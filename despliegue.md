# Infraestructura y Despliegue

## Proveedores Cloud

| Proveedor | Servicio | Plan | Propósito |
|-----------|----------|------|-----------|
| **GCP** | Cloud Run | Pago por uso | Compute serverless para backend y frontend |
| **GCP** | Artifact Registry | Pago por uso | Registro de imágenes Docker (espejo de ghcr.io) |
| **Cloudflare** | DNS, CDN, WAF, DDoS | Free ($0) | Proxy inverso, caché, seguridad, DNS |
| **Supabase** | PostgreSQL | Pro | Base de datos gestionada |
| **Firebase** | Auth, Firestore | Spark (free) | Autenticación, base de datos en tiempo real |
| **GitHub** | Repos, Actions, Registry | Free | Control de versiones, CI/CD, registro de imágenes |

## Flujo de Despliegue

```
┌──────────────┐     ┌──────────────────┐     ┌──────────┐     ┌───────────┐
│  git push    │────▶│  GitHub Actions  │────▶│  ghcr.io │────▶│  Dokploy  │
│ development  │     │  build + test    │     │  imagen  │     │  detecta  │
│    / dev     │     │  + docker push   │     │  Docker  │     │  y hace   │
└──────────────┘     └──────────────────┘     └──────────┘     │  deploy   │
                                                                └─────┬─────┘
                                                                      │
┌──────────────┐     ┌──────────────────┐     ┌───────────────────────▼──┐
│  Cloudflare  │◀────│  Smoke test      │◀────│  Cloud Run              │
│  purge caché │     │  (health check)  │     │  nueva revisión activa  │
└──────────────┘     └──────────────────┘     └──────────────────────────┘
```

### Ramas y entornos

| Repositorio | Rama de trabajo | Rama de staging | Rama de producción |
|-------------|-----------------|-----------------|---------------------|
| Backend | `development` | `staging` | `main` |
| Frontend | `dev` | `test` | `main` |

El flujo estándar es: `feature branch` → `development/dev` → prueba → merge a `staging/test` → QA → merge a `main` → producción.

### CI/CD (GitHub Actions)

- **Backend** (`ci.yaml`): install → lint → test → build → Docker build & push
- **Frontend**: Renovate para auto-actualizaciones de dependencias
- **Post-deploy**: smoke test (health check HTTP) + purga de caché Cloudflare (requiere secrets `CF_API_TOKEN` y `CF_ZONE_ID`)

### Despliegue automatizado (Dokploy)

Dokploy monitorea las ramas `development` (backend) y `dev` (frontend). Al detectar un nuevo commit, toma la imagen Docker de `ghcr.io`, la despliega en Cloud Run, y ejecuta smoke test + purga de caché.

## Docker

### Backend

```dockerfile
# Build: node:20-slim + pnpm
# Runtime: gcr.io/distroless/nodejs20:nonroot
# Puerto: 8080
# Usuario: non-root
# CMD: dist/main.js
```

- Multistage: separa build de runtime para minimizar tamaño
- Distroless: sin shell, sin gestor de paquetes, superficie de ataque mínima
- pnpm como gestor de paquetes

### Frontend

```dockerfile
# Build: node:22-alpine + npm
# Runtime: gcr.io/distroless/nodejs22:nonroot
# Puerto: 8080
# Output: standalone
```

- Next.js output standalone: incluye solo lo necesario para producción
- `sharp` para optimización de imágenes en producción

## Dominios y DNS

### Estado actual

- **Dominio principal**: `weloveboom.cloud`
- **Subdominios**: `api.weloveboom.cloud`, `www.weloveboom.cloud`
- **DNS**: Cloudflare (nameservers: `jobs.ns.cloudflare.com`, `lola.ns.cloudflare.com`)
- **15 registros DNS**: A (Google IPs), CNAME (api, www), MX (Google Workspace), TXT (SPF, DKIM, Firebase, verificación)

### Migración planificada: `weloveboom.cloud` → `ilboom.cl`

Plan de 10 pasos documentado en `infra-ilboom/08-domain-migration/`. Implica:

- Aproximadamente 36 referencias a actualizar en código, variables de entorno y documentación
- Recreación de certificados SSL
- Actualización de URLs de webhook en Stripe, MercadoPago y Firebase
- Coexistencia temporal de ambos dominios durante la transición

## Caché (3 capas)

| Capa | Proveedor | Qué cachea | TTL |
|------|-----------|-----------|-----|
| **Edge** | Cloudflare CDN | Archivos estáticos, explore | 30d estáticos, 2h explore |
| **Aplicación** | GCP CDN | `CACHE_ALL_STATIC` en Cloud Run | Configurable |
| **Framework** | Next.js ISR | Páginas públicas (explore, categorías) | `staleTimes: dynamic 30s, static 300s` |

Las rutas de API (`/ib/api/*`) no se cachean en Cloudflare.

## Terraform (Infraestructura como Código)

Ubicación: `infra-ilboom/09-iac-terraform/`

```hcl
# Proveedores
terraform {
  required_providers {
    google    = { source = "hashicorp/google", version = "~> 6.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 5.0" }
  }
}
```

### Recursos gestionados

| Archivo | Recursos |
|---------|----------|
| `main.tf` | Cloud Run IAM (permisos de invocación) |
| `cloudflare.tf` | 18 registros DNS, configuración de zona, reglas WAF, reglas de caché |
| `providers.tf` | Configuración de providers GCP y Cloudflare |
| `variables.tf` | Variables parametrizadas para dominio, WAF toggle, caché toggle |
| `outputs.tf` | Outputs útiles (URLs, nombres) |

El estado de Terraform está versionado. Recrear el entorno completo desde cero es `terraform apply`.

## Variables de Entorno

### Backend — agrupadas por servicio

**General**:
`NODE_ENV`, `PORT`, `DATABASE_URL`, `SQLITE_DATABASE`, `DB_LOGGING`, `FRONTEND_BASE_URL`, `TIME_OUT`, `LOG_LEVEL`

**Firebase Auth**:
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (o `FIREBASE_PRIVATE_KEY_B64`)

**Cloudflare R2**:
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

**Cloudflare Stream**:
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN`, `CLOUDFLARE_WEBHOOK_SECRET`, `CLOUDFLARE_STREAM_SIGNING_KEY_ID`, `CLOUDFLARE_STREAM_SIGNING_PRIVATE_KEY`

**Stripe**:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_NOTIFICATION_URL`

**MercadoPago**:
`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, `PAYMENT_FAILURE_URL`, `PAYMENT_NOTIFICATION_URL`

**dLocalGo**:
`DLOCALGO_API_KEY`, `DLOCALGO_SECRET_KEY`, `DLOCALGO_API_URL`, `DLOCALGO_COUNTRY`, `DLOCALGO_NOTIFICATION_URL`

**Feature flags**:
`PLATFORM_FEE_PERCENT`, `FEATURE_VIDEO_PRESIGNED_UPLOAD`, `VIDEO_MAX_FEED_DURATION_SECONDS`, `VIDEO_MAX_VOD_DURATION_SECONDS`, `VIDEO_MAX_UPLOAD_SIZE_BYTES`, `VIDEO_PRESIGNED_URL_TTL_SECONDS`, `VIDEO_OUTPUT_MAX_WIDTH`, `VIDEO_OUTPUT_MAX_HEIGHT`, `VIDEO_TRANSCODE_BITRATE`

**Proveedor de pago por defecto**:
`PAYMENT_PROVIDER`

### Frontend

**Públicas** (accesibles desde el navegador, prefijo `NEXT_PUBLIC_`):
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_VIDEO_MAX_FEED_DURATION`, `NEXT_PUBLIC_VIDEO_MAX_VOD_DURATION`, `NEXT_PUBLIC_VIDEO_OUTPUT_MAX_WIDTH`, `NEXT_PUBLIC_VIDEO_OUTPUT_MAX_HEIGHT`, `NEXT_PUBLIC_VIDEO_TRANSCODE_BITRATE`

**Privadas** (solo servidor):
`API_URL`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

### Inyección de variables en runtime

El frontend expone `/runtime-env.js` (ruta `force-dynamic`) que inyecta `window.__INBOOM_RUNTIME_ENV__` en el cliente desde `process.env` del servidor. Esto permite cambiar variables sin rebuild.

## Costos Mensuales Estimados

| Servicio | Costo aproximado | Notas |
|----------|-----------------|-------|
| GCP Cloud Run | $20–50 | 2 servicios 512 MiB, tráfico moderado |
| GCP Artifact Registry | $0–5 | Almacenamiento de imágenes Docker |
| Cloudflare | **$0** | Plan Free cubre DNS, CDN, WAF, DDoS |
| Supabase | ~$25 | PostgreSQL gestionado, plan Pro |
| Firebase Auth | **$0** | Spark plan (límites generosos: 50K MAU) |
| Firebase Firestore | **$0** | Spark plan (1 GiB almacenado, 50K lecturas/día) |
| GitHub | **$0** | Plan Free (repositorios privados ilimitados) |
| Stripe / MP / dLocal | Variable | Solo comisiones por transacción |
| **Total fijo** | **~$45–80/mes** | Sin contar comisiones de pago |
