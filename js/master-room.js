/* Mundos Sombrios — Sala dos Mestres V0.59
   Fonte única de verdade da apresentação da Ancoragem/Mesa do Mestre.
   O motor VTT e o armazenamento permanecem em script.js; este módulo é dono da sala.
*/
(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function canGM(){try{return !!(currentUser && (currentUser.role==='mestre'||currentUser.role==='admin'));}catch(_){return false;}}
  function room(){return document.getElementById('ancoragem-gm-tab');}
  function render(){
    if(!canGM())return;
    const root=room(); if(!root)return;
    msSeedRepoStoreFromLegacyCharacters(); msSeedTablesFromLegacy(); msSyncCurrentUserView();
    const snapshot=typeof window.getMasterRoomState==='function'?window.getMasterRoomState():{tables:[],joined:[]};
    const tables=Array.isArray(snapshot.tables)?snapshot.tables:[];
    const joined=Array.isArray(snapshot.joined)?snapshot.joined:[];
    const people=tables.reduce((sum,t)=>sum+(Array.isArray(t.participants)?t.participants.length:0),0);
    const limit=10;
    root.innerHTML=`
      <div class="master-room">
        <header class="master-room-header">
          <div><span class="mr-kicker">CÂMARA DE REGISTROS</span><h2>Sala dos Mestres</h2><p>Administre suas fendas, prepare sessões e mantenha os registros dos participantes em um único lugar.</p></div>
          <div class="mr-seal" aria-label="Acesso de Mestre">♛<span>${currentUser.role==='admin'?'ARCONTE':'MESTRE'}</span></div>
        </header>
        <section class="mr-actions" aria-label="Ações da Mesa">
          <button type="button" class="mr-action primary" id="mr-create">＋ <span>FORJAR NOVA MESA</span><small>Até ${limit} mesas por conta</small></button>
          <button type="button" class="mr-action" id="mr-refresh">↻ <span>ATUALIZAR REGISTROS</span><small>Sincroniza o acervo local</small></button>
          <button type="button" class="mr-action" id="mr-player-view">👁 <span>VISÃO DO JOGADOR</span><small>Ver mesas conectadas</small></button>
        </section>
        <section class="mr-metrics" aria-label="Resumo da Sala">
          <article><b>${tables.length}</b><span>Mesas próprias</span><small>${limit-tables.length} espaços livres</small></article>
          <article><b>${people}</b><span>Participantes registrados</span><small>nas suas mesas</small></article>
          <article><b>${joined.length}</b><span>Conexões externas</span><small>como participante</small></article>
        </section>
        <section class="mr-registry">
          <header><div><span class="mr-kicker">REGISTRO DE FENDAS</span><h3>Mesas sob sua guarda</h3></div><span class="mr-count">${tables.length}/${limit}</span></header>
          <div id="mr-table-list" class="mr-table-list">${tables.length?tables.map(tableCard).join(''):`<div class="mr-empty"><span>∴</span><strong>Nenhuma mesa foi forjada.</strong><p>Abra uma nova fenda para começar sua sala.</p></div>`}</div>
        </section>
      </div>`;
    if (typeof window.renderMasterTools === 'function') window.renderMasterTools(root);
    root.querySelector('#mr-create').addEventListener('click',window.openCreateTableModal);
    root.querySelector('#mr-refresh').addEventListener('click',render);
    root.querySelector('#mr-player-view').addEventListener('click',()=>window.switchAncoragemTab('player'));
    root.querySelectorAll('[data-enter]').forEach(b=>b.addEventListener('click',()=>window.enterVTT(b.dataset.enter,true)));
    root.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>window.copyCode(b.dataset.copy)));
    root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{window.deleteTable(b.dataset.delete); setTimeout(render,0);}));
  }
  function tableCard(t){
    const participants=Array.isArray(t.participants)?t.participants.length:0;
    const theme=t.theme||'default';
    const mode=t.gameMode==='exodo'?'ÊXODO':'OCULTATUN';
    return `<article class="mr-table-card"><div class="mr-table-mark">◈</div><div class="mr-table-main"><div class="mr-table-meta"><span>FENDA ATIVA</span><span>${esc(theme)}</span><span>${mode}</span></div><h4>${esc(t.name||'Mesa sem nome')}</h4><p>Código <strong>${esc(t.code||'—')}</strong> · ${participants} participante(s)</p></div><div class="mr-table-actions"><button type="button" class="mr-enter" data-enter="${esc(t.id)}">ENTRAR</button><button type="button" data-copy="${esc(t.code)}">COPIAR CÓDIGO</button><button type="button" class="danger" data-delete="${esc(t.id)}">EXCLUIR</button></div></article>`;
  }
  window.renderMasterRoom=render;
  window.renderAncoragem=render;
  window.switchAncoragemTab=function(tab){
    const player=document.getElementById('ancoragem-player-tab'), gm=document.getElementById('ancoragem-gm-tab');
    const gmActive=tab==='gm' && canGM();
    if(player)player.style.display=gmActive?'none':'flex'; if(gm){gm.style.display=gmActive?'flex':'none'; if(!gmActive && !canGM()) gm.innerHTML='';}
    document.querySelectorAll('#screen-ancoragem .tab-btn').forEach(btn=>btn.classList.toggle('active', (gmActive&&btn.id==='tab-btn-gm')||(!gmActive&&btn.id!=='tab-btn-gm')));
    if(gmActive)render();
  };
  document.addEventListener('DOMContentLoaded',()=>{ if(document.getElementById('screen-ancoragem'))render(); });
})();
