// Armazenar países selecionados para filtro
let paisesSelecionados = new Set();

document.addEventListener('DOMContentLoaded', () => {
    carregarJogos();
    carregarAnotacoes();
    atualizarDataAtual();
    
    // Configurar botão de toggle do filtro
    const toggleFiltro = document.getElementById('toggle-filtro');
    const listaPaises = document.getElementById('lista-paises');
    
    toggleFiltro.addEventListener('click', () => {
        listaPaises.classList.toggle('recolhido');
        toggleFiltro.classList.toggle('ativo');
    });
});

// Função para obter o código de 3 letras do país
function getCodigoPais(pais, alpha3) {
    if (pais === 'England') return 'ENG';
    if (pais === 'World') return 'INT';
    return alpha3 || pais.substring(0, 3).toUpperCase();
}

// Lista de países principais na ordem desejada
const PAISES_PRINCIPAIS = [
    { nome: 'Brazil', slug: 'br', alpha3: 'BRA' },
    { nome: 'England', slug: 'gb-eng', alpha3: 'ENG' },
    { nome: 'Germany', slug: 'de', alpha3: 'GER' },
    { nome: 'Spain', slug: 'es', alpha3: 'ESP' },
    { nome: 'France', slug: 'fr', alpha3: 'FRA' },
    { nome: 'Netherlands', slug: 'nl', alpha3: 'NED' },
    { nome: 'Argentina', slug: 'ar', alpha3: 'ARG' },
    { nome: 'Saudi Arabia', slug: 'sa', alpha3: 'KSA' }
];

// Função para criar os botões de filtro de países
function criarFiltrosPaises(jogos) {
    const paisesPrincipais = document.getElementById('paises-principais');
    const listaPaises = document.getElementById('lista-paises');
    paisesPrincipais.innerHTML = '';
    listaPaises.innerHTML = '';

    // Coletar países únicos dos jogos
    const paisesMap = new Map();
    jogos.forEach(jogo => {
        if (jogo.pais && jogo.pais_slug && !paisesMap.has(jogo.pais)) {
            paisesMap.set(jogo.pais, {
                slug: jogo.pais_slug,
                alpha3: jogo.alpha3
            });
        }
    });

    // Criar botões para países principais
    PAISES_PRINCIPAIS.forEach(paisPrincipal => {
        if (paisesMap.has(paisPrincipal.nome)) {
            const paisFiltro = criarBotaoPais(
                paisPrincipal.nome,
                paisPrincipal.slug,
                paisPrincipal.alpha3,
                'pais-principal'
            );
            paisesPrincipais.appendChild(paisFiltro);
            paisesMap.delete(paisPrincipal.nome);
        }
    });

    // Ordenar países restantes alfabeticamente
    const paisesRestantes = Array.from(paisesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

    // Criar botões para países restantes
    paisesRestantes.forEach(([nome, dados]) => {
        const paisFiltro = criarBotaoPais(
            nome,
            dados.slug,
            dados.alpha3,
            'pais-filtro'
        );
        listaPaises.appendChild(paisFiltro);
    });
}

function criarBotaoPais(nome, slug, alpha3, className) {
    const paisFiltro = document.createElement('div');
    paisFiltro.className = className;
    paisFiltro.dataset.pais = nome;

    const bandeira = document.createElement('img');
    const paisSlug = nome === 'England' ? 'gb-eng' : slug.substring(0, 2).toLowerCase();
    bandeira.src = `https://flagcdn.com/w20/${paisSlug}.png`;
    bandeira.alt = nome;

    const codigoPais = document.createElement('span');
    codigoPais.textContent = getCodigoPais(nome, alpha3);

    paisFiltro.appendChild(bandeira);
    paisFiltro.appendChild(codigoPais);

    paisFiltro.addEventListener('click', () => {
        if (paisesSelecionados.has(nome)) {
            paisesSelecionados.delete(nome);
            paisFiltro.classList.remove('selecionado');
        } else {
            paisesSelecionados.add(nome);
            paisFiltro.classList.add('selecionado');
        }
        filtrarJogos();
    });

    return paisFiltro;
}

// Função para filtrar jogos baseado nos países selecionados
function filtrarJogos() {
    const jogosCards = document.querySelectorAll('.jogo-card');
    
    jogosCards.forEach(card => {
        const paisBandeira = card.querySelector('.pais-bandeira');
        const pais = paisBandeira.alt;
        
        if (paisesSelecionados.size === 0 || paisesSelecionados.has(pais)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function atualizarDataAtual() {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('data-atual').textContent = dataFormatada;
}

// Função para obter apenas a hora local do timestamp para ordenação
function getHoraLocal(timestamp) {
    const data = new Date(timestamp * 1000);
    return data.getHours() * 60 + data.getMinutes();
}

async function carregarJogos() {
    try {
        const response = await fetch('/api/jogos');
        const jogos = await response.json();
        const listaJogos = document.getElementById('lista-jogos');
        listaJogos.innerHTML = '';
        
        // Atualizar quantidade total de jogos
        document.getElementById('quantidade-jogos').textContent = jogos.length;
        
        // Ordenar jogos por horário local (0:00 a 23:59)
        const jogosOrdenados = [...jogos].sort((a, b) => {
            const horaA = getHoraLocal(a.data_hora);
            const horaB = getHoraLocal(b.data_hora);
            return horaA - horaB;
        });
        
        // Criar filtros de países
        criarFiltrosPaises(jogos);
        
        // Adicionar jogos à lista na ordem dos horários
        jogosOrdenados.forEach(jogo => {
            const jogoElement = criarElementoJogo(jogo);
            listaJogos.appendChild(jogoElement);
        });
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
    }
}

async function carregarAnotacoes() {
    try {
        const response = await fetch('/api/anotacoes');
        const anotacoes = await response.json();
        
        // Mapear anotações por jogo_id para fácil acesso
        const anotacoesPorJogo = {};
        anotacoes.forEach(anotacao => {
            anotacoesPorJogo[anotacao.jogo_id] = anotacao;
        });

        // Atualizar cards com anotações
        document.querySelectorAll('.jogo-card').forEach(card => {
            const jogoId = card.dataset.jogoId;
            const anotacao = anotacoesPorJogo[jogoId];
            
            if (anotacao) {
                card.classList.add('tem-anotacao');
                const textarea = card.querySelector('.anotacao-texto');
                if (textarea) {
                    textarea.value = anotacao.texto;
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar anotações:', error);
    }
}

function criarElementoJogo(jogo) {
    const template = document.getElementById('template-jogo');
    const jogoElement = template.content.cloneNode(true);
    const jogoCard = jogoElement.querySelector('.jogo-card');
    
    jogoCard.dataset.jogoId = jogo.id;
    
    // Preencher informações do jogo
    const campeonatoLogo = jogoCard.querySelector('.campeonato-logo');
    campeonatoLogo.src = `https://api.sofascore.app/api/v1/unique-tournament/${jogo.tournament_id}/image`;
    campeonatoLogo.alt = jogo.campeonato;
    
    const paisBandeira = jogoCard.querySelector('.pais-bandeira');
    // Tratamento especial para a Inglaterra
    const paisSlug = jogo.pais === 'England' ? 'gb-eng' : jogo.pais_slug.substring(0, 2).toLowerCase();
    paisBandeira.src = `https://flagcdn.com/w20/${paisSlug}.png`;
    paisBandeira.alt = jogo.pais;
    
    jogoCard.querySelector('.campeonato-nome').textContent = jogo.campeonato;

    // Time da casa
    const timeCasaEscudo = jogoCard.querySelector('.time:first-child .time-escudo');
    timeCasaEscudo.src = `https://api.sofascore.app/api/v1/team/${jogo.time_casa_id}/image`;
    timeCasaEscudo.alt = jogo.time_casa;
    jogoCard.querySelector('.time:first-child .time-nome').textContent = jogo.time_casa;

    // Time visitante
    const timeVisitanteEscudo = jogoCard.querySelector('.time:last-child .time-escudo');
    timeVisitanteEscudo.src = `https://api.sofascore.app/api/v1/team/${jogo.time_visitante_id}/image`;
    timeVisitanteEscudo.alt = jogo.time_visitante;
    jogoCard.querySelector('.time:last-child .time-nome').textContent = jogo.time_visitante;

    jogoCard.querySelector('.horario').textContent = formatarData(jogo.data_hora);
    
    // Configurar botões e eventos
    const btnExpandir = jogoCard.querySelector('.btn-expandir');
    const btnAnotacao = jogoCard.querySelector('.btn-anotacao');
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnSalvar = jogoCard.querySelector('.btn-salvar');
    
    btnExpandir.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAnotacao(jogoCard);
    });
    
    btnAnotacao.addEventListener('click', (e) => {
        e.stopPropagation();
        if (anotacaoDiv.style.display === 'none') {
            mostrarAnotacao(jogoCard);
        }
    });
    
    btnSalvar.addEventListener('click', () => salvarAnotacao(jogoCard));
    
    return jogoElement;
}

function toggleAnotacao(jogoCard) {
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnExpandir = jogoCard.querySelector('.btn-expandir i');
    
    if (anotacaoDiv.style.display === 'none') {
        mostrarAnotacao(jogoCard);
    } else {
        esconderAnotacao(jogoCard);
    }
}

function mostrarAnotacao(jogoCard) {
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnExpandir = jogoCard.querySelector('.btn-expandir i');
    
    anotacaoDiv.style.display = 'block';
    anotacaoDiv.classList.remove('recolhido');
    anotacaoDiv.classList.add('expandido');
    btnExpandir.classList.add('fa-rotate-180');
}

function esconderAnotacao(jogoCard) {
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnExpandir = jogoCard.querySelector('.btn-expandir i');
    
    anotacaoDiv.classList.remove('expandido');
    anotacaoDiv.classList.add('recolhido');
    btnExpandir.classList.remove('fa-rotate-180');
    
    // Aguardar a animação terminar antes de esconder
    setTimeout(() => {
        if (anotacaoDiv.classList.contains('recolhido')) {
            anotacaoDiv.style.display = 'none';
        }
    }, 300);
}

async function salvarAnotacao(jogoCard) {
    const jogoId = jogoCard.dataset.jogoId;
    const texto = jogoCard.querySelector('.anotacao-texto').value;
    
    if (!texto.trim()) {
        alert('Por favor, digite uma anotação antes de salvar.');
        return;
    }
    
    try {
        const response = await fetch('/api/anotacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jogo_id: jogoId,
                time_casa: jogoCard.querySelector('.time-casa').textContent,
                time_visitante: jogoCard.querySelector('.time-visitante').textContent,
                data_hora: new Date().toISOString(),
                campeonato: jogoCard.querySelector('.campeonato').textContent,
                texto: texto
            })
        });
        
        if (response.ok) {
            jogoCard.classList.add('tem-anotacao');
            alert('Anotação salva com sucesso!');
            esconderAnotacao(jogoCard);
        } else {
            throw new Error('Erro ao salvar anotação');
        }
    } catch (error) {
        console.error('Erro ao salvar anotação:', error);
        alert('Erro ao salvar anotação. Por favor, tente novamente.');
    }
}

function formatarData(timestamp) {
    if (!timestamp) return '';
    
    // O Sofascore envia timestamp em segundos
    const data = new Date(timestamp * 1000);
    
    return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Função para obter apenas a hora do timestamp para ordenação
function getHoraLocal(timestamp) {
    const data = new Date(timestamp * 1000);
    return data.getHours() * 60 + data.getMinutes();
}
