function setText(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (!el) return;
    if (value === undefined || value === null || value === '') {
        el.textContent = fallback;
        return;
    }
    el.textContent = value;
}

function setupReveal() {
    const elements = document.querySelectorAll('.reveal');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px' });

    elements.forEach(el => observer.observe(el));
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}
