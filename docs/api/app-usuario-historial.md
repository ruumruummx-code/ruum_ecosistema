# Contrato de historial resumido de app usuario

Ruta: `GET /api/traslados/resumen`

La ruta requiere sesión Supabase válida y devuelve únicamente traslados del
perfil autenticado. No acepta `usuario_id`, `auth_user_id` ni filtros de
ownership enviados por el cliente.

## Parámetros

- `limite`: entero de 1 a 20, por defecto 6.
- `desplazamiento`: entero mayor o igual a 0, por defecto 0.

## Respuesta

```json
{
  "items": [],
  "paginacion": {
    "limite": 6,
    "desplazamiento": 0,
    "siguienteDesplazamiento": 6,
    "hayMas": true
  }
}
```

La lista completa y los filtros avanzados permanecen en `/mis-viajes`; esta ruta
es el resumen de baja latencia para el dashboard. El endpoint aplica rate limit
por usuario y no debe cachearse de forma pública.

## Regresión de autorización

La ruta deriva `usuario_id` exclusivamente de `auth.getUser()` y delega la
lectura en la consulta protegida de `pasaporte_digital`; nunca acepta un id de
propietario desde el cliente. La prueba de middleware verifica que `/inicio`
requiere sesión y que `/soporte` es público. La validación contra las políticas
RLS aplicadas debe ejecutarse también en el proyecto Supabase de staging antes
del despliegue; las pruebas locales no sustituyen esa comprobación.
