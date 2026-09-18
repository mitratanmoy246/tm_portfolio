const PROFILE = {
    cf: 'mitratanmoy246',
    cc: 'kryven',
    lc: 'mitratanmoy246',
    github: 'mitratanmoy246'
};

let cfChart = null;
let ccChart = null;

/* ================================
   COLOR HELPERS
================================ */
function getCFRankColor(rank) {
    if (!rank) return 'inherit';
    const r = rank.toLowerCase();
    if (r.includes('newbie')) return '#808080';
    if (r.includes('pupil')) return '#00ff66'; // Neon Green
    if (r.includes('specialist')) return '#00e5ff'; // Cyan
    if (r.includes('expert')) return '#4080ff'; // Blue
    if (r.includes('candidate master')) return '#a000a0'; // Purple
    if (r.includes('grandmaster')) return '#ff0000'; // Red
    if (r.includes('master')) return '#ff8c00'; // Orange
    return 'inherit';
}

function getCCRankColor(stars) {
    if (!stars) return 'inherit';
    const s = stars.toString();
    if (s.includes('1') || s.includes('2')) return '#00ff66'; // Green
    if (s.includes('3')) return '#4080ff'; // Blue
    if (s.includes('4')) return '#a000a0'; // Purple
    if (s.includes('5')) return '#ffbf00'; // Yellow
    if (s.includes('6')) return '#ff8c00'; // Orange
    if (s.includes('7')) return '#ff0000'; // Red
    return 'inherit';
}

/* ================================
   GENERIC FETCH
================================ */
async function getJSON(url) {
    const response = await fetch(url, { headers:{ Accept:'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/* ================================
   BACKGROUND PLUGINS
================================ */
const cfBackgroundPlugin = {
    id: 'cfBackground',
    beforeDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, left, right, width }, scales: { y } } = chart;
        ctx.save();
        
        const bands = [
            { min: 0, max: 1199, name: 'NEWBIE', color: 'rgba(128, 128, 128, 0.05)' },
            { min: 1200, max: 1399, name: 'PUPIL', color: 'rgba(0, 255, 102, 0.05)' },
            { min: 1400, max: 1599, name: 'SPECIALIST', color: 'rgba(0, 229, 255, 0.05)' },
            { min: 1600, max: 1899, name: 'EXPERT', color: 'rgba(64, 128, 255, 0.05)' },
            { min: 1900, max: 2099, name: 'CANDIDATE MASTER', color: 'rgba(160, 0, 160, 0.05)' },
            { min: 2100, max: 2399, name: 'MASTER', color: 'rgba(255, 140, 0, 0.05)' },
            { min: 2400, max: 4000, name: 'GRANDMASTER', color: 'rgba(255, 0, 0, 0.05)' }
        ];

        bands.forEach(band => {
            const yStart = Math.max(top, y.getPixelForValue(band.max));
            const yEnd = Math.min(bottom, y.getPixelForValue(band.min));
            
            if (yEnd > top && yStart < bottom) {
                ctx.fillStyle = band.color;
                ctx.fillRect(left, yStart, width, yEnd - yStart);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '9px "IBM Plex Mono"';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(band.name, right - 5, yStart + 5);
            }
        });
        ctx.restore();
    }
};

const ccBackgroundPlugin = {
    id: 'ccBackground',
    beforeDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, left, right, width }, scales: { y } } = chart;
        ctx.save();
        
        const bands = [
            { min: 0, max: 1399, name: '1★', color: 'rgba(128, 128, 128, 0.05)' },
            { min: 1400, max: 1599, name: '2★', color: 'rgba(0, 255, 102, 0.05)' },
            { min: 1600, max: 1799, name: '3★', color: 'rgba(64, 128, 255, 0.05)' },
            { min: 1800, max: 1999, name: '4★', color: 'rgba(160, 0, 160, 0.05)' },
            { min: 2000, max: 2199, name: '5★', color: 'rgba(255, 191, 0, 0.05)' },
            { min: 2200, max: 2499, name: '6★', color: 'rgba(255, 140, 0, 0.05)' },
            { min: 2500, max: 4000, name: '7★', color: 'rgba(255, 0, 0, 0.05)' }
        ];

        bands.forEach(band => {
            const yStart = Math.max(top, y.getPixelForValue(band.max));
            const yEnd = Math.min(bottom, y.getPixelForValue(band.min));
            
            if (yEnd > top && yStart < bottom) {
                ctx.fillStyle = band.color;
                ctx.fillRect(left, yStart, width, yEnd - yStart);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '9px "IBM Plex Mono"';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(band.name, right - 5, yStart + 5);
            }
        });
        ctx.restore();
    }
};

/* ================================
   CODEFORCES
================================ */
async function fetchCodeforces() {
    try {
        const [profileResponse, submissionsResponse, ratingResponse] = await Promise.all([
            getJSON(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(PROFILE.cf)}`),
            getJSON(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(PROFILE.cf)}&from=1&count=10000`),
            getJSON(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(PROFILE.cf)}`)
        ]);

        if (profileResponse.status !== 'OK' || !profileResponse.result?.[0]) {
            throw new Error('Codeforces profile unavailable');
        }

        const user = profileResponse.result[0];
        const submissions = submissionsResponse.status === 'OK' ? submissionsResponse.result : [];
        const contests = ratingResponse.status === 'OK' ? ratingResponse.result : [];

        const solved = new Set();
        submissions.forEach(sub => {
            if (sub.verdict !== 'OK' || !sub.problem) return;
            solved.add(`${sub.problem.contestId || 'x'}-${sub.problem.index || sub.problem.name}`);
        });

        setText('cfRating', Number(user.rating || 0).toLocaleString());
        setText('cfMaxRating', Number(user.maxRating || 0).toLocaleString());
        setText('cfSolved', solved.size.toLocaleString());

        const rankEl = document.getElementById('cfRank');
        if (rankEl) {
            rankEl.textContent = (user.rank || 'UNRATED').toUpperCase();
            rankEl.style.color = getCFRankColor(user.rank);
        }

        renderCodeforcesChart(contests);
        setText('cfChartStatus', 'LIVE');
        document.getElementById('cfChartStatus').style.color = 'var(--accent-cyan)';
    } catch (error) {
        console.warn('CF Error:', error);
        setText('cfRating', '—');
        setText('cfMaxRating', '—');
        setText('cfSolved', '—');
        const rankEl = document.getElementById('cfRank');
        if (rankEl) { rankEl.textContent = 'UNAVAILABLE'; rankEl.style.color = 'inherit'; }
        setText('cfChartStatus', 'ERR');
        document.getElementById('cfChartStatus').style.color = 'red';
    }
}

function renderCodeforcesChart(contests) {
    const canvas = document.getElementById('cfChart');
    if (!canvas || !window.Chart) return;

    const labels = contests.map(c => formatDate(c.ratingUpdateTimeSeconds));
    const values = contests.map(c => c.newRating);

    if (cfChart) cfChart.destroy();
    const ctx = canvas.getContext('2d');

    cfChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor: '#00e5ff',
                backgroundColor: '#00e5ff',
                borderWidth: 1.5,
                pointRadius: 2,
                pointHoverRadius: 4,
                fill: false, // Turned off fill so background bands are clear
                tension: 0.1
            }]
        },
        plugins: [cfBackgroundPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { 
                legend: { display: false }, 
                tooltip: { backgroundColor: '#000', borderColor: '#333', borderWidth: 1, titleFont: { family: 'IBM Plex Mono', size: 9 }, bodyFont: { family: 'IBM Plex Mono', size: 10 } } 
            },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#666', font: { family: 'IBM Plex Mono', size: 8 } } 
                }
            }
        }
    });
}

/* ================================
   CODECHEF (With Aggressive Fallbacks)
================================ */
async function fetchCodeChef() {
    try {
        const base = `https://codechef-stats-api-two.vercel.app/${encodeURIComponent(PROFILE.cc)}`;
        
        const promises = [
            getJSON(base).catch(() => ({})),
            getJSON(`${base}/contests`).catch(() => ({})),
            getJSON(`${base}/rating`).catch(() => ({}))
        ];
        
        const [summaryRes, contestsRes, ratingRes] = await Promise.all(promises);

        const sData = summaryRes?.data || summaryRes || {};
        const cData = contestsRes?.data || contestsRes || {};
        const rData = ratingRes?.data || ratingRes || {};

        const current = rData.current ?? sData.currentRating ?? cData.rating ?? 0;
        const max = rData.max ?? sData.maxRating ?? cData.maxRating ?? 0;
        const solved = sData.totalSolved ?? 0;
        let stars = sData.stars ?? sData.ratingStars ?? sData.rank ?? '—';

        if (current) setText('ccRating', Number(current).toLocaleString());
        if (max) setText('ccMaxRating', Number(max).toLocaleString());
        if (solved) setText('ccSolved', Number(solved).toLocaleString());

        const ccStarsEl = document.getElementById('ccStars');
        if (ccStarsEl) {
            ccStarsEl.textContent = String(stars).toUpperCase();
            ccStarsEl.style.color = getCCRankColor(stars);
        }

        renderCodeChefChart(rData.history || cData.history || []);
        
        if (!current && !max && !solved && stars === '—') throw new Error("No data returned");
        
        setText('ccChartStatus', 'LIVE');
        document.getElementById('ccChartStatus').style.color = 'var(--accent-cyan)';
    } catch (error) {
        console.warn('CC Error:', error);
        setText('ccRating', '—');
        setText('ccMaxRating', '—');
        setText('ccSolved', '—');
        const ccStarsEl = document.getElementById('ccStars');
        if (ccStarsEl) { ccStarsEl.textContent = 'UNAVAILABLE'; ccStarsEl.style.color = 'inherit'; }
        setText('ccChartStatus', 'ERR');
        document.getElementById('ccChartStatus').style.color = 'red';
    }
}

function renderCodeChefChart(history) {
    const canvas = document.getElementById('ccChart');
    if (!canvas || !window.Chart) return;
    if (!history || history.length === 0) return;

    const labels = history.map(h => h.timestamp ? formatDate(h.timestamp) : '');
    const values = history.map(h => Number(h.rating || h.currentRating || 0));

    if (ccChart) ccChart.destroy();
    const ctx = canvas.getContext('2d');

    ccChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor: '#00e5ff',
                backgroundColor: '#00e5ff',
                borderWidth: 1.5,
                pointRadius: 2,
                pointHoverRadius: 4,
                fill: false, // Turned off fill so background bands are clear
                tension: 0.1
            }]
        },
        plugins: [ccBackgroundPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { 
                legend: { display: false }, 
                tooltip: { backgroundColor: '#000', borderColor: '#333', borderWidth: 1, titleFont: { family: 'IBM Plex Mono', size: 9 }, bodyFont: { family: 'IBM Plex Mono', size: 10 } } 
            },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#666', font: { family: 'IBM Plex Mono', size: 8 } } 
                }
            }
        }
    });
}

/* ================================
   TERMINAL DATA (With API Fallbacks)
================================ */
function fetchTerminalData() {
    setText('termGhUsername', PROFILE.github);
    setText('termLcUsername', PROFILE.lc);

    // GITHUB
    getJSON(`https://github-stats.tashif.codes/${encodeURIComponent(PROFILE.github)}`)
        .then(res => {
            const data = res?.data || res || {};
            if(!data.commits && !data.totalCommits) throw new Error('Primary GH endpoint missing data');
            
            setText('termGhCommits', data.totalCommits ?? data.commits ?? 74);
            setText('termGhStars', data.totalStars ?? data.stars ?? 2);
            setText('termGhCStreak', data.currentStreak ?? 0);
            setText('termGhLStreak', data.longestStreak ?? 4);

            const langs = data.languages || data.topLanguages;
            if (Array.isArray(langs) && langs.length > 0) {
                const container = document.getElementById('termGhLangs');
                if (container) {
                    container.innerHTML = '';
                    langs.slice(0, 5).forEach(l => {
                        container.innerHTML += `<span>[${l.name || l.language} ${Math.round(l.percent ?? l.percentage ?? 0)}%]</span> `;
                    });
                }
            } else {
                setText('termGhLangs', '[NO LANGUAGE DATA RETURNED]');
            }
        })
        .catch(err => {
            console.warn('GH Primary Failed, trying standard API:', err);
            getJSON(`https://api.github.com/users/${encodeURIComponent(PROFILE.github)}`)
                .then(user => {
                    setText('termGhCommits', `[REPOS: ${user.public_repos || '—'}]`);
                    setText('termGhStars', '—');
                    setText('termGhCStreak', '—');
                    setText('termGhLStreak', '—');
                    setText('termGhLangs', '[API UNAVAILABLE]');
                }).catch(() => {
                    setText('termGhLangs', '[CONNECTION REFUSED]');
                });
        });

    // LEETCODE
    getJSON(`https://leetcode-stats.tashif.codes/${encodeURIComponent(PROFILE.lc)}`)
        .then(res => {
            const data = res?.data || res || {};
            setText('termLcSolved', data.totalSolved ?? data.total_solved ?? 6);
            
            const acc = data.acceptanceRate ?? data.acceptance_rate ?? data.acceptance ?? 54.5;
            setText('termLcAcceptance', !isNaN(Number(acc)) ? `${Number(acc).toFixed(1)}%` : acc);
            
            setText('termLcRank', data.ranking ?? data.rank ?? 5000001);
            setText('termLcEasy', data.easySolved ?? data.easy_solved ?? 6);
            setText('termLcMedium', data.mediumSolved ?? data.medium_solved ?? 0);
            setText('termLcHard', data.hardSolved ?? data.hard_solved ?? 0);
        }).catch(err => {
            console.warn('LC Error:', err);
        });
}
