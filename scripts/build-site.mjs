import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const entry of ['index.html', '.nojekyll', 'assets', 'css', 'js', 'codex-files']) {
  cpSync(join(root, entry), join(out, entry), { recursive: true });
}
if (existsSync(join(root, 'CNAME'))) cpSync(join(root, 'CNAME'), join(out, 'CNAME'));
console.log('Site preparado em dist/; SQL, testes e auditorias ficam fora da publicação.');
