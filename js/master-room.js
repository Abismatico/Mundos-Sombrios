/* Mundos Sombrios — Sala dos Mestres V0.59
   Fonte única de verdade da apresentação da Ancoragem/Mesa do Mestre.
   O motor VTT e o armazenamento permanecem em script.js; este módulo é dono da sala.
*/
(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function canGM(){try{return !!(currentUser && (currentUser.role==='mestre'||currentUser.role==='admin'));}catch(_){return false;}}
  function room(){return document.getElementById('ancoragem-gm-tab');}
  function renderPlayerConnections(){
    const root=document.getElementById('player-tables-list'); if(!root)return;
    const snapshot=typeof window.getMasterRoomState==='function'?window.getMasterRoomState():{joined:[]};
    const joined=Array.isArray(snapshot.joined)?snapshot.joined:[];
    root.innerHTML=joined.length?joined.map(t=>{
      const mode=t.gameMode==='ocultatun'?'OCULTATUN':'ÊXODO';
      const people=Array.isArray(t.participants)?t.participants.length:0;
      return `<article class="player-table-card"><div class="player-table-sigil">◈</div><div><small>FENDA CONECTADA · ${mode}</small><h4>${esc(t.name||'Mesa sem nome')}</h4><p>Código <strong>${esc(t.code||'—')}</strong> · ${people} participante(s)</p></div><div class="player-table-actions"><button type="button" data-player-enter="${esc(t.id)}">ENTRAR</button><button type="button" class="danger" data-player-leave="${esc(t.code||'')}">DESCONECTAR</button></div></article>`;
    }).join(''):`<div class="mr-empty player-empty"><span>∴</span><strong>Nenhuma Fenda conectada.</strong><p>Use “Atravessar Véu” e informe o código recebido do Mestre.</p></div>`;
    root.querySelectorAll('[data-player-enter]').forEach(b=>b.addEventListener('click',()=>window.enterVTT?.(b.dataset.playerEnter,false)));
    root.querySelectorAll('[data-player-leave]').forEach(b=>b.addEventListener('click',()=>window.leaveJoinedTable?.(b.dataset.playerLeave)));
  }
  function render(){
    renderPlayerConnections();
    if(!canGM())return;
    const root=room(); if(!root)return;
    msSeedRepoStoreFromLegacyCharacters(); msSeedTablesFromLegacy(); msSyncCurrentUserView();
    const snapshot=typeof window.getMasterRoomState==='function'?window.getMasterRoomState():{tables:[],joined:[]};
    const tables=Array.isArray(snapshot.tables)?snapshot.tables:[];
    const joined=Array.isArray(snapshot.joined)?snapshot.joined:[];
    const people=tables.reduce((sum,t)=>sum+(Array.isArray(t.participants)?t.participants.length:0),0);
    const limit=window.MS_SOUL?.tableCapacity?.() ?? (currentUser.role==='admin'?Infinity:3);
    const limitLabel=limit===Infinity?'∞':String(limit);
    const free=limit===Infinity?'∞':Math.max(0,limit-tables.length);
    const selectedId=String(window.__msMasterRoomTableId||tables[0]?.id||'');
    const selectedTable=tables.find(t=>String(t.id)===selectedId)||tables[0]||null;
    if(selectedTable) window.__msMasterRoomTableId=selectedTable.id;
    root.innerHTML=`
      <div class="master-room">
        <header class="master-room-header">
          <div><span class="mr-kicker">CÂMARA DE REGISTROS</span><h2>Sala dos Mestres</h2><p>Administre suas fendas, prepare sessões e mantenha os registros dos participantes em um único lugar, com sincronização pelo Supabase online.</p></div>
          <div class="mr-seal" aria-label="Acesso de Mestre">♛<span>${currentUser.role==='admin'?'ARCONTE':'MESTRE'}</span></div>
        </header>
        <section class="mr-actions" aria-label="Ações da Mesa">
          <button type="button" class="mr-action primary" id="mr-create">＋ <span>${limit!==Infinity&&tables.length>=limit?'AMPLIAR CAPACIDADE':'FORJAR NOVA MESA'}</span><small>${limit===Infinity?'Capacidade ilimitada':`Capacidade ${tables.length}/${limitLabel}`}</small></button>
          <button type="button" class="mr-action" id="mr-refresh">↻ <span>ATUALIZAR REGISTROS</span><small>Sincroniza o acervo local</small></button>
          <button type="button" class="mr-action" id="mr-player-view">👁 <span>VISÃO DO JOGADOR</span><small>Ver mesas conectadas</small></button>
        </section>
        <section class="mr-metrics" aria-label="Resumo da Sala">
          <article><b>${tables.length}</b><span>Mesas próprias</span><small>${free} espaços livres</small></article>
          <article><b>${people}</b><span>Participantes registrados</span><small>nas suas mesas</small></article>
          <article><b>${joined.length}</b><span>Conexões externas</span><small>como participante</small></article>
        </section>
        <section class="mr-registry">
          <header><div><span class="mr-kicker">REGISTRO DE FENDAS</span><h3>Mesas sob sua guarda</h3></div><span class="mr-count">${tables.length}/${limitLabel}</span></header>
          <div id="mr-table-list" class="mr-table-list">${tables.length?tables.map(tableCard).join(''):`<div class="mr-empty"><span>∴</span><strong>Nenhuma mesa foi forjada.</strong><p>Abra uma nova fenda para começar sua sala.</p></div>`}</div>
        </section>
      </div>`;
    if(selectedTable && typeof window.renderMasterTools === 'function') {
      const commandRoot=root.querySelector(`[data-command-host="${CSS.escape(String(selectedTable.id))}"]`);
      const toolsRoot=root.querySelector(`[data-tools-host="${CSS.escape(String(selectedTable.id))}"]`);
      if(toolsRoot) window.renderMasterTools(toolsRoot, selectedTable, {commandRoot});
    }
    root.querySelectorAll('[data-workspace-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      const shell=btn.closest('.mr-table-operational'); if(!shell)return;
      shell.querySelectorAll('[data-workspace-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      shell.querySelectorAll('[data-workspace-panel]').forEach(x=>x.hidden=x.dataset.workspacePanel!==btn.dataset.workspaceTab);
    }));
    root.querySelector('#mr-create').addEventListener('click',window.openCreateTableModal);
    root.querySelector('#mr-refresh').addEventListener('click',syncRemote);
    root.querySelector('#mr-player-view').addEventListener('click',()=>window.switchAncoragemTab('player'));
    root.querySelectorAll('[data-prepare]').forEach(b=>b.addEventListener('click',()=>{window.__msMasterRoomTableId=b.dataset.prepare;render();}));
    root.querySelectorAll('[data-enter]').forEach(b=>b.addEventListener('click',()=>window.enterVTT(b.dataset.enter,true)));
    root.querySelectorAll('[data-invite]').forEach(b=>b.addEventListener('click',()=>createInvite(b.dataset.invite)));
    root.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>window.copyCode(b.dataset.copy)));
    root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{window.deleteTable(b.dataset.delete); setTimeout(render,0);}));
  }

  async function syncRemote(){
    if(!canGM()||!window.MS_SERVICES?.Games)return render();
    try{const result=await window.MS_SERVICES.Games.listMine();const rows=result?.data||result||[];if(Array.isArray(rows)){allTablesDB=rows.map(t=>typeof msNormalizeTable==='function'?msNormalizeTable(t):t);msSyncCurrentUserView?.();}window.MS_PLATFORM?.toast('Registros sincronizados com o Supabase online.','success');}
    catch(e){console.warn('[Mundos Sombrios] sincronização da Sala do Mestre:',e);window.MS_PLATFORM?.toast('Não foi possível atualizar as mesas online.','error');}
    render();
  }
  async function createInvite(tableId){
    if(!window.MS_SERVICES?.Games?.createInvite)return;
    try{const result=await window.MS_SERVICES.Games.createInvite(tableId,null,1);const data=result?.data||result||{};const code=data.code||data.invite_code||data; if(code){try{await navigator.clipboard.writeText(String(code))}catch(_){} window.MS_PLATFORM?.toast(`Convite criado e copiado: ${code}`,'success');}}
    catch(e){window.MS_PLATFORM?.toast(e.message||'Não foi possível criar o convite.','error');}
  }

  function tableCard(t){
    const participants=Array.isArray(t.participants)?t.participants.length:0;
    const theme=t.theme||'default';
    const mode=t.gameMode==='exodo'?'ÊXODO':'OCULTATUN';
    const settings=t.settings||{}; const selected=String(window.__msMasterRoomTableId||'')===String(t.id);
    const id=esc(t.id);
    const workspace=selected?`<section class="mr-table-operational" aria-label="Centro operacional de ${esc(t.name||'mesa')}">
      <nav class="mr-table-workspace-tabs" aria-label="Áreas da mesa"><button type="button" class="active" data-workspace-tab="command">CAMPANHA EM MOVIMENTO</button><button type="button" data-workspace-tab="tools">COFRE DO MESTRE</button></nav>
      <div class="mr-table-workspace-panel" data-workspace-panel="command"><div class="mr-command-host" data-command-host="${id}"></div></div>
      <div class="mr-table-workspace-panel" data-workspace-panel="tools" hidden><div class="mr-tools-host" data-tools-host="${id}"></div></div>
    </section>`:'';
    return `<article class="mr-table-card ${selected?'selected':''}"><div class="mr-table-mark">◈</div><div class="mr-table-main"><div class="mr-table-meta"><span>${selected?'OPERAÇÃO ABERTA':'FENDA ATIVA'}</span><span>${esc(theme)}</span><span>${mode}</span></div><h4>${esc(t.name||'Mesa sem nome')}</h4><p>Código <strong>${esc(t.code||'—')}</strong> · ${participants} participante(s)</p>${settings.description?`<p>${esc(settings.description)}</p>`:''}<small>${esc(settings.era||'Época aberta')} · ${esc(settings.region||'Região aberta')}${Array.isArray(settings.expansions)&&settings.expansions.length?` · ${esc(settings.expansions.join(', '))}`:''}</small></div><div class="mr-table-actions"><button type="button" data-prepare="${id}">${selected?'ATUALIZAR OPERAÇÃO':'ABRIR OPERAÇÃO'}</button><button type="button" class="mr-enter" data-enter="${id}">ENTRAR</button><button type="button" data-invite="${id}">CRIAR CONVITE</button><button type="button" data-copy="${esc(t.code)}">COPIAR CÓDIGO</button><button type="button" class="danger" data-delete="${id}">EXCLUIR</button></div>${workspace}</article>`;
  }

  window.renderPlayerConnections=renderPlayerConnections;
  window.renderMasterRoom=render;
  window.renderAncoragem=render;
  window.switchAncoragemTab=function(tab){
    const player=document.getElementById('ancoragem-player-tab'), gm=document.getElementById('ancoragem-gm-tab');
    const gmActive=tab==='gm' && canGM();
    if(player)player.style.display=gmActive?'none':'flex'; if(gm){gm.style.display=gmActive?'flex':'none'; if(!gmActive && !canGM()) gm.innerHTML='';}
    document.querySelectorAll('#screen-ancoragem .tab-btn').forEach(btn=>btn.classList.toggle('active', (gmActive&&btn.id==='tab-btn-gm')||(!gmActive&&btn.id!=='tab-btn-gm')));
    if(gmActive)render(); else renderPlayerConnections();
  };
  document.addEventListener('DOMContentLoaded',()=>{ if(document.getElementById('screen-ancoragem'))render(); });
})();
