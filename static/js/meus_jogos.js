// Armazenar dados originais para filtrar
let todosJogos = [];
let todasAnotacoes = {};

document.addEventListener('DOMContentLoaded', () => {
    carregarMeusJogos();
    atualizarDataAtual();
    
    // Configurar busca
    const buscaInput = document.getElementById('busca-input');
    const buscaBtn = document.getElementById('busca-btn');
    
    buscaInput.addEventListener('input', () => {
        filtrarJogos(buscaInput.value);
    });
    
    buscaBtn.addEventListener('click', () => {
        filtrarJogos(buscaInput.value);
    });
    
    // Permitir busca ao pressionar Enter
    buscaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filtrarJogos(buscaInput.value);
        }
    });
});

function filtrarJogos(termoBusca) {
    const listaJogos = document.getElementById('lista-jogos');
    listaJogos.innerHTML = '';
    
    if (!termoBusca.trim()) {
        // Se não houver termo de busca, mostrar todos os jogos
        renderizarJogos(todosJogos);
        return;
    }
    
    const termoLower = termoBusca.toLowerCase();
    
    const jogosFiltrados = todosJogos.filter(jogo => {
        const anotacao = todasAnotacoes[jogo.id];
        
        // Verificar se o termo está no nome dos times
        const timeCasaMatch = jogo.time_casa.toLowerCase().includes(termoLower);
        const timeVisitanteMatch = jogo.time_visitante.toLowerCase().includes(termoLower);
        
        // Verificar se o termo está no texto da anotação
        const anotacaoMatch = anotacao && anotacao.texto.toLowerCase().includes(termoLower);
        
        return timeCasaMatch || timeVisitanteMatch || anotacaoMatch;
    });
    
    if (jogosFiltrados.length === 0) {
        listaJogos.innerHTML = `
            <div class="meus_jogos__mensagem-vazia">
                <p>Nenhum resultado encontrado para "${termoBusca}"</p>
                <button onclick="limparBusca()" class="meus_jogos__btn-voltar">Limpar busca</button>
            </div>
        `;
        return;
    }
    
    renderizarJogos(jogosFiltrados);
}

function limparBusca() {
    const buscaInput = document.getElementById('busca-input');
    buscaInput.value = '';
    renderizarJogos(todosJogos);
}

function renderizarJogos(jogos) {
    const listaJogos = document.getElementById('lista-jogos');
    listaJogos.innerHTML = '';
    
    if (jogos.length === 0) {
        listaJogos.innerHTML = `
            <div class="meus_jogos__mensagem-vazia">
                <p>Você ainda não fez anotações em nenhum jogo hoje.</p>
                <a href="/" class="meus_jogos__btn-voltar">Ver todos os jogos</a>
            </div>
        `;
        return;
    }
    
    jogos.forEach(jogo => {
        const jogoElement = criarElementoJogo(jogo, todasAnotacoes[jogo.id]);
        listaJogos.appendChild(jogoElement);
    });
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

async function carregarMeusJogos() {
    try {
        // Primeiro, carregar todas as anotações
        const anotacoesResponse = await fetch('/api/anotacoes');
        const anotacoes = await anotacoesResponse.json();
        
        // Depois, carregar todos os jogos
        const jogosResponse = await fetch('/api/jogos');
        const jogos = await jogosResponse.json();
        
        // Criar um mapa de jogos com anotações e ordenar por data (mais recente primeiro)
        todosJogos = jogos
            .filter(jogo => anotacoes.some(anotacao => anotacao.jogo_id === jogo.id))
            .sort((a, b) => b.data_hora - a.data_hora); // Ordem decrescente
        
        // Mapear anotações por jogo_id
        todasAnotacoes = {};
        anotacoes.forEach(anotacao => {
            todasAnotacoes[anotacao.jogo_id] = anotacao;
        });
        
        // Renderizar jogos
        renderizarJogos(todosJogos);
    } catch (error) {
        console.error('Erro ao carregar meus jogos:', error);
    }
}

function criarElementoJogo(jogo, anotacao) {
    const template = document.getElementById('template-jogo');
    const jogoElement = template.content.cloneNode(true);
    const jogoCard = jogoElement.querySelector('.meus_jogos__jogo-card');
    
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
    
    // Adicionar horário e data
    const horarioElement = jogoCard.querySelector('.horario');
    horarioElement.innerHTML = formatarData(jogo.data_hora);
    
    // Preencher anotação existente
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    
    if (anotacao) {
        textarea.value = anotacao.texto;
        anotacaoVisualizacao.innerHTML = formatarTextoVisualizacao(anotacao.texto);
    }
    
    // Configurar botões e eventos
    const btnExpandir = jogoCard.querySelector('.btn-expandir');
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    
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

function esconderAnotacao(jogoCard) {
    const anotacaoDiv = jogoCard.querySelector('.jogo-anotacao');
    const btnExpandir = jogoCard.querySelector('.btn-expandir i');
    
    anotacaoDiv.classList.remove('expandido');
    anotacaoDiv.classList.add('recolhido');
    btnExpandir.classList.remove('fa-rotate-180');
    
    setTimeout(() => {
        if (anotacaoDiv.classList.contains('recolhido')) {
            anotacaoDiv.style.display = 'none';
        }
    }, 300);
}

function ativarModoEdicao(jogoCard) {
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    
    // Mostrar textarea e esconder visualização
    textarea.style.display = 'block';
    anotacaoVisualizacao.style.display = 'none';
    
    // Mudar o texto do botão para "Salvar"
    btnEditar.textContent = 'Salvar';
    
    // Focar no textarea
    textarea.focus();
}

function desativarModoEdicao(jogoCard) {
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const btnEditar = jogoCard.querySelector('.btn-editar');
    
    // Esconder textarea e mostrar visualização
    textarea.style.display = 'none';
    anotacaoVisualizacao.style.display = 'block';
    
    // Mudar o texto do botão para "Editar"
    btnEditar.textContent = 'Editar';
}

// Função para formatar o texto para visualização (converter ** para <strong>)
function formatarTextoVisualizacao(texto) {
    if (!texto) return '';
    
    // Substituir ** por <strong> para negrito
    let formatado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formatado;
}

// Função para mostrar o modal de salvamento
function mostrarModalSalvamento() {
    const modal = document.getElementById('modal-salvamento');
    modal.classList.add('ativo');
    
    // Configurar eventos para fechar o modal
    const fecharModal = modal.querySelector('.fechar-modal');
    const btnOk = modal.querySelector('.btn-modal-ok');
    
    const fecharModalFn = () => {
        modal.classList.remove('ativo');
        fecharModal.removeEventListener('click', fecharModalFn);
        btnOk.removeEventListener('click', fecharModalFn);
    };
    
    fecharModal.addEventListener('click', fecharModalFn);
    btnOk.addEventListener('click', fecharModalFn);
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
