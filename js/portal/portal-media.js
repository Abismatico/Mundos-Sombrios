/* Mundos Sombrios — Portal Oficial / Biblioteca de mídia V0.61.3
   Fonte única para armazenamento binário de imagens e vídeos do Portal.
*/
(function(){
  'use strict';
  const DB_NAME='MundosSombriosPortalMediaV1';
  const STORE='media';
  const MAX_IMAGE=8*1024*1024;
  const MAX_VIDEO=40*1024*1024;
  const urlCache=new Map();
  let dbPromise=null;

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('IndexedDB indisponível neste navegador.'));return;}
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Falha ao abrir armazenamento de mídia.'));
    });
    return dbPromise;
  }
  async function put(file){
    if(!file)return null;
    const type=String(file.type||'').toLowerCase();
    const kind=type.startsWith('image/')?'image':type.startsWith('video/')?'video':null;
    if(!kind)throw new Error('Selecione uma imagem ou vídeo válido.');
    const max=kind==='image'?MAX_IMAGE:MAX_VIDEO;
    if(file.size>max)throw new Error(`${kind==='image'?'Imagem':'Vídeo'} excede o limite de ${Math.round(max/1024/1024)} MB.`);

    if (window.MS_DB && window.MS_DB.ready && typeof window.MS_DB.uploadPortalMedia === 'function') {
      try {
        const remote = await window.MS_DB.uploadPortalMedia(file);
        if (remote && remote.url) {
          return { id: remote.id, type: remote.type, kind: remote.kind, name: remote.name, alt: '', url: remote.url, remote: true };
        }
      } catch (_error) {
        // fallback local
      }
    }

    const id=`portal-media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const record={id,blob:file,type,kind,name:file.name||id,createdAt:new Date().toISOString()};
    const db=await openDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Falha ao salvar mídia.'));});
    return {id,type,kind,name:record.name,alt:'', remote:false};
  }
  async function get(id){
    if(!id)return null;
    if (window.MS_DB && window.MS_DB.ready && typeof id === 'string' && id.includes('/')) {
      return { id, kind: id.includes('.mp4') || id.includes('.webm') ? 'video' : 'image', name: id.split('/').pop(), path: id, remote: true };
    }
    const db=await openDb();
    return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||new Error('Falha ao ler mídia.'));});
  }
  async function url(id){
    if(!id)return '';
    if (typeof id === 'string' && id.includes('/')) {
      const remoteUrl = window.MS_DB && window.MS_DB.ready && typeof window.MS_DB.getPortalMediaUrl === 'function'
        ? await window.MS_DB.getPortalMediaUrl(id)
        : '';
      if (remoteUrl) return remoteUrl;
    }
    if(urlCache.has(id))return urlCache.get(id);
    const record=await get(id);
    if(!record)return '';
    const objectUrl=URL.createObjectURL(record.blob);
    urlCache.set(id,objectUrl);
    return objectUrl;
  }
  async function remove(id){
    if(!id)return;
    if (window.MS_DB && window.MS_DB.ready && typeof window.MS_DB.removePortalMedia === 'function' && typeof id === 'string' && id.includes('/')) {
      try { await window.MS_DB.removePortalMedia(id); } catch (_error) {}
    }
    const cached=urlCache.get(id); if(cached){URL.revokeObjectURL(cached);urlCache.delete(id);}
    const db=await openDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Falha ao excluir mídia.'));});
  }
  async function prepareContent(content){
    const map={};
    const add=async ref=>{if(ref&&ref.id){const u=await url(ref.id);if(u)map[ref.id]=u;}};
    await add(content.hero?.media); await add(content.featured?.media);
    const groups=['announcements','events','classes','expansions','community','stories','worlds'];
    for(const key of groups)for(const item of (content[key]||[]))await add(item.media);
    return map;
  }
  function revokeAll(){for(const u of urlCache.values())URL.revokeObjectURL(u);urlCache.clear();}
  window.PortalMedia={DB_NAME,MAX_IMAGE,MAX_VIDEO,put,get,url,remove,prepareContent,revokeAll};
})();
