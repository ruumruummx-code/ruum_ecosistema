# Ticket RUUM-SEC-014b: Pipeline de Release Android y Gestión de Keystores en CI/CD

**Metadatos del Ticket:**
- **ID:** `RUUM-SEC-014b`
- **Tipo:** Task
- **Título:** [Fase 3 / Hallazgo F0.6] Implementación de Pipeline de Release Android End-to-End, Firma Automatizada y Publicación en Play Console
- **Owner:** FS (Frontend Senior / Mobile) + DO (DevOps / SRE)
- **Esfuerzo:** 3–5 pd
- **Prioridad:** 🟠 Alta (Bloqueante de distribución de producto móvil)
- **Fase:** Fase 3 (Mobile Hardening & Distribution / F3.2 ampliado)
- **Vinculado a:** `RUUM-SEC-007` (F0.6: Desactivación de `webContentsDebuggingEnabled`)
- **Documento de Escalamiento:** [escalamiento-comite-android-release-pipeline.md](file:///c:/ruum_ecosistema-main/docs/escalamiento-comite-android-release-pipeline.md)
- **Estado:** To Do

---

## 1. Contexto y Justificación

Durante la mitigación de seguridad móvil de la Fase 0 (`RUUM-SEC-007` / F0.6), se identificó que el monorepo no cuenta con un release pipeline automatizado ni gestión segura de certificados de firma para las dos aplicaciones Android (`app-usuario` y `app-conductor`).
Actualmente, las aplicaciones solo se pueden generar mediante builds manuales en Android Studio en equipos locales de desarrolladores. Esto impide la distribución oficial en Google Play Store, introduce riesgo de pérdida de llaves y abre la posibilidad de errores humanos (ej. habilitar banderas `debuggable: true` en binarios de producción).

---

## 2. Alcance y Actividades

1. **Configuración de Gradle en ambas aplicaciones (`app-usuario` y `app-conductor`):**
   - Configurar bloques `signingConfigs.release` en `android/app/build.gradle` consumiendo variables de entorno seguras (`ANDROID_KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`).
   - Forzar `minifyEnabled true`, `shrinkResources true` y `debuggable false` en `buildTypes.release`.
2. **Custodia de Llaves de Firma (Keystores):**
   - Generación de `release.keystore` de producción con algoritmo RSA 4096 / SHA-256.
   - Resguardo cifrado de la llave en HashiCorp Vault / Google Cloud KMS o GitHub Secrets protegidos (nunca en el árbol de Git).
3. **Flujo Automatizado de CI/CD (GitHub Actions):**
   - Crear `.github/workflows/android-release.yml` para compilar y firmar los artefactos `.aab` de forma determinista y reproducible al crear un tag `v*.*.*-android`.
4. **Publicación Automatizada en Google Play Console:**
   - Integración con Fastlane (`supply`) o GitHub Action oficial de Google Play para publicar directamente en el track de **Internal Testing**.
5. **Procedimiento Operativo Estándar (SOP):**
   - Documentar la guía de rotación de certificados y llaves de firma en `docs/runbooks/android-signing.md`.

---

## 3. Criterios de Aceptación

- [ ] Bloques `signingConfigs.release` configurados de forma segura en `app-usuario` y `app-conductor`.
- [ ] Build release firmado reproducible ejecutado exitosamente en GitHub Actions sin intervención manual.
- [ ] Artefacto AAB publicado y verificado en el canal de pruebas internas (Internal Testing) de Google Play Console.
- [ ] Documentación operativa de firma y rotación aprobada por el Comité de Arquitectura.
