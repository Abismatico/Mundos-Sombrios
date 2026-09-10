/* Mundos Sombrios — Mesa ao Vivo V3 / V2.7 */
(function(){
  'use strict';
  let mounted=false,activeTable=null,activeAsGM=false,livePaused=false,lastHealth={status:'idle'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function role(){return String(window.currentUser?.role||'jogador').toLowerCase();}
  function mount(table,asGM){
    activeTable=table||null;activeAsGM=!!asGM;livePaused=String(table?.status||'active')==='paused';window.__msTableLivePaused=livePaused;
    const screen=document.getElementById('screen-vtt');if(!screen)return;
    if(!mounted){
      const header=screen.querySelector('.vtt-header'),legacyTitle=document.getElementById('vtt-table-name'),quick=document.getElementById('vtt-quick-access'),presence=screen.querySelector('.ms-vtt-presence');
      const cards=document.getElementById('vtt-cards-window'),grid=document.getElementById('vtt-grid-window'),chat=document.getElementById('vtt-chat-box'),dice=document.getElementById('vtt-dice-box');
      const shell=document.createElement('div');shell.id='ms-table-v3';shell.className='ms-table-v3';
      shell.innerHTML=`<header class="ms-table-v3-head"><div class="ms-table-v3-identity"><span>FENDA ATIVA</span><strong data-ms-table-title></strong><small data-ms-table-code></small></div><div class="ms-table-v3-health"><i></i><b data-ms-sync-label>CONECTANDO</b><small data-ms-latency></small></div><div class="ms-table-v3-head-actions"></div></header><div class="ms-table-v3-body"><aside class="ms-table-v3-left"><nav class="ms-table-v3-nav"><button data-pane="stage" class="active">CENA</button><button data-open="vtt-gallery-window">ARQUIVOS</button><button data-open="vtt-equipment-window">ARSENAL</button><button class="gm-only-v3" data-action="director">DIREÇÃO</button><button class="gm-only-v3" data-action="manage">TRIPULAÇÃO</button><button class="gm-only-v3" data-action="shield">ESCUDO DO MESTRE</button></nav><section class="ms-table-v3-cards"></section></aside><main class="ms-table-v3-stage"></main><aside class="ms-table-v3-right"><section class="ms-table-v3-chat"></section><section class="ms-table-v3-dice"></section><section class="ms-table-v3-telemetry" hidden></section></aside></div><footer class="ms-table-v3-footer"><div data-ms-table-presence></div><div class="ms-table-v3-footer-actions"></div></footer><div class="ms-table-v3-overlays"></div><aside class="ms-table-v3-director" hidden><header><span>DIREÇÃO AO VIVO</span><button data-action="director-close">×</button></header><div class="ms-table-v3-director-state"><i></i><strong data-director-state>SESSÃO ATIVA</strong></div><div class="ms-table-v3-director-actions"><button data-action="pause">PAUSAR SESSÃO</button><button data-action="resume">RETOMAR SESSÃO</button><button data-action="manage">GERIR TRIPULAÇÃO</button><button data-action="shield">ABRIR ESCUDO DO MESTRE</button></div><label>AVISO GLOBAL<textarea data-director-notice maxlength="400" placeholder="Mensagem que será exibida para todos na mesa"></textarea></label><button class="primary" data-action="notice">TRANSMITIR AVISO</button></aside>`;
      screen.insertBefore(shell,header||screen.firstChild);
      const actions=shell.querySelector('.ms-table-v3-head-actions');
      const toolbar=header?.querySelector('.vtt-toolbar-buttons');
      if(toolbar){[...toolbar.children].forEach(btn=>{const call=String(btn.getAttribute('onclick')||'');if(/vtt-cards-window|vtt-grid-window|vtt-dice-box|vtt-chat-box/.test(call))return;actions.appendChild(btn);});}
      if(legacyTitle){legacyTitle.classList.add('ms-table-v3-legacy-title');shell.querySelector('.ms-table-v3-identity').appendChild(legacyTitle);}
      header?.remove(); quick?.remove(); presence?.remove();
      if(cards)shell.querySelector('.ms-table-v3-cards').appendChild(cards);if(grid)shell.querySelector('.ms-table-v3-stage').appendChild(grid);if(chat)shell.querySelector('.ms-table-v3-chat').appendChild(chat);if(dice)shell.querySelector('.ms-table-v3-dice').appendChild(dice);
      ['vtt-gallery-window','vtt-equipment-window'].forEach(id=>{const n=document.getElementById(id);if(n)shell.querySelector('.ms-table-v3-overlays').appendChild(n);});
      shell.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.open)window.toggleVttWindow?.(b.dataset.open);if(b.dataset.action==='director')toggleDirector(true);if(b.dataset.action==='director-close')toggleDirector(false);if(b.dataset.action==='manage')window.openManagePlayers?.();if(b.dataset.action==='shield')window.openMasterShield?.();if(b.dataset.action==='pause')await setLiveStatus('paused');if(b.dataset.action==='resume')await setLiveStatus('active');if(b.dataset.action==='notice')await sendNotice();});
      mounted=true;
    }
    screen.classList.add('ms-table-v3-active');
    const shell=document.getElementById('ms-table-v3');
    shell.querySelector('[data-ms-table-title]').textContent=table?.name||document.getElementById('vtt-table-name')?.textContent||'Mesa';
    shell.querySelector('[data-ms-table-code]').textContent=table?.code?`CÓDIGO ${table.code}`:'RASCUNHO';
    shell.classList.toggle('is-gm',!!asGM);shell.classList.toggle('is-admin',role()==='admin');shell.classList.toggle('is-paused',livePaused);updateDirector();
    shell.querySelectorAll('.gm-only-v3').forEach(x=>x.hidden=!asGM);
    [document.getElementById('vtt-cards-window'),document.getElementById('vtt-grid-window'),document.getElementById('vtt-chat-box'),document.getElementById('vtt-dice-box')].forEach(n=>{if(n)n.style.display='flex';});
    const currentHealth=window.MS_TABLE_SESSION?.current?.();
    if(currentHealth){
      lastHealth=currentHealth;
      const syncLabel=shell.querySelector('[data-ms-sync-label]'),healthEl=shell.querySelector('.ms-table-v3-health');
      const status=String(currentHealth.status||'idle');
      if(syncLabel)syncLabel.textContent=status.toUpperCase();
      if(healthEl)healthEl.dataset.status=status;
    }
    const tele=shell.querySelector('.ms-table-v3-telemetry');tele.hidden=role()!=='admin';if(role()==='admin')renderTelemetry(currentHealth||{});setRealtimeControlsEnabled(canUseRealtime());
    setTimeout(()=>{try{window.initVttGrid?.();window.vttCanvas?.calcOffset?.();window.vttCanvas?.requestRenderAll?.();}catch(_){}},60);
  }
  function canUseRealtime(){const ok=['synced','connected','SUBSCRIBED'].includes(String(lastHealth.status||''))||!activeTable?.id||String(activeTable.id)==='draft';return ok&&(activeAsGM||!livePaused);}
  function toggleDirector(show){const panel=document.querySelector('.ms-table-v3-director');if(panel&&activeAsGM)panel.hidden=show===undefined?!panel.hidden:!show;}
  function updateDirector(){window.__msTableLivePaused=livePaused;const shell=document.getElementById('ms-table-v3'),panel=shell?.querySelector('.ms-table-v3-director'),label=panel?.querySelector('[data-director-state]');if(shell)shell.classList.toggle('is-paused',livePaused);if(label)label.textContent=livePaused?'SESSÃO PAUSADA':'SESSÃO ATIVA';if(panel){panel.querySelector('[data-action="pause"]')?.toggleAttribute('hidden',livePaused);panel.querySelector('[data-action="resume"]')?.toggleAttribute('hidden',!livePaused);}setRealtimeControlsEnabled(canUseRealtime());}
  async function setLiveStatus(status){if(!activeAsGM||!activeTable?.id||String(activeTable.id)==='draft')return;try{const row=await window.MS_SERVICES?.Games?.setLiveStatus?.(activeTable.id,status);if(!row?.id)throw new Error('O servidor não confirmou a alteração.');livePaused=status==='paused';activeTable.status=status;updateDirector();window.MS_PLATFORM?.emit?.('table:live-status',{tableId:activeTable.id,status});window.MS_PLATFORM?.toast?.(livePaused?'Sessão pausada para os jogadores.':'Sessão retomada.','success');}catch(e){window.MS_PLATFORM?.toast?.(e?.message||'Não foi possível alterar o estado da sessão.','error');}}
  async function sendNotice(){if(!activeAsGM||!activeTable?.id)return;const input=document.querySelector('[data-director-notice]'),text=String(input?.value||'').trim();if(!text)return;try{await window.MS_TABLE_SESSION?.send?.('master_notice',{message:text});if(input)input.value='';window.MS_PLATFORM?.toast?.('Aviso transmitido à mesa.','success');}catch(e){window.MS_PLATFORM?.toast?.(e?.message||'Aviso não confirmado.','error');}}
  function renderTelemetry(h){const box=document.querySelector('.ms-table-v3-telemetry');if(!box||role()!=='admin')return;const p=Object.keys(h.presence||{}).length;box.innerHTML=`<span>DIAGNÓSTICO DO ARCONTE</span><dl><div><dt>Canal</dt><dd>${esc(h.status||'idle')}</dd></div><div><dt>Evento</dt><dd>#${Number(h.lastEventId||0)}</dd></div><div><dt>Fila</dt><dd>${Number(h.pending||0)}</dd></div><div><dt>Reconexões</dt><dd>${Number(h.reconnects||0)}</dd></div><div><dt>Presença</dt><dd>${p}</dd></div><div><dt>Backend</dt><dd>${esc(window.MS_CONFIG?.supabase?.projectRef||'—')}</dd></div></dl>`;}
  window.addEventListener('ms:table-shell-refresh',e=>mount(e.detail?.table,e.detail?.asGM));
  document.addEventListener('table:session-health',()=>{});
  window.addEventListener('table:session-health',()=>{});
  function setRealtimeControlsEnabled(enabled){
    const input=document.getElementById('chat-input');if(input){input.disabled=!enabled;input.placeholder=enabled?'Mensagem...':'Aguardando sincronização da mesa…';}
    document.querySelectorAll('#vtt-chat-box button[onclick*=\"sendChatMessage\"],#vtt-dice-box button[onclick*=\"roll3DDice\"]').forEach(b=>{b.disabled=!enabled;b.title=enabled?'':'Recurso compartilhado indisponível até a mesa sincronizar.';});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    window.MS_PLATFORM?.on?.('table:session-health',h=>{lastHealth=h||{};const shell=document.getElementById('ms-table-v3');if(!shell)return;const label=shell.querySelector('[data-ms-sync-label]'),health=shell.querySelector('.ms-table-v3-health');const status=String(h.status||'offline');if(label)label.textContent=status.toUpperCase();if(health)health.dataset.status=status;setRealtimeControlsEnabled(canUseRealtime());renderTelemetry(h);});window.MS_PLATFORM?.on?.('table:live-status',e=>{if(activeTable?.id&&String(e?.tableId||'')!==String(activeTable.id))return;livePaused=String(e?.status)==='paused';if(activeTable)activeTable.status=livePaused?'paused':'active';updateDirector();});
  });
  window.MS_TABLE_SHELL=Object.freeze({mount,renderTelemetry});
})();
