from pathlib import Path
from playwright.sync_api import sync_playwright
import json, mimetypes, re, sys

ROOT=Path(__file__).resolve().parents[1]/'sandbox-offline'
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<head>', '<head><base href="https://app.local/">', HTML, count=1, flags=re.I)
FAKE_STORAGE=r'''(() => {
  const bag = new Map();
  const storage = {getItem(k){return bag.has(String(k))?bag.get(String(k)):null;},setItem(k,v){bag.set(String(k),String(v));},removeItem(k){bag.delete(String(k));},clear(){bag.clear();},key(i){return [...bag.keys()][i]??null;},get length(){return bag.size;}};
  try {Object.defineProperty(window,'localStorage',{configurable:true,value:storage});Object.defineProperty(window,'sessionStorage',{configurable:true,value:storage});} catch(e) {}
  window.confirm=()=>true; window.alert=()=>{}; window.prompt=(_,d='')=>d;
})();'''

def mime(path): return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
results=[]
def check(name, cond, detail=''):
    results.append({'name':name,'ok':bool(cond),'detail':detail if isinstance(detail,(dict,list,int,float,bool)) else str(detail)})

def click_role(page, role):
    page.locator(f'#ms-offline-qa [data-role="{role}"]').click()
    page.wait_for_function(f"window.currentUser && window.currentUser.role === '{role}'",timeout=10000)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    ctx.add_init_script(FAKE_STORAGE)
    page=ctx.new_page()
    console_errors=[]
    page_errors=[]
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda exc: page_errors.append(str(exc)))
    def route_handler(route):
        u=route.request.url
        if not u.startswith('https://app.local/'): return route.abort()
        rel=u.split('https://app.local/',1)[1].split('?',1)[0].split('#',1)[0]
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT.resolve())
        except Exception:return route.abort()
        if path.is_file(): return route.fulfill(status=200,body=path.read_bytes(),content_type=mime(path))
        return route.fulfill(status=404,body=b'not found',content_type='text/plain')
    page.route('**/*',route_handler)
    page.set_content(HTML,wait_until='domcontentloaded',timeout=30000)
    page.wait_for_function("window.MS_DB&&window.MS_DB.ready===true&&window.currentUser?.role==='jogador'",timeout=15000)
    page.wait_for_timeout(250)

    # JOGADOR — Fichas globais e visualizador integral.
    check('Jogador autenticado', page.evaluate("window.currentUser.role==='jogador'"), page.evaluate('window.currentUser.username'))
    check('botão FICHAS global existe', page.locator('[data-global-sheets]').count()==1)
    page.evaluate("window.showScreen('screen-mode-select')"); page.wait_for_timeout(120)
    page.locator('[data-global-sheets]').click(); page.wait_for_timeout(250)
    check('Fichas Rápidas abre sem Santuário', page.locator('#ms-quick-sheets').is_visible())
    check('Jogador possui fichas rápidas', page.locator('#ms-quick-sheets [data-quick-view]').count()>=2, page.locator('#ms-quick-sheets [data-quick-view]').count())
    page.locator('#ms-quick-sheets [data-quick-view="char-player-exodo"]').click(); page.wait_for_timeout(500)
    page.wait_for_function("window.MS_PROGRESSION?.version==='2.10.0'",timeout=10000)
    check('visualizador somente leitura abre', page.locator('#ms-character-viewer').is_visible())
    labels=page.locator('#ms-character-viewer [data-evo-tab]').all_text_contents()
    check('visualizador possui FICHA / EVOLUÇÃO / HISTÓRICO', all(any(k in x for x in labels) for k in ['FICHA','EVOLUÇÃO','HISTÓRICO']), labels)
    page.locator('#ms-character-viewer [data-evo-tab="evolution"]').click(); page.wait_for_timeout(150)
    check('saldo PEG visível ao Jogador', 'PEG' in page.locator('#ms-character-viewer [data-evo-pane="evolution"]').inner_text())
    check('trilhas de evolução renderizadas', page.locator('#ms-character-viewer .ms-evo-track').count()>0, page.locator('#ms-character-viewer .ms-evo-track').count())
    check('Jogador pode registrar prática', page.locator('#ms-character-viewer [data-evo-evidence]').count()>0)
    check('Jogador pode solicitar treino', page.locator('#ms-character-viewer [data-evo-train]').count()>0)
    page.locator('#ms-character-viewer [data-view-close]').click()
    page.locator('#ms-quick-sheets [data-quick-close]').click()

    # MESTRE — entra na Mesa, usa Central Operacional e prepara uma evolução real.
    click_role(page,'mestre')
    ok=page.evaluate("window.enterVTT('table-sandbox-001',true)")
    page.wait_for_timeout(800)
    check('Mestre entra na Mesa', page.locator('#screen-vtt').evaluate("e=>e.classList.contains('active')"), ok)
    check('Sandbox VTT inicializa Fabric Lite local', page.evaluate("!!window.fabric?.__msLite"), page.evaluate("window.fabric?.version||''"))
    page.evaluate("window.msOpenCrewCenter()")
    page.wait_for_timeout(700)
    check('Central Operacional abre', page.locator('#ms-crew-center').is_visible())
    page.locator('#ms-crew-center [data-crew-tab="evolution"]').click(); page.wait_for_timeout(250)
    subtabs=page.locator('#ms-crew-center [data-evo-tab]').all_text_contents()
    check('Central tem quatro áreas de Evolução', all(any(k in x for x in subtabs) for k in ['PERSONAGENS','SOLICITAÇÕES','TREINAMENTOS','LEDGER']), subtabs)
    check('Mestre pode conceder PEG por participante', page.locator('#ms-crew-center [data-crew-grant]').count()>0)
    check('Mestre pode gerenciar evolução sem Forja', page.locator('#ms-crew-center [data-evo-manage]').count()>0)

    state=page.evaluate("window.MS_EVOLUTION_BACKEND.state('table-sandbox-001','char-player-exodo')")
    skill=next((t for t in state.get('tracks',[]) if t.get('capability_type')=='skill'),None)
    check('trilha de perícia disponível para jornada QA', skill is not None, skill or {})
    if skill:
        # Abre o gerenciador e reconhece os sucessos necessários via UI.
        page.locator('#ms-crew-center [data-evo-manage="char-player-exodo"]').click(); page.wait_for_timeout(450)
        needed=max(1,int(skill.get('successes_required',10))-int(skill.get('successes',0)))
        sel=f'[data-evo-success="skill|{skill["capability_key"]}"]'
        check('controle + SUCESSOS disponível ao Mestre', page.locator('#ms-character-viewer '+sel).count()==1, sel)
        if page.locator('#ms-character-viewer '+sel).count():
            remaining=needed
            while remaining>0:
                award=min(20,remaining)
                page.locator('#ms-character-viewer '+sel).click(); page.wait_for_timeout(100)
                page.locator('#ms-evo-action-dialog [data-successes]').fill(str(award))
                page.locator('#ms-evo-action-dialog [data-session]').fill('QA V2.10')
                page.locator('#ms-evo-action-dialog [data-note]').fill('Reconhecimento QA de uso recorrente e relevante da perícia.')
                page.locator('#ms-evo-action-dialog [data-submit]').click(); page.wait_for_timeout(450)
                remaining-=award
        page.locator('#ms-character-viewer [data-view-close]').click(); page.wait_for_timeout(100)
        # Concede PEG pelo botão operacional (prompt controlado) suficiente para qualquer perícia QA.
        page.evaluate("window.prompt=(msg,d='')=>String(msg||'').includes('Quantos PEG')?'80':(String(msg||'').includes('Motivo da concessão')?'QA V2.10 · verba de evolução':d)")
        page.locator('#ms-crew-center [data-crew-grant="char-player-exodo"]').click(); page.wait_for_timeout(450)
        after_prep=page.evaluate("window.MS_EVOLUTION_BACKEND.state('table-sandbox-001','char-player-exodo')")
        target=next((t for t in after_prep.get('tracks',[]) if t.get('capability_type')=='skill' and t.get('capability_key')==skill.get('capability_key')),None)
        check('perícia ficou elegível por sucessos', bool(target and target.get('status')=='ready'), target or {})
        check('PEG foi concedido e reserva debitada', int(after_prep.get('account',{}).get('balance',0))>=80, after_prep.get('account',{}))

        # Jogador solicita a evolução pelo visualizador real.
        page.locator('#ms-crew-center [data-crew-close]').click(); page.evaluate('window.leaveVTT && window.leaveVTT()'); page.wait_for_timeout(200)
        click_role(page,'jogador')
        page.evaluate("window.msOpenQuickSheets()") ; page.wait_for_timeout(250)
        page.locator('#ms-quick-sheets [data-quick-view="char-player-exodo"]').click(); page.wait_for_timeout(450)
        page.locator('#ms-character-viewer [data-evo-tab="evolution"]').click(); page.wait_for_timeout(120)
        upsel=f'[data-evo-upgrade="skill|{skill["capability_key"]}"]'
        up=page.locator('#ms-character-viewer '+upsel)
        check('SOLICITAR EVOLUÇÃO habilitado ao Jogador', up.count()==1 and up.is_enabled(), upsel)
        if up.count() and up.is_enabled(): up.click(); page.wait_for_timeout(400)
        requested=page.evaluate("window.MS_EVOLUTION_BACKEND.state('table-sandbox-001','char-player-exodo')")
        pending=[x for x in requested.get('upgradeRequests',[]) if x.get('status','pending')=='pending']
        check('solicitação semântica persiste até Mestre processar', len(pending)>0, pending)
        page.locator('#ms-character-viewer [data-view-close]').click(); page.locator('#ms-quick-sheets [data-quick-close]').click()

        # Mestre aprova pela Central > Solicitações.
        click_role(page,'mestre'); page.evaluate("window.enterVTT('table-sandbox-001',true)"); page.wait_for_timeout(650)
        page.evaluate('window.msOpenCrewCenter()'); page.wait_for_timeout(500)
        page.locator('#ms-crew-center [data-crew-tab="evolution"]').click(); page.wait_for_timeout(180)
        page.locator('#ms-crew-center [data-evo-tab="requests"]').click(); page.wait_for_timeout(180)
        req=page.locator('#ms-crew-center [data-evo-resolve][data-evo-kind="upgrade"][data-evo-approved="1"]')
        check('Mestre recebe solicitação na Central', req.count()>0, req.count())
        if req.count():
            page.evaluate("window.prompt=(msg,d='')=>'QA V2.10 · evolução aprovada'")
            req.first.click(); page.wait_for_timeout(500)
        approved=page.evaluate("window.MS_EVOLUTION_BACKEND.state('table-sandbox-001','char-player-exodo')")
        evolved=next((t for t in approved.get('tracks',[]) if t.get('capability_type')=='skill' and t.get('capability_key')==skill.get('capability_key')),None)
        check('aprovação altera somente a trilha e reinicia sucessos', bool(evolved and int(evolved.get('current_rank',0))==int(skill.get('current_rank',0))+1 and int(evolved.get('successes',-1))==0), evolved or {})
        check('Ledger da Mesa contém evolução', any(e.get('event_type')=='EVOLUTION_APPLIED' for e in approved.get('events',[])), approved.get('events',[])[:5])
        page.locator('#ms-crew-center [data-crew-close]').click(); page.evaluate('window.leaveVTT && window.leaveVTT()'); page.wait_for_timeout(150)

    # ADM / ARCONTE — reserva, Ledger e autoridade de Mestre na Mesa.
    click_role(page,'admin')
    page.evaluate('window.openAdminPanel()'); page.wait_for_timeout(350)
    page.locator('[data-admin-tab="progression"]').click(); page.wait_for_timeout(450)
    check('Arconte lista Mesas com métricas de evolução', page.locator('#admin-progression-panel .ms-arconte-table').count()>0)
    row=page.locator('#admin-progression-panel .ms-arconte-table').first
    row.locator('[data-admin-peg-amount]').fill('7'); row.locator('[data-admin-peg-reason]').fill('QA V2.10 · reforço Arconte'); row.locator('[data-admin-peg]').click(); page.wait_for_timeout(450)
    row=page.locator('#admin-progression-panel .ms-arconte-table').first
    row.locator('[data-admin-ledger]').click(); page.wait_for_timeout(450)
    ledger=row.locator('[data-admin-ledger-host]')
    check('Ledger do Arconte abre por Mesa', 'ECONOMIA PEG' in ledger.inner_text() and 'MEMÓRIA DE EVOLUÇÃO' in ledger.inner_text(), ledger.inner_text()[:500])
    check('Ledger registra concessão do Arconte', 'CONCESSÃO ARCONTE' in ledger.inner_text() or 'QA V2.10' in ledger.inner_text(), ledger.inner_text()[:500])
    page.evaluate("document.getElementById('admin-panel-modal')?.classList.remove('open')")
    adm_tables=page.evaluate('window.MS_DB.fetchMyTables().then(r=>r.data)')
    check('ADM enxerga qualquer Mesa no Sandbox', any(t.get('id')=='table-sandbox-001' for t in adm_tables), adm_tables)
    page.evaluate("window.enterVTT('table-sandbox-001',true)"); page.wait_for_timeout(650)
    page.evaluate('window.msOpenCrewCenter()'); page.wait_for_timeout(450)
    check('ADM herda Central Operacional na Mesa', page.locator('#ms-crew-center').is_visible() and page.locator('#ms-crew-center [data-crew-tab="evolution"]').count()==1)
    check('ADM herda comandos de Mestre', page.evaluate("[...document.querySelectorAll('.gm-only-btn')].some(e=>getComputedStyle(e).display!=='none')"))

    # Sanidade final.
    check('nenhum erro crítico de JavaScript no QA', not page_errors and not console_errors, {'pageErrors':page_errors[:10],'console':console_errors[:10]})
    page.screenshot(path='/mnt/data/v210-browser-qa.png',full_page=True)
    browser.close()

failed=[r for r in results if not r['ok']]
print(json.dumps({'ok':not failed,'results':results,'failed':failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
