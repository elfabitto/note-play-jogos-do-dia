document.addEventListener('DOMContentLoaded', () => {
    carregarMeusJogos();
    atualizarDataAtual();
});

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
        
        // Criar um mapa de jogos com anotações
        const jogosComAnotacoes = jogos.filter(jogo => 
            anotacoes.some(anotacao => anotacao.jogo_id === jogo.id)
        );
        
        // Mapear anotações por jogo_id
        const anotacoesPorJogo = {};
        anotacoes.forEach(anotacao => {
            anotacoesPorJogo[anotacao.jogo_id] = anotacao;
        });
        
        // Renderizar jogos com anotações
        const listaJogos = document.getElementById('lista-jogos');
        listaJogos.innerHTML = '';
        
        if (jogosComAnotacoes.length === 0) {
            listaJogos.innerHTML = `
                <div class="meus_jogos__mensagem-vazia">
                    <p>Você ainda não fez anotações em nenhum jogo hoje.</p>
                    <a href="/" class="meus_jogos__btn-voltar">Ver todos os jogos</a>
                </div>
            `;
            return;
        }
        
        jogosComAnotacoes.forEach(jogo => {
            const jogoElement = criarElementoJogo(jogo, anotacoesPorJogo[jogo.id]);
            listaJogos.appendChild(jogoElement);
        });
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
    paisNome.textContent = `🏴 ${jogo.pais || ''}`;
    
    jogoCard.querySelector('.campeonato-nome').textContent = jogo.campeonato;
    
    // Time da casa
    jogoCard.querySelector('.time:first-child .time-nome').textContent = jogo.time_casa;
    
    // Time visitante
    jogoCard.querySelector('.time:last-child .time-nome').textContent = jogo.time_visitante;
    
    // Adicionar emoji de relógio ao horário
    const horarioElement = jogoCard.querySelector('.horario');
    horarioElement.innerHTML = `<span>🕒</span><span>${formatarData(jogo.data_hora)}</span>`;
    
    // Preencher anotação existente
    const textarea = jogoCard.querySelector('.anotacao-texto');
    if (anotacao) {
        textarea.value = anotacao.texto;
    }
    
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
    
    // O Sofascore envia timestamp em segundos, precisamos converter para milissegundos
    const data = new Date(timestamp * 1000);
    
    return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
