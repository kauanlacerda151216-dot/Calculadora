from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def calcular_media(n1, pim, n2):
    """MS = (NP1*4 + PIM*2 + NP2*4) / 10"""
    return (n1 * 4 + pim * 2 + n2 * 4) / 10

def arredondar_media(media):
    """Regra especial: 4.75 <= media < 5.0 -> 5.0"""
    if 4.75 <= media < 5.0:
        return 5.0
    return round(media, 2)

def situacao_final(frequencia_percent, pim, media_final):
    """Prioridade: falta > PIM < 5 > média"""
    if frequencia_percent < 75:
        return "Reprovado por Falta,matou muita aula"
    if pim < 5:
        return "Reprovado por PIM vishh (nota < 5)"
    if media_final >= 5:
        return "Aprovado"
    return "Reprovado por Média,se lascou"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular', methods=['POST'])
def calcular():
    dados = request.get_json()

    # Extrair dados
    nome = dados.get('nome', '').strip()
    disciplina = dados.get('disciplina', '').strip()
    carga_horaria = 60  # fixo conforme enunciado
    try:
        faltas = int(dados.get('faltas', 0))
    except ValueError:
        return jsonify({'erro': 'Faltas deve ser um número inteiro'}), 400

    try:
        np1 = float(dados.get('np1', 0))
        pim = float(dados.get('pim', 0))
        np2 = float(dados.get('np2', 0))
    except ValueError:
        return jsonify({'erro': 'Notas devem ser números'}), 400

    # Validações de intervalo (bônus)
    if not (0 <= np1 <= 10):
        return jsonify({'erro': 'NP1 deve estar entre 0 e 10'}), 400
    if not (0 <= pim <= 10):
        return jsonify({'erro': 'PIM deve estar entre 0 e 10'}), 400
    if not (0 <= np2 <= 10):
        return jsonify({'erro': 'NP2 deve estar entre 0 e 10'}), 400
    if faltas < 0 or faltas > carga_horaria:
        return jsonify({'erro': f'Faltas devem estar entre 0 e {carga_horaria} horas'}), 400

    # Lista de notas (exigência da rubrica)
    lista_notas = [np1, pim, np2]

    # Cálculos
    media_bruta = calcular_media(np1, pim, np2)
    media_final = arredondar_media(media_bruta)
    frequencia = ((carga_horaria - faltas) / carga_horaria) * 100
    situacao = situacao_final(frequencia, pim, media_final)

    # Contagem de notas abaixo de 5 (desafio extra)
    notas_abaixo_5 = sum(1 for nota in lista_notas if nota < 5)

    # Montar resposta
    resultado = {
        'nome': nome,
        'disciplina': disciplina,
        'carga_horaria': carga_horaria,
        'faltas': faltas,
        'frequencia': round(frequencia, 2),
        'notas': lista_notas,
        'media': media_final,
        'situacao': situacao,
        'notas_abaixo_5': notas_abaixo_5
    }
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True)

    from flask import send_file, make_response
import io

@app.route('/baixar_boletim', methods=['POST'])
def baixar_boletim():
    dados = request.get_json()
    
    # Conteúdo do arquivo
    conteudo = f"""
    ========== BOLETIM ACADÊMICO ==========
    Aluno: {dados['nome']}
    Disciplina: {dados['disciplina']}
    Carga horária: {dados['carga_horaria']}h
    Faltas: {dados['faltas']}h
    Frequência: {dados['frequencia']}%
    Notas: NP1={dados['notas'][0]} | PIM={dados['notas'][1]} | NP2={dados['notas'][2]}
    Média final (MS): {dados['media']}
    Situação: {dados['situacao']}
    Notas abaixo de 5: {dados['notas_abaixo_5']}
    =======================================
    """
    
    # Criar um arquivo em memória
    buffer = io.BytesIO()
    buffer.write(conteudo.encode('utf-8'))
    buffer.seek(0)
    
    # Enviar como download
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"boletim_{dados['nome'].replace(' ', '_')}.txt",
        mimetype='text/plain'
    )