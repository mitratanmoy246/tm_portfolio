document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    setupHeader();
    setupAnchors();

    fetchCodeforces();
    fetchCodeChef();
    fetchTerminalData();
});

function setupHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    let previous = window.scrollY;

    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        
        if (current > 70) header.classList.add('scrolled');
        else header.classList.remove('scrolled');

        if (current > previous && current > 180) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        previous = current;
    }, { passive: true });
}

function setupAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            const id = link.getAttribute('href');
            if (!id || id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
