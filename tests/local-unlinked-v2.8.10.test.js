import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('js/ms-runtime-config.js');
const config=read('js/ms-config.js');
const db=read('js/supabase-db.js');
const offline=read('js/offline-db.js');
const index=read('index.html');
const install=read('supabase-install-completo-v2.8.10-local.sql');
const hasSandbox=fs.existsSync('sandbox-offline/index.html');
const sandboxIndex=hasSandbox?read('sandbox-offline/index.html'):'';

test('runtime de produção contém somente a configuração pública do Supabase',()=>{
  assert.match(runtime,/url:\s*'https:\/\/xhcunksjrksdzdtabfxt\.supabase\.co'/);
  assert.match(runtime,/publishableKey:\s*'sb_publishable_[A-Za-z0-9_-]+'/);
  assert.doesNotMatch(config,/https:\/\/[a-z0-9]+\.supabase\.co/i);
  assert.doesNotMatch(config,/sb_publishable_[A-Za-z0-9_-]+/);
  assert.match(config,/projectRef:match\?\.\[1\]\|\|'unlinked'/);
});

test('configuração e adaptador offline são carregados antes do contrato de banco',()=>{
  const runtimePos=index.indexOf('js/ms-runtime-config.js');
  const configPos=index.indexOf('js/ms-config.js');
  const offlinePos=index.indexOf('js/offline-db-loader.js');
  const dbPos=index.indexOf('js/supabase-db.js');
  assert.ok(runtimePos>=0 && configPos>runtimePos && offlinePos>configPos && dbPos>offlinePos);
});

test('sem configuração remota, contrato MS_DB usa backend local em vez de bloquear login',()=>{
  assert.match(db,/window\.MS_OFFLINE_DB\?\.create/);
  assert.match(db,/Modo offline local ativado/);
  assert.match(offline,/async signIn/);
  assert.match(offline,/ready:true,enabled:false,offline:true/);
});

test('instalador consolidado continua incluindo infraestrutura de evolução V2.8.9 e Arconte',()=>{
  assert.match(install,/create table if not exists public\.table_progression_wallets/);
  assert.match(install,/create table if not exists public\.character_progression_accounts/);
  assert.match(install,/create table if not exists public\.progression_transactions/);
  assert.match(install,/progression_buy_table_points/);
  assert.match(install,/progression_grant_character/);
  assert.match(install,/progression_admin_adjust_table/);
  assert.match(install,/soul_add_transaction/);
});

test('sandbox local é a aplicação completa e não uma página de demonstração isolada',{skip:!hasSandbox},()=>{
  assert.match(sandboxIndex,/js\/script\.js/);
  assert.doesNotMatch(sandboxIndex,/js\/master-tools\.js/);
  assert.match(read('js/feature-loader.js'),/js\/master-tools\.js/);
  assert.match(sandboxIndex,/js\/progression-v2\.8\.9\.js|js\/feature-loader\.js/);
  assert.match(sandboxIndex,/screen-login/);
});
