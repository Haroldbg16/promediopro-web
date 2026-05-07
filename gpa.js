document.addEventListener('DOMContentLoaded', () => {

    const gpaRowsContainer = document.getElementById('gpa-rows');
    const addRowBtn = document.getElementById('add-gpa-row');
    const semesterGpaDisplay = document.getElementById('semester-gpa');
    const cumulativeGpaDisplay = document.getElementById('cumulative-gpa');
    const statusBadge = document.getElementById('status-badge');
    const deansListBadge = document.getElementById('deans-list');
    const modeCollegeBtn = document.getElementById('mode-college');
    const modeHsBtn = document.getElementById('mode-hs');
    const prevGpaInput = document.getElementById('prev-gpa');
    const prevCreditsInput = document.getElementById('prev-credits');
    const targetGpaInput = document.getElementById('target-gpa');
    const requiredGpaVal = document.getElementById('required-gpa-val');
    const predictorMsg = document.getElementById('predictor-msg');
    const maxPossibleBox = document.getElementById('max-possible-box');
    const maxPossibleVal = document.getElementById('max-possible-val');
    const downloadImgBtn = document.getElementById('download-gpa-image');
    const calculatorCard = document.querySelector('.calculator-card');
    const modeStatusText = document.getElementById('current-mode-status');
    const saveIndicator = document.getElementById('save-indicator');
    const whatsappShareBtn = document.getElementById('share-whatsapp');

    let isHighSchool = false;

    const gpaScale = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0, '❓ Sin nota aún': null
    };

    // --- Mode Toggle ---
    modeCollegeBtn.addEventListener('click', () => {
        isHighSchool = false;
        modeCollegeBtn.classList.add('active');
        modeHsBtn.classList.remove('active');
        calculatorCard.classList.remove('mode-hs');
        modeStatusText.innerText = "College (Standard)";
        validateInput(prevCreditsInput);
        validateInput(prevGpaInput);
        validateInput(targetGpaInput);
        calculateAll();
        saveState();
    });

    modeHsBtn.addEventListener('click', () => {
        isHighSchool = true;
        modeHsBtn.classList.add('active');
        modeCollegeBtn.classList.remove('active');
        calculatorCard.classList.add('mode-hs');
        modeStatusText.innerText = "High School (Weighted)";
        validateInput(prevCreditsInput);
        validateInput(prevGpaInput);
        validateInput(targetGpaInput);
        calculateAll();
        saveState();
    });

    // --- Menu Hamburger ---
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Dropdown Logic
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    navDropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.nav-dropdown-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                navDropdowns.forEach(d => d.classList.remove('open'));
                if (!isOpen) dropdown.classList.add('open');
            });
        }
    });

    document.addEventListener('click', () => {
        navDropdowns.forEach(d => d.classList.remove('open'));
    });

    // --- Persistence Utilities ---
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
        if (saveIndicator) {
            saveIndicator.classList.add('visible');
            setTimeout(() => saveIndicator.classList.remove('visible'), 2000);
        }
    }, 500);

    function saveState() {
        const rows = [];
        document.querySelectorAll('.gpa-row').forEach(row => {
            rows.push({
                name: row.querySelector('.input-name').value,
                letter: row.querySelector('.letter-select').value,
                credits: row.querySelector('.input-credits').value,
                type: row.querySelector('.input-type').value
            });
        });

        const state = {
            isHs: isHighSchool,
            prevGpa: prevGpaInput.value,
            prevCr: prevCreditsInput.value,
            target: targetGpaInput.value,
            rows: rows
        };

        localStorage.setItem('promediopro_gpa_data', JSON.stringify(state));
        showSaveIndicator();
    }

    function loadState() {
        const saved = localStorage.getItem('promediopro_gpa_data');
        if (!saved) {
            for (let i = 0; i < 3; i++) addGpaRow();
            return;
        }

        try {
            const state = JSON.parse(saved);
            isHighSchool = state.isHs || false;

            if (isHighSchool) {
                modeHsBtn.classList.add('active');
                modeCollegeBtn.classList.remove('active');
                calculatorCard.classList.add('mode-hs');
                modeStatusText.innerText = "High School (Weighted)";
            } else {
                modeCollegeBtn.classList.add('active');
                modeHsBtn.classList.remove('active');
                calculatorCard.classList.remove('mode-hs');
                modeStatusText.innerText = "College (Standard)";
            }

            prevGpaInput.value = state.prevGpa || '';
            prevCreditsInput.value = state.prevCr || '';
            targetGpaInput.value = state.target || '';

            gpaRowsContainer.innerHTML = '';
            if (state.rows && state.rows.length > 0) {
                state.rows.forEach(rowData => {
                    // Migración: convierte el nombre antiguo al nuevo
                    if (rowData.letter === 'Pendiente') rowData.letter = '❓ Sin nota aún';
                    addGpaRow(rowData);
                });
            } else {
                for (let i = 0; i < 3; i++) addGpaRow();
            }
            calculateAll();
        } catch (e) {
            console.error("Error loading GPA state", e);
            for (let i = 0; i < 3; i++) addGpaRow();
        }
    }

    // --- Input Validation ---
    function validateInput(input) {
        let val = parseFloat(input.value);
        if (isNaN(val)) return;

        if (val < 0) input.value = 0;

        if (input === prevGpaInput || input === targetGpaInput) {
            const max = isHighSchool ? 5.0 : 4.0;
            if (val > max) input.value = max;
        } else if (input.classList.contains('input-credits')) {
            if (val > 6) input.value = 6;
        } else if (input === prevCreditsInput) {
            const maxCredits = isHighSchool ? 30 : 150;
            if (val > maxCredits) input.value = maxCredits;
        }
    }

    // Block -, +, e keys in number inputs
    document.addEventListener('keydown', (e) => {
        if (e.target.type === 'number') {
            if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === 'E') {
                e.preventDefault();
            }
        }
    });

    // --- Row Management ---
    function addGpaRow(data = { name: '', letter: 'A', credits: 3, type: 'Regular' }) {
        const row = document.createElement('div');
        row.className = 'gpa-row';

        row.innerHTML = `
            <div class="mobile-field field-name">
                <label class="mobile-label">NOMBRE DE MATERIA</label>
                <input type="text" value="${data.name}" placeholder="Ej: Cálculo Integral" class="input-name">
            </div>
            <div class="mobile-field field-letter">
                <label class="mobile-label">CALIFICACIÓN</label>
                <select class="letter-select">
                    ${Object.keys(gpaScale).map(l => `<option value="${l}" ${l === data.letter ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="mobile-field field-credits">
                <label class="mobile-label">CRÉDITOS</label>
                <div class="credits-input-group">
                    <button type="button" class="btn-credit-minus">&minus;</button>
                    <input type="number" value="${data.credits}" class="input-credits" min="0" max="100" step="0.5">
                    <button type="button" class="btn-credit-plus">&plus;</button>
                </div>
            </div>
            <div class="mobile-field field-type">
                <label class="mobile-label">ESCALA</label>
                <select class="input-type letter-select">
                    <option value="Regular" ${data.type === 'Regular' ? 'selected' : ''}>Regular</option>
                    <option value="Honors" ${data.type === 'Honors' ? 'selected' : ''}>Honors (+0.5)</option>
                    <option value="AP/IB" ${data.type === 'AP/IB' ? 'selected' : ''}>AP/IB (+1.0)</option>
                </select>
            </div>
            <button class="btn-remove">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        `;

        row.querySelector('.btn-remove').addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
                calculateAll();
                saveState();
            }, 300);
        });

        row.querySelector('.btn-credit-minus').addEventListener('click', () => {
            let input = row.querySelector('.input-credits');
            let val = parseFloat(input.value) || 0;
            if (val > 0) {
                input.value = val - 0.5;
                validateInput(input);
                calculateAll();
                saveState();
            }
        });

        row.querySelector('.btn-credit-plus').addEventListener('click', () => {
            let input = row.querySelector('.input-credits');
            let val = parseFloat(input.value) || 0;
            input.value = val + 0.5;
            validateInput(input);
            calculateAll();
            saveState();
        });

        row.querySelectorAll('select, input').forEach(el => {
            el.addEventListener('change', () => {
                if (el.type === 'number') validateInput(el);
                calculateAll();
                saveState();
            });
            el.addEventListener('input', () => {
                if (el.type === 'number') validateInput(el);
                calculateAll();
                saveState();
            });
        });

        gpaRowsContainer.appendChild(row);
        calculateAll();
    }

    // --- Calculations ---
    function calculateAll() {
        const rows = document.querySelectorAll('.gpa-row');
        let semTotalQP = 0;
        let semTotalCredits = 0;
        let pendingCredits = 0;
        let validRows = 0;

        rows.forEach(row => {
            const letter = row.querySelector('.letter-select').value;
            const credits = parseFloat(row.querySelector('.input-credits').value) || 1;
            const type = row.querySelector('.input-type').value;

            const baseValue = gpaScale[letter];
            let boost = 0;
            if (isHighSchool && baseValue !== null && baseValue > 0) {
                if (type === 'Honors') boost = 0.5;
                if (type === 'AP/IB') boost = 1.0;
            }

            if (baseValue !== null) {
                semTotalQP += (baseValue + boost) * credits;
                semTotalCredits += credits;
                validRows++;
            } else if (baseValue === null) {
                pendingCredits += credits;
            }
        });

        const semGpa = semTotalCredits > 0 ? semTotalQP / semTotalCredits : 0;

        const prevGpa = parseFloat(prevGpaInput.value) || 0;
        const prevCredits = parseFloat(prevCreditsInput.value) || 0;

        const totalCredits = prevCredits + semTotalCredits;
        const totalQP = (prevGpa * prevCredits) + semTotalQP;

        const cumGpa = totalCredits > 0 ? totalQP / totalCredits : (prevCredits > 0 ? prevGpa : 0);

        semesterGpaDisplay.innerText = semGpa.toFixed(2);
        cumulativeGpaDisplay.innerText = cumGpa.toFixed(2);

        if (semGpa >= 3.50 && semTotalCredits > 0) {
            deansListBadge.classList.add('visible');
        } else {
            deansListBadge.classList.remove('visible');
        }

        updateStatus(semGpa, semTotalCredits, validRows);
        calculatePredictor(totalQP, totalCredits, pendingCredits);
    }

    function updateStatus(avg, credits, valid) {
        if (valid === 0) {
            statusBadge.innerText = 'Ingrese datos';
            statusBadge.className = 'status-badge';
            return;
        }

        if (avg >= 3.0) {
            statusBadge.innerText = '¡Excelencia Académica!';
            statusBadge.className = 'status-badge pass';
        } else if (avg >= 2.0) {
            statusBadge.innerText = 'Buen progreso';
            statusBadge.className = 'status-badge';
        } else {
            statusBadge.innerText = 'Bajo el promedio estándar';
            statusBadge.className = 'status-badge fail';
        }
    }

    function calculatePredictor(currentQP, currentCredits, pendingCredits) {
        const target = parseFloat(targetGpaInput.value);
        const maxScale = isHighSchool ? 5.0 : 4.0;
        const totalFutureCredits = currentCredits + pendingCredits;

        // Siempre calcular y mostrar el máximo alcanzable si hay pendientes
        if (pendingCredits > 0) {
            const maxPossible = (currentQP + (maxScale * pendingCredits)) / totalFutureCredits;
            maxPossibleVal.innerText = maxPossible.toFixed(2);
            maxPossibleBox.style.display = 'flex';
        } else {
            maxPossibleBox.style.display = 'none';
        }

        if (isNaN(target) || pendingCredits <= 0) {
            requiredGpaVal.innerText = '---';
            predictorMsg.innerText = pendingCredits <= 0
                ? 'Selecciona "❓ Sin nota aún" en algún curso'
                : 'Establece una meta de GPA';
            predictorMsg.className = 'status-badge';
            return;
        }

        const neededAvg = (target * totalFutureCredits - currentQP) / pendingCredits;

        if (neededAvg > maxScale) {
            // Meta inalcanzable: mostrar alternativa realista
            const maxPossible = (currentQP + (maxScale * pendingCredits)) / totalFutureCredits;
            requiredGpaVal.innerText = '---';
            predictorMsg.innerText = `Meta inalcanzable. Máximo posible: ${maxPossible.toFixed(2)} — ¿Ajustar meta?`;
            predictorMsg.className = 'status-badge fail';
        } else if (neededAvg <= 0) {
            requiredGpaVal.innerText = '✓';
            predictorMsg.innerText = '¡Ya superaste tu meta! Sigue así 🎉';
            predictorMsg.className = 'status-badge pass';
        } else {
            requiredGpaVal.innerText = neededAvg.toFixed(2);

            // Badge de dificultad según el GPA necesario
            if (neededAvg <= 3.0) {
                predictorMsg.innerText = `🟢 ¡Alcanzable! Necesitas promediar ${neededAvg.toFixed(2)} (equivale a B o mejor)`;
                predictorMsg.className = 'status-badge pass';
            } else if (neededAvg <= 3.3) {
                predictorMsg.innerText = `🟢 Muy alcanzable. Necesitas promediar B+ (${neededAvg.toFixed(2)})`;
                predictorMsg.className = 'status-badge pass';
            } else if (neededAvg <= 3.7) {
                predictorMsg.innerText = `🟡 Desafiante. Necesitas promediar A- (${neededAvg.toFixed(2)})`;
                predictorMsg.className = 'status-badge';
            } else {
                predictorMsg.innerText = `🔴 Muy difícil. Necesitas promediar ${neededAvg.toFixed(2)} — casi solo A's`;
                predictorMsg.className = 'status-badge fail';
            }
        }
    }

    // --- Global Input Listeners ---
    [prevGpaInput, prevCreditsInput, targetGpaInput].forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            calculateAll();
            saveState();
        });
    });

    addRowBtn.addEventListener('click', () => {
        addGpaRow();
        saveState();
    });

    document.getElementById('reset-gpa').addEventListener('click', () => {
        if (confirm('¿Borrar todos los datos de GPA?')) {
            gpaRowsContainer.innerHTML = '';
            prevGpaInput.value = '';
            prevCreditsInput.value = '';
            targetGpaInput.value = '';
            localStorage.removeItem('promediopro_gpa_data');
            for (let i = 0; i < 3; i++) addGpaRow();
            calculateAll();
        }
    });

    // --- Init ---
    loadState();

    // --- Export Image Logic ---
    const imageModal = document.getElementById('image-modal');
    const previewContainer = document.getElementById('preview-image-container');
    const closeModal = document.querySelector('.close-modal');
    const modalShareBtn = document.getElementById('modal-share-btn');
    const modalDownloadBtn = document.getElementById('modal-download-btn');
    let generatedBlob = null;

    downloadImgBtn.addEventListener('click', () => {
        imageModal.style.display = 'block';
        previewContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:40px">Generando imagen...</p>';

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';

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

            ctx.beginPath();
            ctx.arc(900, 200, 400, 0, Math.PI * 2);
            ctx.fillStyle = isLightTheme ? 'rgba(14, 165, 233, 0.08)' : 'rgba(6, 182, 212, 0.05)';
            ctx.fill();

            ctx.fillStyle = isLightTheme ? '#0C4A6E' : 'white';
            ctx.font = 'bold 60px Outfit';
            ctx.fillText('PROMEDIO', 100, 120);
            ctx.fillStyle = isLightTheme ? '#0EA5E9' : '#28c6e2ff';
            ctx.fillText('PRO', 420, 120);

            ctx.textAlign = 'center';
            ctx.fillStyle = isLightTheme ? '#0369A1' : 'rgba(255,255,255,0.6)';
            ctx.font = '40px Inter';
            ctx.fillText('MI GPA ACUMULADO ES:', 540, 340);

            ctx.fillStyle = isLightTheme ? '#0EA5E9' : '#06b6d4';
            ctx.font = 'bold 240px Outfit';
            ctx.fillText(cumulativeGpaDisplay.innerText, 540, 560);

            ctx.fillStyle = isLightTheme ? '#0C4A6E' : 'white';
            ctx.font = '45px Inter';
            const scaleText = isHighSchool ? "Escala Americana (Weighted)" : "Escala Americana 4.0";
            ctx.fillText(scaleText, 540, 680);

            ctx.fillStyle = isLightTheme ? '#334155' : 'rgba(255,255,255,0.6)';
            ctx.font = '40px Inter';
            ctx.fillText(`GPA Semestral: ${semesterGpaDisplay.innerText}`, 540, 780);

            if (deansListBadge.classList.contains('visible')) {
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 45px Inter';
                ctx.fillText(`🏆 Dean's List`, 540, 860);
            }

            ctx.fillStyle = isLightTheme ? '#64748B' : 'rgba(255,255,255,0.4)';
            ctx.font = '35px Inter';
            ctx.fillText('promediopro.com/gpa', 540, 1020);

            const dataUrl = canvas.toDataURL('image/png');
            previewContainer.innerHTML = `<img src="${dataUrl}" alt="Vista previa de GPA">`;

            canvas.toBlob((blob) => {
                generatedBlob = blob;
            }, 'image/png');
        }, 50);
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
        link.download = 'mi-gpa-promediopro.png';
        link.href = img.src;
        link.click();
    };

    modalDownloadBtn.addEventListener('click', triggerDownload);

    modalShareBtn.addEventListener('click', async () => {
        if (!generatedBlob) return;
        const file = new File([generatedBlob], 'mi-gpa.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Mi GPA en PromedioPro',
                    text: '¡Mira mi GPA en PromedioPro!'
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al compartir:', err);
                    triggerDownload();
                }
            }
        } else {
            triggerDownload();
        }
    });

    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', () => {
            const gpa = cumulativeGpaDisplay.innerText;
            const text = encodeURIComponent(`¡Mi GPA es ${gpa}! Observa y Carga mi Calculo Aqui:`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
        });
    }

    // --- International Scale Converter ---
    const localScaleSelect = document.getElementById('local-scale');
    const localGradeInput = document.getElementById('local-grade');
    const gpaConvertedDisplay = document.getElementById('gpa-converted');
    const letterConvertedDisplay = document.getElementById('letter-converted');

    function convertGrade() {
        const scale = localScaleSelect.value;
        const grade = parseFloat(localGradeInput.value);

        if (isNaN(grade)) {
            gpaConvertedDisplay.innerText = '0.00';
            letterConvertedDisplay.innerText = '-';
            return;
        }

        let gpa = 0;
        let letter = 'F';

        if (scale === '20') {
            if (grade >= 18) { gpa = 4.0; letter = 'A'; }
            else if (grade >= 16) { gpa = 3.7; letter = 'A-'; }
            else if (grade >= 14) { gpa = 3.0; letter = 'B'; }
            else if (grade >= 12) { gpa = 2.0; letter = 'C'; }
            else if (grade >= 11) { gpa = 1.0; letter = 'D'; }
            else { gpa = 0.0; letter = 'F'; }
        } else if (scale === '10') {
            if (grade >= 9.5) { gpa = 4.0; letter = 'A+'; }
            else if (grade >= 9.0) { gpa = 4.0; letter = 'A'; }
            else if (grade >= 8.0) { gpa = 3.3; letter = 'B+'; }
            else if (grade >= 7.0) { gpa = 3.0; letter = 'B'; }
            else if (grade >= 6.0) { gpa = 2.0; letter = 'C'; }
            else { gpa = 0.0; letter = 'F'; }
        } else if (scale === '7') {
            if (grade >= 6.5) { gpa = 4.0; letter = 'A'; }
            else if (grade >= 6.0) { gpa = 3.7; letter = 'A-'; }
            else if (grade >= 5.0) { gpa = 3.0; letter = 'B'; }
            else if (grade >= 4.5) { gpa = 2.0; letter = 'C'; }
            else if (grade >= 4.0) { gpa = 1.0; letter = 'D'; }
            else { gpa = 0.0; letter = 'F'; }
        } else if (scale === '100') {
            if (grade >= 93) { gpa = 4.0; letter = 'A'; }
            else if (grade >= 90) { gpa = 3.7; letter = 'A-'; }
            else if (grade >= 83) { gpa = 3.0; letter = 'B'; }
            else if (grade >= 73) { gpa = 2.0; letter = 'C'; }
            else if (grade >= 60) { gpa = 1.0; letter = 'D'; }
            else { gpa = 0.0; letter = 'F'; }
        }

        gpaConvertedDisplay.innerText = gpa.toFixed(2);
        letterConvertedDisplay.innerText = letter;
    }

    if (localGradeInput) {
        localGradeInput.addEventListener('input', convertGrade);
        localScaleSelect.addEventListener('change', convertGrade);
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });

}); // end DOMContentLoaded
