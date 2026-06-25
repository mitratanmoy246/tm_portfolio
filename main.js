// Global Chart.js aesthetic defaults
Chart.defaults.color = '#9ca3af';
Chart.defaults.font.family = '"Fira Code", monospace';

// Boot scripts on window load
window.addEventListener('load', () => {
    animateSkillChips();
    fetchCodeforces();
    fetchCodeChef();
    fetchLeetCode();
    fetchGitHubRepos();
});