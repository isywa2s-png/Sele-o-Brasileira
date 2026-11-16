/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   ESTATISTICAS.JS | DESEMPENHO GERAL E RANKINGS INDIVIDUAIS
========================================================= */

(() => {
    "use strict";

    // =========================================================
    // 1. UTILITÁRIOS INTERNOS
    // =========================================================
    function escapeHTML(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getMedalBadge(index) {
        if (index === 0) return "🥇 1º";
        if (index === 1) return "🥈 2º";
        if (index === 2) return "🥉 3º";
        return `${index + 1}º`;
    }

    // =========================================================
    // 2. RENDERIZAÇÃO DOS TOTAIS DA ABA ESTATÍSTICAS
    // =========================================================
    function renderOverviewTotals(calledPlayers) {
        const gamesEl = document.getElementById("statisticsGames");
        const goalsEl = document.getElementById("statisticsGoals");
        const assistsEl = document.getElementById("statisticsAssists");

        const totalGames = calledPlayers.reduce((sum, p) => sum + Number(p.jogos || 0), 0);
        const totalGoals = calledPlayers.reduce((sum, p) => sum + Number(p.gols || 0), 0);
        const totalAssists = calledPlayers.reduce((sum, p) => sum + Number(p.assistencias || 0), 0);

        if (gamesEl) gamesEl.textContent = totalGames;
        if (goalsEl) goalsEl.textContent = totalGoals;
        if (assistsEl) assistsEl.textContent = totalAssists;
    }

    // =========================================================
    // 3. RENDERIZAÇÃO DOS RANKINGS (ARTILHEIROS, GARÇONS E JOGOS)
    // =========================================================
    function renderRankingList(containerId, players, field, suffix) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const ranked = [...players]
            .filter((p) => Number(p[field] || 0) > 0)
            .sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))
            .slice(0, 5);

        if (ranked.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum dado disponível.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ranked
            .map((player, index) => {
                const isTopOne = index === 0;
                const posStyle = isTopOne
                    ? "background: rgba(242, 202, 66, 0.22); color: var(--yellow); min-width: 34px;"
                    : "min-width: 34px;";

                return `
                    <div class="ranking-item animate-fade">
                        <span class="ranking-position" style="${posStyle}">
                            ${getMedalBadge(index)}
                        </span>
                        <span class="ranking-player">
                            ${escapeHTML(player.nome)}
                            <small style="display:block;font-size:8px;color:var(--text-muted);font-weight:600;">
                                ${escapeHTML(player.posicao)}
                            </small>
                        </span>
                        <span class="ranking-value">
                            ${Number(player[field] || 0)} ${suffix}
                        </span>
                    </div>
                `;
            })
            .join("");
    }

    // =========================================================
    // 4. ATUALIZAÇÃO COMPLETA DO MÓDULO
    // =========================================================
    function renderStatistics() {
        const state = window.AppState || { players: [] };
        const players = Array.isArray(state.players) ? state.players : [];
        const calledPlayers = players.filter((p) => Boolean(p.convocado));

        renderOverviewTotals(calledPlayers);
        renderRankingList("topScorers", calledPlayers, "gols", "G");
        renderRankingList("topAssists", calledPlayers, "assistencias", "A");
        renderRankingList("topGames", calledPlayers, "jogos", "J");
    }

    // =========================================================
    // 5. EXPORTAÇÃO E INICIALIZAÇÃO
    // =========================================================
    window.EstatisticasModule = {
        render: renderStatistics
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderStatistics();
    });
})();