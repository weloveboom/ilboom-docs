# Arquitectura del Sistema

## Diagrama de alto nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                          USUARIO FINAL                           │
│               (navegador web, app móvil futura)                   │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Cloudflare       │
                    │  DNS · CDN · WAF   │
                    │  (Plan Free, $0)   │
                    └─────────┬──────────┘
                              │
                ┌─────────────▼──────────────┐
                │   Google Cloud Platform     │
                │   Cloud Run (us-west1)      │
                │                             │
                │  ┌───────────────────────┐  │
                │  │  Backend NestJS       │  │
                │  │  puerto 8080          │  │
                │  │  /ib/api/*            │  │
                │  │  512 MiB              │  │
                │  └───────────────────────┘  │
                │                             │
                │  ┌───────────────────────┐  │
                │  │  Frontend Next.js     │  │
                │  │  puerto 8080          │  │
                │  │  /*                   │  │
                │  │  512 MiB              │  │
                │  └───────────────────────┘  │
                └─────────────────────────────┘

     ┌──────────────┬──────────────┬──────────────┬──────────────┐
     │              │              │              │              │
┌────▼────┐  ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐ ┌─────▼─────┐
│ Supabase │  │  Cloudflare  │ │Cloudflare│ │  Firebase   │ │  Stripe   │
│PostgreSQL│  │      R2      │ │  Stream  │ │Auth+Firest. │ │MercadoPago│
│ (datos)  │  │(fotos/videos)│ │(live/VOD)│ │(auth/chat)  │ │ dLocalGo  │
└──────────┘  └─────────────┘ └──────────┘ └─────────────┘ └───────────┘
```

## Servicios externos

| Servicio | Propósito | SDK / Integración |
|----------|-----------|-------------------|
| **Supabase** | PostgreSQL gestionado. Base de datos principal en staging/producción. | `pg` + TypeORM |
| **Cloudflare R2** | Almacenamiento de medios (fotos, videos, thumbnails). API compatible con S3. Sin costo de egress. | `@aws-sdk/client-s3` |
| **Cloudflare Stream** | Live streaming (RTMPS) y VOD (HLS). Webhooks con firma HMAC para eventos de video. | HTTP directo |
| **Firebase Auth** | Autenticación de usuarios. El backend solo valida tokens (no almacena contraseñas). | `firebase-admin` SDK |
| **Firebase Firestore** | Chat en tiempo real (mensajería 1:1), chat de live streaming, estado de notificaciones. | `firebase-admin` SDK |
| **Stripe** | Procesamiento de pagos con checkout. Webhooks con verificación de firma. | `stripe` SDK v21 |
| **Stripe Connect** | Onboarding de creadores para recibir pagos. Gestión de cuentas conectadas. | `stripe` SDK v21 |
| **MercadoPago** | Proveedor de pagos alternativo. Toggle por usuario (`mp_enabled`). | `mercadopago` SDK v2.12 |
| **dLocalGo** | Pagos split (split payments). En modo sandbox. | Vía Supabase proxy |
| **GitHub Container Registry** | Registro de imágenes Docker (`ghcr.io/weloveboom/*`). | Docker + GitHub Actions |

## Flujo de una request típica

```
1. Usuario accede a weloveboom.cloud
2. Cloudflare recibe la request (DNS proxy, WAF, caché edge)
3. Si es contenido estático cacheado → se sirve desde Cloudflare
4. Si no → se enruta a Cloud Run (frontend o backend según ruta)
5. Frontend (Next.js):
   - Server Components → fetch inicial con token desde cookie
   - Client Components → interactividad, llamadas API vía apiClient
6. Backend (NestJS):
   - Recibe request en /ib/api/*
   - Valida token Firebase (FirebaseAuthGuard)
   - Procesa en capas: Controller → Service → Gateway → Repository
   - Devuelve respuesta envuelta en ResponseWrapper { data, code, status, message }
7. Frontend desenvuelve la respuesta automáticamente
```

## Arquitectura del Backend (NestJS)

### Patrón de capas

```
Controller  →  expone endpoints HTTP, delega al servicio
Service     →  orquesta casos de uso, coordina gateways
Gateway     →  ejecuta lógica atómica (un caso de uso por gateway)
Repository  →  acceso a base de datos (TypeORM, abstracciones)
Mapper      →  transforma entidad ORM → DTO de respuesta
```

### Principios

- **Inyección de dependencias con clases abstractas**: cada componente (service, gateway, mapper, repository) se define con una interfaz abstracta y se inyecta la implementación concreta.
- **22 módulos independientes**: cada módulo (users, posts, store, live, etc.) tiene su propio controller, service, gateways y DTOs. Módulos no se acoplan entre sí.
- **ACL (Anti-Corruption Layer)**: capa que aísla las integraciones externas (DB, Cloudflare, Firebase, pagos). Los módulos de negocio nunca llaman SDKs externos directamente.
- **Migraciones versionadas**: `synchronize: false` en producción. 39 migraciones activas en `src/migrations/`. Cada cambio de esquema genera una migración.

### API

- Prefijo global: `/ib/api`
- Todas las respuestas envueltas: `{ data, code, status, message }`
- Rate limiting: 60 requests/minuto/IP
- Health check: `/ib/api/status/health`

## Arquitectura del Frontend (Next.js)

### App Router

- **Rutas públicas** (sin auth): `/welcome`, `/login`, `/register*`, `/forgot-password*`, `/terms`
- **Rutas protegidas** (grupo `(main)/`): feed, explore, perfil, inbox, lives, etc.
- **Middleware**: valida cookie `auth_token`. Sin token en ruta protegida → redirige a `/welcome`.

### Server Components + Client Components

- **Server Components** (`*Server.tsx`): fetch de datos inicial, SEO, renderizado en servidor
- **Client Components** (`*Client.tsx`): interactividad, estado, hooks
- **ISR** (Incremental Static Regeneration): rutas públicas (explore, categorías) se revalidan cada 300s

### API Client

- Cliente singleton (`apiClient`) para llamadas desde el navegador
- Server fetch (`serverFetch`) para llamadas desde Server Components
- Ambos desenvuelven automáticamente el `ResponseWrapper` del backend
- Token Firebase inyectado como `Authorization: Bearer` en cada request

## Infraestructura (GCP + Cloudflare)

### Google Cloud Platform

- **Proyecto**: `ilboom-test`, región `us-west1`
- **Compute**: 2 servicios Cloud Run (backend + frontend), 512 MiB cada uno
- **Sin Kubernetes, sin balanceador de carga**: Cloud Run es serverless, escala a cero. El ruteo lo hace Cloudflare.
- **Container Registry**: `ghcr.io/weloveboom/*`

### Cloudflare

- **Plan**: Free
- **DNS**: autoridad para `weloveboom.cloud` (15 registros)
- **CDN**: caché edge multi-capa
- **WAF**: reglas anti-scanner, Browser Integrity Check, Hotlink Protection, challenge en endpoints de auth
- **DDoS**: protección L3/L4 incluida

### Terraform (IaC)

Toda la infraestructura está versionada como código en `infra-ilboom/09-iac-terraform/`. Proveedores: GCP + Cloudflare. Recrear el entorno desde cero es ejecutar `terraform apply`.

## Capa de seguridad

| Capa | Mecanismo |
|------|-----------|
| **Borde** | Cloudflare WAF (reglas custom, Browser Integrity Check, Hotlink Protection) |
| **Borde** | Cloudflare DDoS L3/L4 |
| **Aplicación** | Helmet (CSP, HSTS, Permissions-Policy) |
| **Aplicación** | CORS restringido al dominio de la aplicación |
| **Aplicación** | Rate limiting: 60 req/min/IP |
| **Autenticación** | Firebase Auth, 4 niveles de guard: público, autenticado, creador, admin |
| **Webhooks** | Firma HMAC (Stripe, Cloudflare Stream). MercadoPago con validación de firma. |
| **Datos** | PostgreSQL con SSL, conexiones limitadas (15) |
| **Runtime** | Imágenes Docker distroless (sin shell, usuario non-root) |
