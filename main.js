document.addEventListener('DOMContentLoaded', () => {
    const gradeRowsContainer = document.getElementById('grade-rows');
    const addRowBtn = document.getElementById('add-row');
    const finalAverageDisplay = document.getElementById('final-average');
    const statusBadge = document.getElementById('status-badge');
    const modeWeightedBtn = document.getElementById('mode-weighted');
    const modeSimpleBtn = document.getElementById('mode-simple');

    let isWeighted = true;
    gradeRowsContainer.classList.add('mode-weighted');

    // Initialize with 3 rows
    for (let i = 0; i < 3; i++) {
        addRow();
    }

    // Event Listeners
    addRowBtn.addEventListener('click', () => addRow());
     
    modeWeightedBtn.addEventListener('click', () => {
        isWeighted = true;
        gradeRowsContainer.classList.add('mode-weighted');
        gradeRowsContainer.classList.remove('mode-simple');
        modeWeightedBtn.classList.add('active');
        modeSimpleBtn.classList.remove('active');
        updateUIForMode();
        calculate();
    });

    modeSimpleBtn.addEventListener('click', () => {
        isWeighted = false;
        gradeRowsContainer.classList.add('mode-simple');
        gradeRowsContainer.classList.remove('mode-weighted');
        modeSimpleBtn.classList.add('active');
        modeWeightedBtn.classList.remove('active');
        updateUIForMode();
        calculate();
    });

    function addRow() {
        const row = document.createElement('div');
        row.className = 'grade-row';
        row.innerHTML = `
            <input type="text" placeholder="Curso/Examen" class="input-name">
            <input type="number" placeholder="Nota" class="input-grade" step="0.1" min="0">
            <input type="number" placeholder="%" class="input-weight" min="0" max="100" style="display: ${isWeighted ? 'block' : 'none'}">
            <button class="btn-remove" title="Eliminar">&times;</button>
        `;

        const removeBtn = row.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
                calculate();
            }, 300);
        });

        // Add input listeners for calculation
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => calculate());
        });

        gradeRowsContainer.appendChild(row);
        calculate();
    }

    function updateUIForMode() {
        const weightInputs = document.querySelectorAll('.input-weight');
        weightInputs.forEach(input => {
            input.style.display = isWeighted ? 'block' : 'none';
        });
    }

    function calculate() {
        const rows = document.querySelectorAll('.grade-row');
        let totalWeightedScore = 0;
        let totalWeight = 0;
        let sumGrades = 0;
        let validRows = 0;
        let overLimit = false;

        rows.forEach(row => {
            const gradeInput = row.querySelector('.input-grade');
            const weightInput = row.querySelector('.input-weight');
            const grade = parseFloat(gradeInput.value);
            const weight = parseFloat(weightInput.value) || 0;

            if (isWeighted) {
                totalWeight += weight;
                if (totalWeight > 100) overLimit = true;
            }

            if (!isNaN(grade)) {
                if (isWeighted) {
                    totalWeightedScore += (grade * weight) / 100;
                } else {
                    sumGrades += grade;
                }
                validRows++;
            }
        });

        let finalAvg = 0;
        if (validRows > 0) {
            if (isWeighted) {
                // If weight total is over 100, we flag it. 
                // Calculation is still done but we show a warning.
                finalAvg = totalWeight > 0 ? (totalWeightedScore * 100) / totalWeight : 0;
            } else {
                finalAvg = sumGrades / validRows;
            }
        }

        animateValue(finalAverageDisplay, finalAvg);
        updateStatusBadge(finalAvg, totalWeight, overLimit);
        
        // Visual feedback for weight inputs if over 100%
        rows.forEach(row => {
            const weightInput = row.querySelector('.input-weight');
            if (isWeighted && totalWeight > 100) {
                weightInput.style.borderColor = 'var(--accent)';
                weightInput.style.color = 'var(--accent)';
            } else {
                weightInput.style.borderColor = '';
                weightInput.style.color = '';
            }
        });
    }

    function animateValue(element, value) {
        const start = parseFloat(element.innerText) || 0;
        const duration = 500;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = progress * (value - start) + start;
            element.innerText = current.toFixed(2);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    }

    function updateStatusBadge(avg, weightTotal, overLimit) {
        if (weightTotal === 0 && !isWeighted) {
            if (avg === 0) {
                statusBadge.innerText = 'Esperando datos...';
                statusBadge.className = 'status-badge';
                return;
            }
        }

        if (isWeighted) {
            if (overLimit) {
                statusBadge.innerText = `⚠️ El total (${weightTotal}%) supera el 100%`;
                statusBadge.className = 'status-badge fail';
                statusBadge.style.background = 'rgba(244, 63, 94, 0.2)';
                return;
            } else if (weightTotal !== 100 && weightTotal > 0) {
                statusBadge.innerText = `Peso total: ${weightTotal}% (Debe ser 100%)`;
                statusBadge.className = 'status-badge';
                statusBadge.style.color = '#fbbf24'; 
                statusBadge.style.background = 'rgba(251, 191, 36, 0.1)';
                return;
            } else if (weightTotal === 0 && avg === 0) {
                statusBadge.innerText = 'Ingresa pesos porcentuales';
                statusBadge.className = 'status-badge';
                statusBadge.style.color = '';
                return;
            }
        }

        statusBadge.style.color = '';
        statusBadge.style.background = '';

        if (avg >= 12.5 || avg >= 60) { 
            statusBadge.innerText = '¡Vas por buen camino!';
            statusBadge.className = 'status-badge pass';
        } else if (avg > 0) {
            statusBadge.innerText = '¡A esforzarse un poco más!';
            statusBadge.className = 'status-badge fail';
        } else {
            statusBadge.innerText = 'Esperando datos...';
            statusBadge.className = 'status-badge';
        }
    }
});
