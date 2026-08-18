/* Mundos Sombrios — Ferramentas do Mestre + Escudo V0.60
   Proprietário único das ferramentas privadas da Sala dos Mestres e do assistente de regras.
   Não substitui o motor VTT: integra-se por hooks explícitos.
*/
(function(){
  'use strict';
  const FILES='mundosSombriosGMFilesV1', NOTES='mundosSombriosGMNotesV1', NPCS='mundosSombriosGMNPCsV1', VTT='mundosSombriosVttStateV1';
  const MAX_FILE=3*1024*1024;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,f)=>{console.warn('[Mundos Sombrios] Armazenamento local desativado nas ferramentas do mestre.'); return f;};
  const write=(k,v)=>{console.warn('[Mundos Sombrios] Armazenamento local desativado nas ferramentas do mestre.'); return false;};
  const gm=()=>{try{return !!(currentUser&&(currentUser.role==='mestre'||currentUser.role==='admin'))}catch(_){return false}};
  const uid=()=>{try{return String(currentUser?.id||'')}catch(_){return ''}};
  const scoped=(key)=>{const all=read(key,{});return (all&&typeof all==='object'&&!Array.isArray(all)&&Array.isArray(all[uid()]))?all[uid()]:[]};
  const setScoped=(key,val)=>{const all=read(key,{});all[uid()]=Array.isArray(val)?val:[];write(key,all)};
  const tableId=()=>{try{return String(currentTableData?.id||'draft')}catch(_){return 'draft'}};
  const mode=()=>{try{return currentTableData?.gameMode || (typeof currentDraftGameMode!=='undefined'?currentDraftGameMode:null) || (typeof currentMode!=='undefined'?currentMode:'exodo')}catch(_){return 'exodo'}};

  const state={activeTool:'files', shield:null};

  function renderMasterTools(root){
    if(!gm()) return;
    const wrap=document.createElement('section');
    wrap.className='gm-tools-suite';
    wrap.innerHTML=`
      <header class="gm-tools-head"><div><span class="mr-kicker">ACERVO PRIVADO</span><h3>Cofre do Mestre</h3><p>Arquivos, anotações e fichas de NPCs. Este espaço só é renderizado para Mestre/ADM.</p></div><span class="gm-tools-lock">♛ RESTRITO</span></header>
      <nav class="gm-tools-tabs" role="tablist" aria-label="Ferramentas privadas"><button type="button" class="gm-tools-tab active" data-tool="files">Arquivos</button><button type="button" class="gm-tools-tab" data-tool="notes">Bloco de Notas</button><button type="button" class="gm-tools-tab" data-tool="npcs">Fichas de NPC</button></nav>
      <div class="gm-tools-panel" id="gm-tools-panel"></div>`;
    root.appendChild(wrap);
    wrap.querySelectorAll('.gm-tools-tab').forEach(b=>b.addEventListener('click',()=>{state.activeTool=b.dataset.tool;wrap.querySelectorAll('.gm-tools-tab').forEach(x=>x.classList.toggle('active',x===b));renderPanel(wrap.querySelector('#gm-tools-panel'));}));
    renderPanel(wrap.querySelector('#gm-tools-panel'));
  }

  function renderPanel(panel){
    if(!panel||!gm())return;
    if(state.activeTool==='files') renderFiles(panel);
    else if(state.activeTool==='notes') renderNotes(panel);
    else renderNPCs(panel);
  }

  function renderFiles(panel){
    const files=scoped(FILES);
    panel.innerHTML=`<div class="gm-tool-toolbar"><label class="gm-upload-btn">＋ ENVIAR ARQUIVOS<input id="gm-file-input" type="file" multiple hidden></label><span class="gm-storage-hint">Máx. ${Math.round(MAX_FILE/1024/1024)} MB por arquivo · armazenamento local</span></div><div id="gm-file-list" class="gm-file-list"></div>`;
    const list=panel.querySelector('#gm-file-list');
    if(!files.length){list.innerHTML='<div class="gm-empty">Nenhum arquivo privado protocolado.</div>';}
    files.forEach(f=>{list.insertAdjacentHTML('beforeend',`<article class="gm-file-card"><div class="gm-file-icon">▣</div><div><b>${esc(f.name)}</b><small>${esc(f.type||'arquivo')} · ${Math.round((f.size||0)/1024)} KB</small></div><button type="button" data-download="${esc(f.id)}">BAIXAR</button><button type="button" class="danger" data-delete="${esc(f.id)}">EXCLUIR</button></article>`);});
    panel.querySelector('#gm-file-input').addEventListener('change',e=>uploadFiles(e.target.files,panel));
    panel.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>downloadFile(b.dataset.download)));
    panel.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteFile(b.dataset.delete,panel)));
  }
  function uploadFiles(fileList,panel){
    const files=scoped(FILES); let changed=false;
    [...(fileList||[])].forEach(file=>{
      if(file.size>MAX_FILE){alert(`O arquivo ${file.name} excede ${Math.round(MAX_FILE/1024/1024)} MB.`);return;}
      const reader=new FileReader(); reader.onload=()=>{files.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:file.name,type:file.type,size:file.size,data:String(reader.result||''),createdAt:Date.now()});setScoped(FILES,files);changed=true;renderFiles(panel);}; reader.readAsDataURL(file);
    });
  }
  function downloadFile(id){if(!gm())return;const f=scoped(FILES).find(x=>String(x.id)===String(id));if(!f)return;const a=document.createElement('a');a.href=f.data;a.download=f.name;document.body.appendChild(a);a.click();a.remove();}
  function deleteFile(id,panel){if(!gm()||!confirm('Excluir este arquivo privado?'))return;setScoped(FILES,scoped(FILES).filter(f=>String(f.id)!==String(id)));renderFiles(panel);}

  function renderNotes(panel){
    const notes=scoped(NOTES); const text=notes.length?notes[0].text:''; const title=notes.length?notes[0].title:'Caderno do Mestre';
    panel.innerHTML=`<div class="gm-note-editor"><input id="gm-note-title" value="${esc(title)}" maxlength="80" placeholder="Título"><textarea id="gm-note-body" rows="13" placeholder="Anote pistas, cenas, decisões, segredos...">${esc(text)}</textarea><div class="gm-note-actions"><button type="button" id="gm-note-save">SALVAR NOTA</button><span id="gm-note-status" class="gm-status"></span></div></div>`;
    panel.querySelector('#gm-note-save').addEventListener('click',()=>{const note={title:panel.querySelector('#gm-note-title').value.trim()||'Caderno do Mestre',text:panel.querySelector('#gm-note-body').value,updatedAt:Date.now()};setScoped(NOTES,[note]);panel.querySelector('#gm-note-status').textContent='Nota salva.';});
  }

  function renderNPCs(panel){
    const npcs=scoped(NPCS);
    panel.innerHTML=`<div class="gm-npc-grid"><form class="gm-npc-form" id="gm-npc-form"><input id="npc-name" required placeholder="Nome do NPC"><input id="npc-role" placeholder="Função / ameaça"><div class="gm-npc-stats"><input id="npc-pv" type="number" min="0" placeholder="PV"><input id="npc-def" type="number" min="0" placeholder="Defesa"><input id="npc-cd" type="number" min="0" placeholder="CD"><input id="npc-mode" value="${mode()}" readonly></div><textarea id="npc-notes" rows="5" placeholder="Habilidades, testes, comportamento..."></textarea><button type="submit">REGISTRAR NPC</button></form><div class="gm-npc-list" id="gm-npc-list"></div></div>`;
    const list=panel.querySelector('#gm-npc-list'); if(!npcs.length){list.innerHTML='<div class="gm-empty">Nenhum NPC registrado.</div>';} else npcs.forEach(n=>{list.insertAdjacentHTML('beforeend',`<article class="gm-npc-card"><div><b>${esc(n.name)}</b><small>${esc(n.role||'NPC')} · ${esc(n.mode)}</small></div><p>PV ${esc(n.pv??'—')} · DEF ${esc(n.def??'—')} · CD ${esc(n.cd??'—')}</p><p>${esc(n.notes||'')}</p><div><button type="button" data-edit-npc="${esc(n.id)}">EDITAR</button><button type="button" class="danger" data-delete-npc="${esc(n.id)}">EXCLUIR</button></div></article>`)});
    panel.querySelector('#gm-npc-form').addEventListener('submit',e=>{e.preventDefault();const name=panel.querySelector('#npc-name').value.trim();if(!name){return;}const list=scoped(NPCS);list.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name,role:panel.querySelector('#npc-role').value.trim(),pv:Number(panel.querySelector('#npc-pv').value||0),def:Number(panel.querySelector('#npc-def').value||0),cd:Number(panel.querySelector('#npc-cd').value||0),mode:mode(),notes:panel.querySelector('#npc-notes').value.trim(),updatedAt:Date.now()});setScoped(NPCS,list);renderNPCs(panel);});
    panel.querySelectorAll('[data-delete-npc]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Excluir este NPC?')){setScoped(NPCS,scoped(NPCS).filter(n=>String(n.id)!==String(b.dataset.deleteNpc)));renderNPCs(panel);}}));
    panel.querySelectorAll('[data-edit-npc]').forEach(b=>b.addEventListener('click',()=>editNpc(b.dataset.editNpc,panel)));
  }
  function editNpc(id,panel){const n=scoped(NPCS).find(x=>String(x.id)===String(id));if(!n)return;panel.querySelector('#npc-name').value=n.name||'';panel.querySelector('#npc-role').value=n.role||'';panel.querySelector('#npc-pv').value=n.pv??'';panel.querySelector('#npc-def').value=n.def??'';panel.querySelector('#npc-cd').value=n.cd??'';panel.querySelector('#npc-notes').value=n.notes||'';const form=panel.querySelector('#gm-npc-form');form.onsubmit=e=>{e.preventDefault();const list=scoped(NPCS).map(x=>String(x.id)===String(id)?{...x,name:panel.querySelector('#npc-name').value.trim()||x.name,role:panel.querySelector('#npc-role').value.trim(),pv:Number(panel.querySelector('#npc-pv').value||0),def:Number(panel.querySelector('#npc-def').value||0),cd:Number(panel.querySelector('#npc-cd').value||0),notes:panel.querySelector('#npc-notes').value.trim(),updatedAt:Date.now()}:x);setScoped(NPCS,list);renderNPCs(panel);};}

  function mountShield(isGM){ try{window.__msVttIsGM=!!isGM}catch(_){}
    unmountShield(); if(!isGM)return;
    const button=document.createElement('button');button.type='button';button.id='master-shield-cube';button.className='master-shield-cube';button.setAttribute('aria-label','Abrir Escudo do Mestre');button.innerHTML='<span>◈</span><small>ESCUDO</small>';document.body.appendChild(button);
    const box=document.createElement('section');box.id='master-shield-panel';box.className='master-shield-panel';box.hidden=true;box.innerHTML=`<header><div><span class="mr-kicker">ESCUDO DO MESTRE</span><h3>Memória dos Mundos</h3><p id="shield-context"></p></div><button type="button" id="shield-close" aria-label="Fechar">×</button></header><div class="shield-search"><input id="shield-query" placeholder="Pergunte sobre regras, testes, alcance, CDs..."><button type="button" id="shield-ask">CONSULTAR</button></div><div id="shield-answer" class="shield-answer"><div class="shield-empty">Digite uma pergunta. O Escudo consulta apenas o compêndio oficial carregado no site.</div></div>`;document.body.appendChild(box);
    state.shield={button,box}; button.addEventListener('click',()=>{box.hidden=!box.hidden;if(!box.hidden)box.querySelector('#shield-query').focus();});box.querySelector('#shield-close').addEventListener('click',()=>box.hidden=true);box.querySelector('#shield-ask').addEventListener('click',()=>answer(box));box.querySelector('#shield-query').addEventListener('keydown',e=>{if(e.key==='Enter')answer(box)});setContext(box);
  }
  function setContext(box){const m=mode();box.querySelector('#shield-context').textContent=m==='ocultatun'?'Ocultatun · Ecos da Decadência':'Êxodo · Assimilação';}
  let rulesLoadPromise=null;
  function ensureShieldRules(){
    if(Array.isArray(window.MASTER_SHIELD_RULES)) return Promise.resolve(window.MASTER_SHIELD_RULES);
    if(rulesLoadPromise) return rulesLoadPromise;
    rulesLoadPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-master-shield-rules]');
      if(existing){ existing.addEventListener('load',()=>resolve(window.MASTER_SHIELD_RULES||[]),{once:true}); existing.addEventListener('error',reject,{once:true}); return; }
      const script=document.createElement('script');
      script.src='js/master-shield-rules.js';
      script.dataset.masterShieldRules='1';
      script.async=true;
      script.onload=()=>resolve(Array.isArray(window.MASTER_SHIELD_RULES)?window.MASTER_SHIELD_RULES:[]);
      script.onerror=()=>reject(new Error('Não foi possível carregar o compêndio do Escudo.'));
      document.head.appendChild(script);
    }).catch(err=>{rulesLoadPromise=null;throw err;});
    return rulesLoadPromise;
  }
  async function answer(box){
    const q=box.querySelector('#shield-query').value.trim();
    const out=box.querySelector('#shield-answer');
    if(!q){out.innerHTML='<div class="shield-error">Faça uma pergunta.</div>';return;}
    out.innerHTML='<div class="shield-empty">Consultando o compêndio oficial…</div>';
    let rules=[];
    try{rules=await ensureShieldRules();}catch(err){out.innerHTML='<div class="shield-error">O compêndio do Escudo não pôde ser carregado. Tente novamente.</div>';return;}
    const qn=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const terms=qn.split(/[^a-z0-9]+/).filter(x=>x.length>2);const preferred=mode();const scored=rules.map(r=>{const text=(r.text+' '+r.keywords.join(' ')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let score=0;terms.forEach(t=>{if(text.includes(t))score+=2;if(r.keywords.includes(t))score+=1});if(r.mode===preferred)score+=3;return {...r,score};}).filter(r=>r.score>4).sort((a,b)=>b.score-a.score).slice(0,3);if(!scored.length){out.innerHTML='<div class="shield-error">Não encontrei uma regra suficientemente próxima no compêndio oficial. Tente mencionar o modo, a perícia, a potência ou o termo mecânico.</div>';return;}out.innerHTML=`<div class="shield-response"><strong>Consulta mecânica</strong><p>Modo priorizado: <b>${esc(preferred==='exodo'?'Êxodo':'Ocultatun')}</b></p>${scored.map(r=>`<article><b>${esc(r.title)}</b><p>${esc(r.text)}</p><small>Origem: ${esc(r.source)} · índice ${r.line}</small></article>`).join('')}</div>`;
  }
  function unmountShield(){document.getElementById('master-shield-cube')?.remove();document.getElementById('master-shield-panel')?.remove();state.shield=null;try{window.__msVttIsGM=false}catch(_){}}

  function vttState(){const all=read(VTT,{});if(!all[tableId()])all[tableId()]={chat:[],dice:[],gallery:[]};return all[tableId()];}
  function saveVtt(s){const all=read(VTT,{});all[tableId()]=s;write(VTT,all)}
  function onVttEnter(){if(!gm())return;}
  function restoreVttState(){const s=vttState();const chat=document.getElementById('chat-messages');if(chat){chat.innerHTML='';s.chat.forEach(x=>{ if(typeof addChatMessage==='function') addChatMessage(x.sender,x.msg,x.color); });}if(typeof diceHistory!=='undefined'){diceHistory=Array.isArray(s.dice)?s.dice.slice():[];if(typeof renderDiceHistory==='function')renderDiceHistory();}const c=document.getElementById('camp-gallery-container');if(c){c.innerHTML='';(s.gallery||[]).forEach(f=>addGalleryDom(f));}}
  function addGalleryDom(f){const c=document.getElementById('camp-gallery-container');if(!c)return;c.insertAdjacentHTML('beforeend',`<div class="gallery-thumb"><img src="${f.src}" alt="${esc(f.name||'Imagem')}" onclick="viewFullscreen(this.src)"><button type="button" class="delete-btn hide-on-view" data-gallery-src="${encodeURIComponent(f.src)}">X</button></div>`);c.querySelectorAll('[data-gallery-src]').forEach(b=>{if(!b.__bound){b.__bound=true;b.addEventListener('click',()=>removeGalleryImage(decodeURIComponent(b.dataset.gallerySrc||'')));}})}
  function onChatMessage(sender,msg,isGM){const s=vttState();s.chat.push({sender,msg,color:isGM?'#ff00ff':'#00ffcc',at:Date.now()});s.chat=s.chat.slice(-150);saveVtt(s);}
  function onDiceRoll(type,result,sender){const s=vttState();s.dice=Array.isArray(s.dice)?s.dice:[];s.dice.push({id:Date.now(),type,result,sender});s.dice=s.dice.slice(-100);saveVtt(s);}
  function syncDice(list){const s=vttState();s.dice=Array.isArray(list)?list.slice(-100):[];saveVtt(s);}
  function saveGalleryImage(src,name){if(!isVttGM())return;const s=vttState();s.gallery=Array.isArray(s.gallery)?s.gallery:[];s.gallery.push({src,name:name||'Imagem',at:Date.now()});s.gallery=s.gallery.slice(-40);saveVtt(s);}
  function isVttGM(){try{return !!window.__msVttIsGM}catch(_){return false;}}
  function removeGalleryImage(src){const s=vttState();s.gallery=(s.gallery||[]).filter(f=>f.src!==src);saveVtt(s);document.querySelectorAll('[data-gallery-src]').forEach(b=>{try{if(decodeURIComponent(b.dataset.gallerySrc||'')===src)b.parentElement?.remove()}catch(_){}})}

  function saveGrid(canvas){if(!canvas)return;const s=vttState();const objects=canvas.getObjects().filter(o=>!o.isGridLine);s.grid=canvas.toJSON(['owner','borderColor','isGridLine']);s.grid.objects=objects.map(o=>o.toObject(['owner','borderColor','isGridLine']));saveVtt(s);}
  function restoreGrid(canvas){const s=vttState();if(!canvas||!s.grid||!s.grid.objects?.length)return;try{window.__msRestoringGrid=true;canvas.loadFromJSON({version:s.grid.version||'6.0.0',objects:s.grid.objects},()=>{drawGridLines?.();canvas.renderAll();window.__msRestoringGrid=false;});}catch(_){window.__msRestoringGrid=false}}
  window.renderMasterTools=renderMasterTools;
  window.MasterTools={renderMasterTools,mountShield,unmountShield,onVttEnter,restoreVttState,onChatMessage,onDiceRoll,syncDice,saveGalleryImage,removeGalleryImage,saveGrid,restoreGrid};
  document.addEventListener('DOMContentLoaded',()=>{if(gm()){} });
})();
