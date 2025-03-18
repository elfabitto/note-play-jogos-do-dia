from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import pytz
import os
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar o Firebase
if os.environ.get('FIREBASE_CREDENTIALS'):
    # Usar credenciais do ambiente em produção
    import json
    cred_dict = json.loads(os.environ.get('FIREBASE_CREDENTIALS'))
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    # Tentar usar arquivo local em desenvolvimento
    cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    else:
        print("AVISO: Credenciais do Firebase não encontradas. O aplicativo funcionará, mas não salvará dados.")
        db = None

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/meus-jogos')
def meus_jogos():
    return render_template('meus_jogos.html')

@app.route('/amanha')
def amanha():
    return render_template('index.html')

def get_jogos_do_dia(data=None):
    # Usar apenas a API-Football
    if data is None:
        tz = pytz.timezone('America/Sao_Paulo')
        data = datetime.now(tz).strftime('%Y-%m-%d')
    
    print(f"Buscando jogos para a data: {data}")
    
    url_api_football = "https://v3.football.api-sports.io/fixtures"
    
    try:
        headers = {
            "x-apisports-key": os.environ.get('FOOTBALL_API_KEY', '4f5339fa4fe66b4a73b03dd148337a64')
        }
        
        params = {"date": data}
        
        print(f"Fazendo requisição para a API-Football com parâmetros: {params}")
        response = requests.get(url_api_football, headers=headers, params=params)
        
        print(f"Status da resposta: {response.status_code}")
        
        if response.status_code == 200:
            data_response = response.json()
            
            # Verificar se atingiu o limite da API
            if data_response.get('errors') and 'rate limit' in str(data_response.get('errors')).lower():
                print("ERRO: Limite de requisições da API-Football atingido!")
                return 'LIMITE_API_ATINGIDO'
            
            jogos = []
            if data_response.get('response'):
                print(f"Recebidos {len(data_response.get('response'))} jogos da API")
                for fixture in data_response.get('response', []):
                    # Extrair dados do jogo
                    
                    # Obter informações do país
                    pais = fixture.get('league', {}).get('country', 'World')
                    
                    # Mapear países para códigos de 2 letras e alpha3
                    pais_mapeamento = {
                        'England': {'slug': 'gb-eng', 'alpha3': 'ENG'},
                        'Spain': {'slug': 'es', 'alpha3': 'ESP'},
                        'Italy': {'slug': 'it', 'alpha3': 'ITA'},
                        'Germany': {'slug': 'de', 'alpha3': 'GER'},
                        'France': {'slug': 'fr', 'alpha3': 'FRA'},
                        'Brazil': {'slug': 'br', 'alpha3': 'BRA'},
                        'Argentina': {'slug': 'ar', 'alpha3': 'ARG'},
                        'Portugal': {'slug': 'pt', 'alpha3': 'POR'},
                        'Netherlands': {'slug': 'nl', 'alpha3': 'NED'},
                        'Belgium': {'slug': 'be', 'alpha3': 'BEL'},
                        'USA': {'slug': 'us', 'alpha3': 'USA'},
                        'Mexico': {'slug': 'mx', 'alpha3': 'MEX'},
                        'Japan': {'slug': 'jp', 'alpha3': 'JPN'},
                        'South Korea': {'slug': 'kr', 'alpha3': 'KOR'},
                        'China': {'slug': 'cn', 'alpha3': 'CHN'},
                        'Australia': {'slug': 'au', 'alpha3': 'AUS'},
                        'Russia': {'slug': 'ru', 'alpha3': 'RUS'},
                        'Turkey': {'slug': 'tr', 'alpha3': 'TUR'},
                        'Greece': {'slug': 'gr', 'alpha3': 'GRE'},
                        'Sweden': {'slug': 'se', 'alpha3': 'SWE'},
                        'Norway': {'slug': 'no', 'alpha3': 'NOR'},
                        'Denmark': {'slug': 'dk', 'alpha3': 'DEN'},
                        'Switzerland': {'slug': 'ch', 'alpha3': 'SUI'},
                        'Austria': {'slug': 'at', 'alpha3': 'AUT'},
                        'Scotland': {'slug': 'gb-sct', 'alpha3': 'SCO'},
                        'Wales': {'slug': 'gb-wls', 'alpha3': 'WAL'},
                        'Northern Ireland': {'slug': 'gb-nir', 'alpha3': 'NIR'},
                        'Ireland': {'slug': 'ie', 'alpha3': 'IRL'},
                        'Colombia': {'slug': 'co', 'alpha3': 'COL'},
                        'Chile': {'slug': 'cl', 'alpha3': 'CHI'},
                        'Uruguay': {'slug': 'uy', 'alpha3': 'URU'},
                        'Paraguay': {'slug': 'py', 'alpha3': 'PAR'},
                        'Peru': {'slug': 'pe', 'alpha3': 'PER'},
                        'Ecuador': {'slug': 'ec', 'alpha3': 'ECU'},
                        'Venezuela': {'slug': 've', 'alpha3': 'VEN'},
                        'Bolivia': {'slug': 'bo', 'alpha3': 'BOL'},
                        'Croatia': {'slug': 'hr', 'alpha3': 'CRO'},
                        'Serbia': {'slug': 'rs', 'alpha3': 'SRB'},
                        'Poland': {'slug': 'pl', 'alpha3': 'POL'},
                        'Ukraine': {'slug': 'ua', 'alpha3': 'UKR'},
                        'Czech Republic': {'slug': 'cz', 'alpha3': 'CZE'},
                        'Hungary': {'slug': 'hu', 'alpha3': 'HUN'},
                        'Romania': {'slug': 'ro', 'alpha3': 'ROU'},
                        'Bulgaria': {'slug': 'bg', 'alpha3': 'BUL'},
                        'Finland': {'slug': 'fi', 'alpha3': 'FIN'},
                        'Slovakia': {'slug': 'sk', 'alpha3': 'SVK'},
                        'Slovenia': {'slug': 'si', 'alpha3': 'SVN'},
                        'Morocco': {'slug': 'ma', 'alpha3': 'MAR'},
                        'Egypt': {'slug': 'eg', 'alpha3': 'EGY'},
                        'South Africa': {'slug': 'za', 'alpha3': 'RSA'},
                        'Nigeria': {'slug': 'ng', 'alpha3': 'NGA'},
                        'Senegal': {'slug': 'sn', 'alpha3': 'SEN'},
                        'Cameroon': {'slug': 'cm', 'alpha3': 'CMR'},
                        'Ghana': {'slug': 'gh', 'alpha3': 'GHA'},
                        'Ivory Coast': {'slug': 'ci', 'alpha3': 'CIV'},
                        'Algeria': {'slug': 'dz', 'alpha3': 'ALG'},
                        'Tunisia': {'slug': 'tn', 'alpha3': 'TUN'},
                        'Saudi Arabia': {'slug': 'sa', 'alpha3': 'KSA'},
                        'Qatar': {'slug': 'qa', 'alpha3': 'QAT'},
                        'United Arab Emirates': {'slug': 'ae', 'alpha3': 'UAE'},
                        'Iran': {'slug': 'ir', 'alpha3': 'IRN'},
                        'Iraq': {'slug': 'iq', 'alpha3': 'IRQ'},
                        'India': {'slug': 'in', 'alpha3': 'IND'},
                        'Thailand': {'slug': 'th', 'alpha3': 'THA'},
                        'Vietnam': {'slug': 'vn', 'alpha3': 'VIE'},
                        'Indonesia': {'slug': 'id', 'alpha3': 'IDN'},
                        'Malaysia': {'slug': 'my', 'alpha3': 'MAS'},
                        'Singapore': {'slug': 'sg', 'alpha3': 'SIN'},
                        'Philippines': {'slug': 'ph', 'alpha3': 'PHI'},
                        'New Zealand': {'slug': 'nz', 'alpha3': 'NZL'},
                        'Canada': {'slug': 'ca', 'alpha3': 'CAN'},
                        'Costa Rica': {'slug': 'cr', 'alpha3': 'CRC'},
                        'Panama': {'slug': 'pa', 'alpha3': 'PAN'},
                        'Honduras': {'slug': 'hn', 'alpha3': 'HON'},
                        'Jamaica': {'slug': 'jm', 'alpha3': 'JAM'},
                        'Trinidad and Tobago': {'slug': 'tt', 'alpha3': 'TRI'},
                        'World': {'slug': 'int', 'alpha3': 'INT'},
                        'Europe': {'slug': 'eu', 'alpha3': 'EUR'}
                    }
                    
                    # Obter o código do país ou usar o padrão 'xx' para países desconhecidos
                    pais_info = pais_mapeamento.get(pais)
                    if pais_info:
                        pais_slug = pais_info['slug']
                        alpha3 = pais_info['alpha3']
                    else:
                        # Usar valores padrão para países não mapeados
                        pais_slug = 'xx'  # Fallback para bandeira genérica
                        alpha3 = 'UNK'  # Fallback para código genérico
                    
                    # Obter logos dos times e da competição
                    time_casa_logo = fixture.get('teams', {}).get('home', {}).get('logo', '')
                    time_visitante_logo = fixture.get('teams', {}).get('away', {}).get('logo', '')
                    campeonato_logo = fixture.get('league', {}).get('logo', '')
                    pais_flag = fixture.get('league', {}).get('flag', '')
                    
                    # Criar objeto do jogo
                    jogo = {
                        'id': str(fixture.get('fixture', {}).get('id')),
                        'time_casa': fixture.get('teams', {}).get('home', {}).get('name', ''),
                        'time_casa_id': str(fixture.get('teams', {}).get('home', {}).get('id', '')),
                        'time_casa_logo': time_casa_logo,
                        'time_visitante': fixture.get('teams', {}).get('away', {}).get('name', ''),
                        'time_visitante_id': str(fixture.get('teams', {}).get('away', {}).get('id', '')),
                        'time_visitante_logo': time_visitante_logo,
                        'data_hora': fixture.get('fixture', {}).get('timestamp', int(datetime.now().timestamp())),
                        'campeonato': fixture.get('league', {}).get('name', ''),
                        'tournament_id': str(fixture.get('league', {}).get('id', '')),
                        'campeonato_logo': campeonato_logo,
                        'pais': pais,
                        'pais_slug': pais_slug,
                        'alpha3': alpha3,
                        'pais_flag': pais_flag,  # Adicionar URL da bandeira do país, se disponível
                        'tem_anotacao': False
                    }
                    jogos.append(jogo)
            
            if jogos:
                # Ordenar jogos por horário
                jogos.sort(key=lambda x: x['data_hora'])
                return jogos
            else:
                print("Nenhum jogo retornado pela API, usando dados de exemplo")
    except Exception as e:
        # Registrar erro, mas continuar com dados de exemplo
        print(f"Erro ao buscar jogos da API: {e}")
    
    # Verificar se o erro foi devido ao limite da API
    if 'rate limit' in str(e).lower():
        print("ERRO: Limite de requisições da API-Football atingido!")
        return 'LIMITE_API_ATINGIDO'
    
    # Se for outro tipo de erro, usar dados de exemplo
    print("Usando dados de exemplo devido a erro na API")
    jogos = []
    return jogos

@app.route('/api/jogos')
def get_jogos():
    data = request.args.get('date')
    print(f"Requisição para /api/jogos com parâmetro date: {data}")
    
    if data:
        data_formatada = data
    else:
        tz = pytz.timezone('America/Sao_Paulo')
        data_formatada = datetime.now(tz).strftime('%Y-%m-%d')
        print(f"Nenhuma data fornecida, usando data atual: {data_formatada}")
    
    resultado = get_jogos_do_dia(data_formatada)
    
    # Verificar se atingiu o limite da API
    if resultado == 'LIMITE_API_ATINGIDO':
        print("Retornando mensagem de limite de API atingido")
        return jsonify({
            'limite_api_atingido': True,
            'mensagem': 'Você atingiu o limite diário de requisições da API-Football. Por favor, tente novamente amanhã.'
        })
    
    jogos = resultado
    print(f"Retornando {len(jogos)} jogos para a data {data_formatada}")
    
    if not db:
        # Se o Firebase não estiver configurado, retornar jogos sem verificar anotações
        return jsonify(jogos)
    
    # Consultar anotações no Firestore
    anotacoes_ref = db.collection('anotacoes').stream()
    jogos_ids_com_anotacao = set()
    
    for doc in anotacoes_ref:
        anotacao = doc.to_dict()
        jogos_ids_com_anotacao.add(anotacao.get('jogo_id'))
    
    for jogo in jogos:
        jogo['tem_anotacao'] = jogo['id'] in jogos_ids_com_anotacao
    
    return jsonify(jogos)

@app.route('/api/anotacoes', methods=['GET'])
def get_anotacoes():
    if not db:
        return jsonify([])
    
    print("Buscando anotações no Firestore...")
    
    # Consultar anotações no Firestore
    anotacoes_ref = db.collection('anotacoes')
    anotacoes_docs = anotacoes_ref.stream()
    
    # Agrupar anotações por jogo_id
    anotacoes_por_jogo = {}
    
    for doc in anotacoes_docs:
        anotacao = doc.to_dict()
        anotacao['id'] = doc.id
        
        jogo_id = anotacao.get('jogo_id')
        data_hora = anotacao.get('data_hora')
        
        if jogo_id not in anotacoes_por_jogo:
            anotacoes_por_jogo[jogo_id] = []
        
        anotacoes_por_jogo[jogo_id].append(anotacao)
    
    # Para cada jogo_id, pegar apenas a anotação mais recente
    resultado = []
    for jogo_id, anotacoes in anotacoes_por_jogo.items():
        print(f"Processando {len(anotacoes)} anotações para jogo_id {jogo_id}")
        
        # Imprimir todas as anotações para este jogo_id para depuração
        for i, anotacao in enumerate(anotacoes):
            data_hora = anotacao.get('data_hora')
            data_hora_str = data_hora.isoformat() if data_hora else "Sem data"
            print(f"  Anotação {i+1}: ID={anotacao['id']}, data_hora={data_hora_str}, texto={anotacao.get('texto')[:30]}...")
        
        try:
            # Ordenar anotações por data_hora (mais recente primeiro)
            # Usar created_at como fallback se data_hora não estiver disponível
            def get_data_hora(anotacao):
                data_hora = anotacao.get('data_hora')
                if data_hora:
                    return data_hora
                created_at = anotacao.get('created_at')
                if created_at:
                    return created_at
                return datetime.min
            
            anotacoes_ordenadas = sorted(anotacoes, key=get_data_hora, reverse=True)
            
            # Pegar a primeira anotação (a mais recente)
            anotacao_mais_recente = anotacoes_ordenadas[0]
            
            data_hora = anotacao_mais_recente.get('data_hora')
            data_hora_str = data_hora.isoformat() if data_hora else None
            
            print(f"  Anotação mais recente: ID={anotacao_mais_recente['id']}, data_hora={data_hora_str}")
            
            resultado.append({
                'id': anotacao_mais_recente['id'],
                'jogo_id': anotacao_mais_recente.get('jogo_id'),
                'time_casa': anotacao_mais_recente.get('time_casa'),
                'time_visitante': anotacao_mais_recente.get('time_visitante'),
                'texto': anotacao_mais_recente.get('texto'),
                'data_hora': data_hora_str
            })
        except Exception as e:
            print(f"Erro ao processar anotações para jogo_id {jogo_id}: {e}")
    
    print(f"Encontradas {len(resultado)} anotações únicas (mais recentes por jogo)")
    return jsonify(resultado)

@app.route('/api/anotacoes', methods=['POST'])
def criar_anotacao():
    if not db:
        return jsonify({'status': 'error', 'message': 'Firebase não configurado'}), 500
    
    data = request.json
    print(f"Dados recebidos para salvar anotação: {data}")
    
    # Converter a string ISO para objeto datetime
    data_hora = datetime.fromisoformat(data['data_hora'])
    
    # Verificar se é uma atualização (tem ID) ou uma nova anotação
    if 'id' in data and data['id']:
        print(f"Atualizando anotação existente com ID: {data['id']}")
        # Atualizar documento existente
        anotacao_ref = db.collection('anotacoes').document(data['id'])
        
        # Primeiro, verificar se o documento existe
        doc = anotacao_ref.get()
        if not doc.exists:
            print(f"ERRO: Documento com ID {data['id']} não encontrado!")
            return jsonify({'status': 'error', 'message': 'Documento não encontrado'}), 404
        
        # Obter os dados atuais do documento
        anotacao_atual = doc.to_dict()
        print(f"Dados atuais do documento: {anotacao_atual}")
        
        # Atualizar o documento com os novos dados
        anotacao_ref.update({
            'texto': data['texto'],
            'data_hora': data_hora,  # Atualizar data_hora para a data atual
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Verificar se a atualização foi bem-sucedida
        doc_atualizado = anotacao_ref.get()
        print(f"Documento após atualização: {doc_atualizado.to_dict()}")
    else:
        print(f"Criando nova anotação para jogo_id: {data['jogo_id']}")
        # Criar novo documento no Firestore
        anotacao_ref = db.collection('anotacoes').document()  # ID automático
        anotacao_ref.set({
            'jogo_id': str(data['jogo_id']),  # Garantir que jogo_id seja string
            'time_casa': data['time_casa'],
            'time_visitante': data['time_visitante'],
            'data_hora': data_hora,
            'campeonato': data['campeonato'],
            'texto': data['texto'],
            'created_at': firestore.SERVER_TIMESTAMP
        })
    
    print(f"Anotação salva com sucesso, ID: {anotacao_ref.id}")
    return jsonify({'status': 'success', 'id': anotacao_ref.id})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
