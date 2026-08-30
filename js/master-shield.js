// Mundos Sombrios — Escudo do Mestre (integrado ao design original)
(function(){
  'use strict';
  const root=document.getElementById('master-shield-content');
  if(!root)return;
  const qs=s=>root.querySelector(s);
  const qsa=s=>root.querySelectorAll(s);
  const tt=qs('#ms-tooltip');
  const msGo=v=>{ qsa('.ms-view').forEach(x=>x.classList.remove('active')); const el=qs('#ms-v-'+v); if(el)el.classList.add('active'); qsa('.ms-shield-nav button').forEach(b=>b.classList.toggle('active',b.dataset.msView===v)); window.scrollTo({top:0,behavior:'smooth'}); };
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
  // Continentes estilizados (estética de arquivo técnico)
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
  <g stroke="#1c232d" stroke-width="0.5">${
    Array.from({length:19},(_,i)=>`<line x1="${(i+1)*50}" y1="0" x2="${(i+1)*50}" y2="500"/>`).join('')
  }${
    Array.from({length:9},(_,i)=>`<line x1="0" y1="${(i+1)*50}" x2="1000" y2="${(i+1)*50}"/>`).join('')
  }</g>
  <text x="955" y="36" text-anchor="middle" fill="#c9a227" font-size="9" font-family="monospace">☾ ÁPICE</text>`;
  let pts='';
  NACOES.forEach((n,i)=>{
    const c = ALN[n.al][0];
    pts += `<g class="nacao" data-i="${i}">
      <circle cx="${n.x}" cy="${n.y}" r="14" fill="${c}" opacity="0.14"/>
      <circle cx="${n.x}" cy="${n.y}" r="5.5" fill="${c}" stroke="#0a0b0d" stroke-width="1.5"/>
      <circle cx="${n.x}" cy="${n.y}" r="9" fill="none" stroke="${c}" stroke-width="0.8" opacity="0.6">
        <animate attributeName="r" values="7;13;7" dur="3s" begin="${(i%7)*0.4}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0;0.7" dur="3s" begin="${(i%7)*0.4}s" repeatCount="indefinite"/>
      </circle></g>`;
  });
  qs('#ms-v-mapa').innerHTML = `
  <div class="stamp amb">CARTOGRAFIA TÁTICA — VIGÊNCIA T.S.I.N. / ANO 100</div>
  <h1 class="vt">Mapa Global — As 50 Potências</h1>
  <p class="sub">// Passe o cursor e clique nas nações · Alinhamento face ao Tratado de Segregação Internacional de Nexos</p>
  <div class="map-wrap"><svg viewBox="0 0 1000 500">${terra}${pts}</svg></div>
  <div class="map-legend">
    <span><i style="background:${ALN.ant[0]}"></i>BLOCO ANT-NEXO (PURISMO)</span>
    <span><i style="background:${ALN.pro[0]}"></i>BLOCO PRÓ-NEXO (RESISTÊNCIA VELADA)</span>
    <span><i style="background:${ALN.neu[0]}"></i>ÁREA CINZENTA / NEUTRO</span>
  </div>
  <div id="ms-nacao-det" style="margin-top:18px"></div>
  <div class="panel" style="margin-top:18px"><h3>▣ Leitura Estratégica (Ano 100)</h3>
  <p style="color:var(--ink-dim)">A Paz do Terror: com os <b style="color:var(--red-hi)">Angels de Voglaskov</b> como dissuasão absoluta, as guerras migraram para a espionagem e o mercado de mercenários nas fronteiras da Europa Oriental. <b style="color:var(--cyan)">Hakuré (Brasil)</b> ancora o bloco Pró-Nexo com biotecnologia hiper-avançada; o <b style="color:var(--red-hi)">Dólar Federal</b> apodrece em estado policial; e a <b style="color:var(--amber-hi)">Libra Colonial</b> só existe porque a Protheus Corp a injeta artificialmente. Na órbita, a <b>Base Lunar Ápice</b> vigia o vácuo — e algo no vácuo começou a responder.</p></div>`;
  qsa('.nacao').forEach(g=>{
    const n = NACOES[+g.dataset.i];
    g.addEventListener('mouseenter',()=>tipShow(`<b>${n.n}</b><span>≈ ${n.real} · ${ALN[n.al][1]}</span><span class="moeda">${n.moeda} — ${n.cot}</span>`));
    g.addEventListener('mouseleave',tipHide);
    g.addEventListener('click',()=>{
      const c = ALN[n.al][0];
      qs('#ms-nacao-det').innerHTML = `<div class="panel" style="border-left-color:${c}">
        <div class="stamp" style="color:${c};border-color:${c}">${ALN[n.al][1]}</div>
        <h1 class="vt" style="font-size:30px">${n.n}</h1>
        <p class="sub">// EQUIVALENTE DO MUNDO REAL: ${n.real.toUpperCase()}</p>
        <table class="data"><tr><th>Câmbio Oficial</th><th>Cotação (Ano 100)</th></tr>
        <tr><td>${n.moeda}</td><td style="color:var(--cyan)">${n.cot}</td></tr></table>
        <p style="color:var(--ink-dim);margin-top:8px">${n.nota}</p></div>`;
      qs('#ms-nacao-det').scrollIntoView({behavior:'smooth',block:'center'});
    });
  });
})();

/* ══════════ ECONOMIA ══════════ */
(function(){
  // Gráfico 1: barras de cotação Ano 100
  const cot = [
    ["Krov (KV) — Voglaskov",4.50,"#e02832","O Titã de Aço. Supremacia dos Angels."],
    ["Éden (ED) — Hakuré",3.80,"#4fd8c7","A Superpotência Orgânica. Biotecnologia Pró-Nexo."],
    ["Libra (£H) — Hagland",2.10,"#c9a227","O Credor do Mundo."],
    ["Euro-Soberano (€S)",1.50,"#9d6ff5","Cofre forte da contenção."],
    ["Dólar Federal (DF$)",1.00,"#5fbf6f","Padrão base. A Nação Paranoica."],
    ["Nyens (¥N) — Zhonghão",0.85,"#f08c2e","A Fábrica do Mundo."],
    ["Libra Colonial (LC£) — UC",0.60,"#4e9af5","O Feudo Corporativo (Protheus)."],
    ["Real Autárquico (RA$)",0.70,"#777","Reativado sob patrocínio de Hakuré."]
  ];
  let bars = cot.map((m,i)=>{
    const w = (m[1]/4.5)*820;
    return `<g onmouseenter="tipShow('<b>${m[0]}</b><span>${m[3]}</span><span class=moeda>1 unidade = $${m[1].toFixed(2)} DF</span>')" onmouseleave="tipHide()" style="cursor:pointer">
      <text x="0" y="${i*44+16}" fill="#7d8590" font-size="11" font-family="monospace">${m[0]}</text>
      <rect x="0" y="${i*44+22}" width="${Math.max(w,2)}" height="14" fill="${m[2]}" opacity="0.85"/>
      <text x="${Math.max(w,2)+8}" y="${i*44+34}" fill="${m[2]}" font-size="12" font-family="monospace">$${m[1].toFixed(2)}</text></g>`;
  }).join('');

  // Gráfico 2: linhas — variação % (Sem.1 → Ano 10)
  const P = ECON.periodos.slice(0,5), W=900, H=300, pad=40;
  const ymin=-25, ymax=35, xs=i=>pad+(W-2*pad)*i/(P.length-1), ys=v=>H-pad-(H-2*pad)*(v-ymin)/(ymax-ymin);
  let grid='';
  for(let v=-20;v<=30;v+=10) grid+=`<line x1="${pad}" y1="${ys(v)}" x2="${W-pad}" y2="${ys(v)}" stroke="#1c232d"/><text x="4" y="${ys(v)+4}" fill="#4a515b" font-size="10" font-family="monospace">${v>0?'+'+v:v}%</text>`;
  grid+=`<line x1="${pad}" y1="${ys(0)}" x2="${W-pad}" y2="${ys(0)}" stroke="#3a4250" stroke-width="1.5"/>`;
  P.forEach((p,i)=>grid+=`<text x="${xs(i)}" y="${H-14}" text-anchor="middle" fill="#7d8590" font-size="11" font-family="monospace">${p}</text>`);
  let lines='', leg='';
  ECON.moedas.slice(0,7).forEach((m,mi)=>{
    const pts = m.dados.slice(0,5).map((v,i)=>`${xs(i)},${ys(Math.max(ymin,Math.min(ymax,v)))}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${m.cor}" stroke-width="2" opacity="0.9" onmouseenter="tipShow('<b>${m.nome}</b><span>${m.nota}</span>')" onmouseleave="tipHide()" style="cursor:pointer"/>
    ${m.dados.slice(0,5).map((v,i)=>`<circle cx="${xs(i)}" cy="${ys(Math.max(ymin,Math.min(ymax,v)))}" r="3.5" fill="${m.cor}"/>`).join('')}`;
    leg += `<span style="margin-right:14px"><i style="display:inline-block;width:10px;height:10px;background:${m.cor};margin-right:5px"></i>${m.nome}</span>`;
  });

  let tab = `<table class="data"><tr><th>Moeda</th><th>Bloco</th><th>Ano 100</th><th>Análise de Mercado</th></tr>`;
  const blocos = {Krov:"Voglaskov","Éden":"Hakuré",Libra:"Hagland",Euro:"Europa",Dólar:"EUA-Leste",Nyens:"Zhonghão","Libra Colonial":"UC-Oeste",Real:"América do Sul"};
  ECON.moedas.forEach(m=>{
    const cot100 = m.cota[8]!==null && m.cota[8]!==undefined ? ('$'+Number(m.cota[8]).toFixed(2)+' DF') : (m.nome.includes('Dólar')?'Base $1.00':'Escambo/—');
    tab += `<tr><td style="color:${m.cor};font-family:var(--font-mono);font-size:12px">${m.nome}</td><td>${blocos[Object.keys(blocos).find(k=>m.nome.includes(k))]||'—'}</td><td style="color:var(--cyan);font-family:var(--font-mono)">${cot100}</td><td style="color:var(--ink-dim);font-size:13px">${m.nota}</td></tr>`;
  });
  tab += `</table>`;

  qs('#ms-v-economia').innerHTML = `
  <div class="stamp amb">RELATÓRIO EXECUTIVO DA COALIZÃO GLOBAL — MERCADO CAMBIAL</div>
  <h1 class="vt">A Economia do Sangue</h1>
  <p class="sub">// "A economia global deixou de ser baseada em combustíveis ou dados — passou a ser movida pela biologia, contenção e exploração do Gene Êxodo."</p>
  <div class="chart-box"><h4>▸ Cotações Referenciais — Ano 100 P.G.E. (base: Dólar Federal)</h4>
  <svg viewBox="0 0 950 ${cot.length*44+10}" style="width:100%;height:auto">${bars}</svg></div>
  <div class="chart-box"><h4>▸ Variação Cambial % — Do "Boom" da Segregação à Grande Fratura (Ano 1 → Ano 10)</h4>
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${grid}${lines}</svg>
  <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-dim);margin-top:10px;letter-spacing:0.5px">${leg}</div></div>
  <div class="grid2">
    <div class="panel"><h3>▣ O Milagre Corporativo</h3><p style="color:var(--ink-dim)">Nos primeiros 90 dias do T.S.I.N., a privatização da segregação (brecha do Art. 11º) gerou lucros obscenos: ações de biotecnologia e segurança privada subiram <b style="color:var(--green)">+400%</b>. Zhonghão transferiu 80% de sua população Nexo registrada para minas e fábricas tóxicas — custo de produção quase zero.</p></div>
    <div class="panel"><h3>▣ A Máquina Quebrou</h3><p style="color:var(--ink-dim)">A Assimilação Acelerada fez operários Nexo sofrerem Rupturas Genéticas em massa dentro das fábricas. O Nyens, moeda mais agressiva do Ano 1, entrou em queda lenta — e Zhonghão virou o maior comprador oculto de prisioneiros sul-americanos.</p></div>
    <div class="panel amb"><h3>▣ O Padrão-Éden</h3><p style="color:var(--ink-dim)">Hakuré provou que integrar Nexos era mais lucrativo que exterminá-los: <b style="color:var(--amber-hi)">+22,4% no Ano 2, +31% até o Ano 10</b>, consolidando-se como padrão-ouro mundial e líder velado do bloco Pró-Nexo.</p></div>
    <div class="panel"><h3>▣ O Monopólio dos Angels</h3><p style="color:var(--ink-dim)">Quando Voglaskov criou os androides sintéticos com capacidades Nexo, o Krov saltou para <b style="color:var(--red-hi)">$4,50 DF</b> — a moeda mais forte da Terra. O T.S.I.N. não tem jurisdição sobre "máquinas": o vazio legal bélico redefiniu o poder.</p></div>
  </div>
  <div class="chart-box"><h4>▸ Tabela Consolidada — Status Quo (Ano 100)</h4>${tab}</div>`;
})();
// ══ MÓDULO 2 — DOSSIÊS DOS MODOS DE JOGO ══

function classeCard(c){
  return `<div class="card" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">
    <span class="tag">${c.tipo.toUpperCase()}</span><h4>${c.nome}</h4><p>${c.desc}</p>
    <span class="badge">${c.modo}</span></div>
  <div class="panel" style="display:none;margin:-8px 0 14px;border-left-color:var(--amber);grid-column:1/-1">
    <table class="data"><tr><th>Atributos / Recursos</th><th>Sistemas Exclusivos</th></tr>
    <tr><td style="font-family:var(--font-mono);font-size:12px;color:var(--cyan)">${c.stats}</td><td style="font-size:14px;color:var(--ink-dim)">${c.extra}</td></tr></table>
  </div>`;
}
function dossier(view, cor, stampTxt, titulo, sub, paineis, filtro, docId){
  let h = `<div class="stamp" style="color:${cor};border-color:${cor}">${stampTxt}</div>
  <h1 class="vt">${titulo}</h1><p class="sub">${sub}</p>`;
  paineis.forEach(p=>{ h += `<div class="panel" style="border-left-color:${p[2]||cor}"><h3 style="color:${p[2]||cor}">${p[0]}</h3><p style="color:var(--ink-dim)">${p[1]}</p></div>`; });
  const cls = CLASSES.filter(c=>c.modo.startsWith(filtro));
  if(cls.length){
    h += `<div class="panel"><h3>▣ Classes & Arquétipos Jogáveis (${cls.length})</h3><p style="color:var(--ink-faint);font-size:13px;font-family:var(--font-mono)">Clique em uma classe para expandir a ficha técnica.</p><div class="grid3" style="margin-top:10px">`;
    cls.forEach(c=>h+=classeCard(c));
    h += `</div></div>`;
  }
  h += `<button class="btn" onclick="abrirDoc('${docId}')">LER O DOCUMENTO FONTE INTEGRAL →</button>`;
  qs('#ms-v-'+view).innerHTML = h;
}

/* ══ ÊXODO ══ */
dossier('exodo','var(--red-hi)','MODO DE JOGO 01 — SOBREVIVÊNCIA EM UM MUNDO DIVIDIDO','ÊXODO: ASSIMILAÇÃO',
'// O GENE ÊXODO · A SEGREGAÇÃO · A ESPIRAL DA ASSIMILAÇÃO',
[
["∆ O Gene Êxodo","A Terra é um <b>Planeta-Fonte</b>: reservatório de potência evolutiva usado por civilizações interdimensionais para semear, desenvolver e colher energias em ciclos milenares — <b>A Colheita</b>. O Gene Êxodo é o resquício vivo dessas intervenções. Portadores são classificados como Nexos: Passivos, Ativos ou Superiores."],
["∆ A Espiral da Assimilação","O maior medo de um Nexo é perder o controle. Cada uso de poder gera Estresse Genético; acumulado, ele leva à <b>Assimilação</b> — quando o gene consome o hospedeiro e o transforma em um <b style='color:var(--red-hi)'>Herege</b>, uma criatura irracional e devastadora. A Ocultatun suspeita que a Assimilação seja um colapso da barreira entre o real e o irreal."],
["∆ O Tratado (T.S.I.N.)","Os Dez Pilares: desumanização jurídica, registro obrigatório, segregação de serviços, teto hierárquico, propriedade bélica, proibição de academias, licença para matar, adesão coercitiva, classificação terrorista de encontros e supressão cultural. O Nexo não é humano perante a lei — a cultura Nexo é juridicamente inexistente."],
["∆ O Nexo Superior","Quando o gene atinge saturação total (Capacidade 7+, 3 Assimilações Leves ou 1 Grave, CÊ base 20+), o Nexo sincroniza com as <b>Partículas Nexo-Terminais</b> e desperta as 8 Potências evoluídas: Temporal, Espacial, Probabilística, Entropia, Realidade, Vital, Onírica e Inércia."],
["∆ O Projeto Player","A heresia suprema: uma Interface Viva criada pelo 'Arquiteto' fundindo biologia e tecnologia das Eras Perdidas. Quatro partículas — <b>Kairon</b> (previsão/missões), <b>Xenion</b> (matéria/Repositório Kafra), <b>Oníron</b> (IAs Angélicas) e <b>Nexon</b> (evolução) — transformam a existência em sistema. Classificado como Ameaça Ômega.","var(--violet)"]
],'Êxodo','livro_base_exodo');

// Estigmas na view Êxodo
(function(){
  let h = `<div class="panel" style="border-left-color:var(--red-hi)"><h3>▣ As Seis Categorias de Estigma</h3>
  <p style="color:var(--ink-dim);margin-bottom:10px">"O Estigma é a cicatriz da evolução — o modo como o corpo responde ao Gene Êxodo para continuar vivo." Usar poder fora do Estigma causa <b style="color:var(--red-hi)">Ruptura Genética</b> (+5 CD; +10 CD se múltiplos estigmas não desenvolvidos).</p>
  <table class="data"><tr><th>Estigma</th><th>Biologia</th><th>Custo (CÊ)</th><th>Bônus</th><th>Risco / Assimilação</th></tr>`;
  ESTIGMAS.forEach(e=>{ h+=`<tr><td style="color:var(--amber-hi)"><b>${e.nome}</b></td><td style="color:var(--ink-dim)">${e.desc}</td><td style="font-family:var(--font-mono);color:var(--cyan)">${e.custo}</td><td>${e.bonus}</td><td style="color:var(--red-hi);font-size:13px">${e.risco}</td></tr>`; });
  h += `</table></div>`;
  qs('#ms-v-exodo').insertAdjacentHTML('beforeend', h);
})();

/* ══ OCULTATUN ══ */
dossier('ocultatun','var(--cyan)','MODO DE JOGO 02 — O HORROR INVISÍVEL','OCULTATUN: ECOS',
'// O VÉU DA REALIDADE · A SALA BRANCA · A MECÂNICA DE DECADÊNCIA',
[
["§ A Organização","A Ocultatun opera nas sombras contendo ameaças paranormais, estudando o inexplicável e silenciando quem descobre demais. Não é heroica: assassinatos, encobrimentos e experimentos antiéticos são protocolo. Governa a geopolítica a partir da <b>Sala Branca</b> — o espaço anômalo onde a morte pode ser reiniciada até a perfeição tática."],
["§ A Energia Paranormal (EP)","O combustível do impossível. Classes de Carreira possuem 0 EP natural e dependem de equipamentos; Agentes Designados manifestam EP inerente. O preço do poder é a <b>Decadência</b>: a perda gradual de humanidade em espiral."],
["§ A Prova de Supremacia","No Incidente de Nevada (Ano 3), a Sala Branca executou o 'Apagamento Cirúrgico': em 24 horas, uma instalação inteira da Nova Ordem deixou de existir — sem explosão, apenas uma cratera perfeitamente lisa. Hoje, um líder máximo da Nova Ordem é secretamente um Carrasco Cinzento infiltrado: a Ocultatun controla seus 'rivais' por dentro."],
["§ O Câncer Local (Ano 100)","O 'Grande Silêncio' era uma represa: sem as grandes Fendas, a energia paranormal estagnou no mundo. Entidades de Fluxo nascem do trauma diário — fome, opressão, medo nas Zonas de Contenção — e se multiplicam como câncer. Os Carrascos e Esotéricos trabalham até a morte.","var(--red-hi)"]
],'Ocultatun','livro_base_ocultatun');

/* ══ ORDEM DOS SETE ══ */
dossier('ordem','var(--amber-hi)','EXPANSÃO — ECOS DA ALTA GLÓRIA','A ORDEM DOS SETE ARCANJOS',
'// A ENERGIA PARADIMENSIONAL · O ESPECTRO DA VERDADE · ESQUECER PARA PROTEGER',
[
["✦ A Natureza da Ordem","Entidades da Alta Ordem Celeste reencarnadas em corpos mortais. O <b>Ciclo de Reencarnação</b> — esquecer para proteger — mantém a luz escondida até o Despertar. Não são 'A Igreja' pública: no Mundo Velado, são um mistério aterrorizante e milagroso. O sistema imunológico do cosmos."],
["✦ As Duas Eras da Luz","A <b>Alta Ordem Celeste</b> foi a era de ouro das Sete Ascensões Primordiais. <b>O Grande Silêncio e a Queda</b> fraturaram a Ordem e forçaram a reencarnação. Hoje restam Três Ascensões Sobreviventes: <b>Arkhé</b> (Matéria), <b>Ex-Nihilo</b> (Criação) e <b>Poesis Pleroma</b> (Alma)."],
["✦ O Motor da Recordação","A <b>Recordação</b> mede quanto do ser divino despertou no corpo mortal. Aos 90%, o Discípulo toca o limiar da transcensão. Despertar é avançar; o Afastamento é regredir — cada ponto cobra seu preço em humanidade."],
["✦ As Dádivas e o Preço","O Arsenal Divino: artefatos forjados em 1 hora de meditação com as Ascensões necessárias e Recordação mínima. A Queima Divina cobra o crítico; a Saturação Divina torna a Terceira Glória áspera — a gravidade e a dúvida pesam sobre a carne que carrega a luz."],
["✦ Zeladores Silenciosos","Durante a crise sul-americana e o caos de Gervodam, não foi a Coalizão que impediu epidemias e colapsos — foram Samaritanos e Intérpretes, sem exigir território, moeda ou poder. Sua eficácia gera respeito tenso até na Sala Branca.","var(--cyan)"]
],'Ordem','ordem_dos_sete');

/* ══ O ENVOLTO ══ */
dossier('envolto','var(--violet)','EXPANSÃO — CÓDICE DO ESPAÇO FINAL','ECOS DO ENVOLTO',
'// [ ARQUIVO CORROMPIDO ] — A DIMENSÃO QUE PRECEDE O NADA',
[
["◈ O Espaço Final","A anatomia da dimensão que precede o nada. A Energia do Envolto deforma a física e a mente — e sua manipulação não consome energia comum: exige um imposto da própria realidade do usuário, a <b>Corrupção Ontológica</b>."],
["◈ Os Elders","Entidades que rastejam na borda da realidade: <b>Xal-Mhyr</b>, o Reflexo Antes da Origem, que se manifesta através de espelhos e imagens; <b>O Devorador de Vetores</b>, massa de gravidade emocional e geometrias impossíveis; <b>A Sombra da Causa Absoluta</b>, que rege a quebra do princípio de causa e efeito."],
["◈ A Espiral da Corrupção","O Teste de Ancoragem substitui o TCP: cada uso do poder é um paradoxo. Falhas acumulam graus de Corrupção Ontológica até que o usuário deixe de ser um 'quem' e passe a ser um 'o quê'."],
["◈ Sobrecarga da Realidade","Falhas críticas deformam o mundo: chuva de vidro e memória, gravidade invertida transitória, armas que disparam sozinhas, silêncio euclidiano que devora o som, aceleração celular entrópica — e o Olhar de Xal-Mhyr abrindo uma fenda com um olho colossal.","var(--red-hi)"],
["◈ O Cântico dos Esquecidos","Rituais do Envolto levam rodadas, drenam EE e exigem o Teste de Blasfêmia. O Grimório Aberrante inclui o Ritual da Fenda Lúcida e o Cântico da Carne Reversa, que regenera membros decepados costurando estática negra na carne."]
],'Ecos','o_envolto');
// ══ MÓDULO 3 — ÁRVORES DE HABILIDADE, CONSTRUTOR DE FICHAS, ARQUIVOS ══

/* ══════════ ÁRVORES DE HABILIDADE ══════════ */
(function(){
  const sets = {envolto:'As 13 Árvores do Envolto', exodo:'As 12 Potências Ordinárias (Êxodo)', superior:'As 8 Potências Nexo-Terminais (Nexo Superior)', ordem:'As Ascensões da Ordem dos Sete'};
  let nav = `<div class="stamp" style="color:var(--violet);border-color:var(--violet)">PROGRESSÃO — REDE DE BUILDS</div>
  <h1 class="vt">Árvores de Habilidade</h1>
  <p class="sub">// Clique nos nós para ler as capacidades · As árvores do Envolto possuem pré-requisitos cruzados (interconexão)</p>
  <div class="ms-tree-nav">` + Object.keys(sets).map((k,i)=>`<button data-t="${k}" class="${i===0?'active':''}">${sets[k]}</button>`).join('') + `</div>
  <div class="tree-svg-wrap" id="tree-wrap"></div>
  <div class="tree-detail" id="ms-tree-detail"><span style="font-family:var(--font-mono);font-size:12px;color:var(--ink-faint)">▸ SELECIONE UM NÓ DA ÁRVORE PARA INSPECIONAR O TIER</span></div>`;
  qs('#ms-v-arvores').innerHTML = nav;

  function render(key){
    const arv = ARVORES[key];
    const cols = arv.length, bw = 250, bh = 64, gx = 24, gy = 26, top = 40;
    const W = cols*(bw+gx), H = top + 4*(bh+gy) + 20;
    let s = `<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,1100)}px;width:100%;height:auto">`;
    arv.forEach((a,i)=>{
      const x = i*(bw+gx);
      s += `<text x="${x+bw/2}" y="24" text-anchor="middle" fill="#c9a227" font-size="13" font-family="'Barlow Condensed'" font-weight="600" letter-spacing="1">${a.nome.toUpperCase()}</text>`;
      a.tiers.forEach((t,j)=>{
        const y = top + j*(bh+gy);
        if(j>0){ s += `<line class="tier-edge" data-e="${i}-${j}" x1="${x+bw/2}" y1="${y-gy}" x2="${x+bw/2}" y2="${y}"/>`; }
        s += `<g class="tier-node" data-i="${i}" data-j="${j}" data-k="${key}">
          <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="4"/>
          <text x="${x+12}" y="${y+24}" font-size="11.5" fill="#e8ecf1">${t.t.slice(0,34)}</text>
          <text x="${x+12}" y="${y+42}" font-size="10" fill="#7d8590">${t.d.slice(0,44)}…</text>
          <text x="${x+bw-12}" y="${y+24}" text-anchor="end" font-size="10" fill="#a4131c">T${j+1}</text></g>`;
      });
    });
    s += `</svg>`;
    qs('#tree-wrap').innerHTML = s;
    document.querySelectorAll('.tier-node').forEach(n=>{
      n.addEventListener('click',()=>{
        const a = ARVORES[n.dataset.k][+n.dataset.i], t = a.tiers[+n.dataset.j];
        document.querySelectorAll('.tier-node').forEach(x=>x.classList.remove('on'));
        document.querySelectorAll('.tier-edge').forEach(x=>x.classList.remove('on'));
        n.classList.add('on');
        for(let j=+n.dataset.j;j>0;j--){ const e=document.querySelector(`.tier-edge[data-e="${n.dataset.i}-${j}"]`); if(e)e.classList.add('on'); }
        qs('#ms-tree-detail').innerHTML = `<span class="badge" style="border-color:var(--violet);color:var(--violet)">${sets[n.dataset.k]}</span>
        <h3 style="font-family:var(--font-cond);font-weight:800;font-size:22px;letter-spacing:1px;color:#eef1f5;margin:8px 0 2px">${a.nome} — ${t.t}</h3>
        <p style="font-family:var(--font-mono);font-size:11px;color:var(--amber-hi);margin-bottom:8px">${a.tema.toUpperCase()}</p>
        <p style="color:var(--ink-dim)">${t.d}</p>`;
      });
    });
  }
  qsa('.ms-tree-nav button').forEach(b=>b.onclick=()=>{
    qsa('.ms-tree-nav button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); render(b.dataset.t);
  });
  render('envolto');
})();

/* ══════════ ARQUIVOS INTEGRAIS ══════════ */
function abrirDoc(id){ msGo('arquivos'); const d=qs('#ms-doc-'+id); if(d){ d.open=true; setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),150);} }
(function(){
  let h = `<div class="stamp amb">TRANSCRIÇÃO INTEGRAL — NENHUM TEXTO REMOVIDO</div>
  <h1 class="vt">Arquivos-Fonte (16 Documentos)</h1>
  <p class="sub">// Transcrição completa de cada PDF original · Use a busca para filtrar em TODOS os documentos ao mesmo tempo</p>
  <div class="doc-toolbar"><input id="doc-busca" placeholder="▸ Buscar em todos os arquivos (ex: 'Assimilação', 'Carga Êxodo', 'Xal-Mhyr')…" style="flex:1;min-width:260px"><span id="doc-hits" class="pts"></span></div>
  <div id="doc-list">`;
  DOCS.forEach(d=>{
    h += `<details class="bloco" id="doc-${d.id}"><summary>${d.titulo} <span style="margin-left:auto;color:var(--ink-faint);font-size:10px">${(d.texto.length/1024).toFixed(0)} KB</span></summary>
    <div class="corpo"><button class="btn ghost" style="margin:8px 0 12px" onclick="baixarDoc('${d.id}')">▼ BAIXAR ESTE DOCUMENTO (.TXT)</button><div class="txt-doc">${d.texto.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div></details>`;
  });
  h += `</div>`;
  qs('#ms-v-arquivos').innerHTML = h;
  qs('#ms-doc-busca').addEventListener('input',e=>{
    const q = e.target.value.trim().toLowerCase();
    if(q.length<3){ qsa('#ms-doc-list details').forEach(d=>d.style.display=''); qs('#ms-doc-hits').textContent=''; return; }
    let hits=0;
    DOCS.forEach(d=>{
      const el = qs('#ms-doc-'+d.id);
      const ok = d.titulo.toLowerCase().includes(q) || d.texto.toLowerCase().includes(q);
      el.style.display = ok?'':'none';
      if(ok){ el.open = true; hits += (d.texto.toLowerCase().split(q).length-1); }
    });
    qs('#ms-doc-hits').textContent = hits+' ocorrências';
  });
})();
function baixarDoc(id){
  const d = DOCS.find(x=>x.id===id);
  const b = new Blob([d.titulo+'\n'+'═'.repeat(40)+'\n\n'+d.texto],{type:'text/plain;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(b);
  a.download = id+'.txt'; a.click(); URL.revokeObjectURL(a.href);
}
  root.querySelectorAll('.ms-shield-nav button').forEach(b=>b.addEventListener('click',()=>msGo(b.dataset.msView)));
  window.msShieldNavigate=msGo;
  msGo('linha');
})();
