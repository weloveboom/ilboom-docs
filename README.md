# ILBOOM — Documentación del Proyecto

## ¿Qué es ILBOOM?

ILBOOM es una red social para creadores de contenido con herramientas de monetización integradas. Los creadores pueden publicar contenido, vender productos en su tienda, ofrecer video on demand (VOD), transmitir en vivo, lanzar campañas de crowdfunding y recibir propinas. Los usuarios descubren contenido, siguen creadores, compran productos y participan en campañas.

El proyecto se compone de **2 repositorios principales** más herramientas de infraestructura:

- **Backend**: API monolítica en NestJS (`IB-monolitic-backend`)
- **Frontend**: Aplicación web en Next.js (`inboom_frontend`)
- **Infraestructura**: Terraform, scripts y documentación de despliegue (`infra-ilboom`)

## Stack tecnológico resumido

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11, TypeScript 5.7, TypeORM 0.3.28 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Base de datos | PostgreSQL (Supabase) / SQLite (desarrollo local) |
| Autenticación | Firebase Auth |
| Tiempo real | Firebase Firestore (chat, notificaciones) |
| Almacenamiento | Cloudflare R2 (S3-compatible) |
| Streaming | Cloudflare Stream (live RTMPS + VOD HLS) |
| Pagos | Stripe, MercadoPago, dLocalGo |
| Infraestructura | GCP Cloud Run + Cloudflare (CDN, DNS, WAF) |
| IaC | Terraform |

## Estado actual

MVP funcional en producción en [weloveboom.cloud](https://weloveboom.cloud). **22 módulos de backend completos**, frontend con todas las rutas principales activas. Migración de dominio a `ilboom.cl` planificada.

## Para quién es este documento

Para inversionistas, revisores técnicos y cualquier persona que necesite entender la arquitectura, el alcance y el estado del proyecto **sin acceso al código fuente**. Si en una etapa posterior se requiere revisar el código, esta documentación sirve como mapa de navegación.

## Índice de documentos

| Documento | Contenido |
|-----------|-----------|
| [arquitectura.md](arquitectura.md) | Diagrama de alto nivel, servicios cloud, flujo de requests, capas de seguridad |
| [modulos.md](modulos.md) | Backend: 22 módulos con propósito y endpoints. Frontend: rutas, componentes, contextos |
| [despliegue.md](despliegue.md) | Infraestructura GCP + Cloudflare, CI/CD, Docker, variables de entorno, costos |
| [decisiones-tecnicas.md](decisiones-tecnicas.md) | Decisiones de arquitectura relevantes, riesgos y mitigaciones |
| [bugs-y-limitaciones.md](bugs-y-limitaciones.md) | Bugs conocidos, funcionalidad pendiente, limitaciones técnicas |

## Generar PDF

Para compartir sin dar acceso al repositorio, ejecutar:

```bash
bash generar-pdf.sh
```

Genera `ILBOOM-documentacion.pdf` con todos los documentos unificados.

---

## Contacto

- **Dominio actual**: [weloveboom.cloud](https://weloveboom.cloud)
- **Dominio futuro**: ilboom.cl (migración planificada)
