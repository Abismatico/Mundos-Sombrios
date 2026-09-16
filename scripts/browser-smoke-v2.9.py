from pathlib import Path
from playwright.sync_api import sync_playwright
import json, mimetypes, re, sys

ROOT=Path(__file__).resolve().parents[1]/'sandbox-offline'
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<head>', '<head><base href="https://app.local/">', HTML, count=1, flags=re.I)

FAKE_STORAGE=r'''(() => {
  const bag = new Map();
  const storage = {
    getItem(k){ return bag.has(String(k)) ? bag.get(String(k)) : null; },
    setItem(k,v){ bag.set(String(k), String(v)); },
    removeItem(k){ bag.delete(String(k)); },
    clear(){ bag.clear(); },
    key(i){ return [...bag.keys()][i] ?? null; },
    get length(){ return bag.size; }
  };
  try { Object.defineProperty(window,'localStorage',{configurable:true,value:storage}); } catch(e) {}
  try { Object.defineProperty(window,'sessionStorage',{configurable:true,value:storage}); } catch(e) {}
  window.confirm=()=>true;
  window.alert=()=>{};
  window.prompt=(_,d='')=>d;
})();'''

def mime(path):
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

results=[]
def check(name, cond, detail=''):
    results.append({'name':name,'ok':bool(cond),'detail':str(detail)})

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.add_init_script(FAKE_STORAGE)
    page=context.new_page()

    def route_handler(route):
        url=route.request.url
        if url.startswith('https://app.local/'):
            rel=url.split('https://app.local/',1)[1].split('?',1)[0].split('#',1)[0]
            path=(ROOT/rel).resolve()
            try:
                path.relative_to(ROOT.resolve())
            except Exception:
                return route.abort()
            if path.is_file():
                return route.fulfill(status=200,body=path.read_bytes(),content_type=mime(path))
            return route.fulfill(status=404,body=b'not found',content_type='text/plain')
        route.abort()
    page.route('**/*',route_handler)
    page.set_content(HTML,wait_until='domcontentloaded',timeout=30000)
    page.wait_for_function("window.MS_DB && window.MS_DB.ready === true",timeout=15000)
    page.wait_for_function("window.currentUser && window.currentUser.role === 'jogador'",timeout=15000)
    check('sandbox usa backend offline',page.evaluate("window.MS_DB.offline===true"))
    check('login automático Jogador',page.evaluate("window.currentUser.role==='jogador'"),page.evaluate("window.currentUser.username"))
    check('toolbar QA presente',page.locator('#ms-offline-qa').count()==1)
    check('Forja principal presente',page.locator('#screen-builder').count()==1)
    check('Ancoragem principal presente',page.locator('#screen-ancoragem').count()==1)

    # Viewer universal lazy-load real.
    page.evaluate("window.MS_FEATURES.ensureProgression()")
    page.wait_for_function("window.MS_PROGRESSION")
    check('progressão lazy carregada',page.evaluate("!!window.MS_PROGRESSION"))
    page.evaluate("window.msOpenCharacterViewer('char-player-exodo',{source:'sanctuary'})")
    page.wait_for_timeout(250)
    check('viewer universal abre sem Forja',page.locator('#ms-character-viewer').count()==1 and page.locator('#ms-character-viewer').is_visible())
    page.evaluate("window.MS_PROGRESSION.closeViewer && window.MS_PROGRESSION.closeViewer()") if page.evaluate("typeof window.MS_PROGRESSION.closeViewer==='function'") else None

    # Mestre via botão real da barra QA.
    page.locator('#ms-offline-qa [data-role="mestre"]').click()
    page.wait_for_function("window.currentUser && window.currentUser.role === 'mestre'",timeout=10000)
    check('troca real para Mestre',page.evaluate("window.currentUser.role==='mestre'"))
    check('aba Mestre liberada',page.evaluate("getComputedStyle(document.getElementById('tab-btn-gm')).display!=='none'"))
    master_tables=page.evaluate("window.MS_DB.fetchMyTables().then(r=>r.data)")
    check('Mestre enxerga Mesa QA',any(t.get('code')=='QA2811' for t in master_tables),len(master_tables))
    prog=page.evaluate("window.MS_DB.fetchProgressionTableState('table-sandbox-001').then(r=>r.data)")
    check('Mestre enxerga carteira PEG',prog.get('wallet') is not None,prog.get('wallet',{}).get('balance'))

    # ADM / Arconte via botão real.
    page.locator('#ms-offline-qa [data-role="admin"]').click()
    page.wait_for_function("window.currentUser && window.currentUser.role === 'admin'",timeout=10000)
    check('troca real para ADM',page.evaluate("window.currentUser.role==='admin'"))
    check('botão Arconte liberado',page.evaluate("getComputedStyle(document.getElementById('btn-admin-panel')).display!=='none'"))
    page.evaluate("window.openAdminPanel()")
    page.wait_for_timeout(300)
    check('painel Arconte abre',page.locator('#admin-panel-modal').is_visible())
    # Garante que a aba Evolução foi injetada pela camada 2.8.9.
    page.wait_for_timeout(200)
    check('Arconte contém aba Evolução',page.locator('[data-admin-tab="progression"]').count()==1)

    # Contratos de runtime.
    contract=page.evaluate("({viewer:typeof window.MS_DB.fetchCharacterView==='function', grant:typeof window.MS_DB.grantCharacterProgression==='function', adminPeg:typeof window.MS_DB.adminAdjustTableProgression==='function', create:typeof window.MS_DB.createTableRemote==='function'})")
    check('contratos essenciais ativos',all(contract.values()),contract)

    page.screenshot(path='/mnt/data/v290-browser-smoke.png',full_page=True)
    browser.close()

failed=[r for r in results if not r['ok']]
print(json.dumps({'ok':not failed,'results':results,'failed':failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
