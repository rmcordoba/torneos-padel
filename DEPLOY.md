# Despliegue a producción (gratis): Vercel + Neon

Guía paso a paso para poner PádelPro online con costo $0/mes.
La app queda en Vercel (plan Hobby) y la base de datos Postgres en Neon (free tier).

> **Nota de licencia**: el plan Hobby de Vercel es para uso no comercial. Perfecto para
> validar con tu club. Cuando empieces a cobrar suscripciones a los clubes, pasá a
> Vercel Pro (USD 20/mes) o mudá la app a un VPS con Docker.

## 1. Base de datos — Neon

1. Crear cuenta en <https://neon.tech> (login con GitHub) y crear un proyecto
   (región AWS `sa-east-1` São Paulo, la más cercana a Argentina).
2. En **Connection Details** copiar DOS connection strings:
   - **Pooled** (el que dice `-pooler` en el host) → va en `DATABASE_URL`
   - **Direct** (sin `-pooler`) → va en `DIRECT_URL`

## 2. App — Vercel

1. Crear cuenta en <https://vercel.com> (login con GitHub).
2. **Add New → Project** → importar el repo `rmcordoba/torneos-padel`.
3. Framework: Next.js (lo detecta solo). No tocar el build command: Vercel usa
   automáticamente el script `vercel-build` del package.json, que corre
   `prisma generate && prisma migrate deploy && next build` (aplica las
   migraciones en cada deploy).
4. Cargar las **Environment Variables** (sección siguiente) ANTES del primer deploy.
5. Deploy. Los 2 cron jobs de `vercel.json` (recordatorios de turnos 10:00 ART y
   avisos de suscripción 10:30 ART) se registran solos.

## 3. Variables de entorno en Vercel

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Connection string **pooled** de Neon |
| `DIRECT_URL` | Connection string **direct** de Neon |
| `AUTH_SECRET` | Generar nuevo: `openssl rand -base64 32` (NO reusar el de dev) |
| `NEXT_PUBLIC_APP_URL` | `https://<tu-proyecto>.vercel.app` (o tu dominio) |
| `NEXT_PUBLIC_APP_NAME` | `PadelPro` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Los de Google Cloud (ver paso 5) |
| `RESEND_API_KEY` | API key de <https://resend.com> (gratis 100 emails/día) |
| `EMAIL_FROM` | `PadelPro <noreply@tudominio.com>` (dominio verificado en Resend) |
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago (TEST primero, prod después) |
| `BILLING_TRANSFER_INFO` | Texto con datos de transferencia (opcional) |
| `CRON_SECRET` | Generar: `openssl rand -hex 32` — sin esto los crons devuelven 401 |

`AUTH_URL` **no** hace falta en Vercel (next-auth detecta la URL solo).

## 4. Después del primer deploy

1. **Seed de planes** (Básico/Pro) apuntando a Neon, desde tu máquina:

   ```powershell
   $env:DATABASE_URL = "<pooled de Neon>"; $env:DIRECT_URL = "<direct de Neon>"
   npm run db:seed:plans
   ```

2. Crear tu usuario entrando a `https://<app>/registrar-club`.
3. Para hacerte SUPER_ADMIN: en Neon (SQL Editor):

   ```sql
   UPDATE users SET "systemRole" = 'SUPER_ADMIN' WHERE email = 'tu@email.com';
   ```

## 5. Google OAuth (login con Google)

En Google Cloud Console → Credentials → tu OAuth Client:

- **Authorized JavaScript origins**: `https://<tu-proyecto>.vercel.app`
- **Authorized redirect URIs**: `https://<tu-proyecto>.vercel.app/api/auth/callback/google`

## 6. Webhook de Mercado Pago

En el panel de MP (Tus integraciones → Webhooks) configurar:

```
https://<tu-proyecto>.vercel.app/api/webhooks/mercadopago
```

Evento: **Pagos**. Con el token de TEST, hacer un pago de prueba desde
`/dashboard/facturacion` y verificar que la suscripción pasa a ACTIVE.

## 7. Verificación final

- [ ] `https://<app>/` carga la landing
- [ ] Registro de club + login funcionan
- [ ] `https://<app>/api/cron/booking-reminders` sin header devuelve 401
- [ ] Los sitios de club `/c/<slug>` cargan
- [ ] Un email de prueba llega (aprobar una inscripción)
- [ ] Pago de prueba MP acredita la suscripción

## Límites del free tier (alcanzan para empezar)

- **Neon**: 0.5 GB de datos, se suspende tras inactividad (~500ms de cold start en la primera query)
- **Vercel Hobby**: 100 GB de ancho de banda/mes, funciones serverless 10s timeout, 2 crons diarios
- **Resend**: 100 emails/día, 3.000/mes
