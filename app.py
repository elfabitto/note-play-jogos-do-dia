from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import pytz
import os
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar o Firebase (certifique-se de ter o arquivo firebase-credentials.json)
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print("AVISO: Arquivo de credenciais do Firebase não encontrado. O aplicativo funcionará, mas não salvará dados.")
    db = None

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

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
    
    url_api_football = "https://v3.football.api-sports.io/fixtures"
    
    try:
        headers = {
            "x-apisports-key": "4f5339fa4fe66b4a73b03dd148337a64"  # Chave fornecida pelo usuário
        }
        
        params = {"date": data}
        
        response = requests.get(url_api_football, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            jogos = []
            if data.get('response'):
                for fixture in data.get('response', []):
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
    except Exception as e:
        # Registrar erro, mas continuar com dados de exemplo
        pass
    
    # Se nenhuma API funcionou, usar dados de exemplo
    jogos = [
        {
            'id': '1',
            'time_casa': 'Manchester City',
            'time_casa_id': 'manchester_city',
            'time_visitante': 'Real Madrid',
            'time_visitante_id': 'real_madrid',
            'data_hora': int(datetime.now().timestamp()),
            'campeonato': 'UEFA Champions League',
            'tournament_id': 'champions_league',
            'pais': 'Europe',
            'pais_slug': 'eu',
            'alpha3': 'EUR',
            'tem_anotacao': False
        },
        {
            'id': '2',
            'time_casa': 'Liverpool',
            'time_casa_id': 'liverpool',
            'time_visitante': 'Arsenal',
            'time_visitante_id': 'arsenal',
            'data_hora': int(datetime.now().timestamp()) + 3600,
            'campeonato': 'Premier League',
            'tournament_id': 'premier_league',
            'pais': 'England',
            'pais_slug': 'gb-eng',
            'alpha3': 'ENG',
            'tem_anotacao': False
        },
        {
            'id': '3',
            'time_casa': 'Flamengo',
            'time_casa_id': 'flamengo',
            'time_visitante': 'São Paulo',
            'time_visitante_id': 'sao_paulo',
            'data_hora': int(datetime.now().timestamp()) + 7200,
            'campeonato': 'Copa do Brasil',
            'tournament_id': 'copa_brasil',
            'pais': 'Brazil',
            'pais_slug': 'br',
            'alpha3': 'BRA',
            'tem_anotacao': False
        },
        {
            'id': '4',
            'time_casa': 'Boca Juniors',
            'time_casa_id': 'boca_juniors',
            'time_visitante': 'River Plate',
            'time_visitante_id': 'river_plate',
            'data_hora': int(datetime.now().timestamp()) + 10800,
            'campeonato': 'Copa Sudamericana',
            'tournament_id': 'copa_sudamericana',
            'pais': 'Argentina',
            'pais_slug': 'ar',
            'alpha3': 'ARG',
            'tem_anotacao': False
        },
        {
            'id': '5',
            'time_casa': 'Botafogo-PB',
            'time_casa_id': 'botafogo_pb',
            'time_visitante': 'Sport',
            'time_visitante_id': 'sport',
            'data_hora': int(datetime.now().timestamp()) + 14400,
            'campeonato': 'Copa do Nordeste',
            'tournament_id': 'copa_nordeste',
            'pais': 'Brazil',
            'pais_slug': 'br',
            'alpha3': 'BRA',
            'tem_anotacao': False
        }
    ]
        
    # Ordenar jogos por horário
    jogos.sort(key=lambda x: x['data_hora'])
    return jogos

@app.route('/api/jogos')
def get_jogos():
    data = request.args.get('date')
    if data:
        data_formatada = data
    else:
        data_formatada = datetime.now().strftime('%Y-%m-%d')
    
    jogos = get_jogos_do_dia(data_formatada)
    
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
    
    # Consultar anotações no Firestore
    anotacoes_ref = db.collection('anotacoes')
    anotacoes_docs = anotacoes_ref.stream()
    
    resultado = []
    for doc in anotacoes_docs:
        anotacao = doc.to_dict()
        anotacao['id'] = doc.id
        resultado.append({
            'id': doc.id,
            'jogo_id': anotacao.get('jogo_id'),
            'time_casa': anotacao.get('time_casa'),
            'time_visitante': anotacao.get('time_visitante'),
            'texto': anotacao.get('texto')
        })
    
    return jsonify(resultado)

@app.route('/api/anotacoes', methods=['POST'])
def criar_anotacao():
    if not db:
        return jsonify({'status': 'error', 'message': 'Firebase não configurado'}), 500
    
    data = request.json
    
    # Converter a string ISO para objeto datetime
    data_hora = datetime.fromisoformat(data['data_hora'])
    
    # Criar documento no Firestore
    anotacao_ref = db.collection('anotacoes').document()  # ID automático
    anotacao_ref.set({
        'jogo_id': data['jogo_id'],
        'time_casa': data['time_casa'],
        'time_visitante': data['time_visitante'],
        'data_hora': data_hora,
        'campeonato': data['campeonato'],
        'texto': data['texto'],
        'created_at': firestore.SERVER_TIMESTAMP
    })
    
    return jsonify({'status': 'success', 'id': anotacao_ref.id})

if __name__ == '__main__':
    app.run(debug=True)
