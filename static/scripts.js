function showSelect(td) {
  const select = td.querySelector('select');
  const span = td.querySelector('.text-placeholder');
  if (select.style.display === 'none' || select.style.display === '') {
    span.style.display = 'none';
    select.style.display = 'inline-block';
    select.focus();
  }
}

  // Quando escolher uma opção no select
function selectOption(select) {
  const td = select.parentElement;
  const span = td.querySelector('.text-placeholder');
  const val = select.value;

  if (val) {
    span.textContent = val;
    span.style.display = 'inline';
    select.style.display = 'none';

    // Se for produto, busca NCM e valor
    if (td.classList.contains('col-produto')) {
      const tr = td.parentElement;
      fetch('/get_ncm?product=' + encodeURIComponent(val))
        .then(response => response.json())
        .then(data => {
          const tdNcm = tr.querySelector('.col-ncm');
          const tdUnitario = tr.querySelector('.col-unitario');

          if (tdNcm) tdNcm.textContent = data.ncm || '';
          if (tdUnitario) {
            tdUnitario.textContent = data.value !== null
              ? data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '';
          }

          updateSubtotal(tr);
        })
        .catch(err => {
          console.error(err);
          const tr = td.parentElement;
          const tdNcm = tr.querySelector('.col-ncm');
          const tdUnitario = tr.querySelector('.col-unitario');
          if (tdNcm) tdNcm.textContent = 'Erro';
          if (tdUnitario) tdUnitario.textContent = '';
          updateSubtotal(tr);
        });
    }
  } else {
    span.textContent = '';
    span.style.display = 'none';
    select.style.display = 'inline-block';
    select.focus();

    if (td.classList.contains('col-produto')) {
      const tr = td.parentElement;
      const tdNcm = tr.querySelector('.col-ncm');
      const tdUnitario = tr.querySelector('.col-unitario');
      if (tdNcm) tdNcm.textContent = '';
      if (tdUnitario) tdUnitario.textContent = '';
      updateSubtotal(tr);
    }
  }
}

  // Inicializa selects escondidos e spans vazios
  window.onload = function() {
    document.querySelectorAll('.col-produto').forEach(td => {
      const select = td.querySelector('select');
      const span = td.querySelector('.text-placeholder');
      span.textContent = '';
      span.style.display = 'none';
      select.style.display = 'none';
    });
  };

  // Função para atualizar subtotal ao alterar QTD ou UNITÁRIO
  function updateSubtotal(tr) {
    const tdQtd = tr.querySelector('.col-qtd');
    const tdUnitario = tr.querySelector('.col-unitario');
    const tdSubtotal = tr.querySelector('.col-subtotal');

    // Extrai números das células, converte para inteiro e float
    let qtd = tdQtd.textContent.replace(/\D/g, '');
    qtd = qtd ? parseInt(qtd, 10) : 0;

    // Substitui pontos e vírgula para converter string em número float
    let unitarioText = tdUnitario.textContent.trim().replace(/\./g, '').replace(',', '.');
    let unitario = parseFloat(unitarioText);
    if (isNaN(unitario)) unitario = 0;

    let subtotal = qtd * unitario;

    // Formata para moeda BRL ou deixa vazio se 0
    tdSubtotal.textContent = subtotal > 0
      ? subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';
  }

  // Adiciona evento para detectar mudanças em QTD e UNITÁRIO
  function addListeners() {
    document.querySelectorAll('tbody#table-body tr').forEach(tr => {
      const tdQtd = tr.querySelector('.col-qtd');
      const tdUnitario = tr.querySelector('.col-unitario');

      [tdQtd, tdUnitario].forEach(td => {
        td.addEventListener('input', () => updateSubtotal(tr));
        // Impede Enter criar quebra de linha
        td.addEventListener('keydown', e => {
          if (e.key === 'Enter') e.preventDefault();
        });
      });
    });
  }

  // Formatar automaticamente a coluna QTD com zeros à esquerda
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.col-qtd').forEach(cell => {
      cell.addEventListener('input', function () {
        // Mantém apenas números
        let val = this.textContent.replace(/\D/g, '');

        if (val.length === 0) {
          this.textContent = '';
          updateSubtotal(this.parentElement);
          return;
        }

        // Se tiver menos de 3 dígitos → coloca zeros à esquerda até 3
        if (val.length < 3) {
          val = val.padStart(3, '0');
        }
        // Se tiver mais de 3 dígitos → coloca zero à esquerda até 4
        else if (val.length < 4) {
          val = val.padStart(4, '0');
        }

        this.textContent = val;
        updateSubtotal(this.parentElement);
      });

      // Impede que o Enter crie quebras de linha
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') e.preventDefault();
      });
    });

    addListeners();
  });

function generatePDF() {
    const element = document.getElementById('form-container');
    const addRowBtn = document.getElementById('add-row-btn');
    const pdfBtn = document.querySelector('.pdf-button');

    addRowBtn.style.display = 'none';
    pdfBtn.style.display = 'none';

    const opt = {
        margin: 0,
        filename: 'cotacao.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            scrollY: 0,
            y: -10 // captura 10px acima do topo para não cortar a borda
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
        .from(element)
        .set(opt)
        .save()
        .then(() => {
            addRowBtn.style.display = 'inline-block';
            pdfBtn.style.display = 'inline-block';
        });
}


// Carregar unidades e preencher selects da coluna UN
function loadUnits() {
  fetch('/get_units')
    .then(res => res.json())
    .then(units => {
      document.querySelectorAll('.col-un').forEach(td => {
        const select = td.querySelector('select');
        select.innerHTML = '<option value="">---</option>';
        units.forEach(unit => {
          const opt = document.createElement('option');
          opt.value = unit;
          opt.textContent = unit;
          select.appendChild(opt);
        });
        td.querySelector('.text-placeholder').textContent = '';
        select.style.display = 'none';
      });
    })
    .catch(err => console.error('Erro ao carregar unidades:', err));
}

function showSelect(td) {
  const select = td.querySelector('select');
  const span = td.querySelector('.text-placeholder');
  if (select.style.display === 'none' || select.style.display === '') {
    span.style.display = 'none';
    select.style.display = 'inline-block';
    select.focus();
  }
}

function selectUnit(select) {
  const td = select.parentElement;
  const span = td.querySelector('.text-placeholder');
  const val = select.value;

  if (val) {
    span.textContent = val;
    span.style.display = 'inline';
    select.style.display = 'none';
  } else {
    span.textContent = '';
    span.style.display = 'none';
    select.style.display = 'inline-block';
    select.focus();
  }
}

// Inicialização ao carregar DOM
document.addEventListener('DOMContentLoaded', () => {
  loadUnits();

  // Inicializa selects e spans da coluna PRODUTO se necessário
  document.querySelectorAll('.col-produto').forEach(td => {
    const select = td.querySelector('select');
    const span = td.querySelector('.text-placeholder');
    span.textContent = '';
    span.style.display = 'none';
    select.style.display = 'none';
  });
});

function addNewRow() {
  const tbody = document.getElementById('table-body');
  const rows = tbody.querySelectorAll('tr');
  const lastRow = rows[rows.length - 1];
  const newRow = lastRow.cloneNode(true); // clona a última linha inteira com filhos

  // Atualizar o número do item para o próximo
  const newIndex = rows.length + 1;
  newRow.querySelector('.col-item').textContent = newIndex.toString().padStart(2, '0');

  // Resetar valores das células editáveis
  newRow.querySelector('.col-item').textContent = '';

  newRow.querySelector('.col-un .text-placeholder').textContent = '';
  newRow.querySelector('.col-un select').value = '';
  newRow.querySelector('.col-un select').style.display = 'none';

  newRow.querySelector('.col-qtd').textContent = '';
  newRow.querySelector('.col-ncm').textContent = '';
  
  newRow.querySelector('.col-produto .text-placeholder').textContent = '';
  newRow.querySelector('.col-produto select').value = '';
  newRow.querySelector('.col-produto select').style.display = 'none';

  newRow.querySelector('.col-unitario').textContent = '';
  newRow.querySelector('.col-subtotal').textContent = '';

  // Adicionar event listeners para os novos elementos da linha

  // Para selects na coluna UN
  const unSelect = newRow.querySelector('.col-un select');
  const unSpan = newRow.querySelector('.col-un .text-placeholder');
  unSpan.style.display = 'none';
  unSelect.style.display = 'none';

  // Para selects na coluna PRODUTO
  const prodSelect = newRow.querySelector('.col-produto select');
  const prodSpan = newRow.querySelector('.col-produto .text-placeholder');
  prodSpan.style.display = 'none';
  prodSelect.style.display = 'none';

  // Adiciona clique para mostrar select nas colunas UN e PRODUTO
  newRow.querySelector('.col-un').onclick = function() {
    showSelect(this);
  };
  newRow.querySelector('.col-produto').onclick = function() {
    showSelect(this);
  };

  // Evento onchange para selects UN
  unSelect.onchange = function() {
    selectUnit(this);
  };

  // Evento onchange para selects PRODUTO
  prodSelect.onchange = function() {
    selectOption(this);
  };

  // Eventos input para QTD e UNITÁRIO para recalcular subtotal
  const tdQtd = newRow.querySelector('.col-qtd');
  const tdUnitario = newRow.querySelector('.col-unitario');

  // Limpar listeners antigos, adiciona novos
  tdQtd.oninput = () => updateSubtotal(newRow);
  tdQtd.onkeydown = (e) => { if(e.key === 'Enter') e.preventDefault(); };

  tdUnitario.oninput = () => updateSubtotal(newRow);
  tdUnitario.onkeydown = (e) => { if(e.key === 'Enter') e.preventDefault(); };

  // Formatar QTD com zeros à esquerda na nova linha
  tdQtd.addEventListener('input', function () {
    let val = this.textContent.replace(/\D/g, '');

    if (val.length === 0) {
      this.textContent = '';
      updateSubtotal(this.parentElement);
      return;
    }
    if (val.length < 3) {
      val = val.padStart(3, '0');
    } else if (val.length < 4) {
      val = val.padStart(4, '0');
    }
    this.textContent = val;
    updateSubtotal(this.parentElement);
  });

  tdQtd.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') e.preventDefault();
  });

  tbody.appendChild(newRow);
}

// Vincular botão ao evento de adicionar linha
document.getElementById('add-row-btn').addEventListener('click', addNewRow);


// Função para atualizar os números dos itens depois de remover linha
function updateItemNumbers() {
  const rows = document.querySelectorAll('#table-body tr');
  rows.forEach((row, index) => {
    const tdItem = row.querySelector('.col-item');
    tdItem.textContent = (index + 1).toString().padStart(2, '0');
  });
}

// Adiciona eventos aos botões existentes e futuros
function attachRemoveListeners() {
  document.querySelectorAll('.remove-row-btn').forEach(btn => {
    btn.onclick = function(e) {
      const row = e.target.closest('tr');
      const tbody = row.parentElement;
      tbody.removeChild(row);
      updateItemNumbers();
    }
  });
}

function calcularTotal() {
  const tbody = document.getElementById('table-body');
  let total = 0;

  // Pega todas as linhas da tabela
  const linhas = tbody.querySelectorAll('tr');

  linhas.forEach(linha => {
    // Pega a célula da coluna subtotal (7ª coluna - índice 6)
    const celSubtotal = linha.querySelectorAll('td')[6];
    if (celSubtotal) {
      // Pega o texto e remove espaços, vírgulas, converte para ponto decimal
      let valorTexto = celSubtotal.textContent.trim().replace(/\./g, '').replace(',', '.');
      
      // Converte para número float
      let valorNum = parseFloat(valorTexto);

      if (!isNaN(valorNum)) {
        total += valorNum;
      }
    }
  });

  // Formata para Real brasileiro com 2 casas decimais
  const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Atualiza o span total
  document.getElementById('total-value').textContent = totalFormatado;
}


document.querySelectorAll('td.col-subtotal').forEach(td => {
  td.addEventListener('input', calcularTotal);
  td.addEventListener('blur', calcularTotal);
});

function verificarMostrarBotao() {
  const botoesubtotal = Array.from(document.querySelectorAll('td.col-subtotal'));
  const btnAddLinha = document.getElementById('add-row-btn');

  // Verifica se pelo menos uma célula col-subtotal tem texto não vazio
  const existeValor = botoesubtotal.some(td => td.textContent.trim() !== '');

  if (existeValor) {
    btnAddLinha.style.display = 'inline-block'; // mostra botão
  } else {
    btnAddLinha.style.display = 'none'; // esconde botão
  }
}

// Associa o evento input ou blur para as células col-subtotal para disparar a verificação
document.querySelectorAll('td.col-subtotal').forEach(td => {
  td.addEventListener('input', () => {
    verificarMostrarBotao();
    calcularTotal();  // Se quiser recalcular total junto
  });
  td.addEventListener('blur', () => {
    verificarMostrarBotao();
    calcularTotal();
  });
});

// Inicializa estado do botão ao carregar a página
verificarMostrarBotao();