# Módulos del Sistema

## Backend — 22 Módulos

Cada módulo es independiente: tiene su propio controller, service, gateways y DTOs. Se comunican a través de la capa ACL para acceder a base de datos y servicios externos.

### Módulos principales

| Módulo | Propósito | Endpoints destacados |
|--------|-----------|---------------------|
| **Auth** | Validación de tokens Firebase. 4 guards: `FirebaseAuthGuard` (requiere token), `OptionalFirebaseAuthGuard` (público o autenticado), `AdminOnlyGuard`, `CreatorOnlyGuard`. | `POST /auth/validate` |
| **Users** | Perfiles de usuario: búsqueda, perfil público, perfil propio, seguidores/seguidos, sugerencias, registro, bloqueo, fotos de perfil y portada. | `GET /users/me`, `GET /users/profile/:username`, `POST /users/register`, `POST /users/:id/follow`, `DELETE /users/:id/follow` |
| **Posts** | Feed principal, explorar, categorías, scoring de popularidad, crear post con media. | `GET /posts/feed`, `GET /posts/explore`, `GET /posts/category/:id`, `POST /posts` |
| **Media** | Subida y eliminación de imágenes/videos vía Cloudflare R2. URLs prefirmadas con TTL por tipo de contenido. | `POST /media/upload`, `DELETE /media/:id` |
| **Likes** | Likes en posts y likes en comentarios. | `POST /likes/post/:id`, `POST /likes/comment/:id` |
| **Comments** | Comentarios con respuestas anidadas (self-referencing FK). Edición y eliminación. | `POST /comments`, `GET /comments/post/:id`, `PUT /comments/:id`, `DELETE /comments/:id` |
| **Messages** | Conversaciones 1:1 entre usuarios. Almacenadas en Firestore, con fallback REST. | `GET /messages/conversations`, `GET /messages/:conversationId` |
| **Store** | Tienda del creador: CRUD de productos, compras, ventas, estado de envío. | `POST /store/items`, `GET /store/items`, `POST /store/purchase`, `GET /store/sales` |
| **VOD** | Video on demand: subida, compra o alquiler, expiración automática. | `POST /vod`, `GET /vod`, `POST /vod/:id/purchase` |
| **Live** | Live streaming: crear stream, credenciales RTMPS, reproducción HLS, paywall, configuración de chat. | `POST /live`, `GET /live/:id`, `PUT /live/:id/paywall`, `PUT /live/:id/chat-settings` |
| **Payments** | Checkout multi-proveedor, historial de pagos, webhooks entrantes. | `POST /payments/checkout`, `GET /payments/history`, `POST /payments/webhook` |
| **Stripe Connect** | Onboarding de creadores en Stripe Connect. Estado de cuenta, webhooks. | `POST /stripe-connect/onboard`, `GET /stripe-connect/status`, `POST /stripe-connect/webhook` |
| **Campaigns** | Campañas de crowdfunding, donaciones, propinas en posts. | `POST /campaigns`, `GET /campaigns`, `POST /campaigns/:id/donate`, `POST /campaigns/tip` |
| **Fan Wall** | Muro de fans en perfil de creador: escribir entrada, dar like, eliminar. | `POST /fan-wall`, `GET /fan-wall/:userId`, `DELETE /fan-wall/:id` |
| **Admin** | Panel de administración: gestión de usuarios, roles, liquidaciones, toggles de proveedores de pago. | `GET /admin/users`, `PUT /admin/users/:id/role`, `GET /admin/settlements` |
| **Reports** | Reportes de contenido o usuarios. | `POST /reports`, `GET /reports` |
| **Webhooks** | Webhooks de Cloudflare Stream con validación de firma HMAC. | `POST /webhooks/cloudflare-stream` |
| **Notifications** | Notificaciones en tiempo real vía SSE, conteo de no leídas, marcar como leído. | `GET /notifications/stream`, `GET /notifications/unread-count`, `POST /notifications/mark-read` |
| **Health** | Health check para monitoreo y smoke tests de deploy. | `GET /status/health` |
| **Support Tickets** | Tickets de soporte con IDs de conversación IMAP. | `POST /support-tickets`, `GET /support-tickets`, `PUT /support-tickets/:id` |
| **Wallet** | Billetera del usuario: balance y transacciones (créditos/débitos). | `GET /wallet`, `GET /wallet/transactions` |

### Módulos de infraestructura

| Módulo | Propósito |
|--------|-----------|
| **ACL (Anti-Corruption Layer)** | Agrupa 4 sub-módulos de integración: DB (27 entidades + repositorios), Cloudflare R2, Cloudflare Stream, Firebase, Proveedores de pago. |
| **Infrastructure** | Logger (Winston), caché TTL en memoria, HTTP module global, configuración TypeORM. |

### Entidades de base de datos (27)

`app_user`, `user_profile`, `follow`, `post`, `post_media`, `audiovisual`, `post_score`, `post_like`, `comment`, `comment_like`, `item`, `sale`, `shipping_info`, `vod`, `vod_purchase`, `wallet`, `app_transaction`, `payment`, `settlement`, `stripe_connect_account`, `campaign`, `donation`, `fan_wall_entry`, `fan_wall_like`, `live_stream`, `report`, `support_ticket`, `notification_read_state`

---

## Frontend — Rutas y Componentes

### Rutas principales (Next.js App Router)

**Rutas públicas** (sin autenticación):

| Ruta | Descripción |
|------|-------------|
| `/welcome` | Landing page para usuarios no autenticados |
| `/login` | Inicio de sesión |
| `/register*` | Registro, verificación de email, éxito (URL ofuscada) |
| `/forgot-password` | Recuperación de contraseña |
| `/terms` | Términos y privacidad |
| `/payment/success`, `/payment/failure` | Resultado de pago externo |

**Rutas protegidas** (requieren autenticación):

| Ruta | Descripción |
|------|-------------|
| `/` (feed) | Home: barra de categorías, carrusel de artistas, sugerencias, scroll infinito de posts |
| `/explore` | Explorar posts públicos rankeados por popularidad |
| `/category/[id]` | Posts filtrados por categoría |
| `/create` | Crear nuevo post con subida de media |
| `/inbox` | Bandeja de mensajes directos |
| `/notifications` | Centro de notificaciones |
| `/live/[id]` | Visualizador de stream en vivo (reproductor HLS.js + chat en tiempo real) |
| `/profile/[username]` | Perfil público de otro usuario |
| `/profile/me` | Perfil propio: feed personal, seguidores, siguiendo |
| `/profile/me/edit` | Editar perfil |
| `/profile/me/following` | Lista de usuarios seguidos |
| `/profile/me/store` | Gestionar productos de la tienda (creador) |
| `/profile/me/purchases` | Historial de compras |
| `/profile/me/videos` | Biblioteca de VOD |
| `/profile/me/wallet` | Billetera y balance |
| `/profile/me/settings` | Configuración de la cuenta |
| `/profile/me/support` | Tickets de soporte |
| `/profile/me/admin` | Panel de administración (solo admin) |
| `/creator/connect` | Onboarding de Stripe Connect (creador) |

### Componentes principales

**Features** (componentes de dominio):

| Componente | Descripción |
|-----------|-------------|
| `FeedList` / `FeedListClient` | Feed principal con scroll infinito (Server + Client) |
| `FeedPostCardClient` | Tarjeta de post individual con interacciones |
| `CategoryBar` | Barra horizontal de categorías |
| `ArtistsBannerCarousel` | Carrusel de creadores destacados (hero de la home) |
| `ProfileView` / `ProfileViewClient` | Vista de perfil con tabs (posts, tienda, VOD, campañas, fan wall) |
| `ExploreGridClient` | Grid de posts en explorar |
| `LivePlayer` + `LiveChatPanel` | Reproductor HLS.js + chat Firestore para streams en vivo |
| `PostDetailModal` | Modal de detalle de post con comentarios |
| `CommentModal` | Modal de comentarios con respuestas anidadas |
| `CreatePostForm` | Formulario de creación de post |
| `PublishChoiceModal` | Modal para elegir tipo de publicación (tienda, VOD, live, campaña) |
| `TipPostModal` | Modal para enviar propina a un post |
| `StoreTab` / `VodTab` / `CampaignTab` | Tabs del perfil de creador |
| `FanWall` | Muro de fans interactivo |
| `InboxPageClient` | Bandeja de mensajes con conversaciones |
| `WalletPageClient` | Página de billetera con historial de transacciones |
| `GlobalUploadBar` | Barra de progreso de subida de video (global) |
| `LoginForm` / `RegisterForm` / `ForgotPasswordForm` | Formularios de autenticación |
| `WelcomeScreen` | Pantalla de bienvenida con llamadas a la acción |
| `EditProfileModal` | Modal de edición de perfil |
| `CreatorSearchAutocomplete` | Búsqueda de creadores con autocompletado |

**UI** (componentes reutilizables):

`Avatar`, `Button`, `Card`, `Input`, `Tabs`, `BottomSheet`, `Modal`, `ShareModal`, `PaymentModal`, `ReportModal`, `ProfileHeader`, `ImageContainer`, `MembershipCard`, `OTPInput`, `CountrySelector`, `SignedImage`, entre otros.

**Layout** (estructura de página):

`MainLayoutShell`, `Sidebar` (224px desktop), `AppHeader`, `MobileBottomNav` (4 tabs), `Footer`, `GlobalUploadBar`.

### Contextos React (7)

| Contexto | Hook | Propósito |
|----------|------|-----------|
| Auth | `useAuth()` | Usuario autenticado, perfil, login/logout/registro |
| UiMode | `useUiMode()` | Modo oscuro/claro, persiste en localStorage |
| PostInteractions | `usePostInteraction()` | Likes optimistas con rollback en error |
| CreatePostModal | `useCreatePostModal()` | Control del modal de creación de post |
| Notifications | `useNotifications()` | Conteo de notificaciones no leídas (polling + Firestore) |
| InboxUnread | `useInboxUnread()` | Conteo de mensajes no leídos |
| UploadQueue | `useUploadQueue()` | Cola de subida de videos con progreso |

### API Layer

- **23 archivos** en `lib/api/`: cliente singleton, server fetch, tipos, y un archivo por dominio (auth, feed, posts, profile, users, messages, notifications, live, store, vod, broadcasts, campaigns, fan-wall, payments, connect, admin, reports, support)
- Auto-desenvolvimiento del `ResponseWrapper` del backend
- Token inyectado desde cookie en cada request
- Timeout global de 30 segundos
- Subida de archivos con progreso vía `XMLHttpRequest`
