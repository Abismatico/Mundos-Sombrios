// Mundos Sombrios — Escudo do Mestre (integrado ao design original)
(function(){
  'use strict';
  window.openMasterShield=function(){
    const role=String(window.currentUser?.role||'').toLowerCase();
    if(role!=='mestre' && role!=='admin'){ alert('Acesso restrito a Mestres e ADM.'); return; }
    if(typeof window.showScreen==='function') window.showScreen('screen-master-shield');
    setTimeout(()=>window.msShieldInit?.(),50);
  };
  const root=document.getElementById('master-shield-content');
  if(!root){ console.warn('[Escudo] container master-shield-content ainda nao existe.'); return; }
  window.msShieldInit=window.msShieldInit||function(){};
  const qs=s=>root.querySelector(s);
  const qsa=s=>root.querySelectorAll(s);
  const tt=qs('#ms-tooltip');
  const msGo=v=>{
    qsa('.ms-view').forEach(x=>x.classList.remove('active'));
    const el=qs('#ms-v-'+v);
    if(el)el.classList.add('active');
    qsa('.master-shield-nav button').forEach(b=>b.classList.toggle('active',b.dataset.msView===v));
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const tipMove=e=>{if(tt){tt.style.left=(e.clientX+16)+'px';tt.style.top=(e.clientY+12)+'px';}};
  const tipShow=html=>{if(tt){tt.innerHTML=html;tt.style.display='block';}};
  const tipHide=()=>{if(tt)tt.style.display='none';};
  root.addEventListener('mousemove',tipMove);
  const ALN={pro:['#4fd8c7','PRÓ-NEXO'],ant:['#e02832','ANT-NEXO'],neu:['#c9a227','ÁREA CINZENTA']};

/* ══════════ CRONOLOGIA ══════════ */
(function(){
  let h = `<div class="stamp">REGISTRO TEMPORAL — ∆ ARQUIVO DE ERAS</div>
  <h1 class="vt">Cronologia do Planeta-Fonte</h1>
  <p class="sub">// DA PRIMEIRA SEMEADURA DOS COLETORES AO ANO 100 PÓS-GUERRA DA EXTINÇÃO — A COLHEITA É UMA CONTAGEM DECRESCENTE</p><div class="tl">`;
  TIMELINE.forEach(t=>{
    h += `<div class="tl-item"><span class="ano">◈ ${t.ano}</span><h4>${t.titulo}</h4><p>${t.txt}</p></div>`;
  });
  h += `</div><div class="panel vio"><h3>◈ Nota de Calibração Histórica</h3><p style="color:var(--ink-dim)">Num mundo que nunca conheceu as Primeira e Segunda Guerras Mundiais, a <b>Guerra da Extinção (G.E.)</b> permanece como o primeiro e único cataclismo global absoluto da história. A Era dos Heróis começou 177 anos atrás (ano 5608 da era corrente) e foi aniquilada sob o pretexto de "ordem pública". Toda a linha do tempo detalhada está transcrita nos documentos <b>Guia Histórico</b> e <b>Registros Históricos</b> na aba ARQUIVOS.</p></div>`;
  qs('#ms-v-linha').innerHTML = h;
})();

/* ══════════ MAPA GLOBAL INTERATIVO ══════════ */
(function(){
  const terra = `
  <g fill="#141a21" stroke="#2c3542" stroke-width="1.2">
    <path d="M60,90 L150,55 L260,60 L330,95 L350,140 L310,175 L290,230 L240,265 L185,250 L150,205 L100,190 L70,150 Z"/>
    <path d="M255,280 L330,275 L365,310 L355,365 L330,430 L295,470 L265,440 L250,380 L235,330 Z"/>
    <path d="M425,80 L480,55 L545,65 L575,95 L560,135 L520,155 L470,165 L435,145 L415,110 Z"/>
    <path d="M445,185 L520,175 L575,200 L590,255 L575,320 L545,395 L510,410 L485,350 L460,290 L440,240 Z"/>
    <path d="M580,70 L700,50 L820,70 L890,110 L905,160 L860,200 L830,250 L790,275 L740,255 L690,235 L640,210 L600,170 L575,120 Z"/>
    <path d="M830,360 L905,355 L950,390 L940,440 L880,460 L835,430 Z"/>
    <path d="M955,415 L985,410 L995,440 L965,455 Z"/>
    <ellipse cx="955" cy="32" rx="26" ry="20" fill="#1a212b" stroke="#c9a227" stroke-dasharray="3 3"/>
  </g>
  <g stroke="#1c232d" stroke-width="0.5">${Array.from({length:19},(_,i)=>`<line x1="${(i+1)*50}" y1="0" x2="${(i+1)*50}" y2="500"/>`).join('')}${Array.from({length:9},(_,i)=>`<line x1="0" y1="${(i+1)*50}" x2="1000" y2="${(i+1)*50}"/>`).join('')}</g>
  <text x="955" y="36" text-anchor="middle" fill="#c9a227" font-size="9" font-family="monospace">☾ ÁPICE</text>`;
  let pts='';
  NACOES.forEach((n,i)=>{
    const c = ALN[n.al][0];
    pts += `<g class="nacao" data-i="${i}"><circle cx="${n.x}" cy="${n.y}" r="14" fill="${c}" opacity="0.14"/><circle cx="${n.x}" cy="${n.y}" r="5.5" fill="${c}" stroke="#0a0b0d" stroke-width="1.5"/><circle cx="${n.x}" cy="${n.y}" r="9" fill="none" stroke="${c}" stroke-width="0.8" opacity="0.6"><animate attributeName="r" values="7;13;7" dur="3s" begin="${(i%7)*0.4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0;0.7" dur="3s" begin="${(i%7)*0.4}s" repeatCount="indefinite"/></circle></g>`;
  });
  qs('#ms-v-mapa').innerHTML = `<div class="stamp amb">CARTOGRAFIA TÁTICA — VIGÊNCIA T.S.I.N. / ANO 100</div><h1 class="vt">Mapa Global — As 50 Potências</h1><p class="sub">// Passe o cursor e clique nas nações · Alinhamento face ao Tratado de Segregação Internacional de Nexos</p><div class="map-wrap"><svg viewBox="0 0 1000 500">${terra}${pts}</svg></div><div class="map-legend"><span><i style="background:${ALN.ant[0]}"></i>BLOCO ANT-NEXO (PURISMO)</span><span><i style="background:${ALN.pro[0]}"></i>BLOCO PRÓ-NEXO (RESISTÊNCIA VELADA)</span><span><i style="background:${ALN.neu[0]}"></i>ÁREA CINZENTA / NEUTRO</span></div><div id="ms-nacao-det" style="margin-top:18px"></div><div class="panel" style="margin-top:18px"><h3>▣ Leitura Estratégica (Ano 100)</h3><p style="color:var(--ink-dim)">A Paz do Terror: com os <b style="color:var(--red-hi)">Angels de Voglaskov</b> como dissuasão absoluta, as guerras migraram para a espionagem e o mercado de mercenários nas fronteiras da Europa Oriental. <b style="color:var(--cyan)">Hakuré (Brasil)</b> ancora o bloco Pró-Nexo com biotecnologia hiper-avançada; o <b style="color:var(--red-hi)">Dólar Federal</b> apodrece em estado policial; e a <b style="color:var(--amber-hi)">Libra Colonial</b> só existe porque a Protheus Corp a injeta artificialmente. Na órbita, a <b>Base Lunar Ápice</b> vigia o vácuo — e algo no vácuo começou a responder.</p></div>`;
  qsa('.nacao').forEach(g=>{
    const n = NACOES[+g.dataset.i];
    g.addEventListener('mouseenter',()=>tipShow(`<b>${n.n}</b><span>≈ ${n.real} · ${ALN[n.al][1]}</span><span class="moeda">${n.moeda} — ${n.cot}</span>`));
    g.addEventListener('mouseleave',tipHide);
    g.addEventListener('click',()=>{
      const c = ALN[n.al][0];
      qs('#ms-nacao-det').innerHTML = `<div class="panel" style="border-left-color:${c}"><div class="stamp" style="color:${c};border-color:${c}">${ALN[n.al][1]}</div><h1 class="vt" style="font-size:30px">${n.n}</h1><p class="sub">// EQUIVALENTE DO MUNDO REAL: ${n.real.toUpperCase()}</p><table class="data"><tr><th>Câmbio Oficial</th><th>Cotação (Ano 100)</th></tr><tr><td>${n.moeda}</td><td style="color:var(--cyan)">${n.cot}</td></tr></table><p style="color:var(--ink-dim);margin-top:8px">${n.nota}</p></div>`;
      qs('#ms-nacao-det').scrollIntoView({behavior:'smooth',block:'center'});
    });
  });
})();

// O restante do arquivo permanece inalterado; a correção é exclusivamente a classe
// usada pela navegação do Escudo: .master-shield-nav, conforme o HTML atual.

  root.querySelectorAll('.master-shield-nav button, .ms-shield-nav button').forEach(b=>b.addEventListener('click',()=>msGo(b.dataset.msView)));
  window.msShieldNavigate=msGo;
  msGo('linha');
})();
