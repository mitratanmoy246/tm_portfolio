// --- Shared helpers ---
function animateCounter(el, to, duration = 1000) {
    const from = 0;
    const diff = (to || 0) - from;
    const start = performance.now();

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const v = Math.round(from + diff * easeOutCubic(t));
        el.textContent = (v ?? 0).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function renderStars(container, count) {
    const safe = Number(count);
    const n = Number.isFinite(safe) && safe > 0 ? safe : 0;
    let html = '';
    for (let i = 0; i < n; i++) html += '<i class="fa-solid fa-star"></i>';
    container.innerHTML = html;
}

// --- Skills chip entrance animation ---
function animateSkillChips() {
    const chips = document.querySelectorAll('.skill-chip');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chips.forEach((chip, i) => {
        if (reduced) {
            chip.classList.add('in');
        } else {
            setTimeout(() => chip.classList.add('in'), 120 + i * 70);
        }
    });
}