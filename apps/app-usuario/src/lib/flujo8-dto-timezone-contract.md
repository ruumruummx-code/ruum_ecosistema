# Contrato de Zona Horaria, DTO Mínimo y Ownership — Flujo 8

**Ticket de Referencia**: RUUM-USR-F8-001  
**Condición Bloqueante**: CB-3  
**Módulos**: `@ruum/app-usuario` (`zona-horaria-traslados.ts`, `traslados-consulta.ts`, `/viajes/[id]/page.tsx`)  
**Fecha de Actualización**: 2026-11-04  

---

## 1. Problema Resuelto
1. **Contaminación UTC y desajustes de horario**: El filtro de "semana" en `useGestionTraslados.ts` ejecutaba `new Date(hoy + "T00:00:00Z")`. Al mezclar componentes de fecha local con horas en UTC (donde México central tiene UTC-6), se producían desfases de hasta un día completo (off-by-one) durante transiciones de horario o consultas nocturnas.
2. **Exposición innecesaria de PII en listas**: El listado transportaba números detallados de teléfono de contactos de entrega/recepción, VIN completo, y notas de inspección hacia el cliente.
3. **Riesgo IDOR en vista de detalle**: Si la consulta base de detalle cambiaba o si el `pasaporte` no tenía `usuario_id`, existía la posibilidad de renderizar el expediente sin verificar con rigor que perteneciera al usuario autenticado.

---

## 2. Definición del Contrato

### 2.1 Zona Horaria Canónica y Estabilidad DST (Decreto Ley 2022)
- **Zona Horaria Canónica**: `America/Mexico_City`.
- **Declaración Formal de Estabilidad DST**: Mediante el decreto de la *Ley de los Husos Horarios en los Estados Unidos Mexicanos* (publicado en el Diario Oficial de la Federación el 28 de octubre de 2022), se abolió el horario de verano en el territorio nacional (con excepción de franjas fronterizas específicas). Por lo tanto, `America/Mexico_City` opera con huso horario fijo estándar **UTC-6 durante los 365 días del año**, sin saltos de reloj ni desfases estacionales desde 2023.
- **Cálculo de Semana Calendario**: Realizado de forma pura mediante `Intl.DateTimeFormat` con límites estrictos de lunes `00:00:00` a domingo `23:59:59` hora local, eliminando cualquier desfase UTC o cálculo manual defectuoso.

### 2.2 DTO Mínimo y Minimización de PII (`ViajeListaDTO`)
- **Teléfonos de contacto**: Omitidos del payload de lista; solo se cargan en la pantalla de detalle (`/viajes/[id]`).
- **Nombres de conductor**: Pseudonimizados a primer nombre + inicial (ej. `"Roberto S."`).
- **Direcciones**: Reducidas a vialidad principal y ciudad (`sanitizarDireccionCorta`), omitiendo números interiores y referencias privadas.
- **Evidencias 360 e inspecciones**: No se transfieren en la lista paginada.

### 2.3 Confirmación de RLS y Ownership Estricto en Detalle (Defensa en Profundidad)
El acceso al detalle de un traslado implementa defensa en profundidad en dos capas independientes:
1. **Capa 1 — Base de Datos (Postgres RLS)**:
   - La función `obtenerPasaporteCompleto` (`@ruum/api/transfers`) utiliza el cliente de Supabase instanciado con la sesión del usuario (`crearClienteServidor()`).
   - La consulta `SELECT` sobre `public.traslados` y `public.pasaporte_digital` está sujeta a las directivas RLS de PostgreSQL: `usuario_id = auth.uid()` o coincidencia de perfil.
2. **Capa 2 — Aplicación (Ownership Estricto en Next.js)**:
   - En `apps/app-usuario/src/app/viajes/[id]/page.tsx`, se valida explícitamente:
     ```ts
     const { data: { user } } = await clienteAuth.auth.getUser();
     const perfilId = await obtenerUsuarioIdPorAuth(clienteAuth, user.id);
     if (!pasaporte || pasaporte.usuario_id !== perfilId) {
       return <TrasladoNoEncontrado />;
     }
     ```
   - Si no coincide el perfil, se retorna `<TrasladoNoEncontrado />` con semántica 404 para evitar enumeración e IDOR, incluso ante una falla de configuración o bypass de RLS en base de datos.
