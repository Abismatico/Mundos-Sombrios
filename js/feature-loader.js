/* Mundos Sombrios — carregamento sob demanda de áreas pesadas V2.4 */
(function(){
  'use strict';
  let builderPromise=null,builderReady=false,dicePromise=null,historyPromise=null;
  const builderCss=[
    'css/esoterico-surgery.css',
    'css/archetype-art-direction-v0.63.css',
    'css/builder/builder-modern-v0.62.css',
    'css/builder/builder-art-direction-v0.63.css',
    'css/immersive-experience.css'
  ];
  const builderScripts=[
    'js/hermetico-rituais.js',
    'js/linhagem-tree.js',
    'js/exodo-nexo.js',
    'js/aprimorador-engenharia.js',
    'js/projeto-player-interface.js',
    'js/mundos-updates.js',
    'js/esoterico-surgery.js',
    'js/gallery-editor.js',
    'js/ordem-sete.js',
    'js/power-registry.js',
    'js/immersive-experience.js'
  ];
  function css(href){if([...document.styleSheets].some(x=>x.href?.endsWith(href)))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.msFeature='builder';document.head.appendChild(l)}
  function script(src){return new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-ms-feature-src="${src}"]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset.msFeatureSrc=src;s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error(`Não foi possível carregar ${src}`));document.body.appendChild(s)})}
  async function ensureBuilder(){
    if(builderReady)return true;if(builderPromise)return builderPromise;
    builderPromise=(async()=>{
      document.body.classList.add('ms-feature-loading');builderCss.forEach(css);window.MS_PLATFORM?.setStatus?.('builder','loading');
      for(const src of builderScripts)await script(src);
      builderReady=true;document.body.classList.remove('ms-feature-loading');window.MS_PLATFORM?.setStatus?.('builder','success');window.MS_PLATFORM?.emit?.('builder:extensions-ready',{});return true;
    })().catch(error=>{builderPromise=null;document.body.classList.remove('ms-feature-loading');window.MS_PLATFORM?.setStatus?.('builder','error',error);throw error});
    return builderPromise;
  }

  async function ensureDice(){
    if(window.MS_DICE_3D)return true;
    if(!dicePromise)dicePromise=script('js/dice-3d.js').then(()=>true).catch(error=>{dicePromise=null;throw error});
    return dicePromise;
  }
  async function ensureMasterHistory(){
    if(window.MS_MASTER_HISTORY)return true;
    if(!historyPromise)historyPromise=script('js/master-history-data.js').then(()=>true).catch(error=>{historyPromise=null;throw error});
    return historyPromise;
  }
  window.MS_FEATURES={ensureBuilder,ensureDice,ensureMasterHistory,isBuilderReady:()=>builderReady,builderScripts:[...builderScripts]};
})();
