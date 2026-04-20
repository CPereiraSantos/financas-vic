const API_URL = 'https://script.google.com/macros/s/AKfycbwg42yoNZg-Lce41decJO3jvMHUyjzmXi0bTwAxhnicQ5M-EKigYRULp41N5Ewvv-NBPg/exec'; 
let totalDespesasGlobal = 0;

const moeda = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function salvarSaldo() {
    const valor = document.getElementById('saldo-disponivel').value;
    const btn = document.getElementById('btn-saldo');
    btn.innerText = "⌛";
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: "SALVAR_SALDO", valor: valor }) });
    btn.innerText = "OK!";
    setTimeout(() => btn.innerText = "Registar", 2000);
    carregar(); 
}

function calcularRestante(saldoBase) {
    const restante = saldoBase - totalDespesasGlobal;
    const el = document.getElementById('saldo-restante');
    el.innerText = moeda(restante);
    el.style.color = restante < 0 ? "#ef4444" : "#10b981";
}

async function carregar() {
    try {
        const r = await fetch(API_URL);
        const res = await r.json();
        const saldoDaPlanilha = Number(res.saldoInicial) || 0;
        document.getElementById('saldo-disponivel').value = saldoDaPlanilha;
        renderizar(res.despesas || [], saldoDaPlanilha);
    } catch (e) { console.error("Erro:", e); }
}

// Lógica de Edição
function alternarEdicao(id) {
    const linha = document.querySelector(`tr[data-id="${id}"]`);
    const isEditing = linha.classList.contains('editing');

    if (!isEditing) {
        linha.classList.add('editing');
        const celulaNome = linha.cells[0];
        const celulaValor = linha.cells[1];
        const btnEdicao = linha.querySelector('.btn-edit');

        const nomeAtual = celulaNome.innerText;
        const valorLimpo = celulaValor.innerText.replace(/[R$\s.]/g, '').replace(',', '.');

        celulaNome.innerHTML = `<input type="text" class="edit-input" value="${nomeAtual}">`;
        celulaValor.innerHTML = `<input type="number" class="edit-input" value="${valorLimpo}">`;
        btnEdicao.innerText = "💾";
    } else {
        salvarEdicao(id);
    }
}

async function salvarEdicao(id) {
    const linha = document.querySelector(`tr[data-id="${id}"]`);
    const novoNome = linha.cells[0].querySelector('input').value;
    const novoValor = linha.cells[1].querySelector('input').value;

    await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ acao: "EDITAR", id: id, despesa: novoNome, valor: novoValor }) 
    });
    carregar();
}

document.getElementById('form-gasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "⌛";
    await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ 
            acao: "ADICIONAR", 
            despesa: document.getElementById('desc').value, 
            valor: document.getElementById('valor').value 
        }) 
    });
    e.target.reset();
    btn.innerText = "Adicionar";
    carregar();
});

async function deletar(id) {
    if(!confirm("Excluir despesa?")) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: "DELETAR", id })});
    carregar();
}

function renderizar(lista, saldoBase) {
    totalDespesasGlobal = lista.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    document.getElementById('total-geral').innerText = moeda(totalDespesasGlobal);
    calcularRestante(saldoBase);

    let html = "";
    lista.reverse().forEach(item => {
        html += `
            <tr data-id="${item.id}">
                <td>${item.despesa}</td>
                <td>${moeda(item.valor)}</td>
                <td class="actions-cell">
                    <button onclick="alternarEdicao(${item.id})" class="btn-edit">✏️</button>
                    <button onclick="deletar(${item.id})" class="btn-del">🗑️</button>
                </td>
            </tr>`;
    });
    document.getElementById('corpo-tabela').innerHTML = html;
}

carregar();