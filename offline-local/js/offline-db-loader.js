/* Offline DB loader v2.10.4 — seguro com scripts defer. */
(()=>{
  'use strict';
  if(window.MS_CONFIG?.supabase?.configured){
    window.MS_OFFLINE_DB_READY=Promise.resolve(null);
    return;
  }
  if(window.MS_OFFLINE_DB?.create){
    window.MS_OFFLINE_DB_READY=Promise.resolve(window.MS_OFFLINE_DB);
    return;
  }
  window.MS_OFFLINE_DB_READY=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-ms-offline-db]');
    if(existing){
      existing.addEventListener('load',()=>resolve(window.MS_OFFLINE_DB||null),{once:true});
      existing.addEventListener('error',()=>reject(new Error('Falha ao carregar o adaptador offline.')),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src='js/offline-db.js';
    s.dataset.msOfflineDb='1';
    s.async=false;
    s.onload=()=>resolve(window.MS_OFFLINE_DB||null);
    s.onerror=()=>reject(new Error('Falha ao carregar o adaptador offline.'));
    document.head.appendChild(s);
  });
})();
