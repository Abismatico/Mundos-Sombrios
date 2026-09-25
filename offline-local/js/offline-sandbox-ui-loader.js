/* Mundos Sombrios — Offline/Sandbox UI lazy loader v2.10.4 */
(()=>{
  'use strict';
  async function boot(){
    try { if(window.MS_DB_READY) await window.MS_DB_READY; } catch(_) {}
    if(!window.MS_DB?.offline && !window.MS_RUNTIME_CONFIG?.offlineMode) return;
    if(document.querySelector('script[data-ms-offline-ui]')) return;
    const s=document.createElement('script');
    s.src='js/offline-sandbox-ui.js';
    s.dataset.msOfflineUi='1';
    document.head.appendChild(s);
  }
  boot();
})();
