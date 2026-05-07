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
        if (menuToggle) menuToggle.classList.remove('active');
        if (navLinks) navLinks.classList.remove('active');
    });
});

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

function toggleSFaq(item) {
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.g-faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// Reading Progress Bar
window.onscroll = function() {
  updateProgress();
};

function updateProgress() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
  const progressBar = document.getElementById("g-progress-fill");
  if (progressBar) {
      progressBar.style.width = scrolled + "%";
  }
}
