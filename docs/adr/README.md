# ADRs — Registro de decisiones de arquitectura

Este directorio registra las decisiones que **no** se derivan del código: son
decisiones de producto u operación que cambian el alcance de un piloto, una
línea de base de calidad o un compromiso operativo.

Un ADR no es un ticket: describe el problema, las opciones consideredas, la
decisión tomada, sus consecuencias y **quién la firma**. Si una decisión
depende de una firma externa, el ADR queda en estado `Propuesta` hasta que esa
firma exista (apartado "Firmas").

## Formato

| Campo | Contenido |
|---|---|
| Título | `NNNN-<slug>.md`, numeración correlativa, sin renumerar. |
| Estado | `Propuesta` → `Aceptada` → `Reemplazada` / `Obsoleta`. |
| Fecha | Fecha de la decisión (no de la redacción). |
| Decisores | Quién decide (rol, no persona). |
| Firmas | Quién firma y si ya lo hizo. |

## Estados

- **Propuesta** — redactada, pendiente de firma.
- **Aceptada** — firmada por los decisores; vigente.
- **Reemplazada** — sustituida por un ADR posterior (indicar cuál).
- **Obsoleta** — dejó de aplicarse sin reemplazo (indicar por qué).

## Índice

| # | Título | Estado | Decisión en una línea |
|---|---|---|---|
| [0001](0001-offline-arranque-en-frio.md) | Offline de arranque en frío | Propuesta | El piloto acepta el protocolo operativo de Torre de Control; el shell local en Capacitor queda fuera del cierre salvo que Operación lo exija. |
