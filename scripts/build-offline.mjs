import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const {version}=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const out = join(root, 'offline-local');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of ['index.html', '.nojekyll', 'VERSION.txt', 'assets', 'css', 'js', 'data', 'codex-files']) {
  const src = join(root, entry);
  if (existsSync(src)) cpSync(src, join(out, entry), { recursive: true });
}

function makeLocalIndex(html){
  return html
    .replace(/\s*<link rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin>\s*/g,'\n')
    .replace(/\s*<link rel="dns-prefetch" href="\/\/cdn\.jsdelivr\.net">\s*/g,'\n')
    .replace(/\s*<link rel="preconnect" href="https:\/\/cdnjs\.cloudflare\.com" crossorigin>\s*/g,'\n')
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g,'\n')
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g,'\n')
    .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]+rel="stylesheet">\s*/g,'\n')
    .replace(/\s*<script defer src="js\/offline-db-loader\.js"><\/script>\s*/g,'\n    <script defer src="js/offline-db.js"></script>\n')
    .replace(/\s*<script defer src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/dist\/umd\/supabase\.min\.js"><\/script>\s*/g,'\n');
}

writeFileSync(join(out,'index.html'), makeLocalIndex(readFileSync(join(out,'index.html'),'utf8')));
writeFileSync(join(out, 'js', 'ms-runtime-config.js'), `/* Mundos Sombrios — Runtime OFFLINE LOCAL v${version} */\n(function(){\n  'use strict';\n  window.MS_RUNTIME_CONFIG = {\n    environment: 'offline-local',\n    offlineMode: true,\n    sandboxMode: false,\n    storageNamespace: 'ms-local-v2100',\n    supabase: { url:'', publishableKey:'', environment:'unlinked' }\n  };\n})();\n`);
writeFileSync(join(out,'README-OFFLINE.txt'), `SITE OFICIAL MS V${version} — MODO OFFLINE LOCAL\n\nAbra esta pasta por HTTP local. No Windows, use INICIAR-SITE-OFFLINE.bat na raiz do pacote.\nO modo offline não depende do Supabase para autenticação/persistência e usa armazenamento local do navegador.\n\nContas locais de teste:\nJogador: jogador / jogador123\nMestre: mestre / mestre1234\nADM: admin / admin12345\n`);
console.log(`Modo offline local V${version} reconstruído a partir da árvore canônica.`);
