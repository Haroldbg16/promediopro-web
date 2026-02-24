document.addEventListener('DOMContentLoaded', () => {
    const gradeRowsContainer = document.getElementById('grade-rows');
    const addRowBtn = document.getElementById('add-row');
    const finalAverageDisplay = document.getElementById('final-average');
    const statusBadge = document.getElementById('status-badge');
    const modeWeightedBtn = document.getElementById('mode-weighted');
    const modeSimpleBtn = document.getElementById('mode-simple');
    const scaleBtns = document.querySelectorAll('.scale-btn');
    const currentScaleText = document.getElementById('current-scale-text');

    let isWeighted = true;
    let currentScale = 20;
    let passThreshold = 10.5;

    const passThresholdInput = document.getElementById('pass-threshold-input');
    const currentAvgInput = document.getElementById('current-avg');
    const finalWeightInput = document.getElementById('final-weight');
    const targetGradeInput = document.getElementById('target-grade');
    const requiredGradeDisplay = document.getElementById('required-grade');
    const predictorMsg = document.getElementById('predictor-msg');

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

    scaleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentScale = parseInt(btn.dataset.scale);
            
            // Set default thresholds based on scale
            if (currentScale === 7) passThreshold = 4.0;
            else if (currentScale === 10) passThreshold = 6.0;
            else if (currentScale === 20) passThreshold = 10.5;
            else if (currentScale === 100) passThreshold = 60;
            else passThreshold = currentScale * 0.525;

            passThresholdInput.value = passThreshold;
            passThresholdInput.max = currentScale;
            passThresholdInput.min = currentScale === 7 ? 1 : 0;
            targetGradeInput.value = passThreshold;

            scaleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScaleText.innerText = currentScale === 7 ? `1-7` : `0-${currentScale}`;
            updateAllRowsForScale();
            updatePredictorUI(); 
            calculate();
            calculatePredictor();
        });
    });

    // Pass Threshold Listener

    passThresholdInput.addEventListener('input', () => {
        let val = parseFloat(passThresholdInput.value);
        if (isNaN(val)) return;
        
        const minLimit = currentScale === 7 ? 1 : 0;
        if (val < minLimit) val = minLimit;
        if (val > currentScale) val = currentScale;
        
        passThreshold = val;
        passThresholdInput.value = val;
        targetGradeInput.value = val; // Sync with predictor
        calculate();
        calculatePredictor();
    });

    function updatePredictorUI() {
        const helpText = document.querySelector('.input-help');
        if (helpText) helpText.innerText = currentScale === 7 ? `Ingresa tu nota promedio (1-7)` : `Ingresa tu nota promedio (0-${currentScale})`;
        
        const predictorCurrentAvg = document.getElementById('current-avg');
        if (predictorCurrentAvg) predictorCurrentAvg.placeholder = `Ej: ${(currentScale * 0.65).toFixed(1)}`;
    }

    // Sync button logic
    const syncBtn = document.getElementById('sync-calculator');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            if (!isWeighted) {
                alert("La sincronización solo está disponible en modo Ponderado.");
                return;
            }

            const rows = document.querySelectorAll('.grade-row');
            let totalWeight = 0;
            let totalWeightedScore = 0;

            rows.forEach(row => {
                const grade = parseFloat(row.querySelector('.input-grade').value);
                const weight = parseFloat(row.querySelector('.input-weight').value) || 0;
                if (!isNaN(grade)) {
                    totalWeightedScore += (grade * weight) / 100;
                    totalWeight += weight;
                }
            });

            if (totalWeight >= 100) {
                alert("Ya alcanzaste o superaste el 100% del curso.");
                return;
            }

            if (totalWeight > 0) {
                const currentAvg = (totalWeightedScore * 100) / totalWeight;
                currentAvgInput.value = currentAvg.toFixed(2);
                finalWeightInput.value = (100 - totalWeight).toFixed(0);
                
                // Trigger calculation
                calculatePredictor();
                
                // Visual feedback
                syncBtn.style.background = 'var(--secondary)';
                syncBtn.style.color = 'white';
                setTimeout(() => {
                    syncBtn.style.background = '';
                    syncBtn.style.color = '';
                }, 1000);
            } else {
                alert("Ingresa algunas notas en la calculadora primero.");
            }
        });
    }

    function addRow() {
        const currentRows = gradeRowsContainer.querySelectorAll('.grade-row');
        
        if (currentRows.length >= 12) {
            alert("Máximo 12 notas permitidas.");
            return;
        }

        const nextNum = currentRows.length + 1;
        
        const row = document.createElement('div');
        row.className = 'grade-row';
        row.innerHTML = `
            <input type="text" value="Examen ${nextNum}" class="input-name">
            <input type="number" placeholder="Nota (${currentScale === 7 ? '1-7' : '0-' + currentScale})" class="input-grade" step="0.1" min="${currentScale === 7 ? 1 : 0}" max="${currentScale}">
            <input type="number" placeholder="%" class="input-weight" min="0" max="100" style="display: ${isWeighted ? 'block' : 'none'}">
            <button class="btn-remove" title="Eliminar">&times;</button>
        `;

        const removeBtn = row.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
                reIndexRows();
                calculate();
            }, 300);
        });

        // Add input listeners for calculation
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                validateInput(e.target);
                calculate();
            });
        });

        gradeRowsContainer.appendChild(row);
        calculate();
    }

    function reIndexRows() {
        const rows = gradeRowsContainer.querySelectorAll('.grade-row');
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('.input-name');
            const currentVal = nameInput.value;
            // Solo renumerar si el nombre sigue el patrón por defecto "Examen X"
            if (/^Examen \d+$/.test(currentVal)) {
                nameInput.value = `Examen ${index + 1}`;
            }
        });
    }

    function validateInput(input) {
        let val = parseFloat(input.value);
        if (isNaN(val)) return;

        if (val < 0) {
            input.value = 0;
        }

        if (input.classList.contains('input-grade')) {
            if (currentScale === 7 && val < 1) input.value = 1;
            if (val > currentScale) {
                input.value = currentScale;
            }
        } else if (input.classList.contains('input-weight')) {
            if (val > 100) {
                input.value = 100;
            }
        }
    }

    function updateAllRowsForScale() {
        const gradeInputs = document.querySelectorAll('.input-grade');
        gradeInputs.forEach(input => {
            input.placeholder = currentScale === 7 ? `Nota (1-7)` : `Nota (0-${currentScale})`;
            input.max = currentScale;
            input.min = currentScale === 7 ? 1 : 0;
            validateInput(input);
        });

        // Sync target grade for predictor
        passThresholdInput.max = currentScale;
        passThresholdInput.min = currentScale === 7 ? 1 : 0;
        targetGradeInput.value = passThreshold;
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
            if (isWeighted && overLimit) {
                weightInput.classList.add('input-error');
            } else {
                weightInput.classList.remove('input-error');
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
                statusBadge.innerText = `El total (${weightTotal}%) supera el 100%`;
                statusBadge.className = 'status-badge fail';
                return;
            } else if (weightTotal !== 100 && weightTotal > 0) {
                statusBadge.innerText = `Peso total: ${weightTotal}% (Debe ser 100%)`;
                statusBadge.className = 'status-badge';
                statusBadge.style.color = '#fbbf24'; 
                return;
            } else if (weightTotal === 0 && avg === 0) {
                statusBadge.innerText = 'Ingresa pesos porcentuales';
                statusBadge.className = 'status-badge';
                statusBadge.style.color = '';
                return;
            }
        }

        statusBadge.style.color = '';
        
        // Pass threshold is now dynamic
        if (avg >= passThreshold) { 
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

    // Predictor Logic
    [currentAvgInput, finalWeightInput, targetGradeInput].forEach(input => {
        input.addEventListener('input', (e) => {
            validatePredictorInput(e.target);
            calculatePredictor();
        });
    });

    function validatePredictorInput(input) {
        let val = parseFloat(input.value);
        if (isNaN(val)) return;
        if (val < 0) input.value = 0;

        if (input === currentAvgInput || input === targetGradeInput) {
            if (val > currentScale) input.value = currentScale;
        } else if (input === finalWeightInput) {
            if (val > 100) input.value = 100;
        }
    }

    function calculatePredictor() {
        const currentAvg = parseFloat(currentAvgInput.value);
        const finalWeight = parseFloat(finalWeightInput.value);
        const targetGrade = parseFloat(targetGradeInput.value);

        if (isNaN(currentAvg) || isNaN(finalWeight) || isNaN(targetGrade)) {
            requiredGradeDisplay.innerText = '0.00';
            predictorMsg.innerText = 'Completa los datos';
            predictorMsg.className = 'status-badge';
            return;
        }

        if (finalWeight <= 0 || finalWeight >= 100) {
            requiredGradeDisplay.innerText = '---';
            predictorMsg.innerText = 'Peso inválido (1-99)';
            predictorMsg.className = 'status-badge fail';
            return;
        }

        const w = finalWeight / 100;
        let needed = (targetGrade - (currentAvg * (1 - w))) / w;

        // Clamp to minimum scale (0 or 1 for Chile)
        const minScale = currentScale === 7 ? 1 : 0;
        if (needed < minScale) needed = minScale;

        animateValue(requiredGradeDisplay, needed);

        if (needed <= minScale) {
            predictorMsg.innerText = '¡Aprobaste el curso! ';
            predictorMsg.className = 'status-badge pass';
        } else if (needed > currentScale) {
            predictorMsg.innerText = `Necesitas un milagro (supero el límite) 💀`;
            predictorMsg.className = 'status-badge fail';
        } else {
            predictorMsg.innerText = `Necesitas sacar ${needed.toFixed(2)} para aprobar`;
            predictorMsg.className = 'status-badge';
        }
    }

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    // Global prevention of negative sign (-), 'e' (scientific), and '+' in all numeric inputs
    document.addEventListener('keydown', (e) => {
        if (e.target.type === 'number') {
            if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === 'E') {
                e.preventDefault();
            }
        }
    });
});
