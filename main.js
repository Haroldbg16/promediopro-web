document.addEventListener('DOMContentLoaded', () => {
    const gradeRowsContainer = document.getElementById('grade-rows');
    const addRowBtn = document.getElementById('add-row');
    const finalAverageDisplay = document.getElementById('final-average');
    const statusBadge = document.getElementById('status-badge');
    const modeWeightedBtn = document.getElementById('mode-weighted');
    const modeSimpleBtn = document.getElementById('mode-simple');
    const scaleBtns = document.querySelectorAll('.scale-btn');
    const currentScaleText = document.getElementById('current-scale-text');

    // Menu Hamburger Logic
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Dropdown Logic
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    navDropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.nav-dropdown-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            // Close others
            navDropdowns.forEach(d => d.classList.remove('open'));
            // Toggle current
            if (!isOpen) dropdown.classList.add('open');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        navDropdowns.forEach(d => d.classList.remove('open'));
    });

    // Share Guide Toggle Logic
    // Moved to index.html inline script to ensure immediate execution on click.

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

    // Initialization will be handled by loadState()

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
        saveState();
    });

    modeSimpleBtn.addEventListener('click', () => {
        isWeighted = false;
        gradeRowsContainer.classList.add('mode-simple');
        gradeRowsContainer.classList.remove('mode-weighted');
        modeSimpleBtn.classList.add('active');
        modeWeightedBtn.classList.remove('active');
        updateUIForMode();
        calculate();
        saveState();
    });

    scaleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentScale = parseInt(btn.dataset.scale);
            
            // Set default thresholds based on scale
            if (currentScale === 7) passThreshold = 4.0;
            else if (currentScale === 5) passThreshold = 3.0;
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
            saveState();
        });
    });

    // --- Detección Automática de País ---
    function detectCountryAndSetScale() {
        if (localStorage.getItem('promediopro_data')) return; // No sobrescribir si ya hay datos

        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let detectedScale = 20;
            let detectedThreshold = 10.5;

            if (timezone.includes('Santiago')) {
                detectedScale = 7;
                detectedThreshold = 4.0;
            } else if (timezone.includes('Bogota') || timezone.includes('Panama') || timezone.includes('Asuncion')) {
                detectedScale = 5;
                detectedThreshold = 3.0;
            } else if (timezone.includes('Mexico') || timezone.includes('Buenos_Aires') || timezone.includes('Montevideo') || timezone.includes('Madrid') || timezone.includes('Guayaquil')) {
                detectedScale = 10;
                detectedThreshold = 6.0;
            } else if (timezone.includes('Caracas') || timezone.includes('Lima')) {
                detectedScale = 20;
                detectedThreshold = 10.5;
            }

            currentScale = detectedScale;
            passThreshold = detectedThreshold;
            
            const targetBtn = Array.from(scaleBtns).find(b => parseInt(b.dataset.scale) === currentScale);
            if (targetBtn) {
                scaleBtns.forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');
                currentScaleText.innerText = currentScale === 7 ? `1-7` : `0-${currentScale}`;
                passThresholdInput.value = passThreshold;
                updateAllRowsForScale();
                updatePredictorUI();
            }
        } catch (e) { console.log("Auto-detection skip"); }
    }

    // Pass Threshold Listener

    passThresholdInput.addEventListener('input', () => {
        let val = parseFloat(passThresholdInput.value);
        if (isNaN(val)) return;
        
        const minLimit = currentScale === 7 ? 1 : 0;
        if (val < minLimit) val = minLimit;
        if (val > currentScale) val = currentScale;
        
        passThreshold = val;
        passThresholdInput.value = val;
        calculate();
        calculatePredictor();
        saveState();
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

    // Initialization rows and row logic are now handled in the Persistence section

    // XSS sanitization helper
    function sanitize(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
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

    function clampDecimals(input) {
        // Truncate to max 2 decimal places without rounding
        const str = input.value;
        const dotIndex = str.indexOf('.');
        if (dotIndex !== -1 && str.length - dotIndex > 3) {
            input.value = str.substring(0, dotIndex + 3);
        }
    }

    function validateInput(input) {
        clampDecimals(input);
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
            input.placeholder = currentScale === 7 ? `Nota ` : `Nota`;
            input.max = currentScale;
            input.min = currentScale === 7 ? 1 : 0;
            validateInput(input);
        });

        // Sync target grade for predictor
        passThresholdInput.max = currentScale;
        passThresholdInput.min = currentScale === 7 ? 1 : 0;
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
        updateStatusBadge(finalAvg, totalWeight, overLimit, validRows);

        // Visual feedback for weight inputs if over 100%
        rows.forEach(row => {
            const weightInput = row.querySelector('.input-weight');
            if (isWeighted && overLimit) {
                weightInput.classList.add('input-error');
            } else {
                weightInput.classList.remove('input-error');
            }
        });

        // Share buttons restriction
        const isInvalid = (isWeighted && overLimit) || validRows === 0;
        whatsappBtn.disabled = isInvalid;
        downloadImgBtn.disabled = isInvalid;
    }

    function animateValue(element, value) {
        const start = parseFloat(element.innerText) || 0;
        if (element._animFrame) cancelAnimationFrame(element._animFrame);

        const duration = 400;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = progress * (value - start) + start;
            element.innerText = current.toFixed(2);
            if (progress < 1) {
                element._animFrame = window.requestAnimationFrame(step);
            }
        }
        element._animFrame = window.requestAnimationFrame(step);
    }

    function updateStatusBadge(avg, weightTotal, overLimit, validRows) {
        if (validRows === 0) {
            statusBadge.innerText = 'Esperando datos...';
            statusBadge.className = 'status-badge';
            return;
        }

        if (isWeighted) {
            if (overLimit) {
                statusBadge.innerText = `El total (${weightTotal}%) supera el 100%`;
                statusBadge.className = 'status-badge fail';
                return;
            } else if (weightTotal !== 100 && weightTotal > 0) {
                statusBadge.innerText = `Peso total: ${weightTotal}% (Debe ser 100%)`;
                statusBadge.className = 'status-badge';
                return;
            }
        }
        
        // Round to 2 decimals
        const displayedAvg = Math.round(avg * 100) / 100;

        if (displayedAvg >= passThreshold) { 
            statusBadge.innerText = '¡Bien hecho!';
            statusBadge.className = 'status-badge pass';
        } else {
            statusBadge.innerText = '¡A esforzarse un poco más!';
            statusBadge.className = 'status-badge fail';
        }
    }

    // logica del predictor
    [currentAvgInput, finalWeightInput, targetGradeInput].forEach(input => {
        input.addEventListener('input', (e) => {
            validatePredictorInput(e.target);
            calculatePredictor();
            saveState();
        });
    });



    function validatePredictorInput(input) {
        clampDecimals(input);
        let val = parseFloat(input.value);
        if (isNaN(val)) return;
        if (val < 0) input.value = 0;

        if (input === currentAvgInput || input === targetGradeInput) {
            if (val > currentScale) input.value = currentScale;
        } else if (input === finalWeightInput) {
            if (val > 100) input.value = 100;
        }
    }

    let lastCalculatedNeeded = 0;

    function calculatePredictor() {
        const currentAvg = parseFloat(currentAvgInput.value);
        const finalWeight = parseFloat(finalWeightInput.value);
        const targetGrade = parseFloat(targetGradeInput.value);

        if (isNaN(currentAvg) || isNaN(finalWeight) || isNaN(targetGrade)) {
            requiredGradeDisplay.innerText = '0.00';
            predictorMsg.innerText = 'Completa los datos';
            predictorMsg.className = 'status-badge';
            lastCalculatedNeeded = 0;
            return;
        }

        if (finalWeight <= 0 || finalWeight >= 100) {
            requiredGradeDisplay.innerText = '---';
            predictorMsg.innerText = 'Peso inválido (1-99)';
            predictorMsg.className = 'status-badge fail';
            lastCalculatedNeeded = 0;
            return;
        }

        const w = finalWeight / 100;
        let needed = (targetGrade - (currentAvg * (1 - w))) / w;

        // Clamp to minimum scale (0 or 1 for Chile)
        const minScale = currentScale === 7 ? 1 : 0;
        if (needed < minScale) needed = minScale;

        lastCalculatedNeeded = needed;
        animateValue(requiredGradeDisplay, needed);

        if (needed <= minScale) {
            predictorMsg.innerText = '¡Aprobaste el curso!';
            predictorMsg.className = 'status-badge pass';
        } else if (needed > currentScale) {
            predictorMsg.innerText = `Necesitas un milagro (supero el límite) 💀`;
            predictorMsg.className = 'status-badge fail';
        } else {
            predictorMsg.innerText = `Necesitas sacar ${Math.round(needed)} para aprobar`;
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

    // --- Persistence & Sharing Logic ---

    const saveIndicator = document.getElementById('save-indicator');
    const resetBtn = document.getElementById('reset-calculator');
    const whatsappBtn = document.getElementById('share-whatsapp');
    const shareLinkBtn = document.getElementById('share-link');
    const downloadImgBtn = document.getElementById('download-image');

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const showSaveIndicator = debounce(() => {
        saveIndicator.classList.add('visible');
        setTimeout(() => saveIndicator.classList.remove('visible'), 2000);
    }, 500);

    //guardar datos en localstorage
    function saveState() {
        const rows = [];
        document.querySelectorAll('.grade-row').forEach(row => {
            rows.push({
                name: row.querySelector('.input-name').value,
                grade: row.querySelector('.input-grade').value,
                weight: row.querySelector('.input-weight').value
            });
        });

        const state = {
            s: currentScale,
            m: isWeighted ? 'w' : 's',
            t: passThreshold,
            r: rows,
            pca: currentAvgInput.value,
            pfw: finalWeightInput.value,
            ptg: targetGradeInput.value
        };

        localStorage.setItem('promediopro_data', JSON.stringify(state));
        showSaveIndicator();
    }

    function addRow(data = { name: '', grade: '', weight: '' }) {
        const currentRows = gradeRowsContainer.querySelectorAll('.grade-row');
        if (currentRows.length >= 12) return;

        if (currentRows.length + 1 >= 12) {
            addRowBtn.disabled = true;
        }

        const nextNum = currentRows.length + 1;
        const row = document.createElement('div');
        row.className = 'grade-row';
        
        const rowName = sanitize(data.name || `Examen ${nextNum}`);
        
        row.innerHTML = `
            <input type="text" value="${rowName}" class="input-name" maxlength="30">
            <input type="number" value="${sanitize(data.grade)}" placeholder="Nota" class="input-grade" step="0.1" min="${currentScale === 7 ? 1 : 0}" max="${currentScale}">
            <input type="number" value="${sanitize(data.weight)}" placeholder="Peso %" class="input-weight" min="0" max="100" style="display: ${isWeighted ? 'block' : 'none'}">
            <button class="btn-remove" aria-label="Eliminar fila" title="Eliminar">&times;</button>
        `;

        const removeBtn = row.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
                reIndexRows();
                calculate();
                saveState();
                if (gradeRowsContainer.querySelectorAll('.grade-row').length < 12) {
                    addRowBtn.disabled = false;
                }
            }, 300);
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                validateInput(e.target);
                calculate();
                saveState();
            });
        });

        gradeRowsContainer.appendChild(row);
        calculate();
    }

    function loadState() {
        const urlParams = new URLSearchParams(window.location.search);
        let state = null;

        // URL priority
        if (urlParams.has('s')) {
            const names = urlParams.get('n')?.split(',') || [];
            const grades = urlParams.get('g')?.split(',') || [];
            const weights = urlParams.get('p')?.split(',') || [];
            
            state = {
                s: parseInt(urlParams.get('s')),
                m: urlParams.get('m') || 'w',
                t: parseFloat(urlParams.get('t')) || 10.5,
                r: names.map((name, i) => ({
                    name: decodeURIComponent(name),
                    grade: grades[i] || '',
                    weight: weights[i] || ''
                }))
            };
        } else {
            const saved = localStorage.getItem('promediopro_data');
            if (saved) {
                try {
                    state = JSON.parse(saved);
                } catch(e) {
                    console.error("Error parsing saved state", e);
                }
            }
        }

        // Clean container before loading
        gradeRowsContainer.innerHTML = '';

        if (state) {
            currentScale = state.s || 20;
            isWeighted = state.m !== 's';
            passThreshold = state.t || 10.5;

            // Update UI for scale
            const activeScaleBtn = Array.from(scaleBtns).find(b => parseInt(b.dataset.scale) === currentScale);
            if (activeScaleBtn) {
                scaleBtns.forEach(b => b.classList.remove('active'));
                activeScaleBtn.classList.add('active');
                currentScaleText.innerText = currentScale === 7 ? `1-7` : `0-${currentScale}`;
            }

            // Update UI for mode
            if (isWeighted) {
                modeWeightedBtn.classList.add('active');
                modeSimpleBtn.classList.remove('active');
                gradeRowsContainer.classList.add('mode-weighted');
                gradeRowsContainer.classList.remove('mode-simple');
            } else {
                modeSimpleBtn.classList.add('active');
                modeWeightedBtn.classList.remove('active');
                gradeRowsContainer.classList.add('mode-simple');
                gradeRowsContainer.classList.remove('mode-weighted');
            }

            passThresholdInput.value = passThreshold;

            // Load rows
            if (state.r && state.r.length > 0) {
                state.r.forEach(rowData => addRow(rowData));
            } else {
                for (let i = 0; i < 3; i++) addRow();
            }


            //cargar datos del predictor
            if (state.pca !== undefined) currentAvgInput.value = state.pca;
            if (state.pfw !== undefined) finalWeightInput.value = state.pfw;
            if (state.ptg !== undefined) {
                targetGradeInput.value = state.ptg;
            } else {
                targetGradeInput.value = passThreshold; // fallback si no hay dato guardado
            }

            updatePredictorUI();
            calculate();
            calculatePredictor();
        } else {
            // Default 3 rows
            for (let i = 0; i < 3; i++) addRow();
        }
    }

    resetBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
            localStorage.removeItem('promediopro_data');
            window.history.replaceState({}, '', window.location.pathname);
            
            // Reset Global Variables to Default
            isWeighted = true;
            currentScale = 20;
            passThreshold = 10.5;
            
            // Reset Scale UI
            scaleBtns.forEach(b => b.classList.remove('active'));
            const defaultScaleBtn = Array.from(scaleBtns).find(b => parseInt(b.dataset.scale) === 20);
            if (defaultScaleBtn) defaultScaleBtn.classList.add('active');
            currentScaleText.innerText = '0-20';
            
            // Reset Mode UI
            modeWeightedBtn.classList.add('active');
            modeSimpleBtn.classList.remove('active');
            gradeRowsContainer.className = 'grade-rows mode-weighted';
            
            // Clear Calculator
            gradeRowsContainer.innerHTML = '';
            addRowBtn.disabled = false;
            for (let i = 0; i < 3; i++) addRow();
            
            // Clear Predictor
            currentAvgInput.value = '';
            finalWeightInput.value = '';
            targetGradeInput.value = passThreshold;
            passThresholdInput.value = passThreshold;
            requiredGradeDisplay.innerText = '0.00';
            predictorMsg.innerText = 'Completa los datos';
            predictorMsg.className = 'status-badge';
            lastCalculatedNeeded = 0;
            
            calculate();
            calculatePredictor();
        }
    });

    // Sharing Functions
    function generateShareURL() {
        const names = [];
        const grades = [];
        const weights = [];
        document.querySelectorAll('.grade-row').forEach(row => {
            names.push(row.querySelector('.input-name').value);
            grades.push(row.querySelector('.input-grade').value);
            weights.push(row.querySelector('.input-weight').value);
        });

        const params = new URLSearchParams({
            s: currentScale,
            m: isWeighted ? 'w' : 's',
            t: passThreshold,
            n: names.join(','),
            g: grades.join(','),
            p: weights.join(',')
        });

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }

    // boton de compartir a WhatsApp (logica)
    whatsappBtn.addEventListener('click', () => {
        const avg = finalAverageDisplay.innerText;
        const url = generateShareURL();
        
        let message = `Calculé mi promedio en PromedioPro:\n\n Mi promedio actual es: ${avg} / ${currentScale}\n`;

        const finalAvg = parseFloat(finalAverageDisplay.innerText);

       if (finalAvg >= passThreshold) {
        message += 'Logre aprobar el curso!\n\n';
    } else if (lastCalculatedNeeded > currentScale) {
        message += 'Ni con un milagro apruebo ☠️\n\n';
    } else if (!isNaN(parseFloat(currentAvgInput.value)) && !isNaN(parseFloat(finalWeightInput.value))) {
        message += `Necesito un ${lastCalculatedNeeded.toFixed(2)} en el examen final para aprobar!\n\n`;
    }

    message += `Observa mi Calculo aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
});

    const imageModal = document.getElementById('image-modal');
    const previewContainer = document.getElementById('preview-image-container');
    const closeModal = document.querySelector('.close-modal');
    const modalShareBtn = document.getElementById('modal-share-btn');
    const modalDownloadBtn = document.getElementById('modal-download-btn');
    let generatedBlob = null;

    downloadImgBtn.addEventListener('click', () => {
        // Show modal immediately for instant visual feedback
        imageModal.style.display = 'block';
        previewContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:40px">Generando imagen...</p>';

        // Defer heavy canvas work off the main thread task
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';

            // Background
            const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
            if (isLightTheme) {
                grad.addColorStop(0, '#FFFFFF');
                grad.addColorStop(1, '#F0F9FF');
            } else {
                grad.addColorStop(0, '#0f172a');
                grad.addColorStop(1, '#1e293b');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1080);

            // Accent Circle
            ctx.beginPath();
            ctx.arc(900, 200, 400, 0, Math.PI * 2);
            ctx.fillStyle = isLightTheme ? 'rgba(14, 165, 233, 0.08)' : 'rgba(6, 182, 212, 0.05)';
            ctx.fill();

            // Texto del Logo
            ctx.fillStyle = isLightTheme ? '#0C4A6E' : 'white';
            ctx.font = 'bold 60px Outfit';
            ctx.fillText('PROMEDIO', 100, 120);
            ctx.fillStyle = isLightTheme ? '#0EA5E9' : '#28c6e2ff';
            ctx.fillText('PRO', 420, 120);

            // Contenido
            ctx.textAlign = 'center';
            ctx.fillStyle = isLightTheme ? '#0369A1' : 'rgba(255,255,255,0.6)';
            ctx.font = '40px Inter';
            ctx.fillText('MI PROMEDIO ACTUAL ES:', 540, 360);

            ctx.fillStyle = '#0EA5E9';
            if (!isLightTheme) ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 240px Outfit';
            const avgVal = parseFloat(finalAverageDisplay.innerText);
            ctx.fillText(isNaN(avgVal) ? '0' : Math.round(avgVal), 540, 580);

            ctx.fillStyle = isLightTheme ? '#0C4A6E' : 'white';
            ctx.font = '45px Inter';
            ctx.fillText(`Escala: 0-${currentScale}  •  Meta: ${passThreshold}`, 540, 680);

            // Required Grade Info
            if (lastCalculatedNeeded > (currentScale === 7 ? 1 : 0)) {
                ctx.fillStyle = isLightTheme ? '#334155' : 'rgba(255,255,255,0.6)';
                ctx.font = '40px Inter';
                ctx.fillText(`Necesitas un ${Math.round(lastCalculatedNeeded)} en tu examen final`, 540, 780);
            }

            // Footer URL
            ctx.fillStyle = isLightTheme ? '#64748B' : 'rgba(255,255,255,0.4)';
            ctx.font = '35px Inter';
            ctx.fillText('promediopro.com', 540, 1020);

            // Convert to image and show modal
            const dataUrl = canvas.toDataURL('image/png');
            previewContainer.innerHTML = `<img src="${dataUrl}" alt="Vista previa de resultados">`;

            // Prepare blob for sharing
            canvas.toBlob((blob) => {
                generatedBlob = blob;
            }, 'image/png');
        }, 0);
    });

    closeModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    const triggerDownload = () => {
        const img = previewContainer.querySelector('img');
        if (!img) return;
        const link = document.createElement('a');
        link.download = 'mi-promedio-promediopro.png';
        link.href = img.src;
        link.click();
    };

    modalDownloadBtn.addEventListener('click', triggerDownload);

    modalShareBtn.addEventListener('click', async () => {
        if (!generatedBlob) return;

        const file = new File([generatedBlob], 'mi-promedio.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Mi Promedio en PromedioPro',
                    text: '¡Mira mi promedio en PromedioPro!'
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al compartir:', err);
                    triggerDownload();
                }
            }
        } else {
            // Fallback for desktop or unsupported browsers
            triggerDownload();
            alert('La función de compartir imagen no es compatible con este navegador. Se ha descargado la imagen.');
        }
    });

    // Start loading
    detectCountryAndSetScale();
    loadState();
});
