from pathlib import Path
import re, json, subprocess
root=Path(__file__).resolve().parent
pdfs=[
 ('exodo','Êxodo · Livro-Base','codex-files/livro-base-exodo.pdf'),
 ('ocultatun','Ocultatun · Ecos da Decadência','codex-files/livro-base-ocultatun-ecos.pdf'),
 ('envolto','Envolto · Ecos do Espaço Final','codex-files/envolto.pdf'),
 ('ordem','Ordem dos Sete · Ecos da Alta Glória','codex-files/ordem-dos-sete.pdf'),
 ('herdados','Linhagens Herdadas','codex-files/linhagens-herdadas.pdf'),
 ('aprimorador','Projeto Aprimorador','codex-files/arquetipo-aprimorador.pdf'),
 ('player','Projeto Player','codex-files/projeto-player.pdf'),
]
chunks=[]
for mode,title,rel in pdfs:
    txt=subprocess.check_output(['pdftotext','-layout',str(root/rel),'-'],stderr=subprocess.DEVNULL,text=True)
    lines=[re.sub(r'\s+',' ',x).strip() for x in txt.splitlines()]
    lines=[x for x in lines if x]
    # build chunks around semantically dense lines and section headers
    candidates=[]
    for i,line in enumerate(lines):
        low=line.lower()
        if any(k in low for k in [
            'potência de alcance','potência de projeção','teste de controle','teste de atributo','teste de perícia','atletismo','arremessar','saltar','soco','alcance','raio','área de efeito','classe de dificuldade','cd ','queda','ação rápida','ação padrão','reação','decadência','corrupção ontológica','recordação','transcendência','cântico','ritual','covil','enxerto','rejeição','capacidade','equipamento','mcp','gamma lock','estresse','energia paranormal','estamina'
        ]):
            start=max(0,i-2); end=min(len(lines),i+4)
            snippet=' '.join(lines[start:end])
            if len(snippet)>40:
                candidates.append((i,snippet))
    seen=set()
    for i,s in candidates:
        norm=re.sub(r'\W+',' ',s.lower()).strip()
        key=norm[:180]
        if key in seen: continue
        seen.add(key)
        words=set(re.findall(r'[a-zà-ÿ0-9]{3,}', norm))
        chunks.append({'mode':mode,'title':title,'source':rel,'line':i+1,'text':s,'keywords':sorted(words)})
# also add chapter intro chunks every 45 lines for broader lookup
for mode,title,rel in pdfs:
    txt=subprocess.check_output(['pdftotext','-layout',str(root/rel),'-'],stderr=subprocess.DEVNULL,text=True)
    lines=[re.sub(r'\s+',' ',x).strip() for x in txt.splitlines()]
    lines=[x for x in lines if x]
    for i in range(0,len(lines),80):
        snippet=' '.join(lines[i:i+6])
        if len(snippet)>80:
            chunks.append({'mode':mode,'title':title,'source':rel,'line':i+1,'text':snippet,'keywords':re.findall(r'[a-zà-ÿ0-9]{3,}',snippet.lower())})
# dedupe & cap by mode
unique=[]; seen=set(); per={}
for c in chunks:
    k=(c['mode'], re.sub(r'\W+',' ',c['text'].lower())[:220])
    if k in seen: continue
    seen.add(k)
    per[c['mode']]=per.get(c['mode'],0)+1
    if per[c['mode']]<=220:
        unique.append(c)
path=root/'js/master-shield-rules.js'
path.write_text('window.MASTER_SHIELD_RULES = '+json.dumps(unique,ensure_ascii=False,separators=(',',':'))+';\n','utf-8')
print(path, len(unique), sum(len(c['text']) for c in unique))
