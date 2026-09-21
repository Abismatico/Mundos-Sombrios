from pathlib import Path
from playwright.sync_api import sync_playwright
import json, mimetypes, re, sys
ROOT=Path(__file__).resolve().parents[1]/'sandbox-offline'
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<head>', '<head><base href="https://app.local/">', HTML, count=1, flags=re.I)
FAKE_STORAGE=r'''(() => {const bag=new Map();const s={getItem:k=>bag.has(String(k))?bag.get(String(k)):null,setItem:(k,v)=>bag.set(String(k),String(v)),removeItem:k=>bag.delete(String(k)),clear:()=>bag.clear(),key:i=>[...bag.keys()][i]??null,get length(){return bag.size}};try{Object.defineProperty(window,'localStorage',{configurable:true,value:s});Object.defineProperty(window,'sessionStorage',{configurable:true,value:s});}catch(e){}window.confirm=()=>true;window.alert=()=>{};window.prompt=(_,d='')=>d;})();'''
def mime(p): return mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
results=[]
def check(name,cond,detail=''):results.append({'name':name,'ok':bool(cond),'detail':str(detail)})
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':390,'height':844});ctx.add_init_script(FAKE_STORAGE);page=ctx.new_page()
  def route(route):
    u=route.request.url
    if not u.startswith('https://app.local/'): return route.abort()
    rel=u.split('https://app.local/',1)[1].split('?',1)[0].split('#',1)[0];path=(ROOT/rel).resolve()
    try:path.relative_to(ROOT.resolve())
    except:return route.abort()
    return route.fulfill(status=200,body=path.read_bytes(),content_type=mime(path)) if path.is_file() else route.fulfill(status=404,body=b'not found')
  page.route('**/*',route);page.set_content(HTML,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("window.MS_DB&&window.MS_DB.ready===true&&window.currentUser",timeout=15000)
  metrics=page.evaluate("({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})")
  check('portal mobile sem overflow horizontal',metrics['sw']<=metrics['cw']+2,metrics)
  # Jogador entra na mesa real do sandbox.
  ok=page.evaluate("window.enterVTT('table-sandbox-001',false)")
  page.wait_for_timeout(500)
  check('Jogador entra no VTT',page.locator('#screen-vtt').evaluate("e=>e.classList.contains('active')"),ok)
  check('Jogador não vê comandos GM',page.evaluate("[...document.querySelectorAll('.gm-only-btn')].every(e=>getComputedStyle(e).display==='none')"))
  check('Jogador acessa sua janela de evolução',page.locator('[data-room-open=peg]').is_visible())
  page.evaluate("window.leaveVTT && window.leaveVTT()")
  page.wait_for_timeout(200)
  page.locator('#ms-offline-qa [data-role="mestre"]').click();page.wait_for_function("window.currentUser?.role==='mestre'",timeout=10000)
  ok2=page.evaluate("window.enterVTT('table-sandbox-001',true)");page.wait_for_timeout(700)
  check('Mestre entra no VTT',page.locator('#screen-vtt').evaluate("e=>e.classList.contains('active')"),ok2)
  check('Mestre vê comandos GM',page.evaluate("[...document.querySelectorAll('.gm-only-btn')].some(e=>getComputedStyle(e).display!=='none')"))
  check('Mestre acessa a janela exclusiva de PEG',page.locator('[data-room-open=peg]').is_visible())
  check('Campanha em Movimento está dentro do VTT',page.locator('#vtt-campaign-window').count()==1)
  metrics2=page.evaluate("({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})")
  check('VTT mobile sem overflow global',metrics2['sw']<=metrics2['cw']+2,metrics2)
  page.screenshot(path='/mnt/data/v290-mobile-smoke.png',full_page=True)
  browser.close()
failed=[r for r in results if not r['ok']]
print(json.dumps({'ok':not failed,'results':results,'failed':failed},ensure_ascii=False,indent=2));sys.exit(1 if failed else 0)
