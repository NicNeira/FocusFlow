# Configuración de Push Notifications para FocusFlow

Este documento describe cómo configurar las notificaciones push del lado del servidor para FocusFlow.

## Prerequisitos

1. Proyecto de Supabase activo
2. Supabase CLI instalado (`npm install -g supabase`)
3. Docker instalado (para desarrollo local de Edge Functions)

## Paso 1: Generar claves VAPID

Las claves VAPID son necesarias para autenticar las notificaciones push.

```bash
# Instalar web-push globalmente
npm install -g web-push

# Generar par de claves VAPID
web-push generate-vapid-keys
```

Esto generará:

- **Public Key**: Se usa en el cliente (frontend)
- **Private Key**: Se usa en el servidor (Edge Functions)

## Paso 2: Configurar variables de entorno

### En el cliente (.env)

```env
VITE_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
```

### En Supabase (Secrets)

```bash
# Usando Supabase CLI
supabase secrets set VAPID_PUBLIC_KEY=tu_clave_publica_aqui
supabase secrets set VAPID_PRIVATE_KEY=tu_clave_privada_aqui
supabase secrets set VAPID_SUBJECT=mailto:tu@email.com
```

## Paso 3: Ejecutar la migración SQL

Ejecuta el archivo `supabase/migrations/002_push_notifications.sql` en tu SQL Editor de Supabase.

Este script crea:

- Tabla `push_subscriptions`: Almacena las suscripciones de push de los usuarios
- Tabla `scheduled_notifications`: Almacena las notificaciones programadas
- Funciones auxiliares para gestionar notificaciones

## Paso 4: Desplegar Edge Functions

```bash
# Desde la raíz del proyecto
cd supabase/functions

# Desplegar todas las funciones
supabase functions deploy schedule-notification
supabase functions deploy cancel-notifications
supabase functions deploy send-push-notifications
```

## Paso 5: Configurar Cron Job (para envío de notificaciones)

Las notificaciones programadas necesitan un proceso que las envíe cuando llegue el momento.

### Opción A: pg_cron en Supabase

```sql
-- Ejecutar cada minuto
SELECT cron.schedule(
  'send-push-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/send-push-notifications',
    headers := '{"Authorization": "Bearer tu_service_role_key"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Opción B: Servicio externo (Cron-job.org, GitHub Actions, etc.)

Configura un cron job que llame al endpoint cada minuto:

```bash
curl -X POST \
  'https://tu-proyecto.supabase.co/functions/v1/send-push-notifications' \
  -H 'Authorization: Bearer TU_SERVICE_ROLE_KEY'
```

## Paso 6: Registrar Service Worker personalizado

El archivo `public/sw-custom.js` contiene el código para manejar las notificaciones push en el cliente. Este archivo debe ser importado por el service worker principal.

Para proyectos con VitePWA, puedes usar `injectManifest` o importar el script manualmente.

## Flujo de notificaciones

1. **Usuario inicia temporizador**:

   - El cliente calcula cuándo terminará
   - Llama a `/functions/v1/schedule-notification`
   - Se crea un registro en `scheduled_notifications`

2. **Cron job ejecuta cada minuto**:

   - Llama a `/functions/v1/send-push-notifications`
   - Busca notificaciones pendientes cuyo tiempo ha llegado
   - Obtiene las suscripciones push del usuario
   - Envía la notificación push

3. **Usuario pausa/detiene temporizador**:
   - Llama a `/functions/v1/cancel-notifications`
   - Se marcan como canceladas las notificaciones pendientes

## Notas de implementación

### Limitaciones de iOS/Safari

- Safari en iOS tiene soporte limitado para notificaciones push en PWAs
- Requiere iOS 16.4+ y que la app esté instalada en el home screen
- Las notificaciones pueden retrasarse si el dispositivo está en modo de bajo consumo

### Implementación simplificada

La implementación actual de `send-push-notifications` es un placeholder. Para producción:

1. Usar la especificación completa de Web Push con firma VAPID
2. Considerar usar un servicio como OneSignal o Firebase Cloud Messaging
3. Implementar reintentos para suscripciones fallidas
4. Agregar logs y monitoreo

### Alternativa: Usar servicio de terceros

Si prefieres evitar la complejidad de implementar Web Push:

1. **OneSignal**: Servicio gratuito hasta cierto límite
2. **Firebase Cloud Messaging**: Integración con Google
3. **Pusher Beams**: Alternativa de pago

Estos servicios manejan la complejidad de Web Push y ofrecen SDKs fáciles de usar.

## Debugging

### Verificar suscripción push

```javascript
// En la consola del navegador
navigator.serviceWorker.ready.then((reg) => {
  reg.pushManager.getSubscription().then((sub) => {
    console.log("Subscription:", JSON.stringify(sub));
  });
});
```

### Verificar notificaciones programadas

```sql
SELECT * FROM scheduled_notifications
WHERE user_id = 'tu-user-id'
ORDER BY created_at DESC;
```

### Verificar suscripciones guardadas

```sql
SELECT * FROM push_subscriptions
WHERE user_id = 'tu-user-id';
```

## Recursos

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Service Worker Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
