#!/usr/bin/env node
// Genera ILBOOM-documentacion.pdf unificando todos los .md del repositorio
// Usa marked (MD→HTML) + Puppeteer (HTML→PDF, con Chrome del sistema)
// Sin dependencias permanentes: npx descarga marked y puppeteer en primer uso
// Uso: node generar-pdf.mjs

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OUTPUT = join(__dirname, 'ILBOOM-documentacion.pdf');
const STYLE = join(__dirname, 'pdf-style.css');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TEMP = join(__dirname, '.pdf-temp');

const FILES = [
  'README.md',
  'arquitectura.md',
  'modulos.md',
  'despliegue.md',
  'decisiones-tecnicas.md',
  'bugs-y-limitaciones.md',
];

// --- 1. Instalar dependencias si no existen ---
const nodeModules = join(__dirname, 'node_modules');
if (!existsSync(join(nodeModules, 'marked')) || !existsSync(join(nodeModules, 'puppeteer'))) {
  console.log('Instalando dependencias (marked + puppeteer)...');
  mkdirSync(nodeModules, { recursive: true });
  execSync('npm init -y --silent', { cwd: __dirname, stdio: 'ignore' });
  execSync('npm install marked puppeteer --no-save --silent 2>&1', {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' },
  });
}

// --- 2. Verificar Chrome ---
if (!existsSync(CHROME)) {
  console.error('ERROR: No se encontró Chrome en', CHROME);
  process.exit(1);
}

// --- 3. Verificar archivos ---
for (const f of FILES) {
  if (!existsSync(join(__dirname, f))) {
    console.error('ERROR: Falta', f);
    process.exit(1);
  }
}

// --- 4. Leer CSS ---
const css = existsSync(STYLE) ? readFileSync(STYLE, 'utf-8') : '';

// --- 5. Convertir MD → HTML ---
const { marked } = await import('marked');

let htmlBody = '';
for (let i = 0; i < FILES.length; i++) {
  const md = readFileSync(join(__dirname, FILES[i]), 'utf-8');
  const content = marked.parse(md);
  htmlBody += content;
  if (i < FILES.length - 1) {
    htmlBody += '\n<div style="page-break-after: always;"></div>\n';
  }
}

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

const htmlPath = join(TEMP, 'documento.html');
mkdirSync(TEMP, { recursive: true });
writeFileSync(htmlPath, fullHtml, 'utf-8');

// --- 6. HTML → PDF con Puppeteer ---
console.log('Generando', OUTPUT, '...');
const puppeteer = await import('puppeteer');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.pdf({
    path: OUTPUT,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    printBackground: true,
  });
} finally {
  await browser.close();
}

// --- 7. Limpiar ---
if (existsSync(htmlPath)) unlinkSync(htmlPath);
try { unlinkSync(join(__dirname, 'package.json')); } catch {}
try { unlinkSync(join(__dirname, 'package-lock.json')); } catch {}

console.log('✅ PDF generado:', OUTPUT);
