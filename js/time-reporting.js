// Datos iniciales de proyectos
let projects = [
  {
    id: 1,
    name: 'TK/103626-001',
    description: 'Engineer',
    hours: [8, 8, 8, 0, 0, 8, 8]
  },
  {
    id: 2,
    name: 'Internal Activities',
    description: 'Training',
    hours: [0, 0, 0, 0, 0, 0, 0]
  }
];

const weekDays = ['MI', 'JU', 'VI', 'SÁ', 'DO', 'LU', 'MA'];

document.addEventListener('DOMContentLoaded', function() {
  loadFromStorage();
  renderTable();
  updateTotals();

  document.getElementById('onlyBillable').addEventListener('change', function(e) {
    // Placeholder para filtrar proyectos facturables
  });

  window.fillSample = function() {
    projects = [
      {
        id: 1,
        name: 'TK/103626-001',
        description: 'Engineer',
        hours: [8, 8, 8, 0, 0, 8, 8]
      },
      {
        id: 2,
        name: 'Internal Activities',
        description: 'Training',
        hours: [0, 0, 0, 0, 0, 0, 0]
      }
    ];
    saveToStorage();
    renderTable();
    updateTotals();
  };

  window.clearTable = function() {
    projects.forEach(p => p.hours = p.hours.map(() => 0));
    saveToStorage();
    renderTable();
    updateTotals();
  };

  window.submitReport = function() {
    openModal('Reporte enviado para aprobación (prototipo).');
  };
});

function renderTable() {
  const tbody = document.getElementById('timeBody');
  tbody.innerHTML = '';

  projects.forEach((proj, index) => {
    const row = document.createElement('tr');
    if (index === 0) row.classList.add('project-row');

    // Celda de proyecto
    const tdProj = document.createElement('td');
    tdProj.style.textAlign = 'left';
    tdProj.style.paddingLeft = '8px';
    tdProj.innerHTML = `<strong>${proj.name}</strong><div class="small muted">${proj.description}</div>`;
    row.appendChild(tdProj);

    // Celdas de horas
    proj.hours.forEach((hour, dayIndex) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.classList.add('editable');
      td.textContent = hour;
      td.setAttribute('aria-label', weekDays[dayIndex]);
      td.addEventListener('input', function(e) {
        let val = e.target.textContent.trim();
        if (!/^\d*\.?\d*$/.test(val)) {
          e.target.textContent = '0';
        }
        proj.hours[dayIndex] = parseFloat(e.target.textContent) || 0;
        recalcRow(row);
        saveToStorage();
      });
      row.appendChild(td);
    });

    // Celda total de fila
    const tdTotal = document.createElement('td');
    tdTotal.classList.add('small');
    row.appendChild(tdTotal);

    tbody.appendChild(row);
  });

  document.querySelectorAll('#timeBody tr').forEach(row => recalcRow(row));
}

function recalcRow(row) {
  const cells = Array.from(row.querySelectorAll('td.editable'));
  const total = cells.reduce((sum, cell) => sum + (parseFloat(cell.textContent) || 0), 0);
  const totalCell = row.querySelector('td:last-child');
  if (totalCell) totalCell.textContent = total;
  updateTotals();
}

function updateTotals() {
  const rows = document.querySelectorAll('#timeBody tr');
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td.editable');
    cells.forEach((cell, idx) => {
      dayTotals[idx] += parseFloat(cell.textContent) || 0;
    });
  });

  const dayIds = ['totMI', 'totJU', 'totVI', 'totSA', 'totDO', 'totLU', 'totMA'];
  dayIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.textContent = dayTotals[idx];
  });

  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);
  document.getElementById('grandTotal').textContent = grandTotal;
  document.getElementById('weekTotal').textContent = 'Total: ' + grandTotal;
}

function saveToStorage() {
  localStorage.setItem('projects', JSON.stringify(projects));
}

function loadFromStorage() {
  const stored = localStorage.getItem('projects');
  if (stored) {
    try {
      projects = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading projects', e);
    }
  }
}