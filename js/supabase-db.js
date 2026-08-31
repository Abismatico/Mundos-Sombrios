(function () {
    const config = window.MS_DB_CONFIG || {
  url: 'https://xhcunksjrksdzdtabfxt.supabase.co',
  anonKey: 'sb_publishable_Yq3SDfQEaX_vxdZKvADyMQ_evvVDqdi'
};

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('[Mundos Sombrios] Supabase SDK indisponível. Persistência online desativada.');
        window.MS_DB = {
            ready: false,
            enabled: false,
            async saveProfile() { return null; },
            async saveTable() { return null; },
            async saveCharacter() { return null; },
            async saveAdminRequest() { return null; },
            async fetchUsers() { return []; },
            async fetchTables() { return []; },
            async fetchCharacters() { return []; },
            async fetchAdminRequests() { return []; }
        };
        return;
    }

    const supabase = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    const activeRealtimeChannels = new Map();

    const tableNames = {
        profiles: 'profiles',
        tables: 'tables',
        characters: 'characters',
        admin_requests: 'admin_requests',
        site_content: 'site_content',
        posts: 'posts',
        site_settings: 'site_settings',
        table_members: 'table_members',
        table_state: 'table_state',
        table_events: 'table_events',
        gm_notes: 'gm_notes',
        gm_npcs: 'gm_npcs',
        gm_files: 'gm_files'
    };

    async function runQuery(table, action, payload) {
        try {
            const result = await action(table, payload);
            return result;
        } catch (error) {
            console.warn('[Mundos Sombrios] Falha no banco online:', table, error);
            return { data: null, error };
        }
    }

    function normalizeUserPayload(user) {
        if (!user) return null;
        const banned = !!(user.banned || user.isBanned || user.status === 'banned');
        const status = String(user.status || (banned ? 'banned' : 'active')).trim() || 'active';
        const payload = {
            id: String(user.id || 'u-' + Date.now()),
            username: String(user.username || '').trim(),
            email: String(user.email || '').trim(),
            role: user.role || 'jogador',
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            banned,
            status
        };
        if (user.data && typeof user.data === 'object' && Object.keys(user.data).length) {
            payload.data = user.data;
        }
        return payload;
    }

    function normalizeTablePayload(table) {
        if (!table) return null;
        return {
            id: String(table.id || 't-' + Date.now()),
            code: String(table.code || '').toUpperCase(),
            name: String(table.name || 'Fenda sem nome'),
            theme: table.theme || 'default',
            game_mode: table.gameMode || 'exodo',
            owner_id: String(table.ownerId || 'system'),
            participants: Array.isArray(table.participants) ? table.participants : [],
            banned: Array.isArray(table.banned) ? table.banned : [],
            created_at: table.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            settings: table.settings || {}
        };
    }

    function normalizeCharacterPayload(character) {
        if (!character) return null;
        return {
            id: String(character.id || 'c-' + Date.now()),
            owner_id: String(character.ownerId || 'system'),
            user_id: String(character.userId || character.ownerId || 'system'),
            name: String(character.name || 'Alma sem nome'),
            mode: character.mode || 'exodo',
            nature: character.nature || '',
            class_name: character.className || '',
            payload: character,
            created_at: character.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    supabase.auth.onAuthStateChange((event, session) => {
        window.dispatchEvent(new CustomEvent('ms-auth-state', { detail: { event, session, user: session?.user || null } }));
    });

    const api = {
        ready: true,
        enabled: true,
        client: supabase,

        async getSession() {
            const { data, error } = await supabase.auth.getSession();
            return { session: data?.session || null, user: data?.session?.user || null, error: error || null };
        },

        async signIn(identifier, password) {
            const value = String(identifier || '').trim();
            let email = value;
            if (!value.includes('@')) {
                const { data: resolvedEmail, error: lookupError } = await supabase.rpc('resolve_login_email', { p_identifier: value });
                if (lookupError) return { data: null, error: lookupError };
                email = resolvedEmail || '';
            }
            if (!email) return { data: null, error: new Error('Usuário não encontrado.') };
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            return { data, error };
        },

        async signUp({ username, email, password, requestMaster = false }) {
            const { data, error } = await supabase.auth.signUp({
                email: String(email || '').trim(),
                password: String(password || ''),
                options: { data: { username: String(username || '').trim(), request_master: !!requestMaster } }
            });
            if (!error && data?.user && data.user.identities?.length === 0) {
                return { data, error: new Error('Este e-mail já possui uma conta.') };
            }
            return { data, error };
        },

        async signOut() {
            return supabase.auth.signOut();
        },

        async resetPasswordForEmail(email, redirectTo) {
            return supabase.auth.resetPasswordForEmail(String(email || '').trim(), { redirectTo });
        },

        async updatePassword(password) {
            return supabase.auth.updateUser({ password: String(password || '') });
        },
        async fetchMyProfile() {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session?.user) return { data: null, error: sessionError || new Error('Sessão ausente.') };
            const authUser = sessionData.session.user;
            const { data, error } = await supabase.from(tableNames.profiles).select('*').eq('auth_user_id', authUser.id).maybeSingle();
            return { data: data || null, error: error || null };
        },

        async ensureMyProfile(profile = {}) {
            const session = await this.getSession();
            if (!session.user) return null;
            const payload = {
                auth_user_id: session.user.id,
                id: String(session.user.id),
                username: String(profile.username || session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'jogador').trim(),
                email: String(session.user.email || profile.email || '').trim(),
                data: profile.data && typeof profile.data === 'object' ? profile.data : {}
            };
            const { data, error } = await supabase.from(tableNames.profiles).upsert(payload, { onConflict: 'auth_user_id' }).select().maybeSingle();
            if (error) console.warn('[Mundos Sombrios] ensureMyProfile falhou:', error);
            return data || null;
        },

        async adminSetUserRole(userId, role) {
            const { data, error } = await supabase.rpc('admin_set_user_role', { p_user_id: String(userId), p_role: String(role) });
            return { data, error };
        },

        async adminUpdateUsername(userId, username) {
            const { data, error } = await supabase.rpc('admin_update_username', { p_user_id: String(userId), p_username: String(username || '').trim() });
            return { data, error };
        },

        async adminSetUserBanned(userId, banned) {
            const { data, error } = await supabase.rpc('admin_set_user_banned', { p_user_id: String(userId), p_banned: !!banned });
            return { data, error };
        },

        async createTableRemote(table) {
            const payload = normalizeTablePayload(table);
            const { data, error } = await supabase.rpc('create_table_secure', {
                p_id: payload.id, p_code: payload.code, p_name: payload.name, p_theme: payload.theme,
                p_game_mode: payload.game_mode, p_settings: payload.settings || {}
            });
            if (!error && data) return data;
            return { data: null, error };
        },

        async joinTableRemote(code, characterId) {
            const { data, error } = await supabase.rpc('join_table_secure', { p_code: String(code).toUpperCase(), p_character_id: characterId ? String(characterId) : null });
            return { data, error };
        },

        async leaveTableRemote(code) {
            const { data, error } = await supabase.rpc('leave_table_secure', { p_code: String(code).toUpperCase() });
            return { data, error };
        },

        async deleteTableSecure(tableId) {
            const { data, error } = await supabase.rpc('delete_table_secure', { p_table_id: String(tableId) });
            return { data, error };
        },

        async updateTableSettingsSecure(tableId, settings) {
            const { data, error } = await supabase.rpc('update_table_settings_secure', { p_table_id: String(tableId), p_settings: settings || {} });
            return { data, error };
        },

        async fetchTableRoster(tableId) {
            const { data, error } = await supabase.rpc('fetch_table_roster', { p_table_id: String(tableId) });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async fetchTableCharacters(tableId) {
            const { data, error } = await supabase.rpc('fetch_table_characters', { p_table_id: String(tableId) });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async setTableMemberStatus(tableId, userId, status) {
            const { data, error } = await supabase.rpc('set_table_member_status', { p_table_id: String(tableId), p_user_id: String(userId), p_status: String(status) });
            return { data, error };
        },

        async linkTableCharacter(tableId, characterId) {
            const { data, error } = await supabase.rpc('link_table_character', { p_table_id: String(tableId), p_character_id: String(characterId) });
            return { data, error };
        },

        async createTableInvite(tableId, expiresAt = null, maxUses = 0) {
            const { data, error } = await supabase.rpc('create_table_invite', { p_table_id: String(tableId), p_expires_at: expiresAt, p_max_uses: Number(maxUses) || 0 });
            return { data, error };
        },

        async fetchCampaign(tableId) {
            const { data, error } = await supabase.from('campaigns').select('*').eq('table_id', String(tableId)).maybeSingle();
            return { data: data || null, error };
        },

        async createCampaign(tableId, name, description = '') {
            const { data, error } = await supabase.from('campaigns').insert({ table_id: String(tableId), name: String(name || 'Campanha'), description: String(description || '') }).select().maybeSingle();
            return { data, error };
        },

        async fetchSessions(tableId) {
            const { data, error } = await supabase.from('game_sessions').select('*').eq('table_id', String(tableId)).order('created_at', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async createSession(tableId, title, campaignId = null) {
            const { data, error } = await supabase.from('game_sessions').insert({ table_id: String(tableId), campaign_id: campaignId, title: String(title || 'Sessão'), status: 'planned' }).select().maybeSingle();
            return { data, error };
        },

        async updateSessionStatus(sessionId, status) {
            const nextStatus = String(status);
            const patch = { status: nextStatus };
            if (nextStatus === 'active') patch.started_at = new Date().toISOString();
            if (nextStatus === 'ended') patch.ended_at = new Date().toISOString();
            const { data, error } = await supabase.from('game_sessions').update(patch).eq('id', String(sessionId)).select().maybeSingle();
            return { data, error };
        },

        async fetchMyTables() {
            const { data, error } = await supabase.from(tableNames.tables).select('*').order('updated_at', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async publishTableEvent(tableId, eventType, payload = {}) {
            const id = String(tableId);
            const actorId = String(window.currentUser?.id || '');
            const { data, error } = await supabase.from(tableNames.table_events).insert({
                table_id: id, event_type: String(eventType), payload: payload || {}, actor_id: actorId || null
            }).select().maybeSingle();
            if (error) return { data: null, error };
            try { await api.broadcastTableEvent(id, eventType, payload, { id: data?.id }); } catch (broadcastError) {
                console.warn('[Mundos Sombrios] Broadcast indisponível; evento persistido:', broadcastError);
            }
            return { data, error: null };
        },

        async fetchTableEvents(tableId, limit = 200) {
            const { data, error } = await supabase.from(tableNames.table_events).select('*').eq('table_id', String(tableId)).order('created_at', { ascending: true }).limit(limit);
            return { data: Array.isArray(data) ? data : [], error };
        },

        async subscribeTable(tableId, handlers = {}) {
            const id = String(tableId);
            const onEvent = typeof handlers === 'function' ? handlers : handlers?.event;
            const onPresence = typeof handlers?.presence === 'function' ? handlers.presence : null;
            if (!id) return () => {};
            if (activeRealtimeChannels.has(id)) {
                const existing = activeRealtimeChannels.get(id);
                existing.handlers.add({ onEvent, onPresence });
                onPresence?.(existing.channel.presenceState());
                return () => existing.handlers.delete([...existing.handlers].find(x => x.onEvent === onEvent && x.onPresence === onPresence));
            }
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session?.access_token && typeof supabase.realtime.setAuth === 'function') await supabase.realtime.setAuth(sessionData.session.access_token);
            } catch (_) {}
            const channel = supabase.channel(`ms:table:${id}`, { config: { private: true, broadcast: { ack: true, self: false }, presence: { key: String(window.currentUser?.id || 'anonymous') } } });
            const handlersSet = new Set([{ onEvent, onPresence }]);
            const notify = (fn, payload) => handlersSet.forEach(h => { try { h[fn]?.(payload); } catch (e) { console.warn('[Mundos Sombrios] Realtime handler:', e); } });
            channel.on('broadcast', { event: 'table:event' }, msg => notify('onEvent', msg?.payload || msg));
            channel.on('broadcast', { event: 'table:refresh' }, msg => notify('onEvent', { event_type: 'table_refresh', payload: msg?.payload || {} }));
            channel.on('presence', { event: 'sync' }, () => notify('onPresence', channel.presenceState()));
            channel.on('presence', { event: 'join' }, () => notify('onPresence', channel.presenceState()));
            channel.on('presence', { event: 'leave' }, () => notify('onPresence', channel.presenceState()));
            const status = await new Promise(resolve => {
                let done = false;
                channel.subscribe(st => { if (!done && ['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(st)) { done = true; resolve(st); } });
                setTimeout(() => { if (!done) { done = true; resolve('TIMED_OUT'); } }, 12000);
            });
            if (status !== 'SUBSCRIBED') { try { await supabase.removeChannel(channel); } catch (_) {} throw new Error(`Não foi possível conectar à mesa em tempo real (${status}).`); }
            activeRealtimeChannels.set(id, { channel, handlers: handlersSet });
            try { await channel.track({ user_id: String(window.currentUser?.id || ''), username: String(window.currentUser?.username || 'Jogador'), role: String(window.currentUser?.role || 'jogador'), online_at: new Date().toISOString() }); } catch (_) {}
            return () => {
                const current = activeRealtimeChannels.get(id);
                const first = current?.handlers;
                const target = [...(first || [])].find(x => x.onEvent === onEvent && x.onPresence === onPresence);
                if (target) first.delete(target);
                if (first && first.size === 0) { try { supabase.removeChannel(channel); } catch (_) {} activeRealtimeChannels.delete(id); }
            };
        },


        async broadcastTableEvent(tableId, eventType, payload, options = {}) {
            const id = String(tableId);
            if (!id) throw new Error('Mesa inválida.');
            const existing = activeRealtimeChannels.get(id);
            if (existing) {
                return existing.channel.send({ type: 'broadcast', event: 'table:event', payload: { id: options.id || null, table_id: id, event_type: String(eventType), payload: payload || {}, actor_id: String(window.currentUser?.id || ''), created_at: new Date().toISOString() } });
            }
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session?.access_token && typeof supabase.realtime.setAuth === 'function') await supabase.realtime.setAuth(sessionData.session.access_token);
            } catch (_) {}
            const channel = supabase.channel(`ms:table:${id}`, { config: { private: true, broadcast: { ack: true, self: false } } });
            try {
                const status = await new Promise(resolve => { let done=false; channel.subscribe(st=>{ if(!done&&['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(st)){done=true;resolve(st);} }); setTimeout(()=>{if(!done){done=true;resolve('TIMED_OUT');}},12000); });
                if (status !== 'SUBSCRIBED') throw new Error(`Canal da mesa indisponível (${status}).`);
                return await channel.send({ type: 'broadcast', event: 'table:event', payload: { id: options.id || null, table_id: id, event_type: String(eventType), payload: payload || {}, actor_id: String(window.currentUser?.id || ''), created_at: new Date().toISOString() } });
            } finally { try { await supabase.removeChannel(channel); } catch (_) {} }
        },

        async saveTableState(tableId, state) {
            const { data, error } = await supabase.from(tableNames.table_state).upsert({ table_id: String(tableId), state: state || {} }, { onConflict: 'table_id' }).select().maybeSingle();
            return { data, error };
        },

        async fetchTableState(tableId) {
            const { data, error } = await supabase.from(tableNames.table_state).select('state').eq('table_id', String(tableId)).maybeSingle();
            return { data: data?.state || null, error };
        },

        async saveGMNote(tableId, note) {
            const { data, error } = await supabase.from(tableNames.gm_notes).upsert({ id: String(note.id), table_id: String(tableId), payload: note }, { onConflict: 'id' }).select().maybeSingle();
            return { data, error };
        },

        async deleteGMNote(noteId) {
            const { data, error } = await supabase.from(tableNames.gm_notes).delete().eq('id', String(noteId));
            return { data, error };
        },

        async fetchGMNotes(tableId) {
            const { data, error } = await supabase.from(tableNames.gm_notes).select('payload').eq('table_id', String(tableId)).order('updated_at', { ascending: false });
            return { data: (data || []).map(row => row.payload).filter(Boolean), error };
        },

        async saveGMNpc(tableId, npc) {
            const { data, error } = await supabase.from(tableNames.gm_npcs).upsert({ id: String(npc.id), table_id: String(tableId), payload: npc }, { onConflict: 'id' }).select().maybeSingle();
            return { data, error };
        },

        async deleteGMNpc(npcId) {
            const { data, error } = await supabase.from(tableNames.gm_npcs).delete().eq('id', String(npcId));
            return { data, error };
        },

        async fetchGMNpcs(tableId) {
            const { data, error } = await supabase.from(tableNames.gm_npcs).select('payload').eq('table_id', String(tableId)).order('updated_at', { ascending: false });
            return { data: (data || []).map(row => row.payload).filter(Boolean), error };
        },

        async uploadGMFile(tableId, file) {
            const session = await this.getSession();
            if (!session.user) return { data: null, error: new Error('Sessão ausente.') };
            const safe = String(file.name || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${session.user.id}/${String(tableId)}/${Date.now()}-${safe}`;
            const { data: upload, error: uploadError } = await supabase.storage.from('gm-assets').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
            if (uploadError) return { data: null, error: uploadError };
            const { data, error } = await supabase.from(tableNames.gm_files).insert({ table_id: String(tableId), path, name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size || 0 }).select().maybeSingle();
            return { data, error };
        },

        async fetchGMFiles(tableId) {
            const { data, error } = await supabase.from(tableNames.gm_files).select('*').eq('table_id', String(tableId)).order('created_at', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async createSignedGMFileUrl(path, expiresIn = 3600) {
            const { data, error } = await supabase.storage.from('gm-assets').createSignedUrl(String(path), expiresIn);
            return { data, error };
        },

        async deleteGMFile(id, path) {
            const { error: storageError } = await supabase.storage.from('gm-assets').remove([String(path)]);
            const { data, error } = await supabase.from(tableNames.gm_files).delete().eq('id', String(id));
            return { data, error: error || storageError || null };
        },

        async saveProfile(profile) {
            const session = await this.getSession();
            if (!session.user) return null;
            const payload = {
                auth_user_id: session.user.id,
                id: String(session.user.id),
                username: String(profile?.username || session.user.user_metadata?.username || session.user.email?.split('@')[0] || '').trim(),
                email: String(session.user.email || profile?.email || '').trim(),
                data: profile?.data && typeof profile.data === 'object' ? profile.data : {}
            };
            const { data, error } = await runQuery(tableNames.profiles, (table) =>
                supabase.from(table).upsert(payload, { onConflict: 'auth_user_id' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveProfile falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async fetchUsers() {
            const { data, error } = await runQuery(tableNames.profiles, (table) =>
                supabase.from(table).select('*').order('created_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async updateCharacterAsGM(tableId, character) {
            if (!tableId || !character?.id) return null;
            const { data, error } = await supabase.rpc('gm_update_character', {
                p_table_id: String(tableId),
                p_character_id: String(character.id),
                p_name: String(character.name || ''),
                p_mode: String(character.mode || 'exodo'),
                p_nature: character.nature || null,
                p_class_name: character.className || null,
                p_payload: character
            });
            if (error) {
                console.warn('[Mundos Sombrios] updateCharacterAsGM falhou:', error);
                return null;
            }
            return data || null;
        },

        async fetchMyCharacters() {
            const session = await this.getSession();
            if (!session.user) return { data: [], error: new Error('Sessão ausente.') };
            const { data, error } = await supabase.from(tableNames.characters).select('*').eq('user_id', session.user.id).order('updated_at', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async saveCharacter(character) {
            const payload = normalizeCharacterPayload(character);
            if (!payload) return null;
            const { data, error } = await supabase.rpc('save_character_secure', {
                p_id: payload.id, p_name: payload.name, p_mode: payload.mode, p_nature: payload.nature || null,
                p_class_name: payload.class_name || null, p_payload: payload.payload || {}
            });
            if (error) console.warn('[Mundos Sombrios] saveCharacter falhou:', error);
            return data || null;
        },

        async deleteMyCharacter(characterId) {
            const { data, error } = await supabase.rpc('delete_my_character', { p_character_id: String(characterId) });
            return { data, error };
        },

        async fetchCharacterVersions(characterId) {
            const { data, error } = await supabase.from('character_versions').select('*').eq('character_id', String(characterId)).order('version_no', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async restoreCharacterVersion(characterId, versionId) {
            const { data, error } = await supabase.rpc('restore_character_version', { p_character_id: String(characterId), p_version_id: String(versionId) });
            return { data, error };
        },

        async fetchCharacters() {
            const { data, error } = await runQuery(tableNames.characters, (tableName) =>
                supabase.from(tableName).select('*').order('updated_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async saveAdminRequest(request) {
            if (!request) return null;
            const payload = {
                id: String(request.id || 'req-' + Date.now()),
                user_id: String(request.userId || request.user_id || 'system'),
                username: String(request.username || 'desconhecido'),
                status: request.status || 'pending',
                created_at: request.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            if (request.data && typeof request.data === 'object' && Object.keys(request.data).length) {
                payload.data = request.data;
            }
            const { data, error } = await runQuery(tableNames.admin_requests, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'id' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveAdminRequest falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async fetchAdminRequests() {
            const { data, error } = await runQuery(tableNames.admin_requests, (tableName) =>
                supabase.from(tableName).select('*').order('created_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async saveSiteContent(content, key = 'portal-official') {
            if (!content || typeof content !== 'object') return null;
            const payload = {
                key: String(key),
                content: content,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await runQuery(tableNames.site_content, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'key' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveSiteContent falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async fetchSiteContent(key = 'portal-official') {
            const { data, error } = await runQuery(tableNames.site_content, (tableName) =>
                supabase.from(tableName).select('*').eq('key', String(key)).maybeSingle()
            );
            if (error) return null;
            if (!data) return null;
            return data.content && typeof data.content === 'object' ? data.content : {};
        },

        async savePost(post) {
            if (!post) return null;
            const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            const id = String(post.id || 'post-' + suffix);
            const rawSlug = String(post.slug || post.id || 'post-' + suffix).trim();
            const slug = rawSlug
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'post-' + suffix;
            const payload = {
                id,
                slug: `${slug}-${suffix}`,
                type: String(post.type || 'post'),
                title: String(post.title || 'Post sem título'),
                subtitle: post.subtitle || '',
                summary: post.summary || '',
                body: post.body || '',
                category: post.category || '',
                world: post.world || '',
                status: post.status || 'draft',
                published: !!post.published,
                metadata: post.metadata || {},
                created_at: post.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await runQuery(tableNames.posts, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'id' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] savePost falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async deletePost(id) {
            if (!id) return false;
            const { error } = await runQuery(tableNames.posts, (tableName) =>
                supabase.from(tableName).delete().eq('id', String(id))
            );
            if (error) { console.warn('[Mundos Sombrios] deletePost falhou:', error); return false; }
            return true;
        },

        async fetchPosts() {
            const { data, error } = await runQuery(tableNames.posts, (tableName) =>
                supabase.from(tableName).select('*').order('created_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async fetchMapPoints() {
            const rows = await this.fetchSiteSettings();
            const row = rows.find(x => x.key === 'master_shield_map_points');
            return Array.isArray(row?.value?.points) ? row.value.points : null;
        },

        async saveSiteSetting(key, value) {
            const payload = {
                key: String(key),
                value: value ?? {},
                updated_at: new Date().toISOString()
            };
            const { data, error } = await runQuery(tableNames.site_settings, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'key' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveSiteSetting falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async fetchSiteSettings() {
            const { data, error } = await runQuery(tableNames.site_settings, (tableName) =>
                supabase.from(tableName).select('*').order('updated_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async uploadPortalMedia(file) {
            if (!file || typeof file === 'undefined') return null;
            const type = String(file.type || '').toLowerCase();
            const kind = type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : null;
            if (!kind) throw new Error('Selecione uma imagem ou vídeo válido.');
            const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            const safeName = String(file.name || `${kind}-${suffix}`).replace(/\s+/g, '-');
            const path = `portal-media/${suffix}-${safeName}`;
            const { data, error } = await supabase.storage.from('portal-media').upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'application/octet-stream'
            });
            if (error) {
                console.warn('[Mundos Sombrios] uploadPortalMedia falhou:', error);
                return null;
            }
            const publicUrl = supabase.storage.from('portal-media').getPublicUrl(path).data?.publicUrl || '';
            return {
                id: path,
                path,
                name: safeName,
                kind,
                type,
                url: publicUrl,
                createdAt: new Date().toISOString()
            };
        },

        async removePortalMedia(path) {
            if (!path) return true;
            try {
                const { error } = await supabase.storage.from('portal-media').remove([String(path)]);
                if (error) {
                    console.warn('[Mundos Sombrios] removePortalMedia falhou:', error);
                    return false;
                }
                return true;
            } catch (error) {
                console.warn('[Mundos Sombrios] removePortalMedia falhou:', error);
                return false;
            }
        },

        async getPortalMediaUrl(path) {
            if (!path) return '';
            try {
                const { data } = supabase.storage.from('portal-media').getPublicUrl(String(path));
                return data?.publicUrl || '';
            } catch (error) {
                console.warn('[Mundos Sombrios] getPortalMediaUrl falhou:', error);
                return '';
            }
        },

        async syncUserState(snapshot) {
            // Login/hidratação é uma operação de leitura. Não regravamos fichas automaticamente,
            // pois isso criaria versões artificiais sem que o jogador tivesse alterado o personagem.
            if (!snapshot) return null;
            const session = await this.getSession();
            if (session.user && snapshot.currentUser) return this.saveProfile(snapshot.currentUser);
            return null;
        }
    };

    window.MS_DB = api;
})();
