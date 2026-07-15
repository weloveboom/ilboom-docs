# Decisiones Técnicas Relevantes

## 1. Monolito NestJS (no microservicios)

**Decisión**: Un solo backend con 22 módulos independientes.

**Motivo**: Velocidad de desarrollo con equipo pequeño. Cada módulo tiene su propio controller, service y gateways, con interfaces abstractas que permiten extraerlo a un microservicio independiente si la escala lo exige. No hay acoplamiento entre módulos.

**Riesgo**: Si el monolito crece demasiado, los deploys se vuelven lentos y un fallo en un módulo puede afectar a otros. **Mitigación**: cada módulo ya está aislado con su propia interfaz abstracta. Extraer un módulo a su propio servicio sería mayormente mover archivos.

---

## 2. PostgreSQL vía Supabase (no servidor propio)

**Decisión**: Base de datos gestionada en Supabase en lugar de administrar un servidor PostgreSQL propio.

**Motivo**: Cero administración de servidores, backups automáticos, SSL incluido, pooling de conexiones. Supabase es compatible con PostgreSQL estándar (mismas migraciones, mismos queries).

**Riesgo**: Vendor lock-in y dependencia de un tercero para la disponibilidad de datos. **Mitigación**: Supabase es PostgreSQL estándar. Migrar a otro proveedor (AWS RDS, Google Cloud SQL) es cuestión de cambiar la URL de conexión y exportar/importar datos. Las migraciones de TypeORM son independientes del proveedor.

---

## 3. Cloudflare R2 para almacenamiento de medios

**Decisión**: Usar R2 (compatible con API S3) en lugar de AWS S3 directo.

**Motivo**: R2 no cobra por egress (tráfico de salida). En una red social con muchas imágenes y videos, el egress de S3 sería el costo dominante. R2 lo elimina. Además, la integración con el resto de Cloudflare (CDN, caché) es nativa.

**Riesgo**: Vendor lock-in con Cloudflare. **Mitigación**: R2 usa API S3 estándar. Cambiar a AWS S3 o cualquier otro almacenamiento S3-compatible es cambiar 4 variables de entorno y el endpoint del SDK. Las URLs prefirmadas son S3 estándar.

---

## 4. Firebase Auth (no autenticación propia)

**Decisión**: Delegar toda la autenticación a Firebase Auth. El backend solo valida tokens JWT.

**Motivo**: No almacenar contraseñas elimina una superficie de ataque completa. Firebase maneja OAuth (Google, email/password), verificación de email, recuperación de contraseña y rotación de tokens. Zero-day de seguridad delegado a Google.

**Riesgo**: Dependencia de Firebase para el login. Si Firebase tiene outage, nadie puede iniciar sesión. **Mitigación**: histórico de disponibilidad de Firebase Auth >99.95%. Los tokens son JWT estándar — en teoría se podría migrar a otro proveedor OIDC sin cambiar el frontend.

---

## 5. Firestore para tiempo real (chat y notificaciones)

**Decisión**: Usar Firestore como base de datos en tiempo real para chat 1:1, chat de live streaming y estado de notificaciones.

**Motivo**: Sincronización en tiempo real sin WebSockets propios. Firestore ofrece listeners reactivos que el frontend consume directamente. Menos código que implementar un sistema de WebSockets con Redis pub/sub.

**Riesgo**: Fuera del Spark plan gratuito, Firestore puede volverse costoso si hay muchas lecturas/escrituras. **Mitigación**: Los datos principales siguen en PostgreSQL. Firestore solo almacena mensajes y estado de notificaciones (datos efímeros). Hay fallback REST si Firestore no está disponible.

---

## 6. Proveedores de pago con patrón Registry

**Decisión**: Implementar los proveedores de pago (Stripe, MercadoPago, dLocalGo) con una interfaz abstracta común y un registry que selecciona el proveedor por configuración o por preferencia del usuario.

**Motivo**: Agregar un nuevo proveedor de pago no requiere tocar los módulos que consumen pagos (store, campaigns, wallet). Solo se implementa la interfaz y se registra. También permite toggle por usuario (ej. `mp_enabled`).

**Riesgo**: Cada proveedor tiene comportamientos distintos (webhooks, formatos de respuesta, tiempos de confirmación). La abstracción puede filtrar diferencias importantes. **Mitigación**: La interfaz expone operaciones comunes (crear pago, verificar, reembolsar). Cada implementación maneja sus particularidades internamente.

---

## 7. Next.js App Router + Server Components

**Decisión**: Usar Next.js 16 con App Router y el paradigma de Server Components por defecto.

**Motivo**: Renderizado híbrido: Server Components para SEO y carga inicial rápida (fetch en servidor), Client Components solo donde hay interactividad. ISR para rutas públicas (explore, categorías) reduce carga en el backend.

**Riesgo**: Complejidad del modelo mental Server/Client. Es fácil meter estado del cliente donde no debería o hacer fetchs innecesarios. **Mitigación**: Convención clara de nombres (`*Server.tsx` / `*Client.tsx`) y el equipo ya está entrenado en este patrón.

---

## 8. Cloud Run sobre Kubernetes

**Decisión**: Usar Cloud Run (serverless) en lugar de GKE (Kubernetes).

**Motivo**: Escala a cero cuando no hay tráfico, escala automáticamente con la demanda, no requiere administrar clústeres ni nodos. Para el tráfico actual, 512 MiB por servicio es suficiente.

**Riesgo**: Cold start (>1s) cuando un servicio está en cero. **Mitigación**: Configurar `min-instances=1` si el tráfico lo justifica. El frontend tiene ISR que reduce las requests al backend.

---

## 9. Eliminación del Load Balancer de GCP

**Decisión**: En julio 2026 se eliminó el External HTTP(S) Load Balancer de GCP.

**Motivo**: Costo de ~$4,500/mes por Premium Tier data processing. Cloudflare ya ofrece balanceo de carga DNS, terminación SSL y WAF. Cloud Run maneja el ruteo interno con path mapping (`/ib/api/*` → backend, `/*` → frontend).

**Riesgo**: Sin balanceador, las URLs directas de Cloud Run (`.run.app`) no tienen WAF. **Mitigación**: El dominio público (`weloveboom.cloud`) siempre pasa por Cloudflare. Las URLs `.run.app` no se exponen a usuarios. Documentado en `infra-ilboom/10-seguridad-ingress/`.

---

## 10. Terraform para Infraestructura como Código

**Decisión**: Versionar toda la infraestructura en Terraform (GCP + Cloudflare).

**Motivo**: Recrear el entorno completo desde cero con un solo comando. Evita configuración manual en consolas web. Cambios de infraestructura se revisan como código (pull request, diff de `terraform plan`).

**Riesgo**: Terraform state es la fuente de verdad. Si se pierde o corrompe, hay que recrear o importar recursos manualmente. **Mitigación**: State remoto (GCS bucket con versioning) — no implementado aún, estado actual en local.

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Vendor lock-in Cloudflare (R2, Stream) | Media | Medio | APIs estándar (S3). Alternativas: AWS S3, Mux/Wowza para streaming |
| Caída de Supabase | Baja | Alto | Plan con soporte. Migrable a AWS RDS o Cloud SQL |
| Monolito se vuelve inmanejable | Baja | Medio | Cada módulo ya está aislado con interfaces abstractas |
| dLocalGo sin validación de firma | Media | Bajo | Opera en sandbox. Solo afecta si se usa en producción |
| Cold start de Cloud Run | Media | Bajo | Mitigable con min-instances. ISR reduce requests |
| Sin APM/Observabilidad avanzada | Media | Medio | Logs Winston + Cloud Run logging. Suficiente para escala actual |
