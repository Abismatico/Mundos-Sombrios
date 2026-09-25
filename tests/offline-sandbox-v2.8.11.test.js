import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const offline=read('js/offline-db.js');
const ui=read('js/offline-sandbox-ui.js');
const index=read('index.html');
const hasSandbox=fs.existsSync('sandbox-offline/index.html');
const sandboxIndex=hasSandbox?read('sandbox-offline/index.html'):'';
const sandboxRuntime=hasSandbox?read('sandbox-offline/js/ms-runtime-config.js'):'';

function runtime(){
  const mem=new Map();
  const localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
  class CustomEvent{constructor(type,opts={}){this.type=type;this.detail=opts.detail}}
  class BroadcastChannel{addEventListener(){}postMessage(){}close(){}}
  const events=[];
  const ctx={console,Date,Math,JSON,URLSearchParams,location:{search:''},localStorage,CustomEvent,BroadcastChannel,setTimeout,clearTimeout,crypto:{randomUUID:()=>`uuid-${Date.now()}`}};
  ctx.window=ctx;ctx.window.dispatchEvent=e=>{events.push(e)};ctx.window.addEventListener=()=>{};ctx.window.MS_RUNTIME_CONFIG={sandboxMode:true,storageNamespace:'test-ms-v2811',supabase:{url:'',publishableKey:''}};
  vm.createContext(ctx);vm.runInContext(offline,ctx,{filename:'offline-db.js'});
  return {ctx,api:ctx.MS_OFFLINE_DB.create(),events};
}

test('login offline possui os três papéis QA e sessão persistida',async()=>{
  const {api}=runtime();
  for(const [user,pass,role] of [['jogador','jogador123','jogador'],['mestre','mestre1234','mestre'],['admin','admin12345','admin']]){
    await api.signOut();
    const r=await api.signIn(user,pass);assert.equal(r.error,null);
    const s=await api.getSession();assert.equal(s.user.role,role);
  }
});

test('sandbox offline simula Mesa, PEG e concessão Arconte sem Supabase',{skip:!hasSandbox},async()=>{
  const {api}=runtime();
  await api.signIn('mestre','mestre1234');
  const tables=(await api.fetchMyTables()).data;const table=tables.find(t=>t.code==='QA2811');assert.ok(table);
  const before=(await api.fetchProgressionTableState(table.id)).data.wallet.balance;
  const grant=await api.grantCharacterProgression(table.id,'char-player-exodo',2,'teste');assert.equal(grant.error,null);
  const after=(await api.fetchProgressionTableState(table.id)).data.wallet.balance;assert.equal(after,before-2);
  await api.signOut();await api.signIn('admin','admin12345');
  const adj=await api.adminAdjustTableProgression(table.id,7,'QA Arconte');assert.equal(adj.error,null);assert.equal(adj.data.balance,after+7);
});

test('site principal carrega adaptador offline antes do contrato MS_DB',()=>{
  const posOffline=index.indexOf('js/offline-db-loader.js');
  const posDb=index.indexOf('js/supabase-db.js');
  assert.ok(posOffline>0&&posDb>posOffline);
  assert.match(index,/offline-login-hint/);
  assert.match(index,/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/);
});

test('sandbox é réplica integral do runtime e usa banco isolado',{skip:!hasSandbox},()=>{
  for(const token of ['js/script.js','js/ms-services.js','js/soul-economy.js','js/offline-db.js','js/offline-sandbox-ui-loader.js']){
    assert.match(sandboxIndex,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.doesNotMatch(sandboxIndex,/js\/master-room\.js/);
  assert.match(read('js/feature-loader.js'),/js\/master-room\.js/);
  assert.match(sandboxRuntime,/sandboxMode:\s*true/);
  assert.match(sandboxRuntime,/ms-sandbox-v(?:2811|290|2100|2101|2104)/);
  assert.match(ui,/JOGADOR/);assert.match(ui,/MESTRE/);assert.match(ui,/ADM \/ ARCONTE/);
});
