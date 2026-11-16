/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   SCRIPT.JS | NÚCLEO CENTRAL, NAVEGAÇÃO, REALTIME E ADMIN
========================================================= */

(() => {
    "use strict";

    // =========================================================
    // 1. CONFIGURAÇÕES E CREDENCIAIS
    // =========================================================
    const CONFIG = {
        SUPABASE_URL: "https://iiabulubutkcsxpqbazw.supabase.co",
        SUPABASE_KEY: "sb_publishable_N8TbqsocEQUiUlQsivKwRg_0rMr_CNI",
        ADMIN_USER: "Lemos",
        ADMIN_PASS: "1234",
        STORAGE_SESSION_KEY: "brasil_selecao_admin_auth",
        STORAGE_PLAYERS_KEY: "brasil_selecao_players_cache",
        STORAGE_TROPHIES_KEY: "brasil_selecao_trophies_cache"
    };

    // Estado Global da Aplicação (acessível por painel.js, jogadores.js, etc.)
    window.AppState = {
        players: [],
        trophies: [],
        isAdmin: false,
        currentSection: "painel",
        isConnected: false,
        lastSync: null,
        pendingConfirmCallback: null
    };

    // Instância do Supabase (usa a do supabase.js se já existir, ou cria uma)
    let sbClient = window.supabaseClient || null;

    function initSupabaseClient() {
        if (sbClient) return sbClient;

        if (window.supabase && typeof window.supabase.createClient === "function") {
            sbClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            window.supabaseClient = sbClient;
            return sbClient;
        }
        return null;
    }

    // =========================================================
    // 2. SELETORES DO DOM
    // =========================================================
    const DOM = {
        body: document.body,
        loadingScreen: document.getElementById("loadingScreen"),
        toastContainer: document.getElementById("toastContainer"),

        // Sidebar & Topbar
        sidebar: document.getElementById("sidebar"),
        sidebarOverlay: document.getElementById("sidebarOverlay"),
        menuToggle: document.getElementById("menuToggle"),
        closeSidebar: document.getElementById("closeSidebar"),
        topbarMore: document.getElementById("topbarMore"),
        moreMenu: document.getElementById("moreMenu"),
        moreAdmin: document.getElementById("moreAdmin"),
        adminAccess: document.getElementById("adminAccess"),
        currentPage: document.getElementById("currentPage"),

        // Status & Contadores
        connectionIndicator: document.getElementById("connectionIndicator"),
        connectionStatus: document.getElementById("connectionStatus"),
        lastUpdate: document.getElementById("lastUpdate"),
        syncStatus: document.getElementById("syncStatus"),
        totalPlayers: document.getElementById("totalPlayers"),
        totalCalled: document.getElementById("totalCalled"),
        currentYear: document.getElementById("currentYear"),

        // Navegação
        navButtons: document.querySelectorAll("[data-section]"),
        sections: document.querySelectorAll(".page-section"),

        // Painel (Dashboard)
        dashboardPlayers: document.getElementById("dashboardPlayers"),
        dashboardCalled: document.getElementById("dashboardCalled"),
        dashboardGames: document.getElementById("dashboardGames"),
        dashboardTrophies: document.getElementById("dashboardTrophies"),
        dashboardCalledList: document.getElementById("dashboardCalledList"),
        dashboardTrophyList: document.getElementById("dashboardTrophyList"),

        // Jogadores
        addPlayerBtn: document.getElementById("addPlayerBtn"),
        playerSearch: document.getElementById("playerSearch"),
        positionFilter: document.getElementById("positionFilter"),
        callFilter: document.getElementById("callFilter"),
        rosterTotal: document.getElementById("rosterTotal"),
        rosterCalled: document.getElementById("rosterCalled"),
        rosterNotCalled: document.getElementById("rosterNotCalled"),
        playersGrid: document.getElementById("playersGrid"),

        // Convocados
        calledCount: document.getElementById("calledCount"),
        calledGames: document.getElementById("calledGames"),
        calledGoals: document.getElementById("calledGoals"),
        calledAssists: document.getElementById("calledAssists"),
        calledPlayersTable: document.getElementById("calledPlayersTable"),

        // Estatísticas
        statisticsGames: document.getElementById("statisticsGames"),
        statisticsGoals: document.getElementById("statisticsGoals"),
        statisticsAssists: document.getElementById("statisticsAssists"),
        topScorers: document.getElementById("topScorers"),
        topAssists: document.getElementById("topAssists"),
        topGames: document.getElementById("topGames"),

        // Sala de Troféus
        addTrophyBtn: document.getElementById("addTrophyBtn"),
        trophyTypes: document.getElementById("trophyTypes"),
        trophyTotal: document.getElementById("trophyTotal"),
        trophiesGrid: document.getElementById("trophiesGrid"),

        // Administração
        adminSessionBadge: document.getElementById("adminSessionBadge"),
        adminLocked: document.getElementById("adminLocked"),
        adminDashboard: document.getElementById("adminDashboard"),
        adminLoginBtn: document.getElementById("adminLoginBtn"),
        adminLogoutBtn: document.getElementById("adminLogoutBtn"),
        adminAddPlayer: document.getElementById("adminAddPlayer"),
        adminAddTrophy: document.getElementById("adminAddTrophy"),
        adminManageStats: document.getElementById("adminManageStats"),
        adminPlayersList: document.getElementById("adminPlayersList"),
        adminTrophiesList: document.getElementById("adminTrophiesList"),

        // Modais e Formulários
        playerModal: document.getElementById("playerModal"),
        playerModalTitle: document.getElementById("playerModalTitle"),
        playerForm: document.getElementById("playerForm"),
        playerId: document.getElementById("playerId"),
        playerName: document.getElementById("playerName"),
        playerPosition: document.getElementById("playerPosition"),
        playerNumber: document.getElementById("playerNumber"),
        playerGames: document.getElementById("playerGames"),
        playerGoals: document.getElementById("playerGoals"),
        playerAssists: document.getElementById("playerAssists"),

        statsModal: document.getElementById("statsModal"),
        statsForm: document.getElementById("statsForm"),
        statsPlayerId: document.getElementById("statsPlayerId"),
        statsPlayerName: document.getElementById("statsPlayerName"),
        statsGames: document.getElementById("statsGames"),
        statsGoals: document.getElementById("statsGoals"),
        statsAssists: document.getElementById("statsAssists"),

        trophyModal: document.getElementById("trophyModal"),
        trophyModalTitle: document.getElementById("trophyModalTitle"),
        trophyForm: document.getElementById("trophyForm"),
        trophyId: document.getElementById("trophyId"),
        trophyName: document.getElementById("trophyName"),
        trophyImage: document.getElementById("trophyImage"),
        trophyImagePreview: document.getElementById("trophyImagePreview"),
        trophyQuantity: document.getElementById("trophyQuantity"),
        trophySeasons: document.getElementById("trophySeasons"),

        adminModal: document.getElementById("adminModal"),
        adminLoginForm: document.getElementById("adminLoginForm"),
        adminUsername: document.getElementById("adminUsername"),
        adminPassword: document.getElementById("adminPassword"),
        adminLoginError: document.getElementById("adminLoginError"),

        confirmModal: document.getElementById("confirmModal"),
        confirmTitle: document.getElementById("confirmTitle"),
        confirmMessage: document.getElementById("confirmMessage"),
        cancelConfirm: document.getElementById("cancelConfirm"),
        confirmAction: document.getElementById("confirmAction")
    };

    // =========================================================
    // 3. UTILITÁRIOS E SEGURANÇA (XSS, ZOOM, TOASTS)
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

    function showToast(message, type = "success") {
        if (!DOM.toastContainer) return;

        const icons = {
            success: "fa-circle-check",
            error: "fa-circle-xmark",
            warning: "fa-triangle-exclamation"
        };

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.success}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        DOM.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            setTimeout(() => toast.remove(), 300);
        }, 3400);
    }

    function preventMobileZoom() {
        // Garante viewport sem zoom forçado em iOS/Android ao clicar em inputs
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute(
                "content",
                "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            );
        }
    }

    function hideLoadingScreen() {
        if (!DOM.loadingScreen) return;
        DOM.loadingScreen.style.opacity = "0";
        DOM.loadingScreen.style.pointerEvents = "none";
        setTimeout(() => {
            DOM.loadingScreen.style.display = "none";
        }, 350);
    }

    function updateConnectionUI(online) {
        window.AppState.isConnected = online;

        if (DOM.connectionIndicator) {
            DOM.connectionIndicator.style.background = online ? "#22c875" : "#f2ca42";
            DOM.connectionIndicator.style.boxShadow = online
                ? "0 0 10px rgba(34, 200, 117, 0.8)"
                : "0 0 10px rgba(242, 202, 66, 0.5)";
        }

        if (DOM.connectionStatus) {
            DOM.connectionStatus.textContent = online ? "Online • Tempo Real" : "Modo Local";
        }

        if (DOM.syncStatus) {
            DOM.syncStatus.textContent = online ? "SINCRONIZADO" : "OFFLINE";
            DOM.syncStatus.style.color = online ? "#22c875" : "#f2ca42";
        }

        if (DOM.lastUpdate) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
            DOM.lastUpdate.textContent = `Atualizado às ${timeStr}`;
        }
    }

    // =========================================================
    // 4. NAVEGAÇÃO, MENU LATERAL E MENU 3 PONTINHOS (MOBILE)
    // =========================================================
    const SECTION_TITLES = {
        painel: "Painel",
        jogadores: "Jogadores",
        convocados: "Convocados",
        estatisticas: "Estatísticas",
        trofeus: "Sala de Troféus",
        presidencia: "Presidência",
        admin: "Administração"
    };

    function navigateTo(sectionName) {
        if (!sectionName) return;

        // Fecha menus mobile antes de trocar
        closeMobileSidebar();
        closeMoreMenu();

        window.AppState.currentSection = sectionName;

        // Atualiza seções visíveis
        DOM.sections.forEach((sec) => {
            sec.classList.toggle("active", sec.id === `section-${sectionName}`);
        });

        // Atualiza estado ativo nos botões de navegação
        document.querySelectorAll(".nav-item").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.section === sectionName);
        });

        // Atualiza breadcrumb
        if (DOM.currentPage) {
            DOM.currentPage.textContent = SECTION_TITLES[sectionName] || "Painel";
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openMobileSidebar() {
        if (DOM.sidebar) DOM.sidebar.classList.add("open");
        if (DOM.sidebarOverlay) DOM.sidebarOverlay.classList.add("active");
    }

    function closeMobileSidebar() {
        if (DOM.sidebar) DOM.sidebar.classList.remove("open");
        if (DOM.sidebarOverlay) DOM.sidebarOverlay.classList.remove("active");
    }

    function toggleMoreMenu(e) {
        if (e) e.stopPropagation();
        if (!DOM.moreMenu || !DOM.topbarMore) return;

        const isOpen = DOM.moreMenu.classList.toggle("show");
        DOM.topbarMore.classList.toggle("open", isOpen);
    }

    function closeMoreMenu() {
        if (DOM.moreMenu) DOM.moreMenu.classList.remove("show");
        if (DOM.topbarMore) DOM.topbarMore.classList.remove("open");
    }

    // =========================================================
    // 5. MODAIS
    // =========================================================
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("active");
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove("active");
        }
    }

    function openConfirmModal(title, message, onConfirm) {
        if (DOM.confirmTitle) DOM.confirmTitle.textContent = title;
        if (DOM.confirmMessage) DOM.confirmMessage.textContent = message;
        window.AppState.pendingConfirmCallback = onConfirm;
        openModal("confirmModal");
    }

    // =========================================================
    // 6. AUTENTICAÇÃO ADMINISTRATIVA (LEMOS / 1234)
    // =========================================================
    function checkAdminSession() {
        const saved = localStorage.getItem(CONFIG.STORAGE_SESSION_KEY);
        setAdminState(saved === "true", false);
    }

    function setAdminState(isAdmin, notify = true) {
        window.AppState.isAdmin = isAdmin;

        if (isAdmin) {
            localStorage.setItem(CONFIG.STORAGE_SESSION_KEY, "true");
            DOM.body.classList.add("is-admin");
        } else {
            localStorage.removeItem(CONFIG.STORAGE_SESSION_KEY);
            DOM.body.classList.remove("is-admin");
        }

        // Atualiza interface da aba Administração
        if (DOM.adminLocked) DOM.adminLocked.hidden = isAdmin;
        if (DOM.adminDashboard) DOM.adminDashboard.hidden = !isAdmin;

        if (DOM.adminSessionBadge) {
            DOM.adminSessionBadge.innerHTML = isAdmin
                ? `<i class="fa-solid fa-shield-halved"></i> ADMIN: LEMOS ATIVO`
                : `<i class="fa-solid fa-lock"></i> ACESSO RESTRITO`;
        }

        if (notify) {
            showToast(
                isAdmin ? "Bem-vindo, Lemos! Modo admin ativado." : "Sessão administrativa encerrada.",
                isAdmin ? "success" : "warning"
            );
        }

        renderAll();
    }

    function handleAdminLogin(e) {
        e.preventDefault();
        const user = (DOM.adminUsername?.value || "").trim();
        const pass = (DOM.adminPassword?.value || "").trim();

        if (user === CONFIG.ADMIN_USER && pass === CONFIG.ADMIN_PASS) {
            if (DOM.adminLoginError) DOM.adminLoginError.hidden = true;
            DOM.adminLoginForm.reset();
            closeModal("adminModal");
            setAdminState(true, true);
            navigateTo("admin");
        } else {
            if (DOM.adminLoginError) {
                DOM.adminLoginError.textContent = "Usuário ou senha incorretos. Apenas Lemos tem acesso.";
                DOM.adminLoginError.hidden = false;
            }
            showToast("Credenciais inválidas!", "error");
        }
    }

    // =========================================================
    // 7. BANCO DE DADOS & TEMPO REAL (SUPABASE + FALLBACK)
    // =========================================================
    async function loadInitialData() {
        const client = initSupabaseClient();

        // Carrega cache local imediatamente para resposta instantânea
        try {
            const cachedPlayers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_PLAYERS_KEY) || "[]");
            const cachedTrophies = JSON.parse(localStorage.getItem(CONFIG.STORAGE_TROPHIES_KEY) || "[]");
            if (cachedPlayers.length) window.AppState.players = cachedPlayers;
            if (cachedTrophies.length) window.AppState.trophies = cachedTrophies;
            renderAll();
        } catch (err) {
            console.warn("Cache local vazio ou inválido.");
        }

        if (!client) {
            updateConnectionUI(false);
            hideLoadingScreen();
            return;
        }

        try {
            const [playersRes, trophiesRes] = await Promise.all([
                client.from("jogadores").select("*").order("nome", { ascending: true }),
                client.from("trofeus").select("*").order("id", { ascending: true })
            ]);

            if (playersRes.error) throw playersRes.error;
            if (trophiesRes.error) throw trophiesRes.error;

            window.AppState.players = normalizePlayers(playersRes.data || []);
            window.AppState.trophies = normalizeTrophies(trophiesRes.data || []);

            saveLocalCache();
            updateConnectionUI(true);
            renderAll();
            setupRealtimeSubscriptions(client);
        } catch (error) {
            console.error("Erro ao sincronizar com Supabase:", error);
            updateConnectionUI(false);
            showToast("Conectado em modo offline. Verifique as tabelas no Supabase.", "warning");
        } finally {
            hideLoadingScreen();
        }
    }

    function normalizePlayers(list) {
        return list.map((p) => ({
            id: p.id,
            nome: p.nome || p.name || "Jogador",
            posicao: p.posicao || p.position || "Atacante",
            numero: p.numero ?? p.number ?? "",
            convocado: Boolean(p.convocado ?? p.called ?? false),
            jogos: Number(p.jogos ?? p.games ?? 0),
            gols: Number(p.gols ?? p.goals ?? 0),
            assistencias: Number(p.assistencias ?? p.assists ?? 0)
        }));
    }

    function normalizeTrophies(list) {
        return list.map((t) => ({
            id: t.id,
            nome: t.nome || t.name || "Título",
            imagem: t.imagem || t.image || "",
            quantidade: Number(t.quantidade ?? t.quantity ?? 1),
            temporadas: t.temporadas || t.seasons || ""
        }));
    }

    function saveLocalCache() {
        localStorage.setItem(CONFIG.STORAGE_PLAYERS_KEY, JSON.stringify(window.AppState.players));
        localStorage.setItem(CONFIG.STORAGE_TROPHIES_KEY, JSON.stringify(window.AppState.trophies));
    }

    function setupRealtimeSubscriptions(client) {
        client
            .channel("brasil-realtime-channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "jogadores" },
                async () => {
                    const { data } = await client
                        .from("jogadores")
                        .select("*")
                        .order("nome", { ascending: true });
                    if (data) {
                        window.AppState.players = normalizePlayers(data);
                        saveLocalCache();
                        updateConnectionUI(true);
                        renderAll();
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "trofeus" },
                async () => {
                    const { data } = await client
                        .from("trofeus")
                        .select("*")
                        .order("id", { ascending: true });
                    if (data) {
                        window.AppState.trophies = normalizeTrophies(data);
                        saveLocalCache();
                        updateConnectionUI(true);
                        renderAll();
                    }
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    updateConnectionUI(true);
                }
            });
    }

    // =========================================================
    // 8. OPERAÇÕES CRUD (JOGADORES, CONVOCAÇÃO, STATS E TROFÉUS)
    // =========================================================
    function requireAdmin() {
        if (!window.AppState.isAdmin) {
            showToast("Apenas o administrador Lemos pode alterar dados.", "error");
            openModal("adminModal");
            return false;
        }
        return true;
    }

    async function savePlayer(e) {
        e.preventDefault();
        if (!requireAdmin()) return;

        const id = DOM.playerId.value;
        const payload = {
            nome: DOM.playerName.value.trim(),
            posicao: DOM.playerPosition.value,
            numero: DOM.playerNumber.value ? Number(DOM.playerNumber.value) : null,
            jogos: Number(DOM.playerGames.value || 0),
            gols: Number(DOM.playerGoals.value || 0),
            assistencias: Number(DOM.playerAssists.value || 0)
        };

        if (!payload.nome || !payload.posicao) {
            showToast("Preencha o nome e a posição do jogador.", "warning");
            return;
        }

        const client = initSupabaseClient();

        try {
            if (client && window.AppState.isConnected) {
                if (id) {
                    const { error } = await client.from("jogadores").update(payload).eq("id", id);
                    if (error) throw error;
                    showToast("Jogador atualizado com sucesso! 🇧🇷");
                } else {
                    payload.convocado = false;
                    const { error } = await client.from("jogadores").insert([payload]);
                    if (error) throw error;
                    showToast("Jogador adicionado ao elenco! ⚽");
                }
            } else {
                // Fallback Local
                if (id) {
                    const idx = window.AppState.players.findIndex((p) => String(p.id) === String(id));
                    if (idx !== -1) {
                        window.AppState.players[idx] = { ...window.AppState.players[idx], ...payload };
                    }
                } else {
                    window.AppState.players.push({
                        id: Date.now(),
                        convocado: false,
                        ...payload
                    });
                }
                saveLocalCache();
                renderAll();
                showToast("Jogador salvo localmente!");
            }

            DOM.playerForm.reset();
            DOM.playerId.value = "";
            closeModal("playerModal");
        } catch (err) {
            console.error(err);
            showToast("Erro ao salvar jogador.", "error");
        }
    }

    async function toggleCallPlayer(playerId) {
        if (!requireAdmin()) return;

        const player = window.AppState.players.find((p) => String(p.id) === String(playerId));
        if (!player) return;

        const novoStatus = !player.convocado;
        const client = initSupabaseClient();

        // Atualização otimista imediata na tela
        player.convocado = novoStatus;
        renderAll();

        try {
            if (client && window.AppState.isConnected) {
                const { error } = await client
                    .from("jogadores")
                    .update({ convocado: novoStatus })
                    .eq("id", playerId);
                if (error) throw error;
            } else {
                saveLocalCache();
            }

            showToast(
                novoStatus
                    ? `✅ ${player.nome} foi CONVOCADO!`
                    : `❌ ${player.nome} removido da convocação.`,
                novoStatus ? "success" : "warning"
            );
        } catch (err) {
            player.convocado = !novoStatus;
            renderAll();
            showToast("Erro ao alterar convocação.", "error");
        }
    }

    async function savePlayerStats(e) {
        e.preventDefault();
        if (!requireAdmin()) return;

        const id = DOM.statsPlayerId.value;
        const updates = {
            jogos: Number(DOM.statsGames.value || 0),
            gols: Number(DOM.statsGoals.value || 0),
            assistencias: Number(DOM.statsAssists.value || 0)
        };

        const client = initSupabaseClient();

        try {
            if (client && window.AppState.isConnected) {
                const { error } = await client.from("jogadores").update(updates).eq("id", id);
                if (error) throw error;
            } else {
                const idx = window.AppState.players.findIndex((p) => String(p.id) === String(id));
                if (idx !== -1) {
                    window.AppState.players[idx] = { ...window.AppState.players[idx], ...updates };
                    saveLocalCache();
                    renderAll();
                }
            }

            closeModal("statsModal");
            showToast("Estatísticas atualizadas ao vivo! 📊");
        } catch (err) {
            console.error(err);
            showToast("Erro ao atualizar estatísticas.", "error");
        }
    }

    function deletePlayer(playerId) {
        if (!requireAdmin()) return;
        const player = window.AppState.players.find((p) => String(p.id) === String(playerId));
        if (!player) return;

        openConfirmModal(
            "Remover jogador",
            `Deseja realmente remover ${player.nome} do elenco da Seleção?`,
            async () => {
                const client = initSupabaseClient();
                try {
                    if (client && window.AppState.isConnected) {
                        const { error } = await client.from("jogadores").delete().eq("id", playerId);
                        if (error) throw error;
                    } else {
                        window.AppState.players = window.AppState.players.filter(
                            (p) => String(p.id) !== String(playerId)
                        );
                        saveLocalCache();
                        renderAll();
                    }
                    showToast(`${player.nome} foi removido.`, "warning");
                } catch (err) {
                    showToast("Erro ao excluir jogador.", "error");
                }
            }
        );
    }

    function readImageAsBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    async function saveTrophy(e) {
        e.preventDefault();
        if (!requireAdmin()) return;

        const id = DOM.trophyId.value;
        const nome = DOM.trophyName.value.trim();
        const quantidade = Number(DOM.trophyQuantity.value || 1);
        const temporadas = DOM.trophySeasons.value.trim();
        const file = DOM.trophyImage.files[0];

        if (!nome || !temporadas) {
            showToast("Preencha o nome da competição e as temporadas.", "warning");
            return;
        }

        let base64Image = null;
        if (file) {
            base64Image = await readImageAsBase64(file);
        } else if (id) {
            const existing = window.AppState.trophies.find((t) => String(t.id) === String(id));
            if (existing) base64Image = existing.imagem;
        }

        const payload = {
            nome,
            quantidade,
            temporadas,
            imagem: base64Image || ""
        };

        const client = initSupabaseClient();

        try {
            if (client && window.AppState.isConnected) {
                if (id) {
                    const { error } = await client.from("trofeus").update(payload).eq("id", id);
                    if (error) throw error;
                    showToast("Título atualizado na Sala de Troféus! 🏆");
                } else {
                    const { error } = await client.from("trofeus").insert([payload]);
                    if (error) throw error;
                    showToast("Novo título conquistado adicionado! 🏆");
                }
            } else {
                if (id) {
                    const idx = window.AppState.trophies.findIndex((t) => String(t.id) === String(id));
                    if (idx !== -1) {
                        window.AppState.trophies[idx] = { ...window.AppState.trophies[idx], ...payload };
                    }
                } else {
                    window.AppState.trophies.push({ id: Date.now(), ...payload });
                }
                saveLocalCache();
                renderAll();
                showToast("Título salvo localmente! 🏆");
            }

            DOM.trophyForm.reset();
            DOM.trophyId.value = "";
            if (DOM.trophyImagePreview) {
                DOM.trophyImagePreview.style.display = "none";
                DOM.trophyImagePreview.innerHTML = "";
            }
            closeModal("trophyModal");
        } catch (err) {
            console.error(err);
            showToast("Erro ao salvar título.", "error");
        }
    }

    function deleteTrophy(trophyId) {
        if (!requireAdmin()) return;
        const trophy = window.AppState.trophies.find((t) => String(t.id) === String(trophyId));
        if (!trophy) return;

        openConfirmModal(
            "Remover título",
            `Deseja remover "${trophy.nome}" da Sala de Troféus?`,
            async () => {
                const client = initSupabaseClient();
                try {
                    if (client && window.AppState.isConnected) {
                        const { error } = await client.from("trofeus").delete().eq("id", trophyId);
                        if (error) throw error;
                    } else {
                        window.AppState.trophies = window.AppState.trophies.filter(
                            (t) => String(t.id) !== String(trophyId)
                        );
                        saveLocalCache();
                        renderAll();
                    }
                    showToast("Título removido da galeria.", "warning");
                } catch (err) {
                    showToast("Erro ao excluir título.", "error");
                }
            }
        );
    }

    // =========================================================
    // 9. RENDERIZAÇÃO DAS PÁGINAS
    // =========================================================
    function renderAll() {
        renderCountersAndDashboard();
        renderPlayersGrid();
        renderCalledSection();
        renderStatisticsSection();
        renderTrophiesSection();
        renderAdminLists();
    }

    function renderCountersAndDashboard() {
        const players = window.AppState.players;
        const called = players.filter((p) => p.convocado);
        const trophies = window.AppState.trophies;

        const totalGames = called.reduce((acc, p) => acc + p.jogos, 0);
        const totalTitlesCount = trophies.reduce((acc, t) => acc + Number(t.quantidade || 1), 0);

        if (DOM.totalPlayers) DOM.totalPlayers.textContent = players.length;
        if (DOM.totalCalled) DOM.totalCalled.textContent = called.length;

        if (DOM.dashboardPlayers) DOM.dashboardPlayers.textContent = players.length;
        if (DOM.dashboardCalled) DOM.dashboardCalled.textContent = called.length;
        if (DOM.dashboardGames) DOM.dashboardGames.textContent = totalGames;
        if (DOM.dashboardTrophies) DOM.dashboardTrophies.textContent = totalTitlesCount;

        // Últimos convocados no Painel
        if (DOM.dashboardCalledList) {
            if (called.length === 0) {
                DOM.dashboardCalledList.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-shirt"></i>
                        <h4>Nenhum convocado ainda</h4>
                        <p>Os jogadores convocados aparecerão aqui.</p>
                    </div>`;
            } else {
                DOM.dashboardCalledList.innerHTML = called
                    .slice(0, 5)
                    .map(
                        (p) => `
                        <div class="dashboard-player-item">
                            <div class="player-avatar">${escapeHTML(p.numero || p.nome.charAt(0).toUpperCase())}</div>
                            <div class="dashboard-player-info">
                                <strong>${escapeHTML(p.nome)}</strong>
                                <span>${escapeHTML(p.posicao)} • ${p.jogos}J | ${p.gols}G | ${p.assistencias}A</span>
                            </div>
                            <span class="called-status">
                                <i class="fa-solid fa-check"></i> CONVOCADO
                            </span>
                        </div>`
                    )
                    .join("");
            }
        }

        // Resumo de troféus no Painel
        if (DOM.dashboardTrophyList) {
            if (trophies.length === 0) {
                DOM.dashboardTrophyList.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-trophy"></i>
                        <h4>Galeria vazia</h4>
                        <p>As conquistas aparecerão aqui.</p>
                    </div>`;
            } else {
                DOM.dashboardTrophyList.innerHTML = trophies
                    .slice(0, 4)
                    .map(
                        (t) => `
                        <div class="dashboard-player-item">
                            <div class="player-avatar yellow">
                                ${
                                    t.imagem
                                        ? `<img src="${escapeHTML(t.imagem)}" alt="${escapeHTML(t.nome)}" style="width:24px;height:24px;object-fit:contain;">`
                                        : `<i class="fa-solid fa-trophy"></i>`
                                }
                            </div>
                            <div class="dashboard-player-info">
                                <strong>${escapeHTML(t.nome)} (${t.quantidade}x)</strong>
                                <span>${escapeHTML(t.temporadas)}</span>
                            </div>
                        </div>`
                    )
                    .join("");
            }
        }
    }

    function renderPlayersGrid() {
        const players = window.AppState.players;
        const called = players.filter((p) => p.convocado);

        if (DOM.rosterTotal) DOM.rosterTotal.textContent = players.length;
        if (DOM.rosterCalled) DOM.rosterCalled.textContent = called.length;
        if (DOM.rosterNotCalled) DOM.rosterNotCalled.textContent = players.length - called.length;

        if (!DOM.playersGrid) return;

        const search = (DOM.playerSearch?.value || "").toLowerCase().trim();
        const pos = DOM.positionFilter?.value || "";
        const callStatus = DOM.callFilter?.value || "";

        const filtered = players.filter((p) => {
            const matchesName = p.nome.toLowerCase().includes(search);
            const matchesPos = !pos || p.posicao === pos;
            const matchesCall =
                callStatus === "" || String(p.convocado) === callStatus;
            return matchesName && matchesPos && matchesCall;
        });

        if (filtered.length === 0) {
            DOM.playersGrid.innerHTML = `
                <div class="empty-state full-width">
                    <i class="fa-solid fa-users"></i>
                    <h3>Nenhum jogador encontrado</h3>
                    <p>Adicione jogadores ou ajuste os filtros de busca.</p>
                </div>`;
            return;
        }

        const isAdmin = window.AppState.isAdmin;

        DOM.playersGrid.innerHTML = filtered
            .map((p) => {
                const btnClass = p.convocado ? "call-button" : "call-button not-called";
                const btnLabel = p.convocado
                    ? `<i class="fa-solid fa-check"></i> Convocado`
                    : `<i class="fa-solid fa-plus"></i> Convocar`;

                return `
                    <article class="player-card">
                        <div class="player-card-top">
                            <div class="player-avatar">${escapeHTML(p.nome.charAt(0).toUpperCase())}</div>
                            <span class="player-number">${p.numero ? `#${escapeHTML(p.numero)}` : "🇧🇷"}</span>
                        </div>

                        <h3>${escapeHTML(p.nome)}</h3>
                        <span class="player-position">${escapeHTML(p.posicao)}</span>

                        <div class="player-card-stats">
                            <div>
                                <strong>${p.jogos}</strong>
                                <span>Jogos</span>
                            </div>
                            <div>
                                <strong>${p.gols}</strong>
                                <span>Gols</span>
                            </div>
                            <div>
                                <strong>${p.assistencias}</strong>
                                <span>Assist.</span>
                            </div>
                        </div>

                        <div class="player-card-actions">
                            <button
                                type="button"
                                class="${btnClass}"
                                onclick="window.BrasilApp.toggleCall('${p.id}')"
                                title="${isAdmin ? "Alternar convocação" : "Apenas Lemos pode convocar"}"
                            >
                                ${btnLabel}
                            </button>

                            ${
                                isAdmin
                                    ? `
                                    <button
                                        type="button"
                                        class="edit-button"
                                        onclick="window.BrasilApp.openEditPlayer('${p.id}')"
                                        title="Editar jogador"
                                    >
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="window.BrasilApp.deletePlayer('${p.id}')"
                                        title="Excluir jogador"
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

    function renderCalledSection() {
        const called = window.AppState.players.filter((p) => p.convocado);

        const games = called.reduce((sum, p) => sum + p.jogos, 0);
        const goals = called.reduce((sum, p) => sum + p.gols, 0);
        const assists = called.reduce((sum, p) => sum + p.assistencias, 0);

        if (DOM.calledCount) DOM.calledCount.textContent = called.length;
        if (DOM.calledGames) DOM.calledGames.textContent = games;
        if (DOM.calledGoals) DOM.calledGoals.textContent = goals;
        if (DOM.calledAssists) DOM.calledAssists.textContent = assists;

        if (!DOM.calledPlayersTable) return;

        if (called.length === 0) {
            DOM.calledPlayersTable.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fa-solid fa-shirt"></i>
                            <h4>Nenhum jogador convocado</h4>
                            <p>Vá até a aba Jogadores e clique em Convocar.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        const isAdmin = window.AppState.isAdmin;

        DOM.calledPlayersTable.innerHTML = called
            .map(
                (p) => `
                <tr>
                    <td>
                        <div class="table-player">
                            <div class="player-avatar">${escapeHTML(p.numero || p.nome.charAt(0).toUpperCase())}</div>
                            <div>
                                <strong>${escapeHTML(p.nome)}</strong>
                                <small>${p.numero ? `Camisa ${escapeHTML(p.numero)}` : "Seleção Brasileira"}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHTML(p.posicao)}</td>
                    <td class="table-number">${p.jogos}</td>
                    <td class="table-number">${p.gols}</td>
                    <td class="table-number">${p.assistencias}</td>
                    <td>
                        <div class="table-actions">
                            ${
                                isAdmin
                                    ? `
                                    <button
                                        type="button"
                                        class="stats-edit-button"
                                        onclick="window.BrasilApp.openStatsModal('${p.id}')"
                                        title="Atualizar Jogos, Gols e Assistências"
                                    >
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="window.BrasilApp.toggleCall('${p.id}')"
                                        title="Desconvocar"
                                    >
                                        <i class="fa-solid fa-user-minus"></i>
                                    </button>
                                `
                                    : `<span style="font-size:9px;color:var(--green-light);font-weight:800;">CONVOCADO</span>`
                            }
                        </div>
                    </td>
                </tr>
            `
            )
            .join("");
    }

    function renderStatisticsSection() {
        const called = window.AppState.players.filter((p) => p.convocado);

        const games = called.reduce((sum, p) => sum + p.jogos, 0);
        const goals = called.reduce((sum, p) => sum + p.gols, 0);
        const assists = called.reduce((sum, p) => sum + p.assistencias, 0);

        if (DOM.statisticsGames) DOM.statisticsGames.textContent = games;
        if (DOM.statisticsGoals) DOM.statisticsGoals.textContent = goals;
        if (DOM.statisticsAssists) DOM.statisticsAssists.textContent = assists;

        const renderRanking = (container, sortedList, field, suffix) => {
            if (!container) return;
            const valid = sortedList.filter((p) => p[field] > 0).slice(0, 5);

            if (valid.length === 0) {
                container.innerHTML = `<div class="empty-state"><p>Nenhum dado disponível.</p></div>`;
                return;
            }

            container.innerHTML = valid
                .map(
                    (p, idx) => `
                    <div class="ranking-item">
                        <span class="ranking-position">${idx + 1}º</span>
                        <span class="ranking-player">${escapeHTML(p.nome)}</span>
                        <span class="ranking-value">${p[field]} ${suffix}</span>
                    </div>`
                )
                .join("");
        };

        renderRanking(
            DOM.topScorers,
            [...called].sort((a, b) => b.gols - a.gols),
            "gols",
            "G"
        );
        renderRanking(
            DOM.topAssists,
            [...called].sort((a, b) => b.assistencias - a.assistencias),
            "assistencias",
            "A"
        );
        renderRanking(
            DOM.topGames,
            [...called].sort((a, b) => b.jogos - a.jogos),
            "jogos",
            "J"
        );
    }

    function renderTrophiesSection() {
        const trophies = window.AppState.trophies;
        const totalCups = trophies.reduce((sum, t) => sum + Number(t.quantidade || 1), 0);

        if (DOM.trophyTypes) DOM.trophyTypes.textContent = trophies.length;
        if (DOM.trophyTotal) DOM.trophyTotal.textContent = totalCups;

        if (!DOM.trophiesGrid) return;

        if (trophies.length === 0) {
            DOM.trophiesGrid.innerHTML = `
                <div class="empty-state full-width">
                    <i class="fa-solid fa-trophy"></i>
                    <h3>Nenhuma conquista cadastrada</h3>
                    <p>A história de títulos aparecerá aqui.</p>
                </div>`;
            return;
        }

        const isAdmin = window.AppState.isAdmin;

        DOM.trophiesGrid.innerHTML = trophies
            .map((t) => {
                const seasonsArray = String(t.temporadas || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);

                const seasonsHTML = seasonsArray
                    .map((s) => `<span class="season-tag">${escapeHTML(s)}</span>`)
                    .join("");

                return `
                    <article class="trophy-card">
                        <div class="trophy-card-top">
                            <div class="trophy-image">
                                ${
                                    t.imagem
                                        ? `<img src="${escapeHTML(t.imagem)}" alt="${escapeHTML(t.nome)}">`
                                        : `<i class="fa-solid fa-trophy trophy-placeholder"></i>`
                                }
                            </div>
                            <span class="trophy-quantity">${t.quantidade}x CAMPEÃO</span>
                        </div>

                        <h3>${escapeHTML(t.nome)}</h3>
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
                                        onclick="window.BrasilApp.openEditTrophy('${t.id}')"
                                        title="Editar título"
                                    >
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="window.BrasilApp.deleteTrophy('${t.id}')"
                                        title="Excluir título"
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

    function renderAdminLists() {
        if (DOM.adminPlayersList) {
            if (window.AppState.players.length === 0) {
                DOM.adminPlayersList.innerHTML = `<p style="font-size:10px;color:var(--text-muted);padding:10px 0;">Nenhum jogador cadastrado.</p>`;
            } else {
                DOM.adminPlayersList.innerHTML = window.AppState.players
                    .map(
                        (p) => `
                        <div class="admin-player-row">
                            <div class="player-avatar">${escapeHTML(p.nome.charAt(0).toUpperCase())}</div>
                            <div>
                                <strong>${escapeHTML(p.nome)} ${p.convocado ? "✅" : ""}</strong>
                                <small>${escapeHTML(p.posicao)} • ${p.jogos}J | ${p.gols}G | ${p.assistencias}A</small>
                            </div>
                            <button type="button" class="stats-edit-button" onclick="window.BrasilApp.openStatsModal('${p.id}')" title="Estatísticas">
                                <i class="fa-solid fa-chart-simple"></i>
                            </button>
                            <button type="button" class="edit-button" onclick="window.BrasilApp.openEditPlayer('${p.id}')" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="delete-button" onclick="window.BrasilApp.deletePlayer('${p.id}')" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>`
                    )
                    .join("");
            }
        }

        if (DOM.adminTrophiesList) {
            if (window.AppState.trophies.length === 0) {
                DOM.adminTrophiesList.innerHTML = `<p style="font-size:10px;color:var(--text-muted);padding:10px 0;">Nenhum título cadastrado.</p>`;
            } else {
                DOM.adminTrophiesList.innerHTML = window.AppState.trophies
                    .map(
                        (t) => `
                        <div class="admin-trophy-row">
                            <div class="player-avatar yellow"><i class="fa-solid fa-trophy"></i></div>
                            <div>
                                <strong>${escapeHTML(t.nome)} (${t.quantidade}x)</strong>
                                <small>Temporadas: ${escapeHTML(t.temporadas)}</small>
                            </div>
                            <button type="button" class="edit-button" onclick="window.BrasilApp.openEditTrophy('${t.id}')" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="delete-button" onclick="window.BrasilApp.deleteTrophy('${t.id}')" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>`
                    )
                    .join("");
            }
        }
    }

    // =========================================================
    // 10. MÉTODOS PÚBLICOS (PARA ONCLICK E OUTROS MÓDULOS JS)
    // =========================================================
    window.BrasilApp = {
        navigateTo,
        toggleCall: toggleCallPlayer,
        deletePlayer,
        deleteTrophy,

        openNewPlayer() {
            if (!requireAdmin()) return;
            DOM.playerForm.reset();
            DOM.playerId.value = "";
            if (DOM.playerModalTitle) DOM.playerModalTitle.textContent = "Adicionar jogador";
            openModal("playerModal");
        },

        openEditPlayer(playerId) {
            if (!requireAdmin()) return;
            const p = window.AppState.players.find((item) => String(item.id) === String(playerId));
            if (!p) return;

            DOM.playerId.value = p.id;
            DOM.playerName.value = p.nome;
            DOM.playerPosition.value = p.posicao;
            DOM.playerNumber.value = p.numero || "";
            DOM.playerGames.value = p.jogos;
            DOM.playerGoals.value = p.gols;
            DOM.playerAssists.value = p.assistencias;

            if (DOM.playerModalTitle) DOM.playerModalTitle.textContent = "Editar jogador";
            openModal("playerModal");
        },

        openStatsModal(playerId) {
            if (!requireAdmin()) return;
            const p = window.AppState.players.find((item) => String(item.id) === String(playerId));
            if (!p) return;

            DOM.statsPlayerId.value = p.id;
            if (DOM.statsPlayerName) DOM.statsPlayerName.textContent = `${p.nome} (${p.posicao})`;
            DOM.statsGames.value = p.jogos;
            DOM.statsGoals.value = p.gols;
            DOM.statsAssists.value = p.assistencias;

            openModal("statsModal");
        },

        openNewTrophy() {
            if (!requireAdmin()) return;
            DOM.trophyForm.reset();
            DOM.trophyId.value = "";
            if (DOM.trophyImagePreview) {
                DOM.trophyImagePreview.style.display = "none";
                DOM.trophyImagePreview.innerHTML = "";
            }
            if (DOM.trophyModalTitle) DOM.trophyModalTitle.textContent = "Adicionar título";
            openModal("trophyModal");
        },

        openEditTrophy(trophyId) {
            if (!requireAdmin()) return;
            const t = window.AppState.trophies.find((item) => String(item.id) === String(trophyId));
            if (!t) return;

            DOM.trophyId.value = t.id;
            DOM.trophyName.value = t.nome;
            DOM.trophyQuantity.value = t.quantidade;
            DOM.trophySeasons.value = t.temporadas;

            if (DOM.trophyImagePreview) {
                if (t.imagem) {
                    DOM.trophyImagePreview.style.display = "flex";
                    DOM.trophyImagePreview.innerHTML = `<img src="${escapeHTML(t.imagem)}" alt="Prévia">`;
                } else {
                    DOM.trophyImagePreview.style.display = "none";
                    DOM.trophyImagePreview.innerHTML = "";
                }
            }

            if (DOM.trophyModalTitle) DOM.trophyModalTitle.textContent = "Editar título";
            openModal("trophyModal");
        }
    };

    // =========================================================
    // 11. EVENTOS E INICIALIZAÇÃO
    // =========================================================
    function bindEvents() {
        // Navegação (Sidebar, Topbar 3 Pontinhos, Atalhos de cards)
        document.addEventListener("click", (e) => {
            const navBtn = e.target.closest("[data-section]");
            if (navBtn) {
                e.preventDefault();
                navigateTo(navBtn.dataset.section);
                return;
            }

            // Fechar modais pelo botão X ou Cancelar
            const closeBtn = e.target.closest("[data-close]");
            if (closeBtn) {
                closeModal(closeBtn.dataset.close);
                return;
            }

            // Fechar modal clicando fora da caixa
            if (e.target.classList.contains("modal-overlay")) {
                e.target.classList.remove("active");
            }

            // Fechar menu 3 pontinhos ao clicar fora
            if (DOM.moreMenu && !e.target.closest("#moreMenu") && !e.target.closest("#topbarMore")) {
                closeMoreMenu();
            }
        });

        // Menu Mobile Lateral
        if (DOM.menuToggle) DOM.menuToggle.addEventListener("click", openMobileSidebar);
        if (DOM.closeSidebar) DOM.closeSidebar.addEventListener("click", closeMobileSidebar);
        if (DOM.sidebarOverlay) DOM.sidebarOverlay.addEventListener("click", closeMobileSidebar);

        // Menu 3 Pontinhos (Topbar Mobile & Desktop)
        if (DOM.topbarMore) DOM.topbarMore.addEventListener("click", toggleMoreMenu);

        // Acesso Admin (Sem forçar tela de login inicial; abre modal só ao clicar)
        const handleAdminAccessClick = () => {
            closeMobileSidebar();
            closeMoreMenu();
            if (window.AppState.isAdmin) {
                navigateTo("admin");
            } else {
                openModal("adminModal");
            }
        };

        if (DOM.adminAccess) DOM.adminAccess.addEventListener("click", handleAdminAccessClick);
        if (DOM.moreAdmin) DOM.moreAdmin.addEventListener("click", handleAdminAccessClick);
        if (DOM.adminLoginBtn) DOM.adminLoginBtn.addEventListener("click", () => openModal("adminModal"));
        if (DOM.adminLogoutBtn) DOM.adminLogoutBtn.addEventListener("click", () => setAdminState(false, true));

        // Atalhos da Área Administrativa
        if (DOM.addPlayerBtn) DOM.addPlayerBtn.addEventListener("click", () => window.BrasilApp.openNewPlayer());
        if (DOM.adminAddPlayer) DOM.adminAddPlayer.addEventListener("click", () => window.BrasilApp.openNewPlayer());
        if (DOM.addTrophyBtn) DOM.addTrophyBtn.addEventListener("click", () => window.BrasilApp.openNewTrophy());
        if (DOM.adminAddTrophy) DOM.adminAddTrophy.addEventListener("click", () => window.BrasilApp.openNewTrophy());
        if (DOM.adminManageStats) DOM.adminManageStats.addEventListener("click", () => navigateTo("convocados"));

        // Formulários
        if (DOM.adminLoginForm) DOM.adminLoginForm.addEventListener("submit", handleAdminLogin);
        if (DOM.playerForm) DOM.playerForm.addEventListener("submit", savePlayer);
        if (DOM.statsForm) DOM.statsForm.addEventListener("submit", savePlayerStats);
        if (DOM.trophyForm) DOM.trophyForm.addEventListener("submit", saveTrophy);

        // Preview da Imagem do Troféu ao selecionar arquivo
        if (DOM.trophyImage) {
            DOM.trophyImage.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (file && DOM.trophyImagePreview) {
                    const src = await readImageAsBase64(file);
                    DOM.trophyImagePreview.style.display = "flex";
                    DOM.trophyImagePreview.innerHTML = `<img src="${src}" alt="Prévia do troféu">`;
                }
            });
        }

        // Filtros de Jogadores
        if (DOM.playerSearch) DOM.playerSearch.addEventListener("input", renderPlayersGrid);
        if (DOM.positionFilter) DOM.positionFilter.addEventListener("change", renderPlayersGrid);
        if (DOM.callFilter) DOM.callFilter.addEventListener("change", renderPlayersGrid);

        // Modal de Confirmação
        if (DOM.cancelConfirm) {
            DOM.cancelConfirm.addEventListener("click", () => {
                window.AppState.pendingConfirmCallback = null;
                closeModal("confirmModal");
            });
        }

        if (DOM.confirmAction) {
            DOM.confirmAction.addEventListener("click", async () => {
                const cb = window.AppState.pendingConfirmCallback;
                window.AppState.pendingConfirmCallback = null;
                closeModal("confirmModal");
                if (typeof cb === "function") await cb();
            });
        }
    }

    // =========================================================
    // 12. BOOT DO SISTEMA
    // =========================================================
    document.addEventListener("DOMContentLoaded", () => {
        if (DOM.currentYear) {
            DOM.currentYear.textContent = new Date().getFullYear();
        }

        preventMobileZoom();
        checkAdminSession();
        bindEvents();
        loadInitialData();
    });
})();