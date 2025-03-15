from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///jogos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)

db = SQLAlchemy(app)

class Anotacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jogo_id = db.Column(db.String(100), nullable=False)  # ID do jogo no Sofascore
    time_casa = db.Column(db.String(100), nullable=False)
    time_visitante = db.Column(db.String(100), nullable=False)
    data_hora = db.Column(db.DateTime, nullable=False)
    campeonato = db.Column(db.String(100), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/meus-jogos')
def meus_jogos():
    return render_template('meus_jogos.html')

def get_sofascore_jogos():
    hoje = datetime.now().strftime('%Y-%m-%d')
    url = f'https://api.sofascore.com/api/v1/sport/football/scheduled-events/{hoje}'
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/',
        'If-None-Match': 'W/"0815b4f545"'
    }
    
    try:
        print(f"Fazendo requisição para: {url}")
        response = requests.get(url, headers=headers)
        print(f"Status code: {response.status_code}")
        print(f"Headers recebidos: {response.headers}")
        
        if response.status_code == 403:
            print("Acesso negado pela API do Sofascore")
            # Retornar dados de exemplo para desenvolvimento
            return [
                {
                    'id': '1',
                    'time_casa': 'Manchester City',
                    'time_casa_id': 17,
                    'time_visitante': 'Real Madrid',
                    'time_visitante_id': 2829,
                    'data_hora': int(datetime.now().timestamp()),
                    'campeonato': 'UEFA Champions League',
                    'tournament_id': 7,
                    'pais': 'Europa',
                    'pais_slug': 'eu',
                    'alpha3': 'EUR',
                    'tem_anotacao': False
                },
                {
                    'id': '2',
                    'time_casa': 'Liverpool',
                    'time_casa_id': 44,
                    'time_visitante': 'Arsenal',
                    'time_visitante_id': 42,
                    'data_hora': int(datetime.now().timestamp()) + 3600,
                    'campeonato': 'Premier League',
                    'tournament_id': 17,
                    'pais': 'Inglaterra',
                    'pais_slug': 'gb',
                    'alpha3': 'ENG',
                    'tem_anotacao': False
                },
                {
                    'id': '3',
                    'time_casa': 'Flamengo',
                    'time_casa_id': 5981,
                    'time_visitante': 'São Paulo',
                    'time_visitante_id': 5997,
                    'data_hora': int(datetime.now().timestamp()) + 7200,
                    'campeonato': 'Copa do Brasil',
                    'tournament_id': 77,
                    'pais': 'Brasil',
                    'pais_slug': 'br',
                    'alpha3': 'BRA',
                    'tem_anotacao': False
                },
                {
                    'id': '4',
                    'time_casa': 'Boca Juniors',
                    'time_casa_id': 1932,
                    'time_visitante': 'River Plate',
                    'time_visitante_id': 1934,
                    'data_hora': int(datetime.now().timestamp()) + 10800,
                    'campeonato': 'Copa Sudamericana',
                    'tournament_id': 76,
                    'pais': 'Argentina',
                    'pais_slug': 'ar',
                    'alpha3': 'ARG',
                    'tem_anotacao': False
                },
                {
                    'id': '5',
                    'time_casa': 'Botafogo-PB',
                    'time_casa_id': 6013,
                    'time_visitante': 'Sport',
                    'time_visitante_id': 6003,
                    'data_hora': int(datetime.now().timestamp()) + 14400,
                    'campeonato': 'Copa do Nordeste',
                    'tournament_id': 325,
                    'pais': 'Brasil',
                    'pais_slug': 'br',
                    'alpha3': 'BRA',
                    'tem_anotacao': False
                }
            ]
        
        response.raise_for_status()
        data = response.json()
        print(f"Dados recebidos: {data}")
        
        # Filtrar e organizar os jogos
        jogos = []
        for evento in data.get('events', []):
            tournament = evento.get('tournament', {})
            category = tournament.get('category', {})
            
            # Obter informações do país
            pais = category.get('name', '')
            pais_slug = category.get('country', {}).get('alpha2', '').lower()
            
            jogo = {
                'id': str(evento.get('id')),
                'time_casa': evento.get('homeTeam', {}).get('name'),
                'time_casa_id': evento.get('homeTeam', {}).get('id'),
                'time_visitante': evento.get('awayTeam', {}).get('name'),
                'time_visitante_id': evento.get('awayTeam', {}).get('id'),
                'data_hora': evento.get('startTimestamp'),
                'campeonato': tournament.get('name'),
                'tournament_id': tournament.get('uniqueTournament', {}).get('id'),
                'pais': pais,
                'pais_slug': pais_slug,
                'alpha3': category.get('country', {}).get('alpha3', ''),
                'tem_anotacao': False
            }
            jogos.append(jogo)
        
        # Ordenar jogos por horário
        jogos.sort(key=lambda x: x['data_hora'])
        return jogos
        
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar jogos do Sofascore: {e}")
        return []

@app.route('/api/jogos')
def get_jogos():
    print("Iniciando busca de jogos...")
    jogos = get_sofascore_jogos()
    print(f"Jogos encontrados: {len(jogos)}")
    print(f"Exemplo de jogo: {jogos[0] if jogos else 'Nenhum jogo encontrado'}")
    
    # Verificar quais jogos têm anotações
    anotacoes = Anotacao.query.filter(
        db.func.date(Anotacao.data_hora) == db.func.date(datetime.now())
    ).all()
    
    jogos_ids_com_anotacao = {str(a.jogo_id) for a in anotacoes}
    print(f"IDs de jogos com anotações: {jogos_ids_com_anotacao}")
    
    for jogo in jogos:
        jogo['tem_anotacao'] = jogo['id'] in jogos_ids_com_anotacao
    
    response = jsonify(jogos)
    print("Retornando resposta da API de jogos")
    return response

@app.route('/api/anotacoes', methods=['GET'])
def get_anotacoes():
    anotacoes = Anotacao.query.filter(
        db.func.date(Anotacao.data_hora) == db.func.date(datetime.utcnow())
    ).all()
    return jsonify([{
        'id': a.id,
        'jogo_id': a.jogo_id,
        'time_casa': a.time_casa,
        'time_visitante': a.time_visitante,
        'texto': a.texto
    } for a in anotacoes])

@app.route('/api/anotacoes', methods=['POST'])
def criar_anotacao():
    data = request.json
    anotacao = Anotacao(
        jogo_id=data['jogo_id'],
        time_casa=data['time_casa'],
        time_visitante=data['time_visitante'],
        data_hora=datetime.fromisoformat(data['data_hora']),
        campeonato=data['campeonato'],
        texto=data['texto']
    )
    db.session.add(anotacao)
    db.session.commit()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
