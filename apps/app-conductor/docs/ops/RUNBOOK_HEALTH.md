# Runbook: disponibilidad y health check de App Conductor

## Señal y alertamiento

- El workflow [`Uptime app-conductor`](../../../../.github/workflows/conductor-healthcheck.yml)
  corre cada cinco minutos desde GitHub Actions y también puede ejecutarse con
  `workflow_dispatch`.
- El monitor sintético llama `CONDUCTOR_HEALTHCHECK_URL`; si la variable no está
  definida, consulta `https://concer.ruumruum-moviliax.online/api/health`.
  El URL debe ser HTTPS y terminar en `/api/health`.
- Se considera sano solo si la respuesta es HTTP 2xx con JSON,
  `status: "ok"` y `checks.supabase.status: "ok"`. Tiene timeout de 10 segundos
  y reintenta una vez después de dos segundos. Al agotar intentos, el run falla.
- Configurar en GitHub las notificaciones de fallas del workflow para el equipo
  on-call (Watch/Custom notifications del repositorio o integración de
  alertamiento). El resumen del job fallido contiene el enlace al run. El
  workflow no necesita credenciales de hosting ni de Supabase.
- La medición de Supabase se realiza desde el runtime de la app. El monitor
  externo también detecta indisponibilidad de DNS/TLS, Vercel, routing o del
  propio proceso Next.js. GitHub Actions programado tiene latencia variable;
  usar un proveedor externo dedicado si se requiere SLA de un minuto.

## Respuesta a una falla

1. Abrir el run fallido y revisar `reason`, `host`, estado HTTP implícito y
   latencia. El script evita imprimir cuerpo de respuesta o credenciales.
2. Repetir manualmente el workflow `Uptime app-conductor` para distinguir una
   falla transitoria. Consultar `GET /api/health` desde una ubicación externa;
   un resultado sano devuelve HTTP 200, `status: "ok"` y latencia Supabase.
3. Si el endpoint no responde o devuelve 5xx, revisar el estado del deployment,
   logs de funciones de Vercel y variables de entorno. Confirmar
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y las variables
   Redis configuradas en el ambiente de hosting.
4. Si `checks.supabase.status` no es `ok`, revisar conectividad y estado del
   proyecto Supabase, límites/pausas y errores de Auth/Postgres. `/api/health`
   no expone el error interno al cliente; consultar logs de servidor.
5. Si coincide con una versión nueva, promover el deployment anterior sano
   siguiendo [`../OPERATIONS.md`](../OPERATIONS.md#rollback-e-incidente). No
   revertir migraciones destructivas de manera automática.
6. Recuperación: repetir el check y confirmar dos resultados saludables
   consecutivos; cerrar el incidente según el canal de on-call y documentar
   causa, duración, release y mitigación.

## Prueba manual

```bash
node apps/app-conductor/scripts/healthcheck.mjs
```

Para apuntar a staging, definir `CONDUCTOR_HEALTHCHECK_URL` con su URL HTTPS de
`/api/health` antes de ejecutar el comando o configurar la variable de
repositorio correspondiente. El endpoint `/api/health` es público y no debe
recibir tokens, cookies o datos de usuario en el monitor.
