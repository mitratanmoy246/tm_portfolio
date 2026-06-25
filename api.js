// --- Codeforces Fetch & Chart Render ---
async function fetchCodeforces() {
    const handle = 'mitratanmoy246';
    const loader = document.getElementById('cf-loader');
    const content = document.getElementById('cf-content');

    try {
        // Fetch Profile, Status, and Graph history concurrently
        const [infoRes, statusRes, graphRes] = await Promise.all([
            fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
            fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=50000`),
            fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)
        ]);

        const infoJson = await infoRes.json();
        const statusJson = await statusRes.json();
        const graphData = await graphRes.json();

        if (infoJson.status !== 'OK' || !infoJson.result || !infoJson.result[0]) throw new Error('CF user.info failed');
        if (statusJson.status !== 'OK') throw new Error('CF user.status failed');

        const info = infoJson.result[0];
        const solvedSet = new Set();
        
        (statusJson.result || [])
            .filter(sub => sub.verdict === 'OK' && sub.problem && sub.problem.contestId != null && sub.problem.index != null)
            .forEach(sub => solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`));

        const current = info.rating ?? 'N/A';
        const maxRating = info.maxRating ?? 'N/A';
        const rank = info.rank ?? info.maxRank ?? 'Unrated';
        const solved = solvedSet.size;

        // Color-hint for handle by rating & rank
        const cfHandle = document.getElementById('cf-handle');
        if (cfHandle) {
            const rNum = Number(current);
            const rankNum = Number(info.rank);
            let color = 'border-gray-800 text-gray-300';
            if (Number.isFinite(rNum) && rNum >= 2200) color = 'border-cobaltLight text-cobaltLight';
            else if (Number.isFinite(rNum) && rNum >= 1800) color = 'border-cobalt text-white';
            else if (Number.isFinite(rankNum) && rankNum <= 1000) color = 'border-yellow-400 text-yellow-200';
            cfHandle.className = `ml-2 px-4 py-2 bg-gray-900/60 border rounded-xl font-mono text-sm font-bold ${color}`;
        }

        document.getElementById('cf-rating').textContent = current;
        document.getElementById('cf-max-rating').textContent = maxRating;
        document.getElementById('cf-rank').textContent = String(rank);
        document.getElementById('cf-solved').textContent = solved.toLocaleString();

        // Achievements cards update
        const achMax = Number(maxRating);
        document.getElementById('ach-cf-max-rank').textContent = String(rank);
        document.getElementById('ach-cf-max-rating').textContent = '0';
        animateCounter(document.getElementById('ach-cf-max-rating'), Number.isFinite(achMax) ? achMax : 0, 900);
        animateCounter(document.getElementById('ach-total-solved'), solved, 900);

        loader.classList.add('hidden');
        content.classList.remove('hidden');

        // Render Graph if successful
        if (graphData.status === 'OK' && graphData.result.length > 0) {
            const labels = graphData.result.map(c => {
                const date = new Date(c.ratingUpdateTimeSeconds * 1000);
                return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            });
            const ratings = graphData.result.map(c => c.newRating);
            
            const ctx = document.getElementById('cfChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Rating',
                        data: ratings,
                        borderColor: '#3a66d4',
                        backgroundColor: 'rgba(58, 102, 212, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
                    }
                }
            });
        }
    } catch (e) {
        loader.textContent = 'Failed to sync Codeforces.';
    }
}

// --- CodeChef Fetch & Chart Render ---
async function fetchCodeChef() {
    const user = 'band_deed_94';
    const loader = document.getElementById('cc-loader');
    const content = document.getElementById('cc-content');
    const fallback = document.getElementById('cc-fallback');

    // Helper to safely hit fallbacks for profile
    const fetchProfileData = async () => {
        let data = null;
        const urls = [
            `https://codechef-stats-api-two.vercel.app/profile/${encodeURIComponent(user)}`,
            `https://codechef-api.vercel.app/api/codechef/${encodeURIComponent(user)}`,
            `https://competitive-coding.azurewebsites.net/api/codechef?username=${encodeURIComponent(user)}`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    data = await res.json();
                    break;
                }
            } catch (e) {}
        }
        return data;
    };

    try {
        // Fetch Profile and Graph history concurrently
        const [data, graphRes] = await Promise.all([
            fetchProfileData(),
            fetch(`https://codechef-stats-api-two.vercel.app/rating/${encodeURIComponent(user)}`).catch(() => null)
        ]);

        const profile = data?.profile || data;
        const currentRating = profile?.currentRating ?? profile?.rating ?? profile?.current;
        const highestRating = profile?.highestRating ?? profile?.maxRating ?? profile?.highest;

        const starsRaw = profile?.stars ?? profile?.starCount ?? profile?.star_count ?? 0;
        const starsStr = String(starsRaw);
        const stars = parseInt(starsStr.replace(/[^0-9]/g, ''), 10) || 0;

        if (currentRating == null || highestRating == null) throw new Error('Unable to parse CodeChef stats');

        document.getElementById('cc-current').textContent = Number(currentRating).toLocaleString();
        document.getElementById('cc-highest').textContent = Number(highestRating).toLocaleString();
        renderStars(document.getElementById('cc-stars'), Number(stars) || 0);

        // Achievements cards update
        animateCounter(document.getElementById('ach-cc-current'), Number(currentRating) || 0, 900);
        renderStars(document.getElementById('ach-cc-stars'), Number(stars) || 0);

        loader.classList.add('hidden');
        content.classList.remove('hidden');

        // Render Graph if successful
        if (graphRes && graphRes.ok) {
            const graphData = await graphRes.json();
            if (graphData.success && graphData.ratingData && graphData.ratingData.length > 0) {
                const labels = graphData.ratingData.map(c => {
                    const dateParts = c.end_date.split(' ')[0].split('-');
                    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                });
                const ratings = graphData.ratingData.map(c => Number(c.rating));
                
                const ctx = document.getElementById('ccChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Rating',
                            data: ratings,
                            borderColor: '#f59e0b', 
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHitRadius: 10,
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        animation: false,
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
                        }
                    }
                });
            }
        }
    } catch (e) {
        loader.classList.add('hidden');
        fallback.classList.remove('hidden');
    }
}

// --- LeetCode Fetch ---
async function fetchLeetCode() {
    const loader = document.getElementById('lc-loader');
    const content = document.getElementById('lc-content');
    const fallback = document.getElementById('lc-fallback');

    try {
        const res = await fetch('https://alfa-leetcode-api.onrender.com/mitratanmoy246');
        if (!res.ok) throw new Error('LC API failed');
        const data = await res.json();

        const ranking = data.ranking ?? data.globalRanking ?? data.rank ?? 'N/A';
        const totalSolved = data.totalSolved ?? data.solved ?? 0;
        const easy = data.easySolved ?? data.easy ?? 0;
        const medium = data.mediumSolved ?? data.medium ?? 0;
        const hard = data.hardSolved ?? data.hard ?? 0;

        document.getElementById('lc-ranking').textContent = ranking;
        document.getElementById('lc-solved').textContent = Number(totalSolved).toLocaleString();
        document.getElementById('lc-easy').textContent = Number(easy).toLocaleString();
        document.getElementById('lc-medium').textContent = Number(medium).toLocaleString();
        document.getElementById('lc-hard').textContent = Number(hard).toLocaleString();

        loader.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (e) {
        loader.classList.add('hidden');
        fallback.classList.remove('hidden');
        document.getElementById('lc-ranking').textContent = 'N/A';
        document.getElementById('lc-solved').textContent = '0';
        document.getElementById('lc-easy').textContent = '0';
        document.getElementById('lc-medium').textContent = '0';
        document.getElementById('lc-hard').textContent = '0';
    }
}

// --- GitHub Fetch ---
async function fetchGitHubRepos() {
    const container = document.getElementById('github-repos');
    const loader = document.getElementById('github-loader');
    try {
        const res = await fetch('https://api.github.com/users/mitratanmoy246/repos?sort=updated&per_page=9');
        if (!res.ok) throw new Error('GitHub API Error');
        const repos = await res.json();

        if (repos.length > 0) {
            let html = '';
            repos.forEach(repo => {
                let langColor = 'bg-gray-500';
                if (repo.language === 'C++') langColor = 'bg-pink-500';
                else if (repo.language === 'C') langColor = 'bg-gray-400';
                else if (repo.language === 'JavaScript') langColor = 'bg-yellow-400';
                else if (repo.language === 'HTML') langColor = 'bg-orange-500';

                html += `
                    <a href="${repo.html_url}" target="_blank" aria-label="Repository ${repo.name}" class="glass-panel p-8 rounded-3xl flex flex-col h-full group hover:border-cobaltLight">
                        <div class="flex items-start justify-between mb-5">
                            <h4 class="text-xl font-bold text-white group-hover:text-cobaltLight transition-colors line-clamp-1 flex items-center gap-3">
                                <i class="fa-regular fa-folder text-cobalt" aria-hidden="true"></i> ${repo.name}
                            </h4>
                            <i class="fa-solid fa-arrow-up-right-from-square text-gray-600 text-base group-hover:text-cobaltLight transition-colors" aria-hidden="true"></i>
                        </div>
                        <p class="text-gray-400 text-base mb-6 line-clamp-2">${repo.description ? repo.description : 'No description provided.'}</p>

                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            ${repo.language ? `<span class="flex items-center gap-2 text-sm text-gray-300 font-bold"><span class="w-3 h-3 rounded-full ${langColor}"></span> ${repo.language}</span>` : ''}
                        </div>

                        <div class="flex items-center gap-5 mt-auto pt-4 border-t border-gray-800">
                            <span class="flex items-center gap-1.5 text-sm font-bold text-gray-500"><i class="fa-regular fa-star text-gray-400" aria-hidden="true"></i> ${repo.stargazers_count}</span>
                            <span class="flex items-center gap-1.5 text-sm font-bold text-gray-500"><i class="fa-solid fa-code-fork text-gray-400" aria-hidden="true"></i> ${repo.forks_count}</span>
                        </div>

                        <div class="text-xs text-gray-500 font-mono mt-3">
                            Last updated: ${repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'N/A'}
                        </div>
                    </a>
                `;
            });

            container.innerHTML = html;
            loader.classList.add('hidden');
            container.classList.remove('hidden');
        } else {
            loader.textContent = 'No public repositories found.';
        }
    } catch (error) {
        loader.textContent = 'Failed to load GitHub repositories.';
    }
}