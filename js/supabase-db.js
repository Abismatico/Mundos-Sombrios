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
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const tableNames = {
        profiles: 'profiles',
        tables: 'tables',
        characters: 'characters',
        admin_requests: 'admin_requests',
        site_content: 'site_content',
        posts: 'posts',
        site_settings: 'site_settings'
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
            password_hash: user.passwordHash || user.password_hash || null,
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

    const api = {
        ready: true,
        enabled: true,
        client: supabase,

        async saveProfile(profile) {
            const payload = normalizeUserPayload(profile);
            if (!payload) return null;
            const { data, error } = await runQuery(tableNames.profiles, (table) => 
                supabase.from(table).upsert(payload, { onConflict: 'id' }).select()
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
            const payload = {
                id: String(post.id || 'post-' + Date.now()),
                slug: String(post.slug || post.id || 'post-' + Date.now()),
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

        async syncUserState(snapshot) {
            if (!snapshot || !snapshot.users) return null;
            const tasks = [];
            for (const profile of snapshot.users) {
                tasks.push(this.saveProfile(profile));
            }
            if (Array.isArray(snapshot.tables)) {
                for (const table of snapshot.tables) {
                    tasks.push(this.saveTable(table));
                }
            }
            if (Array.isArray(snapshot.characters)) {
                for (const character of snapshot.characters) {
                    tasks.push(this.saveCharacter(character));
                }
            }
            if (Array.isArray(snapshot.requests)) {
                for (const request of snapshot.requests) {
                    tasks.push(this.saveAdminRequest(request));
                }
            }
            const results = await Promise.allSettled(tasks);
            return results;
        }
    };

    window.MS_DB = api;
})();
