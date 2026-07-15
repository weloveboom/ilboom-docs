// Encripta todos los HTML del build con pagecrypt (AES-256-GCM)
// La contraseña se toma de DOCS_PASSWORD (variable de entorno)
// Cada página queda protegida: el usuario ingresa la clave una vez y
// sessionStorage la recuerda para el resto de páginas.

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = join(import.meta.dirname, '..', 'build');
const PASSWORD = process.env.DOCS_PASSWORD;

if (!PASSWORD) {
  console.error('ERROR: DOCS_PASSWORD no definida');
  process.exit(1);
}

function findHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...findHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = findHtmlFiles(BUILD_DIR);
console.log(`Encriptando ${htmlFiles.length} archivos HTML...`);

for (const file of htmlFiles) {
  const rel = file.replace(BUILD_DIR, '');
  execSync(`npx pagecrypt "${file}" "${file}" "${PASSWORD}"`, { stdio: 'pipe' });
  console.log(`  ✓ ${rel}`);
}

console.log('✅ Documentación protegida');
