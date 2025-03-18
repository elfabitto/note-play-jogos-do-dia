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
        console.log("Recarregando dados do servidor...");
        
        // Primeiro, carregar todas as anotações
        const anotacoesResponse = await fetch('/api/anotacoes?nocache=' + new Date().getTime());
        const anotacoes = await anotacoesResponse.json();
        
        console.log("Anotações carregadas:", anotacoes);
        
        // Mapear anotações por jogo_id
        todasAnotacoes = {};
        anotacoes.forEach(anotacao => {
            todasAnotacoes[anotacao.jogo_id] = anotacao;
        });
        
        // Criar jogos manualmente a partir das anotações
        todosJogos = [];
        
        // Criar um conjunto de IDs de jogos únicos das anotações
        const jogosIds = new Set();
        anotacoes.forEach(anotacao => {
            jogosIds.add(anotacao.jogo_id);
        });
        
        console.log("IDs de jogos únicos das anotações:", Array.from(jogosIds));
        
        // Para cada ID de jogo único, criar um objeto de jogo
        Array.from(jogosIds).forEach(jogoId => {
            // Pegar a primeira anotação para este jogo para obter informações do jogo
            const anotacao = anotacoes.find(a => a.jogo_id === jogoId);
            
            if (anotacao) {
                // Criar um objeto de jogo a partir da anotação
                const jogo = {
                    id: anotacao.jogo_id,
                    time_casa: anotacao.time_casa,
                    time_visitante: anotacao.time_visitante,
                    data_hora: Date.now() / 1000, // Timestamp atual em segundos
                    campeonato: 'Desconhecido', // Valor padrão
                    pais: 'World', // Valor padrão
                    pais_slug: 'un', // Valor padrão
                    alpha3: 'INT', // Valor padrão
                    tem_anotacao: true
                };
                
                todosJogos.push(jogo);
                console.log(`Jogo criado: ${jogo.id} (${jogo.time_casa} vs ${jogo.time_visitante})`);
            }
        });
        
        // Ordenar jogos (mais recente primeiro)
        todosJogos.sort((a, b) => b.data_hora - a.data_hora);
        
        console.log("Jogos criados:", todosJogos.length);
        
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
    
    // Armazenar o ID da anotação se existir
    if (anotacao && anotacao.id) {
        jogoCard.dataset.anotacaoId = anotacao.id;
    }
    
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
    const anotacaoId = jogoCard.dataset.anotacaoId; // Obter o ID da anotação se existir
    const textarea = jogoCard.querySelector('.anotacao-texto');
    const anotacaoVisualizacao = jogoCard.querySelector('.anotacao-visualizacao');
    const texto = textarea.value;
    
    console.log(`Salvando anotação para jogo ${jogoId}, anotação ID: ${anotacaoId || 'nova'}`);
    
    if (!texto.trim()) {
        alert('Por favor, digite uma anotação antes de salvar.');
        return;
    }
    
    try {
        // Preparar os dados para enviar
        const dadosAnotacao = {
            jogo_id: jogoId,
            time_casa: jogoCard.querySelector('.time:first-child .time-nome').textContent,
            time_visitante: jogoCard.querySelector('.time:last-child .time-nome').textContent,
            data_hora: new Date().toISOString(),
            campeonato: jogoCard.querySelector('.campeonato-nome').textContent,
            texto: texto
        };
        
        // Se tiver ID da anotação, incluir para atualizar em vez de criar nova
        if (anotacaoId) {
            dadosAnotacao.id = anotacaoId;
            console.log(`Atualizando anotação existente com ID: ${anotacaoId}`);
        } else {
            console.log(`Criando nova anotação para jogo ${jogoId}`);
        }
        
        console.log("Dados a serem enviados:", dadosAnotacao);
        
        const response = await fetch('/api/anotacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify(dadosAnotacao)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            console.log("Resposta do servidor:", resultado);
            
            // Se for uma nova anotação, armazenar o ID retornado para futuras edições
            if (!anotacaoId && resultado.id) {
                jogoCard.dataset.anotacaoId = resultado.id;
                console.log(`Novo ID de anotação recebido: ${resultado.id}`);
                
                // Atualizar também no objeto de anotações
                if (todasAnotacoes[jogoId]) {
                    todasAnotacoes[jogoId].id = resultado.id;
                }
            }
            
            // Atualizar o texto da anotação no objeto de dados
            if (todasAnotacoes[jogoId]) {
                todasAnotacoes[jogoId].texto = texto;
                console.log(`Texto da anotação atualizado no objeto local`);
            }
            
            // Atualizar o texto de visualização com formatação
            anotacaoVisualizacao.innerHTML = formatarTextoVisualizacao(texto);
            
            // Voltar para o modo de visualização
            desativarModoEdicao(jogoCard);
            
            // Mostrar o modal de salvamento em vez do alerta
            mostrarModalSalvamento();
            
            // Recarregar a página para garantir que os dados estejam atualizados
            setTimeout(() => {
                console.log("Recarregando a página para atualizar os dados...");
                // Forçar recarga completa, ignorando o cache
                const novaURL = window.location.href.split('?')[0] + '?nocache=' + new Date().getTime();
                console.log(`Redirecionando para: ${novaURL}`);
                window.location.href = novaURL;
            }, 1500); // Atraso de 1.5 segundos para garantir que o modal seja exibido antes do reload
        } else {
            const errorData = await response.json();
            throw new Error(`Erro ao salvar anotação: ${errorData.message || response.statusText}`);
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
