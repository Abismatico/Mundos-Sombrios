/* Mundos Sombrios — Offline/Sandbox UI lazy loader v2.10.1 */
(function(){
  'use strict';
  if(!window.MS_DB?.offline && !window.MS_RUNTIME_CONFIG?.offlineMode) return;
  const load=()=>{
    if(document.querySelector('script[data-ms-offline-ui]')) return;
    const s=document.createElement('script');
    s.src='js/offline-sandbox-ui.js';
    s.dataset.msOfflineUi='1';
    document.body.appendChild(s);
  };
  load();
})();
