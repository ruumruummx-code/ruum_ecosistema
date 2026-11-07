# 📋 PLAN DE REMEDIACIÓN UX/IU - app-usuario

**Auditoría:** RUUM-UX-001-SD  
**Fecha de creación:** 2026-11-08  
**Versión:** 1.0  
**Estado:** EN REVISIÓN  
**Objetivo:** Desbloquear GATE RUUM-UX-001-SD y alcanzar conformidad WCAG 2.2 AA

---

## 🎯 RESUMEN EJECUTIVO

| Métrica | Valor | Objetivo |
|---|---|---|
| Tickets abiertos | 12 | 0 |
| Componentes no conformes | 14 | 0 |
| Overrides pendientes | 105 candidatos | 0 sin justificar |
| Co-revisión SD | Pendiente | Firmada |
| **GATE** | 🔴 BLOQUEADO | ✅ DESBLOQUEADO |

**Duración estimada:** 4 semanas (20 días hábiles)  
**Fecha objetivo de finalización:** 2026-12-06  
**Presupuesto estimado:** 240 horas equipo

---

## 📊 MATRIZ DE PRIORIZACIÓN

### Prioridad P0 - Gobernanza (Bloqueantes para GATE)
| ID | Título | Impacto | Esfuerzo | Dependencias |
|---|---|---|---|---|
| SD-REM-012 | Co-revisión y verificación manual | 🔴 Crítico | 8h | SD-REM-001→011 |
| SD-REM-010 | Gobernanza de overrides | 🔴 Crítico | 16h | SD-REM-012 |

### Prioridad P1 - Críticos (Bloquean flujos de usuario)
| ID | Título | Componentes | WCAG | Esfuerzo | Risk |
|---|---|---|---|---|---|
| SD-REM-001 | Contraste y roles de color | Button, ButtonPrimary | 1.4.3, 1.4.6 | 24h | 🔴 Alto |
| SD-REM-002 | Modal: foco y contenido largo | Modal | 2.4.3 | 20h | 🔴 Alto |
| SD-REM-003 | Nombre de MobileButton en loading | MobileButton | 4.1.2 | 12h | 🔴 Alto |
| SD-REM-004 | IDs y asociaciones de controles | Input, Select, Textarea | 1.3.1, 4.1.2 | 32h | 🔴 Alto |
| SD-REM-005 | Patrón de Tabs | Tabs | 2.1.1 | 16h | 🟡 Medio |
| SD-REM-006 | Reflow y títulos completos | MobileHeader, Modal | 1.4.10 | 16h | 🟡 Medio |
| SD-REM-007 | Enlaces deshabilitados | MobileRow, NextOperationalAction | 2.1.1 | 16h | 🔴 Alto |
| SD-REM-008 | Chat: nombre, errores y foco | Chat | 4.1.2 | 12h | 🟡 Medio |
| SD-REM-011 | Nombres y significado de estados | EstadoBadge, MobileProgress, EstadoStepper, RuumHeader | 4.1.2 | 16h | 🟡 Medio |

### Prioridad P2 - Mejoras (No bloqueantes pero requeridos)
| ID | Título | Componentes | Esfuerzo |
|---|---|---|---|
| SD-REM-009 | Tipografía y escalas | Transversal | 16h |

---

## 📅 CRONOGRAMA DETALLADO

### 🟢 Fase 0: Preparación (Día 1 - 2026-11-08 a 2026-11-11)

**Objetivo:** Alinear equipo y establecer lineas base

| Día | Actividad | Responsable | Duración | Entregable |
|---|---|---|---|---|
| 1 | Reunión de kickoff y alineación | UX Lead | 2h | Acta de reunión |
| 1 | Asignación formal de responsables SD-REM | Diseño de Sistemas | 4h | Tabla de asignación firmada |
| 2 | Configuración de entorno de pruebas | Frontend Plataforma | 4h | Entorno listo |
| 2 | Creación de branch de remediación | DevOps | 2h | `remediacion/ux-001-sd` |
| 3 | Revisión de evidencia actual | Accesibilidad | 4h | Informe de línea base |

**Checkpoint:** ✅ Equipo alineado, responsables asignados, entorno listo

---

### 🔴 Fase 1: Remediación P1 - Críticos (Día 4-15 - 2026-11-13 a 2026-11-26)

**Objetivo:** Resolver 8 tickets P1 que bloquean flujos críticos

#### Semana 1 (Día 4-8)
| Día | Ticket | Tarea | Responsable | Horas | % |
|---|---|---|---|---|---|
| 4-5 | SD-REM-001 | Analizar pares de color defectuosos | Frontend Plataforma | 8h | 33% |
| 6-7 | SD-REM-001 | Implementar tokens de color corregidos | Diseño de Sistemas | 8h | 66% |
| 8 | SD-REM-001 | Validar contraste en todos los temas | Accesibilidad | 8h | 100% |
| 4-5 | SD-REM-003 | Implementar aria-busy y conservar nombre en loading | Frontend Plataforma | 8h | 70% |
| 5 | SD-REM-003 | Testing con axe | Accesibilidad | 4h | 100% |
| 6-7 | SD-REM-007 | Bloquear activación de enlaces disabled (teclado) | Frontend Plataforma | 8h | 50% |
| 8 | SD-REM-007 | Bloquear activación (puntero) y testing | Frontend Plataforma | 8h | 100% |
| 4 | SD-REM-008 | Agregar etiqueta explícita a Chat Input | Frontend Plataforma | 4h | 30% |
| 5 | SD-REM-008 | Implementar recuperación de borrador | Frontend Plataforma | 4h | 60% |
| 6 | SD-REM-008 | Foco por instancia (no global) | Frontend Plataforma | 4h | 100% |

**Entregables Semana 1:**
- ✅ SD-REM-001: Tokens de color corregidos
- ✅ SD-REM-003: MobileButton con nombre accesible
- ✅ SD-REM-007: Bloqueo de enlaces disabled
- ✅ SD-REM-008: Chat con etiquetas y foco

#### Semana 2 (Día 9-15)
| Día | Ticket | Tarea | Responsable | Horas | % |
|---|---|---|---|---|---|
| 9-10 | SD-REM-004 | Generar IDs únicos por instancia | Frontend Plataforma | 12h | 40% |
| 11-12 | SD-REM-004 | Asociar label/ayuda/error correctamente | Frontend Plataforma | 12h | 80% |
| 13 | SD-REM-004 | Testing con axe y validación manual | Accesibilidad | 8h | 100% |
| 9-10 | SD-REM-002 | Implementar atrapamiento de foco en Modal | Frontend Plataforma | 8h | 40% |
| 11 | SD-REM-002 | Implementar retorno de foco al cerrar | Frontend Plataforma | 8h | 80% |
| 12 | SD-REM-002 | Ajustar contenido largo y scroll | Frontend Plataforma | 4h | 100% |
| 13-14 | SD-REM-005 | Completar patrón APG en Tabs | Frontend Plataforma | 8h | 50% |
| 15 | SD-REM-005 | Testing con teclado y NVDA | Accesibilidad | 8h | 100% |
| 13-14 | SD-REM-006 | Revisar geometry y truncado en MobileHeader | Frontend Plataforma | 8h | 50% |
| 15 | SD-REM-006 | Validar zoom nativo y reflow | Frontend Plataforma | 8h | 100% |
| 14-15 | SD-REM-011 | Corregir nombres accesibles en estados | Frontend Plataforma | 8h | 50% |

**Entregables Semana 2:**
- ✅ SD-REM-004: Input/Select/Textarea con IDs únicos
- ✅ SD-REM-002: Modal con foco atrapado y retorno
- ✅ SD-REM-005: Tabs con patrón APG completo
- ✅ SD-REM-006: Reflow y títulos completos
- ✅ SD-REM-011: Nombres accesibles corregidos

**Checkpoint Fase 1:** ✅ Todos los P1 resueltos, testing inicial completado

---

### 🟡 Fase 2: Remediación P2 + Gobernanza (Día 16-19 - 2026-11-27 a 2026-11-30)

**Objetivo:** Resolver tickets P2 y gobernanza

| Día | Ticket | Tarea | Responsable | Horas |
|---|---|---|---|---|
| 16 | SD-REM-009 | Revisar tipografía y escalas | Diseño de Sistemas | 8h |
| 17 | SD-REM-009 | Implementar fallback efectivo | Frontend Plataforma | 8h |
| 18 | SD-REM-010 | Revisar y justificar overrides en app-usuario | Propietarios app-usuario | 8h |
| 19 | SD-REM-010 | Retirar compensaciones innecesarias | Frontend Plataforma | 8h |

**Checkpoint Fase 2:** ✅ P2 y gobernanza resueltos

---

### 🟢 Fase 3: Validación y Cierre (Día 20-24 - 2026-12-01 a 2026-12-06)

**Objetivo:** Validar todas las remediaciones y firmar co-revisión

| Día | Actividad | Responsable | Horas | Entregable |
|---|---|---|---|---|
| 20 | Ejecutar auditoría automatizada completa | Accesibilidad | 8h | Reportes axe actualizados |
| 21 | Testing manual con tecnología asistiva (NVDA/VoiceOver) | Accesibilidad | 8h | Reportes de TA |
| 22 | Revisión de todos los componentes remediados | Diseño de Sistemas | 8h | Informe de revisión |
| 23 | Co-revisión y firma nominal | Diseño de Sistemas + UX Lead + Accesibilidad | 8h | CO-REVISION.md firmado |
| 24 | Validación final y merge a main | DevOps | 4h | GATE desbloqueado |

**Checkpoint Final:** ✅ GATE RUUM-UX-001-SD DESBLOQUEADO

---

## 👥 ASIGNACIÓN DE RECURSOS

### Equipos y Responsables

| Rol | Nombre | Horas asignadas | Responsabilidades |
|---|---|---|---|
| **UX Lead** | [Pendiente] | 24h | Coordinación, revisión final |
| **Diseño de Sistemas** | [Pendiente] | 64h | SD-REM-001, 005, 006, 009, 010, 011, 012 |
| **Frontend Plataforma (Lead)** | [Pendiente] | 120h | Todos los tickets técnicos |
| **Frontend Plataforma** | [Pendiente] | 120h | Implementación de fixes |
| **Accesibilidad** | [Pendiente] | 64h | Testing, validación axe/TA |
| **Propietario app-usuario** | [Pendiente] | 16h | SD-REM-010 (overrides) |
| **DevOps** | [Pendiente] | 8h | Entorno, CI/CD |

**Total:** 412 horas  
**Equipo sugerido:** 4 desarrolladores + 1 QA Accesibilidad + 1 Diseñador

---

## 📊 MÉTRICAS DE ÉXITO Y KPIs

### KPIs Cuantitativos

| KPI | Meta | Medición |
|---|---|---|
| Tickets cerrados | 12/12 | % completados |
| Componentes conformes | 58/58 | Veredictos actualizados |
| Infracciones axe | 0 | Reportes automatizados |
| Cobertura de pruebas TA | 100% | Sesiones NVDA/VoiceOver |
| Tiempo promedio por ticket | ≤ 16h | Horas registradas |

### KPIs Cualitativos

- [ ] Todos los componentes pasan pruebas axe sin violations
- [ ] Todos los componentes tienen nombres accesibles correctos
- [ ] Todos los flujos de teclado funcionan correctamente
- [ ] El contraste cumple WCAG 2.2 AA (4.5:1 normal, 3:1 grande)
- [ ] La co-revisión está firmada por todos los responsables

---

## 🚨 RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación | Contingencia |
|---|---|---|---|---|
| Retraso en asignación de responsables | Alta | Alto | Reunión diaria de seguimiento | Escalar a gerencia |
| Problemas técnicos en implementación | Media | Alto | Code review temprano | Pair programming |
| Cambios en requisitos WCAG | Baja | Medio | Monitoreo de estándares | Ajustar plan |
| Falta de disponibilidad de TA | Media | Alto | Reservar equipo de accesibilidad | Usar emuladores |
| Conflictos de merge | Media | Medio | Branches aislados, PRs pequeños | Resolución inmediata |
| Overrides no detectados | Media | Medio | Revisión manual exhaustiva | Auditoría adicional |

---

## 📋 CHECKLIST DE CIERRE

### Documentación
- [ ] Todos los tickets SD-REM actualizados con soluciones
- [ ] Reportes de pruebas axe actualizados
- [ ] Reportes de pruebas con tecnología asistiva
- [ ] CO-REVISION.md firmado
- [ ] Actas de reunión de revisión

### Código
- [ ] Todos los fixes en branch `remediacion/ux-001-sd`
- [ ] PRs revisados y aprobados
- [ ] Merge a main completado
- [ ] Tags de versión creados

### Validación
- [ ] Auditoría automatizada pasa sin violations
- [ ] Testing manual completa
- [ ] Tecnología asistiva validada
- [ ] GATE desbloqueado

---

## 📎 ANEXOS

### Anexos Incluidos
1. **[VEREDICTOS.md](VEREDICTOS.md)** - Estado actual por componente
2. **[OVERRIDES.md](OVERRIDES.md)** - Inventario de overrides en app-usuario
3. **[TOKENS.md](TOKENS.md)** - Análisis de tokens de color
4. **[remediaciones/](remediaciones/)** - Detalle de cada ticket SD-REM
5. **[resultados-base/](resultados-base/)** - Evidencia de auditoría

### Plantillas
- [Plantilla de PR](PLANTILLA-PR.md)
- [Plantilla de acta de reunión](PLANTILLA-ACTA.md)
- [Plantilla de reportes de testing](PLANTILLA-TESTING.md)

---

## 📞 CONTACTOS

| Rol | Nombre | Email | Slack |
|---|---|---|---|
| UX Lead | [Pendiente] | | |
| Diseño de Sistemas | [Pendiente] | | |
| Frontend Plataforma Lead | [Pendiente] | | |
| Accesibilidad | [Pendiente] | | |
| Propietario app-usuario | [Pendiente] | | |

---

## ✅ APROBACIONES

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| UX Lead | | | |
| Diseño de Sistemas | | | |
| Frontend Plataforma | | | |
| Accesibilidad | | | |
| Propietario app-usuario | | | |

---

**Documento generado:** 2026-11-08  
**Próxima revisión:** 2026-11-15 (Checkpoint Fase 1)  
**Versión:** 1.0

---

*Este plan de remediación es parte de la auditoría RUUM-UX-001-SD y debe ser ejecutado en su totalidad para desbloquear el GATE de conformidad UX/IU.*
