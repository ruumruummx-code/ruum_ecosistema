# Decisión del patrón A y firmas

Fecha de decisión: **2026-11-07**, America/Mexico_City.
Responsable informado por el usuario: **H Manuel — Administración e Innovación Digital**.

Instrucción recibida: «la decisión sobre el patrón "A" se te delega para que tomes la mas adecuada». Se registra como delegación de decisión técnica, no como firma de dos áreas.

Decisión técnica ejercida por Codex: **patrón A** para navegación bloqueada, `span role="link" aria-disabled="true"`, sin destino, foco ni eventos. Mantener el rol permite conservar nombre/estado en el árbol accesible, sin montar un ancla ni un adaptador que pueda navegar. Para acciones sin navegación, conservar `button disabled`. No depender de CSS para bloquear teclado. Mantener razones visibles de bloqueo y token semántico de texto del CTA.

| Aceptación | Responsable nominal | Fecha | Estado |
| --- | --- | --- | --- |
| Coordinación / decisión técnica delegada | H Manuel, Administración e Innovación Digital; decisión ejercida por Codex | 2026-11-07 | Registrada en este chat |
| Firma Frontend Plataforma | Pendiente de identificación por el área | Pendiente | No recibida |
| Firma Accesibilidad | Pendiente de identificación por el área | Pendiente | No recibida |

El usuario confirmó: «no hay sesión NVDA deuda pendiente». Se conserva el gate de lector de pantalla abierto. La delegación técnica no acredita una sesión AT ni reemplaza firmas nominales de las áreas. El SHA-256 es integridad de archivos, no firma de una persona.


## Estado vigente tras aprobación condicionada · 2026-11-07

**APROBADOS CON CONDICIONES; P2-1 NO CERRADA.** Ver `ACTUALIZACION-CONDICIONES.md` y `estado-gate.json`: revisión/invalidación del expediente 004, preservación de manifiestos, alcance limitado a consumidores de app-conductor y protección estática del contrato. Pendientes sesión con operador/transcriptor distintos y respaldo, firmas de Frontend/Accesibilidad y co-revisión de Diseño del token `--ruum-on-primary`. Suite actual: 45 pruebas UI. El manifiesto vigente sigue siendo pre-sesión y registra commit base más hashes del workspace, sin atribuir cambios no commiteados a HEAD.
