/* Mundos Sombrios — Portal Oficial V0.61.3
   Fonte única de navegação e renderização pública do portal.
*/
(function(){
  'use strict';
  const state={section:'home',world:null,detail:null};
  const esc=()=>window.PortalContent.escapeHtml;
  const root=()=>document.getElementById('screen-portal');
  const e=v=>esc()(v);
  let mediaUrls={};
  const fmtDate=d=>{if(!d)return '';const date=new Date(d);return Number.isNaN(date.getTime())?e(d):date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});};
  const fmtMedia=ref=>ref&&mediaUrls[ref.id]?mediaUrls[ref.id]:'';
  const mediaBox=(ref,alt='',cls='')=>{const src=fmtMedia(ref);if(!src)return '';const a=e(ref?.alt||alt||'Mídia do Portal');if(ref.kind==='video')return `<div class="portal-media ${cls}"><video controls preload="metadata" playsinline aria-label="${a}" src="${src}"></video></div>`;return `<div class="portal-media ${cls}"><img loading="lazy" src="${src}" alt="${a}"></div>`;};
  function user(){try{return window.currentUser||null}catch(_){return null;}}
  function role(){return user()?.role||'visitante';}
  function show(id){if(typeof window.showScreen==='function')window.showScreen(id);}
  function openLogin(){show('screen-login');}
  function backToPortal(){state.section='home';state.world=null;state.detail=null;render();show('screen-portal');}
  async function render(){
    const r=root();if(!r)return;
    r.setAttribute('aria-busy','true');
    r.innerHTML='<div class="portal-loading" role="status">Abrindo os arquivos do Portal…</div>';
    const c=PortalContent.read();
    try{mediaUrls=await PortalMedia.prepareContent(c);}catch(_){mediaUrls={};}
    let html;
    if(state.section==='home')html=home(c);
    else if(state.section==='world')html=worldPage(c,state.world);
    else if(state.section==='news')html=listing(c,'announcements','NOVIDADES','Atualizações e comunicados',x=>cardFor('announcements',x));
    else if(state.section==='events')html=listing(c,'events','EVENTOS','Próximos encontros e acontecimentos',x=>cardFor('events',x));
    else if(state.section==='classes')html=listing(c,'classes','CLASSES','Arquivos de personagens',x=>cardFor('classes',x));
    else if(state.section==='expansions')html=listing(c,'expansions','EXPANSÕES','Novos capítulos do cenário',x=>cardFor('expansions',x));
    else if(state.section==='community')html=listing(c,'community','COMUNIDADE','Campanhas, criações e destaques',x=>cardFor('community',x));
    else if(state.section==='stories')html=listing(c,'stories','HISTÓRIAS & CONTOS','Narrativas oficiais dos mundos',x=>cardFor('stories',x));
    else if(state.section==='worlds')html=worldsPage(c);
    else html=detailPage(c,state.detail);
    r.innerHTML=html;r.setAttribute('aria-busy','false');document.body.classList.remove('ms-shell-booting');bind(r);
  }
  function mediaStrip(ref,alt){return mediaBox(ref,alt,'portal-card-media');}
  function home(c){
    const logged=user();
    const announcements=PortalContent.published(c.announcements).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4);
    const events=PortalContent.published(c.events).slice(0,3);
    const stories=PortalContent.published(c.stories).slice(0,2);
    return `<div class="portal-shell">
      <header class="portal-nav"><button class="portal-brand" data-act="top">MUNDOS <span>SOMBRIOS</span></button><nav aria-label="Navegação principal"><button data-section="news">NOVIDADES</button><button data-section="events">EVENTOS</button><button data-section="classes">CLASSES</button><button data-section="expansions">EXPANSÕES</button><button data-section="stories">HISTÓRIAS</button><button data-section="community">COMUNIDADE</button><button data-section="worlds">MUNDOS</button><button data-section="codex">CÓDICES</button><button data-section="masters">MESTRES</button>${(['mestre','admin'].includes(String(logged?.role||'').toLowerCase()))?`<button data-act="shield" class="portal-shield-link">ESCUDO DO MESTRE</button>`:''}</nav><div class="portal-user">${logged?`<span>Olá, <b>${e(logged.username)}</b></span><button data-act="game">JOGAR</button><button data-act="logout" class="ghost">SAIR</button>`:`<button data-act="login">ENTRAR</button>`}${PortalContent.isAdmin()?`<button data-act="admin" class="admin-link">ADMINISTRAR</button>`:''}</div></header>
      <main>
        <section class="portal-hero">${mediaStrip(c.hero.media,c.hero.title)}<div class="portal-hero-copy"><span class="portal-eyebrow">${e(c.hero.eyebrow)}</span><h1>${e(c.hero.title)}</h1><h2>${e(c.hero.subtitle)}</h2><p>${e(c.hero.description)}</p><div class="portal-cta-row"><button class="portal-btn primary" data-act="game">${e(c.hero.primaryLabel)}</button><button class="portal-btn" data-section="worlds">EXPLORAR O CENÁRIO</button><button class="portal-btn ghost" data-act="codex">CONSULTAR CÓDICES</button></div></div><div class="portal-hero-sigil" aria-hidden="true"><div class="portal-sigil-ring r1"></div><div class="portal-sigil-ring r2"></div><div class="portal-sigil-core">MS</div></div></section>
        <section class="portal-featured">${mediaStrip(c.featured.media,c.featured.title)}<div class="portal-featured-copy"><span class="portal-label">EM DESTAQUE</span><h2>${e(c.featured.title)}</h2><h3>${e(c.featured.subtitle)}</h3><p>${e(c.featured.description)}</p><span class="portal-badge">${e(c.featured.category)} · ${e(c.featured.world)}</span></div><button class="portal-featured-open" data-detail="featured">EXPLORAR</button></section>
        ${sectionBlock('ANÚNCIOS & ATUALIZAÇÕES','news',announcements,'portal-news-grid',item=>cardFor('announcements',item))}
        ${sectionBlock('PRÓXIMOS EVENTOS','events',events,'portal-event-grid',item=>cardFor('events',item))}
        <section class="portal-section"><div class="portal-section-head"><div><span class="portal-label">DESCUBRA</span><h2>Novas Classes</h2></div><button data-section="classes" class="portal-inline-link">VER TODAS</button></div><div class="portal-class-grid">${c.classes.slice(0,4).map(x=>cardFor('classes',x)).join('')}</div></section>
        <section class="portal-section portal-expansions"><div class="portal-section-head"><div><span class="portal-label">CONTEÚDO OFICIAL</span><h2>Novas Expansões</h2></div><button data-section="expansions" class="portal-inline-link">VER TODAS</button></div><div class="portal-expansion-grid">${c.expansions.map(x=>cardFor('expansions',x)).join('')}</div></section>
        <section class="portal-section"><div class="portal-section-head"><div><span class="portal-label">NARRATIVAS OFICIAIS</span><h2>Histórias & Contos</h2></div><button data-section="stories" class="portal-inline-link">ABRIR ARQUIVO</button></div><div class="portal-story-grid">${stories.map(x=>cardFor('stories',x)).join('')}</div></section>
        <section class="portal-section"><div class="portal-section-head"><div><span class="portal-label">DOIS MUNDOS</span><h2>Escolha sua realidade</h2></div><button data-section="worlds" class="portal-inline-link">VER MUNDOS</button></div><div class="portal-world-grid">${c.worlds.map(x=>cardFor('worlds',x)).join('')}</div></section>
        <section class="portal-masters"><div><span class="portal-label">CENTRO DOS MESTRES</span><h2>Prepare a próxima sessão.</h2><p>Gerencie mesas, consulte os Códices, mantenha NPCs e arquivos privados e use o Escudo do Mestre durante a partida.</p></div><button class="portal-btn primary" data-act="masters">ENTRAR NA MESA DOS MESTRES</button></section>
      </main><footer class="portal-footer"><div><strong>MUNDOS SOMBRIOS</strong><span>Portal Oficial do cenário e sistema autorais.</span></div><div><button data-section="news">Notícias</button><button data-section="events">Eventos</button><button data-section="stories">Histórias</button><button data-section="classes">Classes</button><button data-section="expansions">Expansões</button><button data-act="codex">Códices</button></div><small>${e(c.portalVersion)} · Conteúdo local administrável</small></footer>
    </div>`;
  }
  function cardFor(type,x){
    if(type==='announcements')return `<article class="portal-card">${mediaStrip(x.media,x.title)}<div class="portal-card-meta"><span>${e(x.category||'Atualização')}</span><time>${fmtDate(x.date)}</time></div><h3>${e(x.title)}</h3><p>${e(x.summary||x.description||'')}</p><button data-item="announcements" data-id="${e(x.id)}">LER MAIS</button></article>`;
    if(type==='events')return `<article class="portal-card portal-event-card">${mediaStrip(x.media,x.title)}<div class="event-date"><strong>${fmtDate(x.date)}</strong><span>${e(x.world||'')}</span></div><h3>${e(x.title)}</h3><p>${e(x.description||'')}</p><button data-item="events" data-id="${e(x.id)}">VER EVENTO</button></article>`;
    if(type==='classes')return `<article class="portal-class-card">${mediaStrip(x.media,x.title)}<div class="class-mark">${e(String(x.title||'?').slice(0,1))}</div><span>${e(x.world||'')}</span><h3>${e(x.title)}</h3><strong>${e(x.subtitle||'')}</strong><p>${e(x.description||'')}</p><button data-item="classes" data-id="${e(x.id)}">CONHECER</button></article>`;
    if(type==='expansions')return `<article class="portal-expansion-card">${mediaStrip(x.media,x.title)}<span>${e(x.world||'')}</span><h3>${e(x.title)}</h3><p>${e(x.description||'')}</p><footer><b>${e(x.status||'Disponível')}</b><button data-item="expansions" data-id="${e(x.id)}">EXPLORAR</button></footer></article>`;
    if(type==='stories')return `<article class="portal-story-card">${mediaStrip(x.media,x.title)}<div class="portal-card-meta"><span>${e(x.kind||'Conto')}</span><time>${fmtDate(x.date)}</time></div><h3>${e(x.title)}</h3><strong>${e(x.subtitle||x.world||'')}</strong><p>${e(x.description||'')}</p><button data-item="stories" data-id="${e(x.id)}">LER HISTÓRIA</button></article>`;
    if(type==='community')return `<article class="portal-card">${mediaStrip(x.media,x.title)}<div class="portal-card-meta"><span>${e(x.kind||'Comunidade')}</span><time>${fmtDate(x.date)}</time></div><h3>${e(x.title)}</h3><p>${e(x.description||'')}</p><button data-item="community" data-id="${e(x.id)}">VER DESTAQUE</button></article>`;
    if(type==='worlds')return `<article class="portal-world-card ${e(x.accent)}">${mediaStrip(x.media,x.title)}<div class="world-card-seal">${x.key==='exodo'?'◈':'✦'}</div><span>${e(x.eyebrow)}</span><h3>${e(x.title)}</h3><p>${e(x.description)}</p><footer><button data-world="${e(x.key)}">CONHECER MUNDO</button><button data-world-play="${e(x.key)}">ENTRAR NO MUNDO</button></footer></article>`;
    return '';
  }
  function sectionBlock(title,section,items,cls,render){return `<section class="portal-section"><div class="portal-section-head"><div><span class="portal-label">PORTAL</span><h2>${title}</h2></div><button data-section="${section}" class="portal-inline-link">ABRIR CENTRAL</button></div><div class="${cls}">${items.length?items.map(render).join(''):`<div class="portal-empty">Nenhum registro publicado.</div>`}</div></section>`;}
  function listing(c,key,title,sub,renderer){const items=PortalContent.published(c[key]);return `<div class="portal-subpage"><header class="portal-subpage-head"><button data-act="back">← PORTAL</button><span class="portal-label">${e(title)}</span><h1>${e(sub)}</h1></header><div class="portal-list-grid">${items.length?items.map(renderer).join(''):`<div class="portal-empty">Nenhum conteúdo publicado ainda.</div>`}</div></div>`;}
  function worldsPage(c){return `<div class="portal-subpage"><header class="portal-subpage-head"><button data-act="back">← PORTAL</button><span class="portal-label">DOIS MUNDOS</span><h1>Escolha sua realidade</h1><p>Explore as identidades, registros e caminhos de cada cenário.</p></header><div class="portal-world-grid">${c.worlds.map(x=>cardFor('worlds',x)).join('')}</div></div>`;}
  function worldPage(c,key){const w=c.worlds.find(x=>x.key===key)||c.worlds[0];return `<div class="portal-subpage world-subpage ${e(w.accent)}"><header class="portal-subpage-head">${mediaStrip(w.media,w.title)}<button data-act="back">← PORTAL</button><span class="portal-label">${e(w.eyebrow)}</span><h1>${e(w.title)}</h1><p>${e(w.description)}</p></header><div class="world-subpage-actions"><button class="portal-btn primary" data-world-play="${e(w.key)}">ENTRAR NO MUNDO</button><button class="portal-btn" data-act="codex">CONSULTAR CÓDICE</button></div><div class="world-lore-grid"><article><span>O QUE É</span><h2>Cenário</h2><p>${e(w.description)}</p></article><article><span>CONTEÚDO</span><h2>Classes e expansões</h2><p>Descubra as opções disponíveis no portal e depois entre no Santuário para criar sua ficha.</p></article><article><span>REGISTROS</span><h2>Arquivos do mundo</h2><p>Acesse o Códice oficial para consultar regras, expansões e documentos publicados pelo ADM.</p></article></div></div>`;}
  function detailPage(c,detail){const [type,id]=String(detail||'').split(':');if(detail==='featured')return `<div class="portal-subpage"><header class="portal-subpage-head">${mediaStrip(c.featured.media,c.featured.title)}<button data-act="back">← PORTAL</button><span class="portal-label">EM DESTAQUE</span><h1>${e(c.featured.title)}</h1><p>${e(c.featured.description)}</p></header><article class="portal-detail"><p><b>${e(c.featured.subtitle)}</b></p><p>Categoria: ${e(c.featured.category)} · Mundo: ${e(c.featured.world)}</p><button class="portal-btn primary" data-act="codex">CONSULTAR CÓDICE</button></article></div>`;const item=(c[type]||[]).find(x=>String(x.id)===String(id));if(!item)return home(c);return `<div class="portal-subpage"><header class="portal-subpage-head">${mediaStrip(item.media,item.title)}<button data-act="back">← PORTAL</button><span class="portal-label">${e(type.toUpperCase())}</span><h1>${e(item.title)}</h1><p>${e(item.description||item.summary||'')}</p></header><article class="portal-detail">${item.subtitle?`<p><b>${e(item.subtitle)}</b></p>`:''}<div class="portal-detail-meta">${e(item.world||item.category||item.kind||item.status||'Mundos Sombrios')} · ${fmtDate(item.date)}</div>${type==='stories'&&item.body?`<div class="portal-story-body">${e(item.body).split(/\n\s*\n/).map(par=>`<p>${par.replace(/\n/g,'<br>')}</p>`).join('')}</div>`:''}<button class="portal-btn primary" data-act="${type==='events'?'login':'codex'}">${type==='events'?'PARTICIPAR / ENTRAR':'CONSULTAR CÓDICES'}</button></article></div>`;}
  function bind(r){
    r.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{state.section=b.dataset.section;state.world=null;state.detail=null;render();}));
    r.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>{state.section='world';state.world=b.dataset.world;render();}));
    r.querySelectorAll('[data-world-play]').forEach(b=>b.addEventListener('click',()=>{if(!user()){openLogin();return;}show('screen-mode-select');if(typeof window.selectGameMode==='function')window.selectGameMode(b.dataset.world);}));
    r.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{state.section='detail';state.detail=`${b.dataset.item}:${b.dataset.id}`;render();}));
    r.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>{state.section='detail';state.detail=b.dataset.detail;render();}));
    r.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>handleAction(b.dataset.act)));
  }
  function handleAction(act){if(act==='login'){openLogin();return;}if(act==='logout'){if(typeof window.doLogout==='function')window.doLogout();return;}if(act==='game'){if(user())show('screen-mode-select');else openLogin();return;}if(act==='codex'){show('screen-codex');if(typeof window.renderWorldCodex==='function')window.renderWorldCodex();return;}if(act==='masters'){if(!user()){openLogin();return;}show('screen-ancoragem');if(typeof window.switchAncoragemTab==='function')window.switchAncoragemTab(role()==='jogador'?'player':'gm');return;}if(act==='shield'){if(!['mestre','admin'].includes(String(role()).toLowerCase())){alert('Acesso restrito a Mestres e ADM.');return;}if(typeof window.openMasterShield==='function')window.openMasterShield();return;}if(act==='admin'){window.openPortalAdmin&&window.openPortalAdmin();return;}if(act==='back'||act==='top'){backToPortal();}}
  window.renderOfficialPortal=render;window.openOfficialPortal=async()=>{state.section='home';await PortalContent.hydrate();await render();show('screen-portal');};window.returnToOfficialPortal=backToPortal;window.backToOfficialPortal=backToPortal;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.openOfficialPortal());else window.openOfficialPortal();
})();
