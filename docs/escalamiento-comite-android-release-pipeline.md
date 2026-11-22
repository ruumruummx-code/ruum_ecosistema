# Escalamiento al Comité de Arquitectura y Seguridad: Release Pipeline y Firma de Aplicaciones Android (F0.6)

**Fecha:** 2026-11-27  
**Emisor:** Lead Security & Architecture Auditor  
**Destinatario:** Comité de Arquitectura, Dirección Técnica y Lead de Mobile  
**Referencia:** RUUM-SEC-007 (F0.6: Desactivación de `webContentsDebuggingEnabled`) / RUUM-SEC-EPIC-001-CLOSE  
**Clasificación de Riesgo:** 🔴 Crítico Operativo (Riesgo de Integridad de Binarios y Cadena de Suministro)

---

## 1. Resumen Ejecutivo del Hallazgo

Durante la mitigación inmediata del ticket `RUUM-SEC-007` (desactivación de `webContentsDebuggingEnabled: false` en `capacitor.config.ts` y assets compilados de Android), se identificó un **vacío estructural severo en el ciclo de vida de desarrollo de las aplicaciones móviles Android (`app-usuario` y `app-conductor`)**:

1. **Ausencia de Pipeline Automatizado de Build y Firma (CI/CD):**  
   No existen flujos de trabajo de GitHub Actions, GitLab CI ni Fastlane configurados en el monorepo para compilar artefactos (`.apk` / `.aab`) de forma reproducible y aislada.
2. **Gestión Insegura de Keystores y Llaves de Firma:**  
   No existe un almacén seguro centralizado (ej. Google Cloud KMS, AWS KMS, HashiCorp Vault o GitHub Secrets) para la llave de firma de producción (`release.keystore`). El build dependía de compilaciones manuales en máquinas locales de desarrolladores.
3. **Riesgo de Regresión de Flags de Depuración:**  
   Al compilarse manualmente con Android Studio en estaciones de trabajo locales, existe el riesgo latente de que comandos como `cap sync` o compilaciones en variantes `debug` vuelvan a activar banderas de inspección o expongan certificados de desarrollo en tiendas de aplicaciones.

---

## 2. Impacto Potencial

- **Compromiso de Integridad:** Posibilidad de que binarios generados en estaciones locales no confiables sean subidos a Google Play Store sin trazabilidad de commit hash ni firma criptográfica auditable.
- **Riesgo de Continuidad de Negocio:** Pérdida de la llave de firma privada local impediría actualizar las aplicaciones publicadas en Play Store para miles de usuarios y conductores.
- **Vulnerabilidad de Depuración:** Un APK compilado localmente en modo `debug` expone la consola de Chrome DevTools y la memoria interna de la aplicación a atacantes físicos o malware en el dispositivo.

---

## 3. Plan de Remediación Estructural para Fase 3 (Mobile Hardening)

Se solicita al Comité la aprobación de un ticket de Fase 3 (**RUUM-SEC-014: Mobile CI/CD & Automated Signing Pipeline**) con el siguiente alcance obligatorio:

1. **Implementación de Fastlane / GitHub Actions:**
   - Creación de un workflow en `.github/workflows/android-release.yml` activado exclusivamente por etiquetas de versión protegidas (`v*.*.*`).
   - Ejecución determinista de `pnpm build`, `cap sync android` y `./gradlew bundleRelease`.
2. **Custodia Criptográfica de Llaves de Firma:**
   - Carga segura de `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` y `KEY_PASSWORD` en Secretos de Entorno protegidos con políticas de aprobación.
   - Integración con Play Integrity API.
3. **Guardas de Compilación en Gradle:**
   - Configuración estricta en `build.gradle` para forzar que `release` falle la compilación (`failOnError`) si `webContentsDebuggingEnabled` está en `true` o si `debuggable` es `true`.

---

## 4. Dictamen Solicitado al Comité

- [ ] Toma de conocimiento del hallazgo por parte de la Dirección de Tecnología.
- [ ] Incorporación prioritaria del ticket `RUUM-SEC-014` al Roadmap de la Fase 3.
- [ ] Prohibición formal de distribución de binarios compilados en entornos locales para testing externo o producción.
