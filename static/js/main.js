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

// Função para obter o código de país correto para a bandeira
function getCodigoBandeira(pais, slug) {
    // Mapeamento de países para códigos ISO 3166-1 alpha-2
    const mapeamentoPaises = {
        'World': 'un', // Bandeira da ONU para "World"
        'England': 'gb-eng',
        'Congo-DR': 'cd',
        'Armenia': 'am',
        'Cyprus': 'cy',
        'Guinea': 'gn',
        'Mali': 'ml',
        'Israel': 'il',
        'Bosnia': 'ba',
        'United-Arab-Emirates': 'ae',
        'Costa-Rica': 'cr',
        'Mauritania': 'mr',
        'Antigua-And-Barbuda': 'ag',
        'Guatemala': 'gt',
        // Adicione mais mapeamentos conforme necessário
    };
    
    // Retorna o código mapeado ou o slug original
    return mapeamentoPaises[pais] || slug;
}

// Função para lidar com erro de carregamento da bandeira
function handleBandeiraError(img) {
    img.onerror = null; // Evita loop infinito
    img.src = 'https://flagcdn.com/un.svg'; // Bandeira da ONU como fallback genérico
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
    paisFiltro.className = className === 'pais-principal' ? 'index__pais-principal' : 'index__pais-filtro';
    paisFiltro.dataset.pais = nome;

    // Adicionar bandeira do país
    const bandeiraPais = document.createElement('img');
    bandeiraPais.className = 'index__bandeira-pais';
    bandeiraPais.src = `https://flagcdn.com/${getCodigoBandeira(nome, slug)}.svg`;
    bandeiraPais.alt = `Bandeira ${nome}`;
    bandeiraPais.width = 20;
    bandeiraPais.height = 15;
    bandeiraPais.onerror = function() { handleBandeiraError(this); };
    paisFiltro.appendChild(bandeiraPais);

    // Adicionar espaço entre a bandeira e o código
    const espaco = document.createTextNode(' ');
    paisFiltro.appendChild(espaco);

    const codigoPais = document.createElement('span');
    codigoPais.textContent = getCodigoPais(nome, alpha3);
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
        const paisNome = card.querySelector('.pais-nome');
        const pais = paisNome.textContent;
        
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
    const paisNome = jogoCard.querySelector('.pais-nome');
    
    // Criar elemento de imagem para a bandeira
    const bandeiraPais = document.createElement('img');
    bandeiraPais.className = 'jogo__bandeira-pais';
    bandeiraPais.src = `https://flagcdn.com/${getCodigoBandeira(jogo.pais, jogo.pais_slug) || 'un'}.svg`;
    bandeiraPais.alt = `Bandeira ${jogo.pais || ''}`;
    bandeiraPais.width = 20;
    bandeiraPais.height = 15;
    bandeiraPais.onerror = function() { handleBandeiraError(this); };
    
    // Limpar o conteúdo anterior
    paisNome.innerHTML = '';
    
    // Adicionar a bandeira e o nome do país
    paisNome.appendChild(bandeiraPais);
    paisNome.appendChild(document.createTextNode(` ${jogo.pais || ''}`));
    
    jogoCard.querySelector('.campeonato-nome').textContent = jogo.campeonato;

    // Time da casa
    jogoCard.querySelector('.time:first-child .time-nome').textContent = jogo.time_casa;

    // Time visitante
    jogoCard.querySelector('.time:last-child .time-nome').textContent = jogo.time_visitante;

    // Adicionar emoji de relógio ao horário
    const horarioElement = jogoCard.querySelector('.horario');
    horarioElement.innerHTML = `<span>🕒</span><span>${formatarData(jogo.data_hora)}</span>`;
    
    // Configurar botões e eventos
    const btnExpandir = jogoCard.querySelector('.btn-expandir');
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnSalvar = jogoCard.querySelector('.btn-salvar');
    
    // Fazer o card inteiro ser clicável
    jogoCard.querySelector('.jogo-header').addEventListener('click', () => {
        toggleAnotacao(jogoCard);
    });
    
    // Manter o botão de expandir também clicável
    btnExpandir.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAnotacao(jogoCard);
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
                time_casa: jogoCard.querySelector('.time:first-child .time-nome').textContent,
                time_visitante: jogoCard.querySelector('.time:last-child .time-nome').textContent,
                data_hora: new Date().toISOString(),
                campeonato: jogoCard.querySelector('.campeonato-nome').textContent,
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
