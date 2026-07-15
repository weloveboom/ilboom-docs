# Bugs Conocidos y Funcionalidad Pendiente

## Bugs Conocidos

### 1. Webhooks de dLocalGo sin validación de firma

**Archivo**: `src/acl/services/payment-provider/dlocal/dlocalgo.service.ts`

**Descripción**: La validación de firma HMAC para webhooks de dLocalGo está implementada pero **bypasseada**. Cuando la firma no coincide, el sistema solo loguea un warning y permite el webhook de todas formas (`ALLOWING FOR DEBUG`).

**Impacto**: Riesgo de seguridad si dLocalGo se usa en producción real con pagos. Un atacante podría enviar webhooks falsos para simular pagos completados.

**Plan**: Investigar el formato correcto de firma con la documentación de dLocalGo y habilitar la validación. El TODO en el código tiene fecha sin resolver.

---

### 2. Conflicto de dependencias `class-validator`

**Descripción**: `@nestjs/mapped-types@2.1.0` requiere `class-validator@^0.14.0` pero el proyecto usa `0.15.1`.

**Impacto**: Ninguno en runtime. Solo molesta durante `npm install` o `pnpm install`. Solución actual: `legacy-peer-deps=true` en `.npmrc`.

**Plan**: Actualizar `@nestjs/mapped-types` cuando salga una versión compatible, o forzar la resolución en `package.json`.

---

## Funcionalidad Pendiente

| Funcionalidad | Estado actual | Prioridad |
|--------------|---------------|-----------|
| **Transcoder de video en frontend** | Archivo stub (`lib/workers/video-transcoder.worker.ts`). El TODO dice `integrate @ffmpeg/ffmpeg when ffmpeg.wasm is approved for install`. Actualmente solo simula el delay con `setTimeout`. | **Alta** — Bloquea la compresión de video del lado del cliente antes de subir. |
| **Verificación de email en registro** | Parcialmente implementada. El formulario `VerifyEmailForm.tsx` tiene un TODO que indica que la verificación real con Firebase no está completa. | **Alta** — Usuarios pueden registrarse sin verificar email. |
| **Verificación de código de recuperación de contraseña** | `VerifyPasswordResetForm.tsx` tiene un TODO: la verificación del código no está implementada realmente. | **Alta** — El flujo de recuperación de contraseña no está completo. |
| **Integración completa de pagos en frontend** | 5 fases documentadas en `docs/payments-integration-plan.md`. Pendiente: recarga de billetera, checkout de tienda con wallet + fallback externo, solicitudes de retiro (payout). | **Alta** — La monetización depende de esto. |
| **Upload de video con presigned URLs** | Especificación y plan aprobados (`2026-07-07-video-presigned-upload`). Migrar de multipart (límite 32 MB en Cloud Run) a URLs prefirmadas de R2 con barra de progreso y compresión ffmpeg.wasm. | **Alta** — Resuelve el límite de 32 MB en uploads. |
| **Migración de dominio** (`weloveboom.cloud` → `ilboom.cl`) | Plan de 10 pasos documentado. Implica ~36 referencias en código, variables de entorno y URLs de webhook de terceros. | **Media** — No es blocker funcional, pero es necesario para la marca. |
| **Tests automatizados** | Backend: Jest configurado con algunos tests unitarios (gateways), cobertura baja. Frontend: tests de contextos (PostInteractions, Auth), cobertura baja. | **Media** — Sin cobertura mínima, los deploys no tienen red de seguridad. |
| **APM / Observabilidad** | Solo logs de Winston. Sin Datadog, Sentry ni similar. | **Media** — Debugging en producción depende de Cloud Run logs. |
| **Google Sign-In en frontend** | Soportado vía `signInWithGooglePopup()` pero no completamente integrado en todos los flujos. | **Baja** |

## Limitaciones Técnicas

### Upload de archivos limitado a 32 MB

Cloud Run impone un límite de 32 MB en el body de requests HTTP. Esto afecta la subida de videos grandes. La migración a R2 presigned URLs (funcionalidad pendiente) resolverá esto al permitir que el cliente suba directamente a R2 sin pasar por Cloud Run.

### Cold start de Cloud Run

Cuando un servicio Cloud Run está a cero instancias (sin tráfico reciente), la primera request puede tardar 1-3 segundos adicionales ("cold start"). Mitigable con `min-instances=1`, que mantiene al menos una instancia caliente pero tiene costo adicional.

### Sin balanceador de carga

Tras eliminar el GCP Load Balancer en julio 2026, Cloudflare + Cloud Run manejan todo el ruteo. Esto funciona para la escala actual pero:
- URLs directas de Cloud Run (`.run.app`) no están protegidas por WAF
- Si Cloudflare tiene outage, el servicio es inaccesible (aunque Cloudflare tiene redundancia global)

### Firestore como única opción de tiempo real

Si Firebase/Firestore tiene una interrupción, el chat en vivo y las notificaciones en tiempo real dejan de funcionar. Hay fallback REST para la mensajería, pero sin la experiencia en tiempo real.

### Monolito único

Aunque los módulos están aislados lógicamente, un deploy fallido del monolito afecta a todos los módulos simultáneamente. No hay deploys parciales por módulo.

### Sin API pública documentada

No existe un API documentation (tipo Swagger/OpenAPI). Los endpoints están documentados en el código y en los skills del agente de desarrollo, pero no hay un documento público para integradores externos.
