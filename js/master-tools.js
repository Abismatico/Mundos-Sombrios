/* Mundos Sombrios — Ferramentas do Mestre + Escudo V0.60
   Proprietário único das ferramentas privadas da Sala dos Mestres e do assistente de regras.
   Não substitui o motor VTT: integra-se por hooks explícitos.
*/
(function(){
  'use strict';
  const FILES='mundosSombriosGMFilesV1', NOTES='mundosSombriosGMNotesV1', NPCS='mundosSombriosGMNPCsV1', VTT='mundosSombriosVttStateV1';
  const MAX_FILE=3*1024*1024;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gm=()=>{try{return !!(currentUser&&(currentUser.role==='mestre'||currentUser.role==='admin'))}catch(_){return false}};
  const uid=()=>{try{return String(currentUser?.id||'')}catch(_){return ''}};
  const tableId=()=>{try{return String(currentTableData?.id||'draft')}catch(_){return 'draft'}};
  const online={notes:[],npcs:[],files:[],vtt:{chat:[],dice:[],gallery:[]},hydrated:false,unsubscribe:null};
  const keyKind=k=>k===NOTES?'notes':k===NPCS?'npcs':k===FILES?'files':k===VTT?'vtt':null;
  const scoped=(key)=>{const kind=keyKind(key); if(kind) return Array.isArray(online[kind])?online[kind]:[]; return [];};
  async function persistScoped(key,val,previous=[]){
    if(!window.MS_DB?.ready || !gm() || tableId()==='draft') return;
    const kind=keyKind(key); const next=Array.isArray(val)?val:[]; const old=Array.isArray(previous)?previous:[];
    if(kind==='notes'){ for(const n of next) await window.MS_DB.saveGMNote(tableId(),n); for(const n of old) if(!next.some(x=>String(x.id)===String(n.id))) await window.MS_DB.deleteGMNote(n.id); }
    if(kind==='npcs'){ for(const n of next) await window.MS_DB.saveGMNpc(tableId(),n); for(const n of old) if(!next.some(x=>String(x.id)===String(n.id))) await window.MS_DB.deleteGMNpc(n.id); }
  }
  const setScoped=(key,val)=>{const kind=keyKind(key);const next=Array.isArray(val)?val:[];const prev=kind&&Array.isArray(online[kind])?online[kind].slice():[];if(kind) online[kind]=next;persistScoped(key,next,prev).catch(e=>console.warn('[Mundos Sombrios] persistência GM:',e));};
  async function hydrateOnline(){
    if(!window.MS_DB?.ready || !gm() || tableId()==='draft' || online.hydrated) return;
    try{
      const [notes,npcs,files,state]=await Promise.all([window.MS_DB.fetchGMNotes(tableId()),window.MS_DB.fetchGMNpcs(tableId()),window.MS_DB.fetchGMFiles(tableId()),window.MS_DB.fetchTableState(tableId())]);
      online.notes=notes.data||[]; online.npcs=npcs.data||[]; online.files=files.data||[]; online.vtt=state.data||online.vtt||{chat:[],dice:[],gallery:[]}; online.hydrated=true;
    }catch(e){console.warn('[Mundos Sombrios] hidratação das ferramentas do Mestre:',e);}
  }
  const mode=()=>{try{return currentTableData?.gameMode || (typeof currentDraftGameMode!=='undefined'?currentDraftGameMode:null) || (typeof currentMode!=='undefined'?currentMode:'exodo')}catch(_){return 'exodo'}};

  const state={activeTool:'files', shield:null};

  async function renderMasterTools(root){
    if(!gm()) return;
    await hydrateOnline();
    const wrap=document.createElement('section');
    wrap.className='gm-tools-suite';
    wrap.innerHTML=`
      <header class="gm-tools-head"><div><span class="mr-kicker">ACERVO PRIVADO</span><h3>Cofre do Mestre</h3><p>Arquivos, anotações e fichas de NPCs. Este espaço é privado e persistido online por mesa. </p></div><span class="gm-tools-lock">♛ RESTRITO</span></header>
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
    panel.innerHTML=`<div class="gm-tool-toolbar"><label class="gm-upload-btn">＋ ENVIAR ARQUIVOS<input id="gm-file-input" type="file" multiple hidden></label><span class="gm-storage-hint">Máx. ${Math.round(MAX_FILE/1024/1024)} MB por arquivo · armazenamento privado online</span></div><div id="gm-file-list" class="gm-file-list"></div>`;
    const list=panel.querySelector('#gm-file-list'); if(!files.length) list.innerHTML='<div class="gm-empty">Nenhum arquivo privado protocolado.</div>';
    files.forEach(f=>{list.insertAdjacentHTML('beforeend',`<article class="gm-file-card"><div class="gm-file-icon">▣</div><div><b>${esc(f.name)}</b><small>${esc(f.mime_type||f.type||'arquivo')} · ${Math.round((f.size_bytes||f.size||0)/1024)} KB</small></div><button type="button" data-download="${esc(f.id)}">BAIXAR</button><button type="button" class="danger" data-delete="${esc(f.id)}">EXCLUIR</button></article>`);});
    panel.querySelector('#gm-file-input').addEventListener('change',e=>uploadFiles(e.target.files,panel));
    panel.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>downloadFile(b.dataset.download)));
    panel.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteFile(b.dataset.delete,panel)));
  }
  async function uploadFiles(fileList,panel){
    if(!window.MS_DB?.ready || tableId()==='draft'){alert('Salve a Fenda antes de enviar arquivos.');return;}
    for(const file of [...(fileList||[])]){
      if(file.size>MAX_FILE){alert(`O arquivo ${file.name} excede ${Math.round(MAX_FILE/1024/1024)} MB.`);continue;}
      try{const {data,error}=await window.MS_DB.uploadGMFile(tableId(),file);if(error)throw error;if(data){online.files.unshift(data);renderFiles(panel);}}catch(e){console.warn('[Mundos Sombrios] Upload GM:',e);alert(`Não foi possível enviar ${file.name}.`);}
    }
  }
  async function downloadFile(id){
    if(!gm())return; const f=scoped(FILES).find(x=>String(x.id)===String(id));if(!f)return;
    if(f.path&&window.MS_DB?.createSignedGMFileUrl){const {data,error}=await window.MS_DB.createSignedGMFileUrl(f.path);if(!error&&data?.signedUrl){window.open(data.signedUrl,'_blank','noopener');return;}}
    if(f.data){const a=document.createElement('a');a.href=f.data;a.download=f.name;document.body.appendChild(a);a.click();a.remove();}
  }
  async function deleteFile(id,panel){if(!gm()||!confirm('Excluir este arquivo privado?'))return;const f=scoped(FILES).find(x=>String(x.id)===String(id));if(!f)return;try{const {error}=await window.MS_DB.deleteGMFile(id,f.path);if(error)throw error;online.files=online.files.filter(x=>String(x.id)!==String(id));renderFiles(panel);}catch(e){console.warn('[Mundos Sombrios] Delete GM file:',e);alert('Não foi possível excluir o arquivo.');}}
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

  function vttState(){return online.vtt||{chat:[],dice:[],gallery:[]};}
  function saveVtt(state){
    online.vtt=state;
    // Estado estrutural (grid, galeria, locks) pertence ao Mestre. Jogadores publicam eventos, não sobrescrevem a mesa.
    if(window.MS_DB?.ready&&tableId()!=='draft'&&gm()) window.MS_DB.saveTableState(tableId(),state).catch(e=>console.warn('[Mundos Sombrios] Estado VTT:',e));
  }
  async function onVttEnter(table,isGM){
    if(online.unsubscribe){try{online.unsubscribe();}catch(_){} online.unsubscribe=null;}
    if(window.MS_REALTIME?.disconnect) window.MS_REALTIME.disconnect();
    online.hydrated=false; online.notes=[];online.npcs=[];online.files=[];
    if(table?.id&&window.MS_DB?.ready){
      try{ const [remote,events]=await Promise.all([window.MS_DB.fetchTableState(table.id),window.MS_DB.fetchTableEvents(table.id,200)]); online.vtt=remote.data||{chat:[],dice:[],gallery:[]};
        (events.data||[]).forEach(ev=>applyRemoteEvent(ev)); online.hydrated=false; await hydrateOnline();
        if(window.MS_REALTIME?.connect) online.unsubscribe=await window.MS_REALTIME.connect(table.id,applyRemoteEvent);
      }catch(e){console.warn('[Mundos Sombrios] Realtime da mesa:',e);}
    }
  }
  async function refreshTableRoster(){
    if(!currentTableData?.id || !window.MS_SERVICES?.Games) return;
    try{
      const result=await window.MS_SERVICES.Games.characters(currentTableData.id);
      const remoteCharacters=result?.data||[];
      tablePlayers = remoteCharacters.map(c=>{
        const payload=c?.payload&&typeof c.payload==='object'?msClone(c.payload):{};
        payload.id=c.id; payload.ownerId=c.owner_id; payload.userId=c.user_id; payload.name=payload.name||c.name; payload.mode=payload.mode||c.mode; payload.nature=payload.nature||c.nature; payload.className=payload.className||c.class_name; payload.updatedAt=c.updated_at; payload.isMe=String(c.user_id)===String(currentUser?.id); payload.sourceOwnerId=c.owner_id; payload.sourceCharId=c.id; payload.participantUserId=c.user_id; return payload;
      });
      renderVttCards?.();
      window.MS_PLATFORM?.emit('table:roster-refreshed',{tableId:currentTableData.id,count:tablePlayers.length});
    }catch(e){console.warn('[Mundos Sombrios] refresh roster:',e);}
  }
  function applyRemoteEvent(event){
    if(!event||!event.event_type)return; const p=event.payload||{};
    if(event.event_type==='table_refresh'){
      if(p.entity==='table_members') refreshTableRoster();
      if(p.entity==='table_state') window.MS_DB?.fetchTableState?.(currentTableData?.id).then(r=>{if(r?.data){online.vtt=r.data;restoreVttState();}}).catch(()=>{});
      if(p.entity==='game_sessions') window.MS_PLATFORM?.emit('table:sessions-changed',{tableId:currentTableData?.id});
      return;
    }
    if(event.event_type==='table_state'){ online.vtt=p.state || p || online.vtt; restoreVttState(); return; }
    if(event.event_type==='chat'){
      const duplicate=online.vtt.chat.some(x=>String(x.sender)===String(p.sender)&&String(x.msg)===String(p.msg)&&Date.now()-Number(x.at||0)<5000);
      if(!duplicate){ const item={sender:p.sender,msg:p.msg,color:p.color||'#00ffcc',id:event.id,at:Date.now()}; online.vtt.chat.push(item); online.vtt.chat=online.vtt.chat.slice(-150); if(typeof addChatMessage==='function')addChatMessage(item.sender,item.msg,item.color); }
    }
    if(event.event_type==='token_move'){
      const tokenId=String(p.tokenId||''); const canvas=window.vttCanvas||vttCanvas;
      const obj=canvas?.getObjects()?.find(o=>String(o.msTokenId||'')===tokenId);
      if(obj){ window.__msApplyingRemoteToken=true; obj.set({left:Number(p.left)||0,top:Number(p.top)||0,angle:Number(p.angle)||0,scaleX:Number(p.scaleX)||obj.scaleX,scaleY:Number(p.scaleY)||obj.scaleY}); canvas.renderAll(); window.__msApplyingRemoteToken=false; if(isVttGM && window.MasterTools?.saveGrid) window.MasterTools.saveGrid(canvas); }
      return;
    }
    if(event.event_type==='control'){ Object.assign(window,{}); if(typeof p.chatLocked==='boolean'){ chatLocked=p.chatLocked; const btn=document.getElementById('btn-lock-chat'); if(btn)btn.innerText=chatLocked?'🔏':'🔓'; } return; }
    if(event.event_type==='dice'){
      const duplicate=online.vtt.dice.some(x=>String(x.type)===String(p.type)&&String(x.result)===String(p.result)&&String(x.sender)===String(p.sender)&&Date.now()-Number(x.at||0)<5000);
      if(!duplicate){ const item={id:event.id,type:p.type,result:p.result,sender:p.sender,at:Date.now()}; online.vtt.dice.push(item); online.vtt.dice=online.vtt.dice.slice(-100); diceHistory=online.vtt.dice.slice(-100); if(typeof renderDiceHistory==='function')renderDiceHistory(); }
    }
  }
  function restoreVttState(){const s=vttState();const chat=document.getElementById('chat-messages');if(chat){chat.innerHTML='';(s.chat||[]).forEach(x=>{if(typeof addChatMessage==='function')addChatMessage(x.sender,x.msg,x.color);});}if(typeof diceHistory!=='undefined'){diceHistory=Array.isArray(s.dice)?s.dice.slice():[];if(typeof renderDiceHistory==='function')renderDiceHistory();}const c=document.getElementById('camp-gallery-container');if(c){c.innerHTML='';(s.gallery||[]).forEach(f=>addGalleryDom(f));}}
  function addGalleryDom(f){const c=document.getElementById('camp-gallery-container');if(!c)return;c.insertAdjacentHTML('beforeend',`<div class="gallery-thumb"><img src="${f.src}" alt="${esc(f.name||'Imagem')}" onclick="viewFullscreen(this.src)"><button type="button" class="delete-btn hide-on-view" data-gallery-src="${encodeURIComponent(f.src||'')}">X</button></div>`);}
  function onChatMessage(sender,msg,isGM){const s=vttState();s.chat=Array.isArray(s.chat)?s.chat:[];const local={id:'local-'+Date.now()+'-'+Math.random(),sender,msg,color:isGM?'#ff00ff':'#00ffcc',at:Date.now()};s.chat.push(local);s.chat=s.chat.slice(-150);if(gm()) saveVtt(s);if(window.MS_DB?.ready&&tableId()!=='draft')window.MS_SERVICES?.VTT?.event?.(tableId(),'chat',{sender,msg,color:local.color});}
  function onDiceRoll(type,result,sender){const s=vttState();s.dice=Array.isArray(s.dice)?s.dice:[];s.dice.push({id:'local-'+Date.now()+'-'+Math.random(),type,result,sender,at:Date.now()});s.dice=s.dice.slice(-100);if(gm()) saveVtt(s);if(window.MS_DB?.ready&&tableId()!=='draft')window.MS_SERVICES?.VTT?.event?.(tableId(),'dice',{type,result,sender});}
  function syncDice(list){const s=vttState();s.dice=Array.isArray(list)?list.slice(-100):[];saveVtt(s);}
  function saveTableControlState(patch){ if(!gm()||tableId()==='draft') return; online.vtt={...(online.vtt||{}),...patch}; saveVtt(online.vtt); }
  function saveGalleryImage(src,name){if(!isVttGM())return;const s=vttState();s.gallery=Array.isArray(s.gallery)?s.gallery:[];s.gallery.push({src,name:name||'Imagem',at:Date.now()});s.gallery=s.gallery.slice(-40);saveVtt(s);}
  function isVttGM(){try{return !!window.__msVttIsGM}catch(_){return false;}}
  function removeGalleryImage(src){const s=vttState();s.gallery=(s.gallery||[]).filter(f=>f.src!==src);saveVtt(s);document.querySelectorAll('[data-gallery-src]').forEach(b=>{try{if(decodeURIComponent(b.dataset.gallerySrc||'')===src)b.parentElement?.remove()}catch(_){}})}

  function saveGrid(canvas){if(!canvas)return;const s=vttState();const objects=canvas.getObjects().filter(o=>!o.isGridLine);s.grid=canvas.toJSON(['owner','borderColor','isGridLine']);s.grid.objects=objects.map(o=>o.toObject(['owner','borderColor','isGridLine']));saveVtt(s);}
  function restoreGrid(canvas){const s=vttState();if(!canvas||!s.grid||!s.grid.objects?.length)return;try{window.__msRestoringGrid=true;canvas.loadFromJSON({version:s.grid.version||'6.0.0',objects:s.grid.objects},()=>{drawGridLines?.();canvas.renderAll();window.__msRestoringGrid=false;});}catch(_){window.__msRestoringGrid=false}}
  window.renderMasterTools=renderMasterTools;
  window.MasterTools={renderMasterTools,mountShield,unmountShield,onVttEnter,restoreVttState,onChatMessage,onDiceRoll,syncDice,saveGalleryImage,removeGalleryImage,saveGrid,restoreGrid,saveTableControlState};
  document.addEventListener('DOMContentLoaded',()=>{if(gm()){} });
})();
