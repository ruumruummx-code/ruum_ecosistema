# SD-REM-005 · Diagnóstico original (AC-0)

Fecha: 2026-11-07. Alcance: Tabs compartido y variantes locales inventariadas.

Evidencia original: [ticket](../remediaciones/SD-REM-005.md), [ficha](../componentes/Tabs.md), [árbol/axe light 390](../resultados-base/Tabs--default--light--390--base.json), [interacciones](../interacciones.json) y [veredicto](../VEREDICTOS.md). Extractos preservados en `comparativo-original.json`; `Navigation-original.txt` es el archivo del commit base, sin modificar la auditoría original.

| Punto del diagnóstico propuesto | Contraste con original |
| --- | --- |
| Faltan tablist/tab | **No aplica** al compartido: ambos roles ya existían. Sí faltaban tabpanel y sus relaciones. |
| `aria-selected` incoherente | El código dependía de `t.activo`; cuando era undefined se omitía el atributo. Se normaliza a true/false y una sola selección habilitada. |
| Relaciones/IDs | **Aplica ausencia**, no se afirma duplicidad observada en Tabs original: carecía de IDs, aria-controls y aria-labelledby. |
| Teclado/roving | **Confirmado**: interacciones light y dark `arrow-right` registran `movesToNext: false`. Código sin tabIndex, Home/End ni manejador de teclado. |
| Paneles inactivos accesibles | La muestra original no tenía paneles. No demuestra fuga de un panel inactivo; se incorpora como requisito del nuevo contrato. |
| Deshabilitados | Sin soporte original en TabItem. Se implementa como requisito preventivo; no se inventa un fallo original de activación de Tabs deshabilitadas. |
| Foco/contraste | El foco original ya era visible (outline 3px con token). Axe de la muestra no tenía violaciones; había contraste incompleto en interacciones. Se conserva el foco por token y se mide el nuevo estado seleccionado en ambos temas. |

Decisión: Tabs reales usan **activación manual**, porque varios paneles contienen datos, mapas, chat o formularios. Flechas/Home/End mueven foco sin disparar selección/cargas; Enter/Space y clic seleccionan. Los filtros de una misma tabla/lista/periodo se expresan como grupos de botones `aria-pressed`, sin paneles ficticios. No se confunden con Tabs reales; ver consumidores.json.
