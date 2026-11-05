# Resolución de Conflicto de Reglas de Negocio: `rescate_mecanico`
**Ticket**: RUUM-USR-F6-001  
**Condición Bloqueante**: CB-3  
**Criterios de Aceptación**: CA-5, CA-6  
**Fecha de Publicación**: 2026-11-04  

---

## 1. Identificación del Conflicto Inter-Capa

Durante la auditoría técnica integral del **Flujo 6 (Solicitud Individual de Traslado)**, se identificó una contradicción crítica en las reglas de validación entre tres capas del sistema:

| Capa | Archivo / Componente | Comportamiento Histórico |
| :--- | :--- | :--- |
| **Cliente / UI** | `apps/app-usuario/.../PasoVehiculo.tsx` | Permite seleccionar condición `rescate_mecanico` e inhabilita/flexibiliza el switch de "Puede circular rodando", asumiendo que un vehículo siniestrado o con avería mecánica mayor no rueda. |
| **Validación Compartida (Zod)** | `packages/shared/src/validacion/traslados.ts` | Refinamiento explícito en `esquemaVehiculoBase`: si `condicion === 'rescate_mecanico'`, se autoriza `puedeCircular: false`. |
| **Persistencia / Base de Datos (SQL)** | RPC `usuario_crea_traslado` (migración `20260907232417`) | Verificación estricta e incondicional: `IF NOT v_puede_circular THEN RAISE EXCEPTION 'El MVP solo admite vehículos que encienden, tienen documentación vigente y pueden circular rodando'; END IF;` |

### Impacto Operativo
Cuando un usuario intentaba solicitar un traslado legítimo para un automóvil averiado seleccionando `rescate_mecanico`:
1. El frontend lo permitía.
2. La validación compartida Zod aprobaba el payload.
3. El RPC de base de datos abortaba con un error 500 no controlado por no cumplir `v_puede_circular = true`, impidiendo la creación del traslado y bloqueando la conversión comercial.

---

## 2. Resolución Canónica Implementada

Se alineó la lógica en todas las capas respetando el principio de seguridad en profundidad y la intención de negocio:

### 2.1 Modificación en Base de Datos (Migración `20261104000005`)
En el archivo [20261104000005_flujo6_tarifa_snapshot_rescate_mecanico.sql](file:///c:/ruum_ecosistema-main/supabase/migrations/20261104000005_flujo6_tarifa_snapshot_rescate_mecanico.sql), la guarda de validación del vehículo fue actualizada a:

```sql
-- Validación de vehículo: documentación vigente siempre requerida;
-- puedeCircular es obligatorio salvo para 'rescate_mecanico'
if not (v_tiene_tarjeta and v_tiene_verificacion and v_tiene_placas) then
  raise exception 'El vehículo debe contar con tarjeta de circulación, verificación y placas vigentes';
end if;

if not v_puede_circular and v_condicion <> 'rescate_mecanico' then
  raise exception 'El MVP solo admite vehículos que encienden, tienen documentación vigente y pueden circular rodando';
end if;
```

### 2.2 Requisitos Inmutables
- **Documentación vigente**: Tarjeta de circulación, placas y verificación siguen siendo obligatorias tanto para vehículos rodantes como para rescate mecánico, garantizando trazabilidad legal ante las autoridades de tránsito.
- **Diferenciador de rescate**: Únicamente los vehículos declarados con `condicion = 'rescate_mecanico'` tienen permitida la exención del estado de rodamiento.

---

## 3. Sobretasa Tarifaria de Rescate Mecánico ($1.25\times$)

Para reflejar el costo operativo adicional derivado de maniobras especializadas, carga en grúa/plataforma y riesgos adicionales:

1. **Fórmula Server-Side** ([tarifa-snapshot.ts](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/tarifa-snapshot.ts)):
   - Se aplica un factor multiplicador `factorCondicion = 1.25` cuando `inputs.condicion === "rescate_mecanico"`.
   - Para cualquier otra condición (`seminueva`, `optima`, `buena`), el factor es `1.0`.

2. **Evidencia y Cobertura de Pruebas**:
   - Probado unitariamente en [tarifa-snapshot.test.ts](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/tarifa-snapshot.test.ts) (`aplica sobretasa de 1.25x en rescate_mecanico`).
   - Verificado con cotizaciones idénticas donde la condición estándar resulta en $\$1,595.00$ y rescate mecánico escala a $\$1,993.75$ exactos.
