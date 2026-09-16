/* Mundos Sombrios — Dados poliédricos 3D sem dependências V2.4
   Renderização 3D por projeção de malha em Canvas 2D. Evita Three.js/WebGL e mantém o VTT leve.
*/
(function(){
  'use strict';
  const TAU=Math.PI*2, PHI=(1+Math.sqrt(5))/2;
  const palettes={d4:'#a56cff',d6:'#5aa8ff',d8:'#46d5ca',d10:'#d56cff',d12:'#d4af37',d20:'#ff687c'};
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
  function normalizeMesh(mesh){let r=0;mesh.vertices.forEach(v=>r=Math.max(r,Math.hypot(...v)));const k=1.18/(r||1);return {vertices:mesh.vertices.map(v=>v.map(x=>x*k)),faces:mesh.faces};}
  function cube(){return normalizeMesh({vertices:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]]});}
  function tetra(){return normalizeMesh({vertices:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],faces:[[0,2,1],[0,1,3],[0,3,2],[1,2,3]]});}
  function octa(){return normalizeMesh({vertices:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],faces:[[4,0,2],[4,2,1],[4,1,3],[4,3,0],[5,2,0],[5,1,2],[5,3,1],[5,0,3]]});}
  function d10(){const v=[[0,0,1.55],[0,0,-1.55]];for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5;v.push([Math.cos(a)*1.18,Math.sin(a)*1.18,0]);}const f=[];for(let i=0;i<5;i++){const a=2+i,b=2+((i+1)%5);f.push([0,a,b]);f.push([1,b,a]);}return normalizeMesh({vertices:v,faces:f});}
  function d12(){const v=[],idx=new Map(),key=(x,y,z)=>`${x},${y},${z}`;function V(x,y,z){const k=key(x,y,z);if(!idx.has(k)){idx.set(k,v.length);v.push([x,y,z]);}return idx.get(k)}
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])V(x,y,z);
    const xp=V(2,0,0),xm=V(-2,0,0),yp=V(0,2,0),ym=V(0,-2,0),zp=V(0,0,2),zm=V(0,0,-2);
    const c=(x,y,z)=>V(x,y,z);
    const f=[
      [xp,c(1,1,1),yp,c(1,1,-1)],[xm,c(-1,-1,1),ym,c(-1,-1,-1)],
      [xp,c(1,-1,1),ym,c(1,-1,-1)],[xm,c(-1,1,1),yp,c(-1,1,-1)],
      [xp,c(1,1,1),zp,c(1,-1,1)],[xm,c(-1,1,-1),zm,c(-1,-1,-1)],
      [xp,c(1,1,-1),zm,c(1,-1,-1)],[xm,c(-1,1,1),zp,c(-1,-1,1)],
      [yp,c(1,1,1),zp,c(-1,1,1)],[ym,c(1,-1,-1),zm,c(-1,-1,-1)],
      [yp,c(1,1,-1),zm,c(-1,1,-1)],[ym,c(1,-1,1),zp,c(-1,-1,1)]
    ];return normalizeMesh({vertices:v,faces:f});}
  function icosa(){const v=[[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]];const f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];return normalizeMesh({vertices:v,faces:f});}
  const meshes={d4:tetra(),d6:cube(),d8:octa(),d10:d10(),d12:d12(),d20:icosa()};
  function hexToRgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
  function color(type,light,alpha=1){const [r,g,b]=hexToRgb(palettes[type]||palettes.d20),mix=.18+.82*Math.max(0,Math.min(1,light));return `rgba(${Math.round(r*mix+18*(1-mix))},${Math.round(g*mix+20*(1-mix))},${Math.round(b*mix+25*(1-mix))},${alpha})`}
  function rotate(v,rx,ry,rz){let [x,y,z]=v;let c=Math.cos(rx),s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ry);s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];return [x,y,z]}
  function setup(canvas){const rect=canvas.getBoundingClientRect(),cssW=Math.max(180,Math.round(rect.width||260)),cssH=Math.max(180,Math.round(rect.height||260)),dpr=Math.min(2,window.devicePixelRatio||1);if(canvas.width!==Math.round(cssW*dpr)||canvas.height!==Math.round(cssH*dpr)){canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);}const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:cssW,h:cssH}}
  function draw(canvas,type,angles,result,lift=0,scaleMul=1){const mesh=meshes[type]||meshes.d20,{ctx,w,h}=setup(canvas);ctx.clearRect(0,0,w,h);const verts=mesh.vertices.map(v=>rotate(v,...angles));const camera=4.3,focal=3.25,base=Math.min(w,h)*.31*scaleMul;const proj=verts.map(v=>{const q=focal/(camera-v[2]);return [w/2+v[0]*base*q,h/2+v[1]*base*q-lift,v[2]]});const faces=mesh.faces.map((face,i)=>{const vv=face.map(ix=>verts[ix]);const avg=vv.reduce((a,b)=>add(a,b),[0,0,0]).map(x=>x/vv.length);const n=norm(cross(sub(vv[1],vv[0]),sub(vv[2],vv[0])));return {face,i,avgZ:avg[2],normal:n,center:avg};}).sort((a,b)=>a.avgZ-b.avgZ);const light=norm([-0.35,-0.55,1]);
    ctx.lineJoin='round';ctx.lineCap='round';for(const item of faces){const pts=item.face.map(ix=>proj[ix]);const shade=.18+.82*Math.abs(dot(item.normal,light));ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=color(type,shade,.96);ctx.fill();ctx.strokeStyle='rgba(225,240,255,.52)';ctx.lineWidth=1.15;ctx.stroke();}
    const near=faces[faces.length-1];if(result!==undefined&&result!==null&&result!=='?'&&near){const ps=near.face.map(ix=>proj[ix]),cx=ps.reduce((n,p)=>n+p[0],0)/ps.length,cy=ps.reduce((n,p)=>n+p[1],0)/ps.length;ctx.fillStyle='rgba(255,255,255,.96)';ctx.font=`800 ${Math.max(18,Math.min(w,h)*.105)}px Orbitron, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=palettes[type];ctx.shadowBlur=12;ctx.fillText(String(result),cx,cy);ctx.shadowBlur=0;}
  }
  function overlay(type,value,root=document){const el=root.querySelector?.('#dice-3d-overlay');if(!el)return;const s=el.querySelector('small'),b=el.querySelector('strong');if(s)s.textContent=String(type||'d20').toUpperCase();if(b)b.textContent=value??'?';el.style.setProperty('--die-accent',palettes[type]||palettes.d20)}
  function animate(canvas,type,result,{duration=1050,overlayRoot=document}={}){return new Promise(resolve=>{const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const total=reduce?180:duration,start=performance.now(),seed=(Date.now()%997)/997*TAU;function frame(ts){const t=Math.min(1,(ts-start)/total),ease=1-Math.pow(1-t,3),spin=(1-ease)*7.5;const angles=[seed+ease*TAU*2.7+spin,seed*.7+ease*TAU*3.5,seed*1.4+ease*TAU*2.2];const lift=Math.sin(Math.PI*t)*Math.min(34,canvas.clientHeight*.15);const scale=1+.09*Math.sin(Math.PI*t);draw(canvas,type,angles,t>.91?result:null,lift,scale);if(t<1){requestAnimationFrame(frame)}else{draw(canvas,type,angles,result,0,1);overlay(type,result,overlayRoot);resolve(result)}}overlay(type,'?',overlayRoot);requestAnimationFrame(frame)})}
  function mainCanvas(){return document.getElementById('dice-3d-canvas')}
  function setStatic(type='d20',result='?'){const canvas=mainCanvas();if(!canvas)return;draw(canvas,type,[.55,.7,.15],result);overlay(type,result)}
  async function play(type,result,opts={}){const canvas=mainCanvas();if(!canvas)return result;return animate(canvas,type,result,opts)}
  function broadcast(type,result,sender='Jogador'){
    document.querySelectorAll('.ms-dice-broadcast').forEach(x=>x.remove());const box=document.createElement('div');box.className='ms-dice-broadcast';box.innerHTML=`<canvas width="190" height="190" aria-hidden="true"></canvas><div><small>${String(sender).replace(/[<>&]/g,'')}</small><b>${String(type).toUpperCase()} · ${result}</b></div>`;document.body.appendChild(box);const canvas=box.querySelector('canvas');requestAnimationFrame(()=>box.classList.add('show'));animate(canvas,type,result,{duration:900,overlayRoot:box}).finally(()=>setTimeout(()=>{box.classList.remove('show');setTimeout(()=>box.remove(),220)},950));setStatic(type,result);
  }
  window.MS_DICE_3D={play,broadcast,setStatic,types:Object.keys(meshes),meshes};
  const bootDice=()=>setStatic('d20','?');
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootDice,{once:true});else bootDice();
})();
