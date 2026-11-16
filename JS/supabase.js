/* =========================================================
   BRASIL — SELEÇÃO BRASILEIRA
   SUPABASE.JS | CONEXÃO, BANCO DE DADOS E TEMPO REAL
========================================================= */

(() => {
    "use strict";

    // =========================================================
    // 1. CREDENCIAIS DO PROJETO SUPABASE
    // =========================================================
    const SUPABASE_CONFIG = {
        URL: "https://iiabulubutkcsxpqbazw.supabase.co",
        PUBLISHABLE_KEY: "sb_publishable_N8TbqsocEQUiUlQsivKwRg_0rMr_CNI",
        TABLES: {
            PLAYERS: "jogadores",
            TROPHIES: "trofeus"
        }
    };

    let client = null;
    let realtimeChannel = null;

    // =========================================================
    // 2. INICIALIZAÇÃO DO CLIENTE
    // =========================================================
    function getClient() {
        if (client) return client;

        if (window.supabase && typeof window.supabase.createClient === "function") {
            client = window.supabase.createClient(
                SUPABASE_CONFIG.URL,
                SUPABASE_CONFIG.PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false
                    },
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    }
                }
            );
            window.supabaseClient = client;
            return client;
        }

        console.warn("⚠️ SDK do Supabase (@supabase/supabase-js) não encontrado no HTML.");
        return null;
    }

    // =========================================================
    // 3. TESTE DE CONEXÃO E BUSCA DE DADOS
    // =========================================================
    async function testConnection() {
        const sb = getClient();
        if (!sb) return false;

        try {
            const { error } = await sb
                .from(SUPABASE_CONFIG.TABLES.PLAYERS)
                .select("id")
                .limit(1);

            return !error;
        } catch (err) {
            console.error("Erro ao testar conexão com Supabase:", err);
            return false;
        }
    }

    async function fetchPlayers() {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.PLAYERS)
            .select("*")
            .order("nome", { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async function fetchTrophies() {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.TROPHIES)
            .select("*")
            .order("id", { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // =========================================================
    // 4. OPERAÇÕES DE JOGADORES (CRUD)
    // =========================================================
    async function insertPlayer(playerData) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.PLAYERS)
            .insert([playerData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function updatePlayer(id, updates) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.PLAYERS)
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function deletePlayer(id) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { error } = await sb
            .from(SUPABASE_CONFIG.TABLES.PLAYERS)
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }

    // =========================================================
    // 5. OPERAÇÕES DE TROFÉUS (CRUD)
    // =========================================================
    async function insertTrophy(trophyData) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.TROPHIES)
            .insert([trophyData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function updateTrophy(id, updates) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { data, error } = await sb
            .from(SUPABASE_CONFIG.TABLES.TROPHIES)
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function deleteTrophy(id) {
        const sb = getClient();
        if (!sb) throw new Error("Cliente Supabase indisponível.");

        const { error } = await sb
            .from(SUPABASE_CONFIG.TABLES.TROPHIES)
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }

    // =========================================================
    // 6. SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
    // =========================================================
    function subscribeRealtime({ onPlayersChange, onTrophiesChange, onStatusChange }) {
        const sb = getClient();
        if (!sb) return null;

        // Evita canais duplicados
        if (realtimeChannel) {
            sb.removeChannel(realtimeChannel);
        }

        realtimeChannel = sb
            .channel("selecao-brasileira-live")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: SUPABASE_CONFIG.TABLES.PLAYERS
                },
                (payload) => {
                    if (typeof onPlayersChange === "function") {
                        onPlayersChange(payload);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: SUPABASE_CONFIG.TABLES.TROPHIES
                },
                (payload) => {
                    if (typeof onTrophiesChange === "function") {
                        onTrophiesChange(payload);
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    console.error("Erro no canal Realtime:", status, err);
                }
                if (typeof onStatusChange === "function") {
                    onStatusChange(status === "SUBSCRIBED", status);
                }
            });

        return realtimeChannel;
    }

    // =========================================================
    // 7. EXPORTAÇÃO GLOBAL PARA OS DEMAIS MÓDULOS
    // =========================================================
    getClient();

    window.SupabaseService = {
        config: SUPABASE_CONFIG,
        getClient,
        testConnection,
        fetchPlayers,
        fetchTrophies,
        insertPlayer,
        updatePlayer,
        deletePlayer,
        insertTrophy,
        updateTrophy,
        deleteTrophy,
        subscribeRealtime
    };
})();