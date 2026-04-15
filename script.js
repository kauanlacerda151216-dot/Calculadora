// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calcForm');
    const limparBtn = document.getElementById('limparBtn');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Coletar dados
        const dados = {
            nome: document.getElementById('nome').value,
            disciplina: document.getElementById('disciplina').value,
            faltas: parseInt(document.getElementById('faltas').value),
            np1: parseFloat(document.getElementById('np1').value),
            pim: parseFloat(document.getElementById('pim').value),
            np2: parseFloat(document.getElementById('np2').value)
        };

        // Validação básica no front
        if (dados.faltas < 0 || dados.faltas > 60) {
            alert('Faltas devem estar entre 0 e 60 horas.');
            return;
        }
        if (isNaN(dados.np1) || dados.np1 < 0 || dados.np1 > 10 ||
            isNaN(dados.pim) || dados.pim < 0 || dados.pim > 10 ||
            isNaN(dados.np2) || dados.np2 < 0 || dados.np2 > 10) {
            alert('Notas devem estar entre 0 e 10.');
            return;
        }

        try {
            const response = await fetch('/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const data = await response.json();

            if (response.ok) {
                exibirResultado(data);
            } else {
                alert(data.erro || 'Erro no cálculo');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    limparBtn.addEventListener('click', function() {
        document.getElementById('calcForm').reset();
        document.getElementById('resultado').classList.add('hidden');
        // Remove o botão de download se existir (opcional)
        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) btnDownload.remove();
    });
});

// Função para exibir o boletim e adicionar botão de download
function exibirResultado(data) {
    const divBoletim = document.getElementById('boletim');
    const resultadoDiv = document.getElementById('resultado');

    // Classes de cor para situação
    let situacaoClass = '';
    if (data.situacao === 'Aprovado') situacaoClass = 'situacao-aprovado';
    else if (data.situacao.includes('Falta')) situacaoClass = 'situacao-reprovado';
    else if (data.situacao.includes('PIM')) situacaoClass = 'situacao-pim';
    else situacaoClass = 'situacao-reprovado';

    // Montar HTML do boletim
    divBoletim.innerHTML = `
        <div class="boletim-linha"><strong>Aluno:</strong> ${data.nome}</div>
        <div class="boletim-linha"><strong>Disciplina:</strong> ${data.disciplina}</div>
        <div class="boletim-linha"><strong>Carga horária:</strong> ${data.carga_horaria}h</div>
        <div class="boletim-linha"><strong>Faltas:</strong> ${data.faltas}h</div>
        <div class="boletim-linha"><strong>Frequência:</strong> ${data.frequencia}%</div>
        <div class="boletim-linha"><strong>Notas:</strong> NP1=${data.notas[0]} | PIM=${data.notas[1]} | NP2=${data.notas[2]}</div>
        <div class="boletim-linha"><strong>Média final (MS):</strong> ${data.media}</div>
        <div class="boletim-linha"><strong>Situação:</strong> <span class="${situacaoClass}">${data.situacao}</span></div>
        <div class="boletim-linha"><strong>Notas abaixo de 5:</strong> ${data.notas_abaixo_5}</div>
    `;

    // Remove botão de download antigo, se existir
    const btnExistente = document.getElementById('btnDownload');
    if (btnExistente) btnExistente.remove();

    // Cria botão de download
    const btnDownload = document.createElement('button');
    btnDownload.id = 'btnDownload';
    btnDownload.textContent = '📥 Baixar Boletim (.txt)';
    btnDownload.className = 'btn-download';
    btnDownload.onclick = () => baixarBoletim(data);
    resultadoDiv.appendChild(btnDownload);

    resultadoDiv.classList.remove('hidden');
}

// Download direto no frontend (sem chamar o servidor)
function baixarBoletim(dados) {
    // Montar o conteúdo do arquivo
    const conteudo = `
=========================================
        BOLETIM ACADÊMICO - UNIPLAN
=========================================
Aluno: ${dados.nome}
Disciplina: ${dados.disciplina}
Carga horária: ${dados.carga_horaria}h
Faltas: ${dados.faltas}h
Frequência: ${dados.frequencia}%
Notas: NP1 = ${dados.notas[0]}  |  PIM = ${dados.notas[1]}  |  NP2 = ${dados.notas[2]}
Média final (MS): ${dados.media}
Situação: ${dados.situacao}
Notas abaixo de 5: ${dados.notas_abaixo_5}
=========================================
Data de emissão: ${new Date().toLocaleString()}
    `;

    // Criar e fazer o download
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boletim_${dados.nome.replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}