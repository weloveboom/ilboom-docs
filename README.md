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

## Deploy

El sitio se despliega automáticamente a Cloudflare Pages desde la rama `main`. Configuración de DNS: `docs.ilboom.cl` → Cloudflare Pages.

## Generar PDF

```bash
bash generar-pdf.sh
```

Genera `ILBOOM-documentacion.pdf` con todos los documentos unificados. Requiere Node.js 18+ y Google Chrome instalado.

## Secciones pendientes

- [ ] Swagger UI: agregar `@nestjs/swagger` en el backend para auto-generar la referencia de API en `https://api.weloveboom.cloud/ib/api/docs`
- [ ] Storybook: inicializar en el frontend y linkear desde el portal
- [ ] Icono/logo personalizado para ILBOOM
