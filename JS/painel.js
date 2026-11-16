/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   PAINEL.JS | DASHBOARD E VISÃO GERAL EM TEMPO REAL
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

    function animateCounter(element, targetValue) {
        if (!element) return;

        const target = Number(targetValue) || 0;
        const current = Number(element.dataset.currentValue ?? element.textContent) || 0;

        element.dataset.currentValue = target;

        if (current === target) {
            element.textContent = target;
            return;
        }

        const duration = 350;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(current + (target - current) * eased);

            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(step);
    }

    // =========================================================
    // 2. RENDERIZAÇÃO DOS INDICADORES PRINCIPAIS
    // =========================================================
    function renderIndicators(players, calledPlayers, trophies) {
        const totalPlayersEl = document.getElementById("totalPlayers");
        const totalCalledEl = document.getElementById("totalCalled");

        const dashboardPlayersEl = document.getElementById("dashboardPlayers");
        const dashboardCalledEl = document.getElementById("dashboardCalled");
        const dashboardGamesEl = document.getElementById("dashboardGames");
        const dashboardTrophiesEl = document.getElementById("dashboardTrophies");

        const totalGames = calledPlayers.reduce(
            (sum, player) => sum + Number(player.jogos || 0),
            0
        );

        const totalTitles = trophies.reduce(
            (sum, trophy) => sum + Number(trophy.quantidade || 1),
            0
        );

        if (totalPlayersEl) totalPlayersEl.textContent = players.length;
        if (totalCalledEl) totalCalledEl.textContent = calledPlayers.length;

        animateCounter(dashboardPlayersEl, players.length);
        animateCounter(dashboardCalledEl, calledPlayers.length);
        animateCounter(dashboardGamesEl, totalGames);
        animateCounter(dashboardTrophiesEl, totalTitles);
    }

    // =========================================================
    // 3. LISTA DE ÚLTIMOS CONVOCADOS NO PAINEL
    // =========================================================
    function renderDashboardCalledList(calledPlayers) {
        const container = document.getElementById("dashboardCalledList");
        if (!container) return;

        if (!calledPlayers || calledPlayers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-shirt"></i>
                    <h4>Nenhum convocado ainda</h4>
                    <p>Os jogadores convocados aparecerão aqui em tempo real.</p>
                </div>
            `;
            return;
        }

        // Mostra os 5 convocados mais recentes (ou ordenados por participação)
        const recentCalled = [...calledPlayers].reverse().slice(0, 5);

        container.innerHTML = recentCalled
            .map((player) => {
                const avatarText = player.numero
                    ? `#${escapeHTML(player.numero)}`
                    : escapeHTML(player.nome.charAt(0).toUpperCase());

                return `
                    <div class="dashboard-player-item animate-fade">
                        <div class="player-avatar">${avatarText}</div>

                        <div class="dashboard-player-info">
                            <strong>${escapeHTML(player.nome)}</strong>
                            <span>
                                ${escapeHTML(player.posicao)} • 
                                ${Number(player.jogos || 0)}J | 
                                ${Number(player.gols || 0)}G | 
                                ${Number(player.assistencias || 0)}A
                            </span>
                        </div>

                        <span class="called-status">
                            <i class="fa-solid fa-check"></i>
                            CONVOCADO
                        </span>
                    </div>
                `;
            })
            .join("");
    }

    // =========================================================
    // 4. RESUMO DA SALA DE TROFÉUS NO PAINEL
    // =========================================================
    function renderDashboardTrophyList(trophies) {
        const container = document.getElementById("dashboardTrophyList");
        if (!container) return;

        if (!trophies || trophies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-trophy"></i>
                    <h4>Galeria vazia</h4>
                    <p>As conquistas da Seleção aparecerão aqui.</p>
                </div>
            `;
            return;
        }

        const featuredTrophies = trophies.slice(0, 4);

        container.innerHTML = featuredTrophies
            .map((trophy) => {
                const qty = Number(trophy.quantidade || 1);
                const seasons = escapeHTML(trophy.temporadas || "Histórico");
                const iconHTML = trophy.imagem
                    ? `<img src="${escapeHTML(trophy.imagem)}" alt="${escapeHTML(trophy.nome)}" style="width:24px;height:24px;object-fit:contain;">`
                    : `<i class="fa-solid fa-trophy"></i>`;

                return `
                    <div class="dashboard-player-item animate-fade">
                        <div class="player-avatar yellow">
                            ${iconHTML}
                        </div>

                        <div class="dashboard-player-info">
                            <strong>${escapeHTML(trophy.nome)}</strong>
                            <span>${seasons}</span>
                        </div>

                        <span class="trophy-quantity">${qty}x</span>
                    </div>
                `;
            })
            .join("");
    }

    // =========================================================
    // 5. FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO DO PAINEL
    // =========================================================
    function updatePainel() {
        const state = window.AppState || { players: [], trophies: [] };
        const players = Array.isArray(state.players) ? state.players : [];
        const trophies = Array.isArray(state.trophies) ? state.trophies : [];
        const calledPlayers = players.filter((p) => Boolean(p.convocado));

        renderIndicators(players, calledPlayers, trophies);
        renderDashboardCalledList(calledPlayers);
        renderDashboardTrophyList(trophies);
    }

    // =========================================================
    // 6. EXPORTAÇÃO E INICIALIZAÇÃO
    // =========================================================
    window.PainelModule = {
        render: updatePainel
    };

    document.addEventListener("DOMContentLoaded", () => {
        updatePainel();
    });
})();