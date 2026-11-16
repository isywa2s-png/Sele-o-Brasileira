/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   TROFEUS.JS | SALA DE TROFÉUS, UPLOAD DE IMAGEM E CONQUISTAS
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

    /**
     * Comprime/redimensiona a imagem selecionada para evitar lentidão
     * no Supabase e garantir carregamento rápido em tempo real.
     */
    function optimizeImageFile(file, maxWidth = 360, maxHeight = 360) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Mantém transparência (PNG/WebP) para logos de troféus
                    const outputType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
                    const dataUrl = canvas.toDataURL(outputType, 0.88);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
                img.src = event.target.result;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    // =========================================================
    // 2. RENDERIZAÇÃO DA SALA DE TROFÉUS
    // =========================================================
    function renderTrophies() {
        const state = window.AppState || { trophies: [], isAdmin: false };
        const trophies = Array.isArray(state.trophies) ? state.trophies : [];
        const isAdmin = Boolean(state.isAdmin);

        const typesEl = document.getElementById("trophyTypes");
        const totalEl = document.getElementById("trophyTotal");
        const grid = document.getElementById("trophiesGrid");

        const totalCups = trophies.reduce(
            (sum, item) => sum + Number(item.quantidade || 1),
            0
        );

        if (typesEl) typesEl.textContent = trophies.length;
        if (totalEl) totalEl.textContent = totalCups;

        if (!grid) return;

        if (trophies.length === 0) {
            grid.innerHTML = `
                <div class="empty-state full-width animate-fade">
                    <i class="fa-solid fa-trophy"></i>
                    <h3>Nenhuma conquista cadastrada</h3>
                    <p>Os títulos conquistados pela Seleção Brasileira aparecerão aqui.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = trophies
            .map((trophy) => {
                const qty = Number(trophy.quantidade || 1);
                const qtyLabel = qty === 1 ? "1x CAMPEÃO" : `${qty}x CAMPEÃO`;

                // Integra com temporadas.js se disponível, ou faz split padrão
                const seasonsHTML =
                    window.TemporadasModule &&
                    typeof window.TemporadasModule.renderSeasonTags === "function"
                        ? window.TemporadasModule.renderSeasonTags(trophy.temporadas)
                        : String(trophy.temporadas || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((s) => `<span class="season-tag">🏆 ${escapeHTML(s)}</span>`)
                              .join("");

                const imageHTML = trophy.imagem
                    ? `<img src="${escapeHTML(trophy.imagem)}" alt="${escapeHTML(trophy.nome)}">`
                    : `<i class="fa-solid fa-trophy trophy-placeholder"></i>`;

                return `
                    <article class="trophy-card animate-up">
                        <div class="trophy-card-top">
                            <div class="trophy-image">
                                ${imageHTML}
                            </div>
                            <span class="trophy-quantity">${qtyLabel}</span>
                        </div>

                        <h3>${escapeHTML(trophy.nome)}</h3>
                        <p>Temporadas conquistadas:</p>

                        <div class="trophy-seasons">
                            ${seasonsHTML || `<span class="season-tag">Histórico</span>`}
                        </div>

                        ${
                            isAdmin
                                ? `
                                <div class="trophy-admin-actions">
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
                                        title="Remover título"
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            `
                                : ""
                        }
                    </article>
                `;
            })
            .join("");
    }

    // =========================================================
    // 3. PRÉ-VISUALIZAÇÃO DA IMAGEM NO MODAL DE TROFÉU
    // =========================================================
    function bindTrophyImagePreview() {
        const fileInput = document.getElementById("trophyImage");
        const previewBox = document.getElementById("trophyImagePreview");

        if (!fileInput || !previewBox) return;

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                previewBox.style.display = "none";
                previewBox.innerHTML = "";
                return;
            }

            try {
                const optimizedDataUrl = await optimizeImageFile(file);
                previewBox.style.display = "flex";
                previewBox.innerHTML = `<img src="${optimizedDataUrl}" alt="Prévia do troféu">`;
            } catch (err) {
                console.error("Erro ao gerar prévia da imagem:", err);
            }
        });
    }

    // =========================================================
    // 4. EXPORTAÇÃO E INICIALIZAÇÃO
    // =========================================================
    window.TrofeusModule = {
        render: renderTrophies,
        optimizeImageFile
    };

    document.addEventListener("DOMContentLoaded", () => {
        bindTrophyImagePreview();
        renderTrophies();
    });
})();