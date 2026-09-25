import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const {version}=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const out = join(root, 'sandbox-offline');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Sandbox integral: mesma árvore canônica de runtime, com bootstrap local próprio.
for (const entry of ['index.html', '.nojekyll', 'VERSION.txt', 'assets', 'css', 'js', 'data', 'codex-files']) {
  const src = join(root, entry);
  if (existsSync(src)) cpSync(src, join(out, entry), { recursive: true });
}

function makeSandboxIndex(html){
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

writeFileSync(join(out,'index.html'), makeSandboxIndex(readFileSync(join(out,'index.html'),'utf8')));
writeFileSync(join(out, 'js', 'ms-runtime-config.js'), `/* Mundos Sombrios — Runtime SANDBOX INTEGRAL v${version} */\n(function(){\n  'use strict';\n  window.MS_RUNTIME_CONFIG = {\n    environment: 'sandbox-integral-offline',\n    offlineMode: true,\n    sandboxMode: true,\n    storageNamespace: 'ms-sandbox-v2101',\n    supabase: { url:'', publishableKey:'', environment:'unlinked' }\n  };\n})();\n`);
writeFileSync(join(out, 'README-SANDBOX.txt'), `SITE OFICIAL MS V${version} — SANDBOX INTEGRAL\n\nEsta pasta é gerada automaticamente a partir do mesmo runtime do site principal.\nO bootstrap troca Supabase por banco local isolado e remove dependências remotas do carregamento inicial.\nNão edite esta pasta manualmente: execute npm run sandbox para reconstruí-la.\n\nContas QA:\nJogador: jogador / jogador123\nMestre: mestre / mestre1234\nADM: admin / admin12345\n`);
console.log(`Sandbox integral V${version} reconstruído a partir da árvore canônica.`);
