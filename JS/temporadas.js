/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   TEMPORADAS.JS | FORMATAÇÃO E ORGANIZAÇÃO DE TEMPORADAS
========================================================= */

(() => {
    "use strict";

    // =========================================================
    // 1. UTILITÁRIOS DE PARSE E FORMATAÇÃO DE TEMPORADAS
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

    /**
     * Converte uma string como "S1, S4, S5, S8" em um array limpo ["S1", "S4", "S5", "S8"]
     */
    function parseSeasons(seasonsInput) {
        if (Array.isArray(seasonsInput)) {
            return seasonsInput
                .map((item) => String(item).trim())
                .filter(Boolean);
        }

        if (!seasonsInput) return [];

        return String(seasonsInput)
            .split(/[,;|]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    /**
     * Normaliza e ordena temporadas (ex: S1, S2, S10 em ordem natural)
     */
    function sortSeasons(seasonsArray) {
        return [...seasonsArray].sort((a, b) =>
            a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
        );
    }

    /**
     * Gera o HTML das etiquetas (tags) de temporadas para a Sala de Troféus
     */
    function renderSeasonTags(seasonsInput) {
        const list = parseSeasons(seasonsInput);

        if (list.length === 0) {
            return `<span class="season-tag">Histórico</span>`;
        }

        return list
            .map((season) => `<span class="season-tag">🏆 ${escapeHTML(season)}</span>`)
            .join("");
    }

    /**
     * Retorna um resumo consolidado de todas as temporadas conquistadas em todos os troféus
     */
    function getAllConqueredSeasons() {
        const state = window.AppState || { trophies: [] };
        const trophies = Array.isArray(state.trophies) ? state.trophies : [];
        const uniqueSeasons = new Set();

        trophies.forEach((trophy) => {
            parseSeasons(trophy.temporadas).forEach((season) => {
                uniqueSeasons.add(season.toUpperCase());
            });
        });

        return sortSeasons(Array.from(uniqueSeasons));
    }

    // =========================================================
    // 2. EXPORTAÇÃO GLOBAL
    // =========================================================
    window.TemporadasModule = {
        parseSeasons,
        sortSeasons,
        renderSeasonTags,
        getAllConqueredSeasons
    };
})();