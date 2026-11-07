# SD-REM-005 · Patrón de Tabs

Estado: abierto. Fecha: 6 de noviembre de 2026, America/Mexico_City.

Responsable funcional asignado: **Frontend Plataforma + Diseño de Sistemas**. Propietario nominal y fecha compromiso: pendientes de registro por el equipo. Prioridad: P1.

## Hallazgo

Tabs declara tablist/tab pero no mueve foco con flechas ni define gestión de tabindex y paneles.

Componentes vinculados: Tabs.

## Evidencia

Fichas por componente, resultados-base, capturas-base, interacciones.json, comprobaciones-dirigidas.json, TOKENS.md y OVERRIDES.md según el hallazgo.

## Cierre

Completar patrón APG o adoptar semántica de filtros; teclado y relaciones coherentes con la decisión.

Ticket local; no se creó una incidencia en un gestor externo. La asignación funcional requiere aceptación nominal del equipo.

## Avance técnico · 2026-11-07

Implementado patrón manual en Tabs compartido, paneles e IDs únicos, deshabilitados patrón A, tokens y migración de consumidores. Inventario: 642 archivos, 15 usos compartidos y cero tablists locales encontrados; los filtros se identifican con aria-pressed. Ver `../remediacion-SD-REM-005/README.md`, `AC-0.md`, `consumidores.json`, reportes de pruebas y manifiesto/sello.

Estado: **implementación técnica verificada; pendientes sesión NVDA/VoiceOver real y firmas nominales de Frontend Plataforma + Accesibilidad**. Prioridad de esta solicitud: P2. Las dependencias SD-REM-004/007 conservan sus condiciones; no procede declarar P2-1 cerrada.
