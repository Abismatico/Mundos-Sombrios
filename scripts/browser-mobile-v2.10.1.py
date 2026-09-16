from pathlib import Path
from playwright.sync_api import sync_playwright
import json,mimetypes,re,sys
ROOT=Path(__file__).resolve().parents[1]/'sandbox-offline'
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<head>','<head><base href="https://app.local/">',HTML,count=1,flags=re.I)
FAKE=r'''(()=>{const b=new Map(),s={getItem:k=>b.has(String(k))?b.get(String(k)):null,setItem:(k,v)=>b.set(String(k),String(v)),removeItem:k=>b.delete(String(k)),clear:()=>b.clear(),key:i=>[...b.keys()][i]??null,get length(){return b.size}};try{Object.defineProperty(window,'localStorage',{configurable:true,value:s});Object.defineProperty(window,'sessionStorage',{configurable:true,value:s});}catch(e){}window.confirm=()=>true;window.alert=()=>{};window.prompt=(_,d='')=>d;})();'''
def mime(p):return mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
results=[]
def check(name,cond,detail=''):results.append({'name':name,'ok':bool(cond),'detail':detail if isinstance(detail,(dict,list,int,float,bool)) else str(detail)})
def dims(page,selector=None):
    if selector:
        return page.locator(selector).evaluate("e=>({scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,viewport:innerWidth})")
    return page.evaluate("({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,viewport:innerWidth})")
def role(page,r):
    page.locator(f'#ms-offline-qa [data-role="{r}"]').click();page.wait_for_function(f"window.currentUser?.role==='{r}'",timeout=10000)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':390,'height':844});ctx.add_init_script(FAKE);page=ctx.new_page();page.set_default_timeout(8000);errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def route(rt):
        u=rt.request.url
        if not u.startswith('https://app.local/'):return rt.abort()
        rel=u.split('https://app.local/',1)[1].split('?',1)[0].split('#',1)[0];path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT.resolve())
        except:return rt.abort()
        if path.is_file():return rt.fulfill(status=200,body=path.read_bytes(),content_type=mime(path))
        return rt.fulfill(status=404,body=b'not found',content_type='text/plain')
    page.route('**/*',route);page.set_content(HTML,wait_until='domcontentloaded',timeout=30000);page.wait_for_function("window.MS_DB?.ready&&window.currentUser?.role==='jogador'",timeout=15000);page.wait_for_timeout(250)
    d=dims(page);check('portal 390×844 sem overflow horizontal',d['scrollWidth']<=d['clientWidth']+2,d)

    # Fichas rápidas no mobile.
    page.evaluate("window.showScreen('screen-mode-select')");page.wait_for_timeout(100)
    btn=page.locator('[data-global-sheets]');box=btn.bounding_box();check('botão FICHAS está dentro da viewport',bool(box and box['x']>=-1 and box['x']+box['width']<=391),box or {})
    btn.click();page.wait_for_timeout(250)
    q=dims(page,'#ms-quick-sheets .ms-op-shell');check('Fichas Rápidas sem overflow horizontal',q['scrollWidth']<=q['clientWidth']+2 and q['left']>=-1 and q['right']<=391,q)
    page.locator('#ms-quick-sheets [data-quick-view="char-player-exodo"]').click();page.wait_for_timeout(450)
    v=dims(page,'#ms-character-viewer .ms-viewer-shell');check('visualizador de ficha cabe em 390 px',v['scrollWidth']<=v['clientWidth']+2 and v['left']>=-1 and v['right']<=391,v)
    tabs=page.locator('#ms-character-viewer [data-evo-tab]');check('abas FICHA/EVOLUÇÃO/HISTÓRICO acionáveis no mobile',tabs.count()==3 and all(tabs.nth(i).is_enabled() for i in range(3)),tabs.all_text_contents())
    tabs.nth(1).click();page.wait_for_timeout(120)
    evo=dims(page,'#ms-character-viewer [data-evo-pane="evolution"]');check('painel Evolução sem overflow horizontal',evo['scrollWidth']<=evo['clientWidth']+2,evo)
    check('cards de trilha acessíveis no mobile',page.locator('#ms-character-viewer .ms-evo-track').count()>0,page.locator('#ms-character-viewer .ms-evo-track').count())
    page.locator('#ms-character-viewer [data-view-close]').click();page.locator('#ms-quick-sheets [data-quick-close]').click()

    # Mestre + TRIPULAÇÃO drawer inferior.
    role(page,'mestre');page.evaluate("window.enterVTT('table-sandbox-001',true)");page.wait_for_timeout(700)
    vtt=dims(page);check('VTT 390×844 sem overflow global',vtt['scrollWidth']<=vtt['clientWidth']+2,vtt)
    manage=page.locator('#ms-table-v3 .gm-only-v3[data-action="manage"]');mbox=manage.bounding_box();check('botão TRIPULAÇÃO integralmente dentro da tela',bool(mbox and mbox['x']>=-1 and mbox['x']+mbox['width']<=391),mbox or {})
    manage.click();page.wait_for_timeout(500)
    shell=dims(page,'#ms-crew-center .ms-op-shell');check('Central Operacional vira drawer mobile sem overflow',shell['scrollWidth']<=shell['clientWidth']+2 and shell['left']>=-1 and shell['right']<=391,shell)
    # Proximidade do fundo confirma drawer inferior, não janela flutuante fora da tela.
    rect=page.locator('#ms-crew-center .ms-op-shell').bounding_box();check('drawer da Tripulação ancorado ao fundo',bool(rect and abs((rect['y']+rect['height'])-844)<=3),rect or {})
    main_tabs=page.locator('#ms-crew-center [data-crew-tab]');check('abas principais da Central acionáveis',main_tabs.count()==3 and all(main_tabs.nth(i).is_enabled() for i in range(3)),main_tabs.all_text_contents())
    page.locator('#ms-crew-center [data-crew-tab="evolution"]').click();page.wait_for_timeout(180)
    subtabs=page.locator('#ms-crew-center [data-evo-tab]');check('subabas Personagens/Solicitações/Treinamentos/Ledger acionáveis',subtabs.count()==4 and all(subtabs.nth(i).is_enabled() for i in range(4)),subtabs.all_text_contents())
    cbody=dims(page,'#ms-crew-center [data-crew-body]');check('conteúdo da Central não vaza horizontalmente',cbody['scrollWidth']<=cbody['clientWidth']+2,cbody)
    page.locator('#ms-crew-center [data-evo-tab="ledger"]').click();page.wait_for_timeout(120)
    check('Ledger da Mesa acionável no drawer','LEDGER' in page.locator('#ms-crew-center [data-crew-body]').inner_text().upper())
    page.locator('#ms-crew-center [data-crew-close]').click();page.evaluate('window.leaveVTT && window.leaveVTT()');page.wait_for_timeout(120)

    # ADM/Arconte mobile.
    role(page,'admin');page.locator('#ms-offline-qa').evaluate("e=>e.style.display='none'");page.evaluate('window.openAdminPanel()');page.wait_for_timeout(300);page.locator('[data-admin-tab="progression"]').click();page.wait_for_timeout(450)
    ar=dims(page,'#admin-panel-modal');check('Arconte 390×844 sem overflow horizontal',ar['scrollWidth']<=ar['clientWidth']+2 and ar['left']>=-1 and ar['right']<=391,ar)
    row=page.locator('#admin-progression-panel .ms-arconte-table').first;check('Arconte lista Mesa no mobile',row.count()==1)
    controls=dims(page,'#admin-progression-panel .ms-arconte-table-controls');check('controles PEG/Ledger do Arconte cabem no mobile',controls['scrollWidth']<=controls['clientWidth']+2,controls)
    row.locator('[data-admin-ledger]').click();page.wait_for_timeout(400)
    host=dims(page,'#admin-progression-panel [data-admin-ledger-host]');check('Ledger do Arconte sem overflow horizontal',host['scrollWidth']<=host['clientWidth']+2,host)
    check('Ledger do Arconte acionável em 390×844','ECONOMIA PEG' in row.locator('[data-admin-ledger-host]').inner_text())
    check('sem erros JavaScript no QA mobile',not errors,errors[:10])
    page.screenshot(path='/mnt/data/v2101-mobile-qa.png',full_page=True)
    browser.close()
failed=[r for r in results if not r['ok']]
print(json.dumps({'ok':not failed,'results':results,'failed':failed},ensure_ascii=False,indent=2));sys.exit(1 if failed else 0)
