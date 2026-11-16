/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   ADMIN.JS | CONTROLE DE ACESSO (LEMOS) E GERENCIAMENTO
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

    // =========================================================
    // 2. RENDERIZAÇÃO DAS LISTAS DE GERENCIAMENTO DO ADMIN
    // =========================================================
    function renderAdminPlayers() {
        const container = document.getElementById("adminPlayersList");
        if (!container) return;

        const state = window.AppState || { players: [] };
        const players = Array.isArray(state.players) ? state.players : [];

        if (players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users"></i>
                    <h4>Nenhum jogador cadastrado</h4>
                    <p>Use o botão "Adicionar jogador" acima para cadastrar o elenco.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = players
            .map((player) => {
                const isCalled = Boolean(player.convocado);
                const statusBadge = isCalled
                    ? `<span class="called-status" style="margin-left:6px;">CONVOCADO</span>`
                    : `<span style="margin-left:6px;font-size:8px;color:var(--text-muted);font-weight:800;">NÃO CONVOCADO</span>`;

                return `
                    <div class="admin-player-row animate-fade">
                        <div class="player-avatar ${isCalled ? "" : "yellow"}">
                            ${escapeHTML(String(player.nome || "J").charAt(0).toUpperCase())}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(player.nome)}
                                ${player.numero ? `#${escapeHTML(player.numero)}` : ""}
                                ${statusBadge}
                            </strong>
                            <small>
                                ${escapeHTML(player.posicao)} • 
                                ${Number(player.jogos || 0)} Jogos | 
                                ${Number(player.gols || 0)} Gols | 
                                ${Number(player.assistencias || 0)} Assistências
                            </small>
                        </div>

                        <div class="table-actions">
                            <button
                                type="button"
                                class="call-button ${isCalled ? "" : "not-called"}"
                                style="min-height:34px;padding:0 10px;"
                                onclick="window.BrasilApp.toggleCall('${player.id}')"
                                title="Alternar convocação"
                            >
                                <i class="fa-solid ${isCalled ? "fa-check" : "fa-plus"}"></i>
                                ${isCalled ? "Convocado" : "Convocar"}
                            </button>

                            <button
                                type="button"
                                class="stats-edit-button"
                                onclick="window.BrasilApp.openStatsModal('${player.id}')"
                                title="Editar estatísticas"
                            >
                                <i class="fa-solid fa-chart-simple"></i>
                            </button>

                            <button
                                type="button"
                                class="edit-button"
                                onclick="window.BrasilApp.openEditPlayer('${player.id}')"
                                title="Editar jogador"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="delete-button"
                                onclick="window.BrasilApp.deletePlayer('${player.id}')"
                                title="Excluir jogador"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function renderAdminTrophies() {
        const container = document.getElementById("adminTrophiesList");
        if (!container) return;

        const state = window.AppState || { trophies: [] };
        const trophies = Array.isArray(state.trophies) ? state.trophies : [];

        if (trophies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-trophy"></i>
                    <h4>Nenhum título cadastrado</h4>
                    <p>Use o botão "Adicionar título" acima para registrar conquistas.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = trophies
            .map((trophy) => {
                const iconHTML = trophy.imagem
                    ? `<img src="${escapeHTML(trophy.imagem)}" alt="${escapeHTML(trophy.nome)}" style="width:22px;height:22px;object-fit:contain;">`
                    : `<i class="fa-solid fa-trophy"></i>`;

                return `
                    <div class="admin-trophy-row animate-fade">
                        <div class="player-avatar yellow">
                            ${iconHTML}
                        </div>

                        <div>
                            <strong>${escapeHTML(trophy.nome)} (${Number(trophy.quantidade || 1)}x)</strong>
                            <small>Temporadas: ${escapeHTML(trophy.temporadas || "Não informado")}</small>
                        </div>

                        <div class="table-actions">
                            <button
                                type="button"
                                class="edit-button"
                                onclick="window.BrasilApp.openEditTrophy('${trophy.id}')"
                                title="Editar título"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="delete-button"
                                onclick="window.BrasilApp.deleteTrophy('${trophy.id}')"
                                title="Excluir título"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    // =========================================================
    // 3. SINCRONIZAÇÃO VISUAL DO STATUS DE ADMINISTRADOR
    // =========================================================
    function syncAdminUI() {
        const state = window.AppState || { isAdmin: false };
        const isAdmin = Boolean(state.isAdmin);

        const lockedBox = document.getElementById("adminLocked");
        const dashboardBox = document.getElementById("adminDashboard");
        const sessionBadge = document.getElementById("adminSessionBadge");

        if (lockedBox) lockedBox.hidden = isAdmin;
        if (dashboardBox) dashboardBox.hidden = !isAdmin;

        if (sessionBadge) {
            sessionBadge.innerHTML = isAdmin
                ? `<i class="fa-solid fa-shield-halved"></i> ADMIN: LEMOS ATIVO`
                : `<i class="fa-solid fa-lock"></i> ACESSO RESTRITO`;
        }

        if (isAdmin) {
            renderAdminPlayers();
            renderAdminTrophies();
        }
    }

    // =========================================================
    // 4. EXPORTAÇÃO E INICIALIZAÇÃO
    // =========================================================
    window.AdminModule = {
        render: syncAdminUI,
        renderAdminPlayers,
        renderAdminTrophies
    };

    document.addEventListener("DOMContentLoaded", () => {
        syncAdminUI();
    });
})();