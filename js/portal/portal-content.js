/* Mundos Sombrios — Portal Oficial / Conteúdo V2.0 (Supabase-first)
   Fonte única de conteúdo público. NÃO possui posts/anúncios hardcoded.
   Tudo vem de public.site_content (blocos fixos: hero/featured) e
   public.posts (anúncios, eventos, classes, expansões, comunidade,
   histórias e mundos publicados pelo ADM).
*/
(function () {
  'use strict';

  const KEY = 'portal-official';
  const VERSION = 'V2.0';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Estrutura base VAZIA — sem nenhuma postagem embutida no código.
  const empty = {
    hero: {
      eyebrow: 'PORTAL OFICIAL',
      title: 'Mundos Sombrios',
      subtitle: '',
      description: '',
      primaryLabel: 'ENTRAR NO JOGO',
      media: null
    },
    featured: { title: '', subtitle: '', description: '', category: '', world: '', status: 'featured', media: null },
    announcements: [],
    events: [],
    classes: [],
    expansions: [],
    community: [],
    stories: [],
    worlds: [
      { id: 'world-exodo', key: 'exodo', title: 'Êxodo: Assimilação', eyebrow: 'SALA DE REGISTROS SECRETOS', description: 'Um mundo de protocolos, assimilação e sobrevivência entre registros que deveriam permanecer fechados.', accent: 'tech', media: null },
      { id: 'world-ocultatun', key: 'ocultatun', title: 'Ocultatun Ecos', eyebrow: 'BIBLIOTECA DOS SELOS', description: 'Um mundo de rituais, anomalias, símbolos e ecos que atravessam o conhecimento proibido.', accent: 'arcane', media: null }
    ],
    portalVersion: VERSION
  };

  const LIST_KEYS = ['announcements', 'events', 'classes', 'expansions', 'community', 'stories', 'worlds'];
  const TYPE_TO_LIST = {
    announcement: 'announcements',
    event: 'events',
    class: 'classes',
    expansion: 'expansions',
    community: 'community',
    story: 'stories',
    world: 'worlds'
  };

  let current = JSON.parse(JSON.stringify(empty));
  let hydrated = false;
  let hydrating = null;
  const listeners = new Set();

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function notify() {
    hydrated = true;
    listeners.forEach((fn) => { try { fn(clone(current)); } catch (_) {} });
  }

  function postToEntry(post) {
    if (!post || typeof post !== 'object') return null;
    const meta = (post.metadata && typeof post.metadata === 'object') ? post.metadata : {};
    const entry = {
      id: String(post.id),
      slug: String(post.slug || ''),
      type: String(post.type || 'post'),
      title: String(post.title || ''),
      subtitle: String(post.subtitle || ''),
      summary: String(post.summary || ''),
      body: String(post.body || ''),
      description: String(meta.description || post.summary || ''),
      category: String(post.category || ''),
      world: String(post.world || ''),
      kind: String(meta.kind || post.category || ''),
      key: String(meta.key || ''),
      accent: String(meta.accent || ''),
      eyebrow: String(meta.eyebrow || ''),
      status: String(meta.status || ''),
      date: String(meta.date || post.created_at || ''),
      published: post.published !== false && String(post.status || 'published') !== 'draft',
      media: meta.media && typeof meta.media === 'object' ? meta.media : null,
      createdAt: post.created_at || null,
      updatedAt: post.updated_at || null
    };
    return entry;
  }

  function entryToPost(entry, type) {
    const id = String(entry.id || `${type}-${Date.now().toString(36)}`);
    const slugBase = String(entry.slug || `${type}-${entry.title || id}`)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || id;
    const metadata = { ...(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}) };
    if (entry.media) metadata.media = entry.media;
    if (entry.kind) metadata.kind = entry.kind;
    if (entry.key) metadata.key = entry.key;
    if (entry.accent) metadata.accent = entry.accent;
    if (entry.eyebrow) metadata.eyebrow = entry.eyebrow;
    if (entry.status && type !== 'story') metadata.status = entry.status;
    if (entry.date) metadata.date = entry.date;
    if (entry.description) metadata.description = entry.description;
    return {
      id,
      slug: slugBase,
      type: String(type),
      title: String(entry.title || 'Sem título'),
      subtitle: String(entry.subtitle || ''),
      summary: String(entry.summary || entry.description || ''),
      body: String(entry.body || ''),
      category: String(entry.category || entry.kind || ''),
      world: String(entry.world || ''),
      status: entry.published === false ? 'draft' : 'published',
      published: entry.published !== false,
      metadata
    };
  }

  // Hidratação completa a partir do Supabase: blocos fixos + posts publicados.
  async function hydrateFromSupabase() {
    if (!window.MS_DB || !window.MS_DB.ready) { notify(); return current; }
    if (hydrating) return hydrating;
    hydrating = (async () => {
      const next = clone(empty);
      try {
        const [remote, posts] = await Promise.all([
          window.MS_DB.fetchSiteContent(KEY),
          (window.MS_DB.fetchPublishedPosts ? window.MS_DB.fetchPublishedPosts() : window.MS_DB.fetchPosts())
        ]);
        if (remote && typeof remote === 'object') {
          if (remote.hero && typeof remote.hero === 'object') next.hero = { ...next.hero, ...remote.hero };
          if (remote.featured && typeof remote.featured === 'object') next.featured = { ...next.featured, ...remote.featured };
          if (typeof remote.portalVersion === 'string') next.portalVersion = remote.portalVersion;
        }
        const worldOverrides = new Map();
        (Array.isArray(posts) ? posts : []).forEach((post) => {
          if (!post || post.published === false || String(post.status || '') === 'draft') return;
          const entry = postToEntry(post);
          if (!entry || !entry.title) return;
          const listKey = TYPE_TO_LIST[entry.type];
          if (!listKey) return;
          if (listKey === 'worlds') { worldOverrides.set(entry.key || entry.id, entry); return; }
          next[listKey].push(entry);
        });
        // Mundos: sobrescreve descrição/mídia dos mundos base se houver posts do tipo "world".
        if (worldOverrides.size) {
          next.worlds = next.worlds.map((w) => {
            const o = worldOverrides.get(w.key);
            return o ? { ...w, ...o, id: w.id, key: w.key, accent: w.accent } : w;
          });
        }
        LIST_KEYS.forEach((k) => {
          next[k].sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
        });
        current = next;
      } catch (error) {
        console.warn('[Mundos Sombrios] Falha ao hidratar conteúdo do Supabase:', error);
      }
      hydrating = null;
      notify();
      return current;
    })();
    return hydrating;
  }

  function read() { return clone(current); }

  // Persiste blocos fixos (hero/featured) em site_content. Listas vivem em `posts`.
  async function writeBlocks(data) {
    if (!window.MS_DB || !window.MS_DB.ready) return false;
    const payload = {
      hero: data?.hero || current.hero,
      featured: data?.featured || current.featured,
      portalVersion: VERSION
    };
    if (data?.hero) current.hero = { ...current.hero, ...data.hero };
    if (data?.featured) current.featured = { ...current.featured, ...data.featured };
    current.portalVersion = VERSION;
    try {
      const result = await window.MS_DB.saveSiteContent(payload, KEY);
      return !!result;
    } catch (error) {
      console.warn('[Mundos Sombrios] Falha ao salvar blocos do portal:', error);
      return false;
    }
  }

  // Salva um item de lista como post (id estável → sem duplicação).
  async function saveItem(type, entry) {
    if (!window.MS_DB || !window.MS_DB.ready) return { data: null, error: new Error('offline') };
    const post = entryToPost(entry, type);
    const result = await window.MS_DB.savePost(post);
    if (result && result.error) return { data: null, error: result.error };
    await hydrateFromSupabase();
    return { data: result, error: null };
  }

  async function deleteItem(listKey, id) {
    if (!window.MS_DB || !window.MS_DB.ready) return false;
    try {
      if (window.MS_DB.deletePost) await window.MS_DB.deletePost(id);
      await hydrateFromSupabase();
      return true;
    } catch (error) {
      console.warn('[Mundos Sombrios] Falha ao excluir post:', error);
      return false;
    }
  }

  function isAdmin() {
    try { return !!(window.currentUser && window.currentUser.role === 'admin'); } catch (_) { return false; }
  }

  function published(list) {
    return (Array.isArray(list) ? list : []).filter((x) => x && x.published !== false);
  }

  function onHydrated(fn) { if (typeof fn === 'function') listeners.add(fn); return () => listeners.delete(fn); }

  hydrateFromSupabase();

  window.PortalContent = {
    KEY,
    VERSION,
    defaults: clone(empty),
    read,
    write: writeBlocks,
    saveItem,
    deleteItem,
    isAdmin,
    published,
    escapeHtml: esc,
    hydrate: hydrateFromSupabase,
    onHydrated,
    isHydrated: () => hydrated
  };
})();
