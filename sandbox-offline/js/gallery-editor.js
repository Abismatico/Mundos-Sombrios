/*
 * MUNDOS SOMBRIOS — GALERIA / EDITOR DE CORTE
 * Proprietario canônico do fluxo de imagens da ficha.
 * Implementação nativa por Canvas: não depende de Cropper.js/CDN.
 */
(function installGalleryEditor(){
  'use strict';

  const state={
    target:null,index:-1,src:'',image:null,rotation:0,scale:1,minScale:1,offsetX:0,offsetY:0,
    aspectRatio:1,freeAspect:true,dragging:false,pointerX:0,pointerY:0
  };

  function byId(id){ return document.getElementById(id); }
  function canvas(){ return byId('crop-canvas'); }
  function ctx(){ const c=canvas(); return c?c.getContext('2d'):null; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function normalizeRatio(r){ const n=Number(r); return Number.isFinite(n)&&n>0?n:null; }

  function fitCanvas(){
    const c=canvas(), host=c&&c.parentElement; if(!c||!host) return;
    const rect=host.getBoundingClientRect();
    c.width=Math.max(320,Math.floor(rect.width));
    c.height=Math.max(260,Math.floor(Math.min(rect.height||420,520)));
  }

  function cropRect(){
    const c=canvas(); if(!c) return null;
    const pad=22, maxW=c.width-pad*2, maxH=c.height-pad*2;
    let w=maxW,h=maxH;
    if(state.freeAspect){ w=maxW; h=maxH; }
    else if(state.aspectRatio>=1){ w=maxW; h=Math.min(maxH,w/state.aspectRatio); }
    else { h=maxH; w=Math.min(maxW,h*state.aspectRatio); }
    return {x:(c.width-w)/2,y:(c.height-h)/2,w,h};
  }

  function resetTransform(){
    if(!state.image) return;
    const c=canvas(), angle=Math.abs(state.rotation)%180===90;
    const iw=angle?state.image.naturalHeight:state.image.naturalWidth;
    const ih=angle?state.image.naturalWidth:state.image.naturalHeight;
    state.minScale=Math.max(0.05,Math.max(c.width/iw,c.height/ih));
    state.scale=state.minScale;
    state.offsetX=0; state.offsetY=0; state.rotation=0;
    draw();
  }

  function draw(){
    const c=canvas(), g=ctx(); if(!c||!g) return;
    g.clearRect(0,0,c.width,c.height);
    g.fillStyle='#0b0b0b'; g.fillRect(0,0,c.width,c.height);
    if(state.image){
      g.save();
      g.translate(c.width/2+state.offsetX,c.height/2+state.offsetY);
      g.rotate(state.rotation*Math.PI/180);
      g.scale(state.scale,state.scale);
      g.drawImage(state.image,-state.image.naturalWidth/2,-state.image.naturalHeight/2);
      g.restore();
    }
    const r=cropRect();
    if(!r) return;
    g.save();
    g.fillStyle='rgba(0,0,0,.60)';
    g.beginPath(); g.rect(0,0,c.width,c.height); g.rect(r.x,r.y,r.w,r.h); g.fill('evenodd');
    g.strokeStyle='#d4af37'; g.lineWidth=2; g.strokeRect(r.x,r.y,r.w,r.h);
    g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=1;
    g.beginPath();
    g.moveTo(r.x+r.w/3,r.y); g.lineTo(r.x+r.w/3,r.y+r.h);
    g.moveTo(r.x+r.w*2/3,r.y); g.lineTo(r.x+r.w*2/3,r.y+r.h);
    g.moveTo(r.x,r.y+r.h/3); g.lineTo(r.x+r.w,r.y+r.h/3);
    g.moveTo(r.x,r.y+r.h*2/3); g.lineTo(r.x+r.w,r.y+r.h*2/3);
    g.stroke(); g.restore();
  }

  function setRatio(r){
    state.freeAspect=!normalizeRatio(r);
    if(!state.freeAspect) state.aspectRatio=normalizeRatio(r);
    draw(); return true;
  }

  function zoom(delta){
    if(!state.image) return false;
    state.scale=clamp(state.scale*(1+Number(delta||0)),state.minScale,Math.max(state.minScale*8,8));
    draw(); return true;
  }

  window.openCropModal=function(imageSrc,target='avatar',index=-1){
    const modal=byId('crop-modal'), c=canvas();
    if(!modal||!c){ alert('Editor de corte indisponível.'); return false; }
    if(!imageSrc){ alert('Nenhuma imagem válida foi selecionada.'); return false; }
    const img=new Image();
    img.onload=()=>{
      state.src=imageSrc; state.target=target; state.index=Number.isFinite(Number(index))?Number(index):-1;
      state.image=img; state.aspectRatio=target==='avatar'?1:1; state.freeAspect=target!=='avatar';
      modal.style.display='flex';
      requestAnimationFrame(()=>{ fitCanvas(); resetTransform(); });
    };
    img.onerror=()=>alert('Não foi possível carregar a imagem selecionada.');
    img.src=imageSrc;
    return true;
  };

  window.setAspectRatio=function(ratio){ return setRatio(ratio); };
  window.rotateCrop=function(degrees){ if(!state.image)return false; state.rotation=(state.rotation+Number(degrees||0))%360; draw(); return true; };
  window.zoomCrop=function(delta){ return zoom(delta); };
  window.resetCrop=function(){ if(!state.image)return false; resetTransform(); return true; };

  window.cancelCrop=function(){
    const modal=byId('crop-modal'); if(modal) modal.style.display='none';
    state.target=null; state.index=-1; state.image=null; state.src=''; state.dragging=false;
    const g=ctx(); if(g&&canvas()) g.clearRect(0,0,canvas().width,canvas().height);
    return true;
  };

  window.confirmCrop=function(){
    if(!state.image){ alert('Nenhuma área de corte está ativa.'); return false; }
    try{
      const srcCanvas=canvas(), r=cropRect();
      const ratio=r.w/r.h;
      const outW=640, outH=Math.max(1,Math.round(outW/ratio));
      const out=document.createElement('canvas'); out.width=outW; out.height=outH;
      const g=out.getContext('2d');
      g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
      // Reproduz o mesmo transform do viewport, mas deslocado pelo recorte.
      g.save();
      g.beginPath(); g.rect(0,0,outW,outH); g.clip();
      const sx=outW/r.w, sy=outH/r.h;
      g.scale(sx,sy);
      g.translate(srcCanvas.width/2+state.offsetX-r.x,srcCanvas.height/2+state.offsetY-r.y);
      g.rotate(state.rotation*Math.PI/180);
      g.scale(state.scale,state.scale);
      g.drawImage(state.image,-state.image.naturalWidth/2,-state.image.naturalHeight/2);
      g.restore();
      const base64=out.toDataURL('image/jpeg',0.78);
      const target=state.target, idx=state.index;
      if(target==='avatar'){
        currentAvatarBase64=base64;
        const host=byId('avatar-preview-container'); if(host) host.innerHTML=`<img src="${base64}" alt="Retrato">`;
      }else if(target==='gallery-edit'){
        if(idx<0||!Array.isArray(currentGallery)||idx>=currentGallery.length) throw new Error('Imagem da galeria não encontrada.');
        currentGallery[idx]=base64; window.renderGallery();
      }else if(target==='gallery'){
        if(!Array.isArray(currentGallery)) currentGallery=[];
        if(currentGallery.length>=10) throw new Error('A galeria já atingiu o limite de 10 imagens.');
        currentGallery.push(base64); window.renderGallery();
      }else throw new Error('Destino do corte desconhecido.');
      window.cancelCrop(); return true;
    }catch(error){ console.error('[Mundos Sombrios] Falha no editor de corte:',error); alert(`Não foi possível concluir o corte: ${error.message||'erro desconhecido'}`); return false; }
  };

  function bindCanvas(){
    const c=canvas(); if(!c||c.__msBound) return;
    c.__msBound=true;
    c.addEventListener('pointerdown',e=>{ if(!state.image)return; state.dragging=true; state.pointerX=e.clientX; state.pointerY=e.clientY; c.setPointerCapture?.(e.pointerId); });
    c.addEventListener('pointermove',e=>{ if(!state.dragging)return; state.offsetX+=e.clientX-state.pointerX; state.offsetY+=e.clientY-state.pointerY; state.pointerX=e.clientX; state.pointerY=e.clientY; draw(); });
    c.addEventListener('pointerup',e=>{ state.dragging=false; c.releasePointerCapture?.(e.pointerId); });
    c.addEventListener('pointercancel',()=>{state.dragging=false;});
    c.addEventListener('wheel',e=>{ if(!state.image)return; e.preventDefault(); zoom(e.deltaY<0?.08:-.08); },{passive:false});
    window.addEventListener('resize',()=>{ if(state.image){ fitCanvas(); draw(); }});
    bindCanvas.__bound=true;
  }

  window.removeGalleryImage=function(idx,event){
    if(event) event.stopPropagation(); if(!Array.isArray(currentGallery)||idx<0||idx>=currentGallery.length)return false;
    currentGallery.splice(idx,1); window.renderGallery(); return true;
  };

  window.renderGallery=function renderGalleryCanonical(){
    const container=byId('gallery-container'); if(!container)return;
    container.innerHTML=''; const list=Array.isArray(currentGallery)?currentGallery:[];
    list.forEach((src,idx)=>{
      const item=document.createElement('div'); item.className='gallery-thumb';
      const img=document.createElement('img'); img.src=src; img.alt=`Imagem da galeria ${idx+1}`;
      img.addEventListener('click',()=>viewFullscreen(src)); item.appendChild(img);
      if(typeof isEditMode==='undefined'||isEditMode){
        const edit=document.createElement('button'); edit.type='button'; edit.className='edit-gallery-btn'; edit.textContent='✎ Cortar';
        edit.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.openCropModal(currentGallery[idx],'gallery-edit',idx);}); item.appendChild(edit);
        const del=document.createElement('button'); del.type='button'; del.className='delete-btn'; del.textContent='X'; del.title='Excluir imagem';
        del.addEventListener('click',e=>window.removeGalleryImage(idx,e)); item.appendChild(del);
      }
      container.appendChild(item);
    });
  };

  bindCanvas();
  window.__galleryEditorOwner='js/gallery-editor.js';
  window.__galleryEditorReady=true;
  window.__galleryCropEngine='native-canvas';
})();
