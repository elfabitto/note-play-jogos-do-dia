// Armazenar países selecionados para filtro
let paisesSelecionados = new Set();
let dataAtual = new Date();

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de amanhã
    const isAmanha = window.location.pathname === '/amanha';
    if (isAmanha) {
        // Ajustar para o fuso horário de São Paulo
        const spDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        dataAtual = new Date(spDate.setDate(spDate.getDate() + 1));
        document.getElementById('amanha-link').classList.add('active');
        document.getElementById('hoje-link').classList.remove('active');
    } else {
        // Ajustar para o fuso horário de São Paulo
        dataAtual = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    }
    
    carregarJogos();
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
    { nome: 'Saudi Arabia', slug: 'sa', alpha3: 'KSA' },
    { nome: 'United States', slug: 'us', alpha3: 'USA' },
    { nome: 'Colombia', slug: 'co', alpha3: 'COL' },
    { nome: 'Mexico', slug: 'mx', alpha3: 'MEX' },
    { nome: 'World', slug: 'un', alpha3: 'INT' }
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
        // Pegar o último nó de texto que contém apenas o nome do país
        const pais = Array.from(paisNome.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .pop();
        
        if (paisesSelecionados.size === 0 || paisesSelecionados.has(pais)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function atualizarDataAtual() {
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
        const dataParam = dataAtual.toISOString().split('T')[0];
        const response = await fetch(`/api/jogos?date=${dataParam}`);
        const dados = await response.json();
        const listaJogos = document.getElementById('lista-jogos');
        listaJogos.innerHTML = '';
        
        // Verificar se atingiu o limite da API
        if (dados.limite_api_atingido) {
            console.log("Limite de API atingido:", dados.mensagem);
            
            // Exibir mensagem de limite atingido
            listaJogos.innerHTML = `
                <div class="mensagem-erro">
                    <h3>Limite de API Atingido</h3>
                    <p>${dados.mensagem}</p>
                    <p>Enquanto isso, você ainda pode acessar suas anotações existentes na página "Meus Jogos".</p>
                </div>
            `;
            
            // Atualizar quantidade total de jogos
            document.getElementById('quantidade-jogos').textContent = '0';
            return;
        }
        
        const jogos = dados;
        
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

        // Carregar anotações após carregar os jogos
        await carregarAnotacoes();
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        
        // Exibir mensagem de erro genérica
        const listaJogos = document.getElementById('lista-jogos');
        listaJogos.innerHTML = `
            <div class="mensagem-erro">
                <h3>Erro ao carregar jogos</h3>
                <p>Parece que você atingiu o limite de solicitações da API-Football. Por favor, tente novamente mais tarde.</p>
            </div>
        `;
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
                const anotacaoVisualizacao = card.querySelector('.anotacao-visualizacao');
                
                if (textarea && anotacaoVisualizacao) {
                    // Atualizar tanto o textarea quanto a visualização
                    textarea.value = anotacao.texto;
                    anotacaoVisualizacao.innerHTML = formatarTextoVisualizacao(anotacao.texto);
                    
                    // Garantir que esteja no modo de visualização
                    textarea.style.display = 'none';
                    anotacaoVisualizacao.style.display = 'block';
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
    const timeCasa = jogo.time_casa;
    jogoCard.querySelector('.time:first-child .time-nome').textContent = timeCasa;

    // Time visitante
    jogoCard.querySelector('.time:last-child .time-nome').textContent = jogo.time_visitante;

    // Adicionar horário e data
    const horarioElement = jogoCard.querySelector('.horario');
    horarioElement.innerHTML = formatarData(jogo.data_hora);
    
    // Criar template de texto pré-escrito
    const templateTexto = `Geral:
_______________________
**${timeCasa}**
Destaques:
-

Observações:
-

_______________________
**${jogo.time_visitante}**
Destaques:
-

Observações:
-`;
    
    // Preencher textarea com o template
    const textarea = jogoCard.querySelector('.anotacao-texto');
    textarea.value = templateTexto;
    
    // Configurar botões e eventos
    const btnExpandir = jogoCard.querySelector('.btn-expandir');
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    const btnCancelar = jogoCard.querySelector('.btn-cancelar');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    
    // Inicializar a visualização com o template
    anotacaoVisualizacao.innerHTML = formatarTextoVisualizacao(templateTexto);
    
    // Fazer o card inteiro ser clicável
    jogoCard.querySelector('.jogo-header').addEventListener('click', () => {
        toggleAnotacao(jogoCard);
    });
    
    // Manter o botão de expandir também clicável
    btnExpandir.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAnotacao(jogoCard);
    });
    
    // Configurar o botão de editar/salvar
    btnEditar.addEventListener('click', () => {
        const estaModoEdicao = btnEditar.textContent === 'Salvar';
        
        if (estaModoEdicao) {
            salvarAnotacao(jogoCard);
        } else {
            ativarModoEdicao(jogoCard);
        }
    });
    
    // Configurar o botão de cancelar
    btnCancelar.addEventListener('click', () => {
        cancelarEdicao(jogoCard);
    });
    
    return jogoElement;
}

// Função para formatar o texto para visualização (converter ** para <strong>)
function formatarTextoVisualizacao(texto) {
    if (!texto) return '';
    
    // Substituir ** por <strong> para negrito
    let formatado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formatado;
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
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    
    // Garantir que esteja no modo de visualização
    textarea.style.display = 'none';
    anotacaoVisualizacao.style.display = 'block';
    btnEditar.textContent = 'Editar';
    
    anotacaoDiv.style.display = 'block';
    anotacaoDiv.classList.remove('recolhido');
    anotacaoDiv.classList.add('expandido');
    btnExpandir.classList.add('fa-rotate-180');
}

function ativarModoEdicao(jogoCard) {
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    const btnCancelar = jogoCard.querySelector('.btn-cancelar');
    
    // Guardar o texto original para caso o usuário cancele a edição
    jogoCard.dataset.textoOriginal = textarea.value;
    
    // Mostrar textarea e esconder visualização
    textarea.style.display = 'block';
    anotacaoVisualizacao.style.display = 'none';
    
    // Mudar o texto do botão para "Salvar" e mostrar botão cancelar
    btnEditar.textContent = 'Salvar';
    btnCancelar.style.display = 'block';
    
    // Focar no textarea
    textarea.focus();
}

function desativarModoEdicao(jogoCard) {
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    const btnCancelar = jogoCard.querySelector('.btn-cancelar');
    
    // Esconder textarea e mostrar visualização
    textarea.style.display = 'none';
    anotacaoVisualizacao.style.display = 'block';
    
    // Mudar o texto do botão para "Editar" e esconder botão cancelar
    btnEditar.textContent = 'Editar';
    btnCancelar.style.display = 'none';
}

function cancelarEdicao(jogoCard) {
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    
    // Restaurar o texto original
    if (jogoCard.dataset.textoOriginal) {
        textarea.value = jogoCard.dataset.textoOriginal;
    }
    
    // Desativar o modo de edição
    desativarModoEdicao(jogoCard);
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

// Função para mostrar o modal de salvamento
function mostrarModalSalvamento() {
    const modal = document.getElementById('modal-salvamento');
    
    // Verificar se o modal existe
    if (!modal) {
        console.error('Modal de salvamento não encontrado');
        return;
    }
    
    modal.classList.add('ativo');
    
    // Configurar eventos para fechar o modal
    const fecharModal = modal.querySelector('.fechar-modal');
    const btnOk = modal.querySelector('.btn-modal-ok');
    
    // Remover event listeners anteriores para evitar duplicação
    const fecharModalFn = () => {
        modal.classList.remove('ativo');
        
        if (fecharModal) {
            fecharModal.removeEventListener('click', fecharModalFn);
        }
        
        if (btnOk) {
            btnOk.removeEventListener('click', fecharModalFn);
        }
    };
    
    if (fecharModal) {
        fecharModal.addEventListener('click', fecharModalFn);
    }
    
    if (btnOk) {
        btnOk.addEventListener('click', fecharModalFn);
    }
}

async function salvarAnotacao(jogoCard) {
    const jogoId = jogoCard.dataset.jogoId;
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const texto = textarea.value;
    
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
            // Atualizar o texto de visualização com formatação
            anotacaoVisualizacao.innerHTML = formatarTextoVisualizacao(texto);
            
            // Voltar para o modo de visualização
            desativarModoEdicao(jogoCard);
            
            jogoCard.classList.add('tem-anotacao');
            
            // Mostrar o modal de salvamento em vez do alerta
            mostrarModalSalvamento();
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
    
    const horario = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const dataFormatada = data.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    return `<span>📅 ${dataFormatada}</span> <span>🕒 ${horario}</span>`;
}
