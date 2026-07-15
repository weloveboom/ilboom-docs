# ILBOOM Docs

Portal de documentación del proyecto ILBOOM, construido con [Docusaurus](https://docusaurus.io/).

## Estructura

```
docs/
├── intro.md                  ← Visión general del proyecto
├── arquitectura.md           ← Arquitectura, servicios, seguridad
├── modulos.md                ← Backend y frontend: módulos, rutas, componentes
├── despliegue.md             ← Infraestructura, CI/CD, Docker, variables de entorno, costos
├── decisiones-tecnicas.md    ← Decisiones de diseño, riesgos, mitigaciones
└── bugs-y-limitaciones.md    ← Bugs, pendientes, limitaciones
```

## Desarrollo local

```bash
npm install
npm start
```

Abre http://localhost:3000 en el navegador. Los cambios en `docs/` se reflejan en vivo.

## Build

```bash
npm run build
npm run serve   # previsualizar build de producción
```

## Deploy a GitHub Pages

El deploy es automático: cada push a `main` dispara el workflow `.github/workflows/deploy.yml` que publica el sitio en GitHub Pages con el dominio `docs.weloveboom.cloud`.

**Para activar:**
1. Repo settings → Pages → Source: **GitHub Actions**
2. Repo settings → Pages → Custom domain: `docs.weloveboom.cloud`
3. DNS (Cloudflare): CNAME `docs` → `weloveboom.github.io` en la zona `weloveboom.cloud`

El certificado SSL lo gestiona GitHub automáticamente.

## Generar PDF

```bash
bash generar-pdf.sh
```

Genera `ILBOOM-documentacion.pdf` con todos los documentos unificados. Requiere Node.js 18+ y Google Chrome instalado.

## Estado

- [x] Documentación del proyecto (6 docs)
- [x] Swagger UI — configurado en backend en `/ib/api/docs`
- [x] Storybook — inicializado en frontend, stories de Button y Card
- [x] PDF unificado (`bash generar-pdf.sh`)
- [ ] Deploy a Cloudflare Pages (`docs.ilboom.cl`)
- [ ] Icono/logo personalizado para ILBOOM
