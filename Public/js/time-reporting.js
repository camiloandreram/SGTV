let projects = [
  {
    id: 1,
    name: 'TK/103626-001',
    description: 'Engineer',
    hours: [0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: 2,
    name: 'Internal Activities',
    description: 'Training',
    hours: [0, 0, 0, 0, 0, 0, 0]
  }
];

const weekDaysLabels = ['MI', 'JU', 'VI', 'SÁ', 'DO', 'LU', 'MA'];

document.addEventListener('DOMContentLoaded', function() {
  const datePicker = document.getElementById('datePicker');

  // 1. Configurar fecha inicial (hoy)
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  if(datePicker) {
    datePicker.value = dateString;
    datePicker.addEventListener('change', function() {
      updateTableHeaders(this.value);
    });
  }

  // 2. Cargar datos y renderizar
  loadFromStorage();
  updateTableHeaders(dateString);
});

/**
 * Actualiza los encabezados de la tabla basados en la fecha seleccionada
 */
function updateTableHeaders(selectedDate) {
  const baseDate = new Date(selectedDate);
  // Ajustamos para que la visualización empiece desde el día seleccionado
  const headerCells = document.querySelectorAll('.reporting-table thead th:not(:first-child):not(:last-child)');

  headerCells.forEach((cell, index) => {
    const currentDay = new Date(baseDate);
    currentDay.setDate(baseDate.getDate() + index);

    const dayNum = currentDay.getDate();
    const monthShort = currentDay.toLocaleString('es-ES', { month: 'short' }).toUpperCase();

    cell.innerHTML = `${weekDaysLabels[index]}<br><span style="font-size:10px; font-weight:400; color: var(--text-muted);">${dayNum} ${monthShort}</span>`;
  });

  renderTable();
  updateTotals();
}

/**
 * Renderiza las filas de la tabla
 */
function renderTable() {
  const tbody = document.getElementById('timeBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  projects.forEach((proj, projIdx) => {
    const row = document.createElement('tr');
    if (projIdx === 0) row.classList.add('project-row');

    // Celda de Identificación del Proyecto
    const tdProj = document.createElement('td');
    tdProj.style.textAlign = 'left';
    tdProj.innerHTML = `<div style="font-weight: 700;">${proj.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${proj.description}</div>`;
    row.appendChild(tdProj);

    // Celdas de Horas (Editables)
    proj.hours.forEach((hour, dayIdx) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.classList.add('editable');
      td.textContent = hour === 0 ? '0' : hour;

      // Al entrar: si es 0, limpia para escribir fácil
      td.addEventListener('focus', function() {
        if (this.textContent === '0') this.textContent = '';
      });

      // Al salir: si está vacío, vuelve a 0
      td.addEventListener('blur', function() {
        if (this.textContent.trim() === '') {
          this.textContent = '0';
          proj.hours[dayIdx] = 0;
        }
        updateTotals();
      });

      // Al escribir: validar números y actualizar cálculos
      td.addEventListener('input', function() {
        let val = this.textContent.replace(/[^0-9.]/g, '');
        this.textContent = val;

        // Mantener el cursor al final
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        proj.hours[dayIdx] = parseFloat(val) || 0;
        recalcRow(row);
        saveToStorage();
      });

      row.appendChild(td);
    });

    // Celda Total de la Fila
    const tdTotal = document.createElement('td');
    tdTotal.style.fontWeight = '700';
    row.appendChild(tdTotal);

    tbody.appendChild(row);
    recalcRow(row);
  });
}

/**
 * Calcula el total de una fila específica
 */
function recalcRow(row) {
  const cells = Array.from(row.querySelectorAll('td.editable'));
  const total = cells.reduce((sum, cell) => sum + (parseFloat(cell.textContent) || 0), 0);
  const totalCell = row.querySelector('td:last-child');
  if (totalCell) totalCell.textContent = total;
}

/**
 * Actualiza los totales globales (pie de tabla y badge superior)
 */
function updateTotals() {
  const rows = document.querySelectorAll('#timeBody tr');
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td.editable');
    cells.forEach((cell, idx) => {
      dayTotals[idx] += parseFloat(cell.textContent) || 0;
    });
  });

  // Actualizar Fila de Totales por día
  const dayIds = ['totMI', 'totJU', 'totVI', 'totSA', 'totDO', 'totLU', 'totMA'];
  dayIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.textContent = dayTotals[idx];
  });

  // Gran Total
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);
  const gtEl = document.getElementById('grandTotal');
  const wtEl = document.getElementById('weekTotal');

  if (gtEl) gtEl.textContent = grandTotal;
  if (wtEl) wtEl.textContent = 'Total: ' + grandTotal + 'h';
}

/**
 * Funciones Globales para Botones
 */
window.fillSample = function() {
  projects = [
    { id: 1, name: 'TK/103626-001', description: 'Engineer', hours: [8, 8, 8, 0, 0, 8, 8] },
    { id: 2, name: 'Internal Activities', description: 'Training', hours: [2, 0, 1, 0, 0, 0, 0] }
  ];
  saveToStorage();
  renderTable();
  updateTotals();
};

window.clearTable = function() {
  projects.forEach(p => p.hours = [0, 0, 0, 0, 0, 0, 0]);
  localStorage.removeItem('projects');
  renderTable();
  updateTotals();
};

window.submitReport = function() {
  const modal = document.getElementById('modal');
  const msg = document.getElementById('modalMsg');
  if(modal && msg) {
    msg.textContent = 'El reporte de horas de Camilo ha sido enviado para aprobación.';
    modal.classList.remove('hidden');
  }
};

window.closeModal = function() {
  const modal = document.getElementById('modal');
  if(modal) modal.classList.add('hidden');
};

/**
 * Persistencia
 */
function saveToStorage() {
  localStorage.setItem('projects', JSON.stringify(projects));
}

function loadFromStorage() {
  const stored = localStorage.getItem('projects');
  if (stored) {
    try {
      projects = JSON.parse(stored);
    } catch (e) {
      console.error('Error al cargar storage', e);
    }
  }
}