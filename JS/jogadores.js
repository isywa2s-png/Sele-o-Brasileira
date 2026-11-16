/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   JOGADORES.JS | ELENCO COMPLETO, FILTROS E CONVOCAÇÃO
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

    function getPositionBadgeColor(posicao) {
        const map = {
            "Goleiro": "rgba(242, 202, 66, 0.14)",
            "Zagueiro": "rgba(51, 139, 232, 0.14)",
            "Lateral": "rgba(51, 139, 232, 0.14)",
            "Meio-campista": "rgba(34, 200, 117, 0.14)",
            "Atacante": "rgba(230, 92, 92, 0.14)"
        };
        return map[posicao] || "rgba(255, 255, 255, 0.06)";
    }

    // =========================================================
    // 2. RENDERIZAÇÃO DA ABA "JOGADORES" (ELENCO COMPLETO)
    // =========================================================
    function renderAllPlayers() {
        const state = window.AppState || { players: [], isAdmin: false };
        const players = Array.isArray(state.players) ? state.players : [];
        const isAdmin = Boolean(state.isAdmin);

        const called = players.filter((p) => Boolean(p.convocado));

        // Atualiza resumo numérico no topo da aba Jogadores
        const rosterTotal = document.getElementById("rosterTotal");
        const rosterCalled = document.getElementById("rosterCalled");
        const rosterNotCalled = document.getElementById("rosterNotCalled");

        if (rosterTotal) rosterTotal.textContent = players.length;
        if (rosterCalled) rosterCalled.textContent = called.length;
        if (rosterNotCalled) rosterNotCalled.textContent = players.length - called.length;

        const grid = document.getElementById("playersGrid");
        if (!grid) return;

        // Filtros de pesquisa, posição e convocação
        const searchInput = document.getElementById("playerSearch");
        const positionSelect = document.getElementById("positionFilter");
        const callSelect = document.getElementById("callFilter");

        const query = (searchInput?.value || "").toLowerCase().trim();
        const selectedPos = positionSelect?.value || "";
        const selectedCall = callSelect?.value || "";

        const filteredPlayers = players.filter((p) => {
            const matchName = String(p.nome || "").toLowerCase().includes(query);
            const matchPos = !selectedPos || p.posicao === selectedPos;
            const matchCall = selectedCall === "" || String(Boolean(p.convocado)) === selectedCall;
            return matchName && matchPos && matchCall;
        });

        if (filteredPlayers.length === 0) {
            grid.innerHTML = `
                <div class="empty-state full-width animate-fade">
                    <i class="fa-solid fa-users"></i>
                    <h3>Nenhum jogador encontrado</h3>
                    <p>Nenhum atleta corresponde aos filtros atuais ou o elenco ainda está vazio.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredPlayers
            .map((player) => {
                const isConvocado = Boolean(player.convocado);
                const btnClass = isConvocado ? "call-button convocado active" : "call-button not-called";
                const btnText = isConvocado
                    ? `<i class="fa-solid fa-circle-check"></i> Convocado`
                    : `<i class="fa-solid fa-user-plus"></i> Convocar`;

                const numberDisplay = player.numero ? `#${escapeHTML(player.numero)}` : "🇧🇷";
                const initial = escapeHTML(String(player.nome || "J").charAt(0).toUpperCase());

                return `
                    <article class="player-card animate-up">
                        <div class="player-card-top">
                            <div class="player-avatar ${isConvocado ? "" : "yellow"}">
                                ${initial}
                            </div>
                            <span class="player-number">${numberDisplay}</span>
                        </div>

                        <h3>${escapeHTML(player.nome)}</h3>

                        <span class="player-position" style="background: ${getPositionBadgeColor(player.posicao)};">
                            ${escapeHTML(player.posicao)}
                        </span>

                        <div class="player-card-stats">
                            <div>
                                <strong>${Number(player.jogos || 0)}</strong>
                                <span>Jogos</span>
                            </div>
                            <div>
                                <strong>${Number(player.gols || 0)}</strong>
                                <span>Gols</span>
                            </div>
                            <div>
                                <strong>${Number(player.assistencias || 0)}</strong>
                                <span>Assist.</span>
                            </div>
                        </div>

                        <div class="player-card-actions">
                            <button
                                type="button"
                                class="${btnClass}"
                                onclick="window.BrasilApp.toggleCall('${player.id}')"
                                title="${isAdmin ? "Clique para alternar entre Convocado e Não Convocado" : "Somente Lemos pode convocar"}"
                            >
                                ${btnText}
                            </button>

                            ${
                                isAdmin
                                    ? `
                                    <button
                                        type="button"
                                        class="edit-button"
                                        onclick="window.BrasilApp.openEditPlayer('${player.id}')"
                                        title="Editar dados do jogador"
                                    >
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="window.BrasilApp.deletePlayer('${player.id}')"
                                        title="Remover jogador"
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                `
                                    : ""
                            }
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    // =========================================================
    // 3. RENDERIZAÇÃO DA ABA "CONVOCADOS" (JOGOS, GOLS, ASSIST.)
    // =========================================================
    function renderCalledPlayers() {
        const state = window.AppState || { players: [], isAdmin: false };
        const players = Array.isArray(state.players) ? state.players : [];
        const isAdmin = Boolean(state.isAdmin);

        const calledPlayers = players.filter((p) => Boolean(p.convocado));

        // Somatórios dos convocados
        const totalGames = calledPlayers.reduce((acc, p) => acc + Number(p.jogos || 0), 0);
        const totalGoals = calledPlayers.reduce((acc, p) => acc + Number(p.gols || 0), 0);
        const totalAssists = calledPlayers.reduce((acc, p) => acc + Number(p.assistencias || 0), 0);

        const calledCountEl = document.getElementById("calledCount");
        const calledGamesEl = document.getElementById("calledGames");
        const calledGoalsEl = document.getElementById("calledGoals");
        const calledAssistsEl = document.getElementById("calledAssists");

        if (calledCountEl) calledCountEl.textContent = calledPlayers.length;
        if (calledGamesEl) calledGamesEl.textContent = totalGames;
        if (calledGoalsEl) calledGoalsEl.textContent = totalGoals;
        if (calledAssistsEl) calledAssistsEl.textContent = totalAssists;

        const tbody = document.getElementById("calledPlayersTable");
        if (!tbody) return;

        if (calledPlayers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fa-solid fa-shirt"></i>
                            <h4>Nenhum jogador convocado</h4>
                            <p>Vá até a aba <strong>Jogadores</strong> e clique em <strong>Convocar</strong>.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = calledPlayers
            .map((player) => {
                const avatar = player.numero
                    ? `#${escapeHTML(player.numero)}`
                    : escapeHTML(String(player.nome || "J").charAt(0).toUpperCase());

                return `
                    <tr class="animate-fade">
                        <td>
                            <div class="table-player">
                                <div class="player-avatar">${avatar}</div>
                                <div>
                                    <strong>${escapeHTML(player.nome)}</strong>
                                    <small>${player.numero ? `Camisa ${escapeHTML(player.numero)}` : "Seleção Brasileira 🇧🇷"}</small>
                                </div>
                            </div>
                        </td>
                        <td>${escapeHTML(player.posicao)}</td>
                        <td class="table-number">${Number(player.jogos || 0)}</td>
                        <td class="table-number">${Number(player.gols || 0)}</td>
                        <td class="table-number">${Number(player.assistencias || 0)}</td>
                        <td>
                            <div class="table-actions">
                                ${
                                    isAdmin
                                        ? `
                                        <button
                                            type="button"
                                            class="stats-edit-button"
                                            onclick="window.BrasilApp.openStatsModal('${player.id}')"
                                            title="Editar Jogos, Gols e Assistências"
                                        >
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button
                                            type="button"
                                            class="delete-button"
                                            onclick="window.BrasilApp.toggleCall('${player.id}')"
                                            title="Remover da convocação"
                                        >
                                            <i class="fa-solid fa-user-minus"></i>
                                        </button>
                                    `
                                        : `<span class="called-status"><i class="fa-solid fa-check"></i> ATIVO</span>`
                                }
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    // =========================================================
    // 4. EVENTOS DE FILTRO E EXPORTAÇÃO
    // =========================================================
    function bindFilterEvents() {
        const searchInput = document.getElementById("playerSearch");
        const positionSelect = document.getElementById("positionFilter");
        const callSelect = document.getElementById("callFilter");

        if (searchInput) {
            searchInput.addEventListener("input", renderAllPlayers);
        }
        if (positionSelect) {
            positionSelect.addEventListener("change", renderAllPlayers);
        }
        if (callSelect) {
            callSelect.addEventListener("change", renderAllPlayers);
        }
    }

    function render() {
        renderAllPlayers();
        renderCalledPlayers();
    }

    window.JogadoresModule = {
        render,
        renderAllPlayers,
        renderCalledPlayers
    };

    document.addEventListener("DOMContentLoaded", () => {
        bindFilterEvents();
        render();
    });
})();