# Configuración de Pago con Stripe — Ruum Ruum Usuario

## Flujo de Pago

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE PAGO CON STRIPE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Usuario acepta cotización                                               │
│     └── Estado: cotizacion_aceptada                                         │
│                                                                             │
│  2. Cliente (PagoStripe.tsx)                                                │
│     └── Llama a: POST /functions/v1/crear-payment-intent                   │
│         con: { traslado_id }                                                │
│         headers: Authorization: Bearer <token>                              │
│                                                                             │
│  3. Edge Function (crear-payment-intent)                                    │
│     ├── Verifica sesión y propiedad del traslado                            │
│     ├── Valida monto ($699 - $100,000 MXN)                                  │
│     ├── Crea PaymentIntent en Stripe                                        │
│     ├── Registra pago pendiente en tabla `pagos`                            │
│     └── Retorna: { client_secret }                                          │
│                                                                             │
│  4. Cliente (Stripe Elements)                                               │
│     └── Muestra formulario de pago                                          │
│         con: client_secret + payment_element                                │
│                                                                             │
│  5. Usuario ingresa datos de tarjeta                                        │
│     └── stripe.confirmPayment()                                             │
│                                                                             │
│  6. Stripe procesa el pago                                                  │
│     └── Envía webhook: payment_intent.succeeded                             │
│                                                                             │
│  7. Edge Function (stripe-webhook)                                          │
│     ├── Verifica firma del webhook                                          │
│     ├── Actualiza tabla `pagos` → estado: completado                        │
│     ├── Actualiza tabla `traslados` → siguiente estado                      │
│     └── Registra en `registro_auditoria`                                    │
│                                                                             │
│  8. Cliente (confirmación)                                                  │
│     └── Muestra: "Pago procesado correctamente"                             │
│         Actualiza UI automáticamente                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Variables de Entorno

### Cliente (apps/app-usuario/.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | `pk_test_51H...` |

### Edge Functions (Supabase Secrets)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | `sk_test_51H...` |
| `STRIPE_WEBHOOK_SECRET` | Firma del webhook | `whsec_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbGciOi...` |
| `SUPABASE_URL` | URL del proyecto | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon key | `eyJhbGciOi...` |

## Configuración Paso a Paso

### 1. Crear Cuenta de Stripe

1. Ir a https://stripe.com
2. Crear cuenta o iniciar sesión
3. Obtener claves API en **Developers → API keys**

### 2. Configurar Variables en Supabase

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular proyecto
supabase link --project-ref <tu-project-ref>

# Configurar secrets
    supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
```

### 3. Desplegar Edge Functions

```bash
# Desplegar crear-payment-intent
supabase functions deploy crear-payment-intent

# Desplegar stripe-webhook
supabase functions deploy stripe-webhook
```

### 4. Configurar Webhook en Stripe Dashboard

1. Ir a **Developers → Webhooks**
2. Click en **Add endpoint**
3. URL: `https://<tu-proyecto>.supabase.co/functions/v1/stripe-webhook`
4. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click en **Add endpoint**
6. Copiar el **Signing secret** (whsec_...)
7. Configurar en Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. Configurar Variables Locales

```bash
cd apps/app-usuario
cp .env.example .env
```

Editar `.env`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 6. Verificar Configuración

```bash
cd apps/app-usuario
node scripts/verify-stripe-config.mjs
```

## Pruebas

### Tarjetas de Prueba de Stripe

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Visa | `4242 4242 4242 4242` | Pago exitoso |
| Visa (debit) | `4000 0566 5566 5556` | Pago exitoso |
| Mastercard | `5555 5555 5555 4444` | Pago exitoso |
| American Express | `3782 822463 10005` | Pago exitoso |
| Visa (decline) | `4000 0000 0000 0002` | Pago declinado |
| Visa (3D Secure) | `4000 0025 0000 3155` | Requiere autenticación |

### Probar Webhook Localmente

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks a local
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# En otra terminal, trigger un evento de prueba
stripe trigger payment_intent.succeeded
```

## Estados del Traslado

```
solicitud_creada
    ↓
cotizacion_generada
    ↓
cotizacion_aceptada ← Pago anticipado se inicia aquí
    ↓
pago_completado ← Webhook confirma el pago
    ↓
conductor_asignado
    ↓
conductor_en_camino_al_origen
    ↓
vehiculo_recibido
    ↓
evidencia_inicial_completado
    ↓
traslado_en_curso
    ↓
llegada_a_destino
    ↓
evidencia_final_completado
    ↓
entrega_confirmada
    ↓
pago_pendiente ← Pago al cierre se inicia aquí (si aplica)
    ↓
servicio_cerrado
```

## Tipos de Pago

### Anticipado (`anticipado`)
- Se cobra al aceptar la cotización
- El conductor se asigna después del pago
- Estado requerido: `cotizacion_aceptada`

### Al Cierre (`al_cierre`)
- Se cobra al finalizar el traslado
- El conductor entrega el vehículo primero
- Estado requerido: `entrega_confirmada` o `pago_pendiente`

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| `Stripe no está configurado` | Falta `STRIPE_SECRET_KEY` | Configurar en Supabase Secrets |
| `Sesión inválida` | Token expirado | Usuario debe iniciar sesión de nuevo |
| `Traslado no encontrado` | ID inválido o no pertenece al usuario | Verificar ID y sesión |
| `Cotización ha vencida` | Fecha de expiración pasada | Solicitar nueva cotización |
| `Monto fuera de rango` | < $699 o > $100,000 MXN | Revisar en panel-admin |
| `Firma de webhook inválida` | `STRIPE_WEBHOOK_SECRET` incorrecto | Verificar en Stripe Dashboard |

## Seguridad

- **Nunca** guardar claves secretas en el código
- **Nunca** exponer `STRIPE_SECRET_KEY` al cliente
- Usar siempre HTTPS en producción
- Verificar siempre la firma del webhook
- Validar montos antes de crear PaymentIntent
- Usar RLS para verificar propiedad del traslado

## Referencias

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
