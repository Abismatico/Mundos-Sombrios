(function () {
    const config = window.MS_DB_CONFIG || {
  url: 'https://mectcbsmhmyefsllbope.supabase.co',
  anonKey: 'sb_publishable_b_MyJE3_glRlR5VEyFCZ4g_ZU3xzkeS'
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

        async adminExists() {
            const { data, error } = await supabase.rpc('admin_exists');
            return { data: !!data, error };
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

        async fetchMyTables() {
            const { data, error } = await supabase.from(tableNames.tables).select('*').order('updated_at', { ascending: false });
            return { data: Array.isArray(data) ? data : [], error };
        },

        async publishTableEvent(tableId, eventType, payload = {}) {
            const { data, error } = await supabase.from(tableNames.table_events).insert({
                table_id: String(tableId), event_type: String(eventType), payload: payload || {}
            }).select().maybeSingle();
            return { data, error };
        },

        async fetchTableEvents(tableId, limit = 200) {
            const { data, error } = await supabase.from(tableNames.table_events).select('*').eq('table_id', String(tableId)).order('created_at', { ascending: true }).limit(limit);
            return { data: Array.isArray(data) ? data : [], error };
        },

        subscribeTable(tableId, handler) {
            const channel = supabase.channel(`table:${String(tableId)}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableNames.table_events, filter: `table_id=eq.${String(tableId)}` }, payload => {
                    try { handler(payload?.new || null); } catch (e) { console.warn('[Mundos Sombrios] handler Realtime:', e); }
                })
                .subscribe();
            return () => { try { supabase.removeChannel(channel); } catch (_) {} };
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

        async saveTable(table) {
            const payload = normalizeTablePayload(table);
            if (!payload) return null;
            const { data, error } = await runQuery(tableNames.tables, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'id' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveTable falhou:', error);
            return data && data[0] ? data[0] : null;
        },

        async fetchTables() {
            const { data, error } = await runQuery(tableNames.tables, (tableName) =>
                supabase.from(tableName).select('*').order('updated_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
        },

        async saveCharacter(character) {
            const payload = normalizeCharacterPayload(character);
            if (!payload) return null;
            const { data, error } = await runQuery(tableNames.characters, (tableName) =>
                supabase.from(tableName).upsert(payload, { onConflict: 'id' }).select()
            );
            if (error) console.warn('[Mundos Sombrios] saveCharacter falhou:', error);
            return data && data[0] ? data[0] : null;
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

        async fetchPosts() {
            const { data, error } = await runQuery(tableNames.posts, (tableName) =>
                supabase.from(tableName).select('*').order('created_at', { ascending: false })
            );
            if (error) return [];
            return Array.isArray(data) ? data : [];
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
            if (!snapshot) return null;
            const tasks = [];
            const session = await this.getSession();
            if (session.user && snapshot.currentUser) tasks.push(this.saveProfile(snapshot.currentUser));
            if (session.user && Array.isArray(snapshot.characters)) {
                for (const character of snapshot.characters) {
                    if (String(character.userId || character.ownerId || '') === String(session.user.id)) tasks.push(this.saveCharacter(character));
                }
            }
            const results = await Promise.allSettled(tasks);
            return results;
        }
    };

    window.MS_DB = api;
})();
