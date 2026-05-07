document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos
    const feedbackForm = document.getElementById('native-feedback-form');
    const formContainer = document.getElementById('feedback-form-container');
    const successMsg = document.getElementById('feedback-success');
    const ratingGroup = document.getElementById('rating-group');
    const formTitle = document.querySelector('#feedback-form-container .section-title');
    const formSubtitle = document.querySelector('#feedback-form-container .section-subtitle');
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    const bugsTextarea = document.getElementById('bugs');
    const improvementsTextarea = document.getElementById('improvements');
    const submitBtn = document.querySelector('.btn-submit-feedback');

    // Estado: ¿Ya envió el feedback inicial?
    const hasSubmitted = localStorage.getItem('feedbackSubmitted') === 'true';

    // 1. Lógica del botón flotante
    if (!sessionStorage.getItem('feedbackClicked') && !hasSubmitted) {
        setTimeout(() => {
            const feedbackBtnHTML = `
            <button id="feedback-scroll-btn" class="feedback-scroll-btn" aria-label="Ir al formulario de feedback">
                <span>Danos tu opinión</span>
                <span class="btn-arrow">↓</span>
            </button>`;
            document.body.insertAdjacentHTML('beforeend', feedbackBtnHTML);

            const scrollBtn = document.getElementById('feedback-scroll-btn');
            if (scrollBtn) {
                scrollBtn.addEventListener('click', () => {
                    const feedbackSection = document.getElementById('feedback-section');
                    if (feedbackSection) {
                        feedbackSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    scrollBtn.style.opacity = '0';
                    scrollBtn.style.transform = 'scale(0) translateY(20px)';
                    setTimeout(() => {
                        scrollBtn.remove();
                        sessionStorage.setItem('feedbackClicked', 'true');
                    }, 600);
                });
            }
        }, 25000); // 25 segundos
    }

    // 2. Configuración inicial del formulario según estado
    function setupFormMode() {
        const isReturning = localStorage.getItem('feedbackSubmitted') === 'true';
        
        if (isReturning) {
            // Modo Reporte / Sugerencia Adicional
            if (ratingGroup) ratingGroup.style.display = 'none';
            if (formTitle) formTitle.textContent = 'Reportar un Bug o Sugerencia';
            if (formSubtitle) formSubtitle.textContent = '¿Encontraste algo mal o tienes otra idea? Cuéntanos.';
            
            // Quitar el required de los radios para que deje enviar sin calificar
            ratingInputs.forEach(input => input.removeAttribute('required'));
        }
    }

    setupFormMode();

    // 3. Validación y Envío
    if (feedbackForm) {
        // Inicialmente deshabilitar el botón
        submitBtn.classList.add('disabled');

        function checkValidation() {
            const isReturning = localStorage.getItem('feedbackSubmitted') === 'true';
            
            let isValid = false;
            if (!isReturning) {
                // Primera vez: Requiere calificación Y al menos un comentario
                const isRatingSelected = Array.from(ratingInputs).some(input => input.checked);
                const hasText = bugsTextarea.value.trim().length > 0 || improvementsTextarea.value.trim().length > 0;
                isValid = isRatingSelected && hasText;
            } else {
                // Siguientes veces: Solo requiere texto
                isValid = bugsTextarea.value.trim().length > 0 || improvementsTextarea.value.trim().length > 0;
            }

            if (isValid) {
                if (submitBtn.classList.contains('disabled')) {
                    submitBtn.classList.remove('disabled');
                    submitBtn.classList.add('activated');
                    setTimeout(() => submitBtn.classList.remove('activated'), 500);
                }
            } else {
                submitBtn.classList.add('disabled');
            }
        }

        // Listeners para validación en tiempo real
        ratingInputs.forEach(input => input.addEventListener('change', checkValidation));
        bugsTextarea.addEventListener('input', checkValidation);
        improvementsTextarea.addEventListener('input', checkValidation);

        // Llamar inicialmente
        checkValidation();

        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(feedbackForm);
            const isFirstTime = localStorage.getItem('feedbackSubmitted') !== 'true';
            
            fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            })
            .then(() => {
                // Marcar como enviado si es la primera vez
                if (isFirstTime) {
                    localStorage.setItem('feedbackSubmitted', 'true');
                }

                // Mostrar éxito
                if (formContainer) formContainer.style.display = 'none';
                if (successMsg) successMsg.style.display = 'block';
                
                // Limpiar botón flotante si existe
                const scrollBtn = document.getElementById('feedback-scroll-btn');
                if (scrollBtn) scrollBtn.remove();

                // Ocultar toda la sección de feedback después de unos segundos
                // para que el usuario pueda seguir navegando sin el bloque de éxito
                setTimeout(() => {
                    const feedbackSection = document.getElementById('feedback-section');
                    if (feedbackSection) {
                        feedbackSection.style.transition = 'all 0.8s ease';
                        feedbackSection.style.opacity = '0';
                        feedbackSection.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            feedbackSection.style.display = 'none';
                        }, 800);
                    }
                }, 1500);
            })
            .catch((error) => {
                console.error('Error al enviar el formulario:', error);
                alert('Hubo un error al enviar tu feedback. Por favor, inténtalo de nuevo.');
            });
        });
    }
});