/* Mundos Sombrios — CMS do Portal Oficial V2.0 (Supabase-first)
   Somente ADM. Fonte única: Supabase (site_content + posts + storage portal-media).
   Cada publicação usa ID/slug estáveis: editar ATUALIZA o post, nunca duplica.
*/
(function () {
  'use strict';

  const esc = (v) => PortalContent.escapeHtml(v);
  const read = () => PortalContent.read();
  const isAdmin = () => PortalContent.isAdmin();

  const typeMap = { announcements: 'announcement', events: 'event', classes: 'class', expansions: 'expansion', community: 'community', stories: 'story', worlds: 'world' };
  const config = {
    announcement: { key: 'announcements', label: 'Anúncio', field: 'summary', dateType: 'date', place: 'Categoria' },
    event: { key: 'events', label: 'Evento', field: 'description', dateType: 'datetime-local', place: 'Mundo' },
    class: { key: 'classes', label: 'Classe', field: 'description', dateType: 'date', place: 'Mundo' },
    expansion: { key: 'expansions', label: 'Expansão', field: 'description', dateType: 'date', place: 'Mundo' },
    community: { key: 'community', label: 'Comunidade', field: 'description', dateType: 'date', place: 'Tipo' },
    story: { key: 'stories', label: 'História / Conto', field: 'description', dateType: 'date', place: 'Mundo' },
    world: { key: 'worlds', label: 'Mundo', field: 'description', dateType: 'text', place: 'Identificador (exodo/ocultatun)' }
  };

  function close() {
    const modal = document.getElementById('portal-admin-modal');
    if (modal) { modal.style.display = 'none'; modal.innerHTML = ''; modal.setAttribute('aria-hidden', 'true'); }
  }

  async function open() {
    if (!isAdmin()) { alert('Acesso restrito ao ADM.'); return false; }
    const modal = document.getElementById('portal-admin-modal');
    if (!modal) return false;
    modal.innerHTML = `<div class="portal-admin-card"><header><div><span>ARQUIVO DO ARCONTE</span><h2>Administrar Portal</h2><p>Tudo publicado aqui é gravado no Supabase e aparece imediatamente no site para todos os jogadores.</p></div><button type="button" data-close>FECHAR</button></header>
      <nav class="portal-admin-tabs" role="tablist" aria-label="Tipo de conteúdo">
        <button type="button" class="active" data-tab="announcement">Anúncio</button><button type="button" data-tab="event">Evento</button><button type="button" data-tab="class">Classe</button><button type="button" data-tab="expansion">Expansão</button><button type="button" data-tab="story">História</button><button type="button" data-tab="community">Comunidade</button><button type="button" data-tab="world">Mundo</button><button type="button" data-tab="featured">Destaque</button><button type="button" data-tab="hero">Portal</button>
      </nav><div id="portal-admin-form"><p class="portal-empty">Carregando conteúdo do Supabase…</p></div><section class="portal-admin-list"><h3>Conteúdo publicado</h3><div id="portal-admin-items"></div></section></div>`;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('[data-close]').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
      modal.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === btn));
      renderForm(modal.querySelector('#portal-admin-form'), btn.dataset.tab);
    }));
    await PortalContent.hydrate();
    renderForm(modal.querySelector('#portal-admin-form'), 'announcement');
    renderItems(modal.querySelector('#portal-admin-items'));
    return true;
  }

  function mediaFields(item) {
    return `<fieldset class="portal-media-fieldset"><legend>Mídia do bloco</legend><label>Imagem ou vídeo<input type="file" name="media" accept="image/*,video/*"></label><label>Texto alternativo / descrição da mídia<input name="mediaAlt" value="${esc(item.media?.alt || '')}" placeholder="Descreva a imagem para acessibilidade"></label>${item.media?.id ? `<label class="portal-admin-media-state"><input type="checkbox" name="removeMedia"> Remover mídia atual <span>${esc(item.media.name || item.media.kind || 'arquivo')}</span></label>` : ''}<small>Imagens: até 8 MB. Vídeos: até 40 MB. O arquivo vai para o Supabase Storage e fica visível para todos.</small></fieldset>`;
  }

  function formDataForType(type, item = {}) {
    if (type === 'featured') {
      const f = read().featured;
      return `<form class="portal-admin-form" data-type="featured"><label>Título<input name="title" required value="${esc(item.title || f.title)}"></label><label>Subtítulo<input name="subtitle" value="${esc(item.subtitle || f.subtitle)}"></label><label>Descrição<textarea name="description">${esc(item.description || f.description)}</textarea></label><label>Categoria<input name="category" value="${esc(item.category || f.category)}"></label><label>Mundo<input name="world" value="${esc(item.world || f.world)}"></label>${mediaFields(item.media ? item : f)}<button class="portal-btn primary">SALVAR DESTAQUE</button></form>`;
    }
    if (type === 'hero') {
      const h = read().hero;
      return `<form class="portal-admin-form" data-type="hero"><label>Eyebrow<input name="eyebrow" value="${esc(h.eyebrow)}"></label><label>Título<input name="title" required value="${esc(h.title)}"></label><label>Subtítulo<input name="subtitle" value="${esc(h.subtitle)}"></label><label>Descrição<textarea name="description">${esc(h.description)}</textarea></label><label>Botão principal<input name="primaryLabel" value="${esc(h.primaryLabel)}"></label>${mediaFields(h)}<button class="portal-btn primary">SALVAR PORTAL</button></form>`;
    }
    const cfg = config[type];
    if (!cfg) return '<p class="portal-empty">Tipo de conteúdo inválido.</p>';
    return `<form class="portal-admin-form" data-type="${type}"><label>Título<input name="title" required value="${esc(item.title || '')}"></label><label>${cfg.dateType === 'text' ? 'Identificador' : `Data${cfg.dateType === 'datetime-local' ? ' e hora' : ''}`}<input type="${cfg.dateType === 'text' ? 'text' : cfg.dateType}" name="date" value="${esc(item.date || item.key || '')}"></label><label>${cfg.place}<input name="world" value="${esc(item.world || item.category || item.kind || item.key || '')}"></label>${type === 'class' ? `<label>Subtítulo<input name="subtitle" value="${esc(item.subtitle || '')}"></label>` : ''}<label>Descrição / resumo<textarea name="description">${esc(item[cfg.field] || item.description || '')}</textarea></label>${type === 'story' ? `<label>Texto integral do conto<textarea name="body" class="portal-story-body-input">${esc(item.body || '')}</textarea></label>` : ''}<label><input type="checkbox" name="published" ${item.published !== false ? 'checked' : ''}> Publicado</label>${mediaFields(item)}<button class="portal-btn primary">${item.id ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR'}</button></form>`;
  }

  async function renderForm(root, type, item = null) {
    if (!root) return;
    root.innerHTML = formDataForType(type, item || {});
    const form = root.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submit = form.querySelector('button[type="submit"],button.portal-btn');
      if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
      try {
        const fd = new FormData(form);
        const source = item || (type === 'featured' ? read().featured : type === 'hero' ? read().hero : {});
        let media = source?.media || null;
        if (fd.get('removeMedia') === 'on' && media?.id) { await PortalMedia.remove(media.id); media = null; }
        const file = form.querySelector('input[name="media"]')?.files?.[0];
        if (file) {
          if (media?.id) await PortalMedia.remove(media.id);
          media = await PortalMedia.put(file);
          media.alt = String(fd.get('mediaAlt') || '').trim();
        } else if (media) {
          media = { ...media, alt: String(fd.get('mediaAlt') || media.alt || '').trim() };
        }

        if (type === 'featured' || type === 'hero') {
          const block = type === 'featured'
            ? { title: String(fd.get('title') || '').trim(), subtitle: String(fd.get('subtitle') || '').trim(), description: String(fd.get('description') || '').trim(), category: String(fd.get('category') || '').trim(), world: String(fd.get('world') || '').trim(), status: 'featured', media }
            : { eyebrow: String(fd.get('eyebrow') || '').trim(), title: String(fd.get('title') || '').trim(), subtitle: String(fd.get('subtitle') || '').trim(), description: String(fd.get('description') || '').trim(), primaryLabel: String(fd.get('primaryLabel') || 'ENTRAR NO JOGO').trim(), media };
          const ok = await PortalContent.write({ [type]: block });
          if (!ok) throw new Error('Não foi possível salvar no Supabase. Verifique sua sessão de ADM.');
        } else {
          const cfg = config[type];
          const payload = {
            id: item?.id || `${type}-${Date.now().toString(36)}`,
            slug: item?.slug || '',
            title: String(fd.get('title') || '').trim(),
            date: String(fd.get('date') || ''),
            published: fd.get('published') === 'on',
            description: String(fd.get('description') || '').trim(),
            [cfg.field]: String(fd.get('description') || '').trim(),
            media
          };
          if (type === 'story') payload.body = String(fd.get('body') || '').trim();
          const place = String(fd.get('world') || '').trim();
          if (type === 'announcement') payload.category = place || 'Atualização';
          else if (type === 'community') payload.kind = place || 'Comunidade';
          else if (type === 'world') payload.key = place || item?.key || 'exodo';
          else payload.world = place;
          if (type === 'class') payload.subtitle = String(fd.get('subtitle') || '').trim();
          const { error } = await PortalContent.saveItem(type, payload);
          if (error) throw error;
        }

        if (typeof window.renderOfficialPortal === 'function') await window.renderOfficialPortal();
        await open();
      } catch (err) {
        console.error('[Mundos Sombrios] CMS:', err);
        alert(err?.message || 'Não foi possível salvar o conteúdo.');
      } finally {
        if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
      }
    });
  }

  function renderItems(root) {
    if (!root) return;
    const c = read();
    const entries = [['announcements', 'Anúncio'], ['events', 'Evento'], ['classes', 'Classe'], ['expansions', 'Expansão'], ['stories', 'História/Conto'], ['community', 'Comunidade'], ['worlds', 'Mundo']];
    const parts = [];
    entries.forEach(([key, label]) => {
      const rows = Array.isArray(c[key]) ? c[key] : [];
      parts.push(`<div class="portal-admin-group"><h4>${label}</h4>`);
      if (!rows.length) parts.push('<p class="portal-empty">Sem registros.</p>');
      rows.slice(0, 20).forEach((x) => parts.push(`<article><div><b>${esc(x.title)}</b><small>${esc(x.date || x.world || x.category || x.kind || '')}${x.media ? ' · 📎 mídia' : ''}${x.published === false ? ' · rascunho' : ''}</small></div><button type="button" data-edit="${esc(key)}:${esc(x.id)}">EDITAR</button><button type="button" data-delete="${esc(key)}:${esc(x.id)}">EXCLUIR</button></article>`));
      parts.push('</div>');
    });
    root.innerHTML = parts.join('');
    root.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
      const [key, id] = btn.dataset.edit.split(':');
      const type = typeMap[key];
      const data = read();
      const item = (data[key] || []).find((x) => String(x.id) === String(id));
      renderForm(document.getElementById('portal-admin-form'), type, item);
      document.querySelectorAll('#portal-admin-modal [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === type));
    }));
    root.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('Excluir este conteúdo definitivamente do Supabase?')) return;
      const [key, id] = btn.dataset.delete.split(':');
      const data = read();
      const item = (data[key] || []).find((x) => String(x.id) === String(id));
      if (item?.media?.id) { try { await PortalMedia.remove(item.media.id); } catch (_) {} }
      const ok = await PortalContent.deleteItem(key, id);
      if (!ok) { alert('Não foi possível excluir no Supabase.'); return; }
      if (typeof window.renderOfficialPortal === 'function') await window.renderOfficialPortal();
      renderItems(root);
    }));
  }

  window.openPortalAdmin = open;
  window.closePortalAdmin = close;
})();
