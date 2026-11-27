# Runbook: firma y custodia de llaves Android (RUUM-SEC-014b)

Aplica a `app-conductor` (`com.moviliax.ruumruum.conductor`) y `app-usuario` (`com.moviliax.ruumruum.usuario`).

## 1. Modelo de custodia (decisión)

| Llave | Quién la custodia | Dónde vive | Si se pierde |
| --- | --- | --- | --- |
| **Llave de firma de la app** (app signing key) | Google, vía **Play App Signing** | Infraestructura de Google | No se puede perder: Google la conserva. |
| **Llave de subida** (upload key), una por app | Ruum | GitHub environment protegido `android-release` + respaldo cifrado fuera de línea | Se solicita a Google un *upload key reset* desde Play Console; las apps publicadas no se ven afectadas. |

Por qué así:

- Con Play App Signing, la llave que firma lo que reciben los usuarios nunca sale de Google. Un robo de la llave de subida se revoca rotándola, sin perder la capacidad de actualizar la app.
- Las llaves de subida se usan solo en CI, en un environment con revisores obligatorios y restringido a tags de release. Ningún PR ni rama puede leerlas.
- Ninguna llave entra al repositorio. `*.keystore` y `*.jks` no deben versionarse.
- Cada app tiene su propia llave de subida, para que comprometer una no afecte a la otra.
- Vault/KMS queda descartado por ahora: agrega infraestructura y costo sin reducir el riesgo, porque Google ya custodia la llave crítica.

## 2. Configuración inicial (una sola vez)

### 2.1 Generar las llaves de subida (en una máquina de confianza, fuera de línea si es posible)

```bash
keytool -genkeypair -v \
  -keystore conductor-upload.jks -alias conductor-upload \
  -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000 \
  -dname "CN=Ruum Ruum Conductor, O=Moviliax, L=CDMX, ST=CDMX, C=MX"

keytool -genkeypair -v \
  -keystore usuario-upload.jks -alias usuario-upload \
  -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000 \
  -dname "CN=Ruum Ruum, O=Moviliax, L=CDMX, ST=CDMX, C=MX"
```

Usa contraseñas largas y aleatorias (de 32 caracteres o más), generadas con el gestor de contraseñas del equipo.

### 2.2 Respaldo fuera de línea

1. Guarda los `.jks` y sus contraseñas en el gestor de contraseñas del equipo, en una bóveda con acceso solo para Dirección Técnica y DevOps.
2. Haz una segunda copia cifrada (por ejemplo, con `age` o un USB cifrado) en resguardo físico.
3. Borra los `.jks` de la máquina donde se generaron.

### 2.3 Environment protegido en GitHub

En *Settings > Environments > New environment* crea `android-release` y configúralo así:

- **Required reviewers:** al menos una persona distinta de quien crea el tag.
- **Deployment branches and tags:** *Selected* → solo tags con patrón `v*.*.*-android`.
- **Prevent self-review:** activado.

Después carga estos secretos **en el environment**, no a nivel del repositorio:

| Secreto | Valor |
| --- | --- |
| `CONDUCTOR_UPLOAD_KEYSTORE_B64` | `base64 -w0 conductor-upload.jks` |
| `CONDUCTOR_UPLOAD_STORE_PASSWORD` | contraseña del keystore |
| `CONDUCTOR_UPLOAD_KEY_ALIAS` | `conductor-upload` |
| `CONDUCTOR_UPLOAD_KEY_PASSWORD` | contraseña de la llave |
| `USUARIO_UPLOAD_KEYSTORE_B64` | `base64 -w0 usuario-upload.jks` |
| `USUARIO_UPLOAD_STORE_PASSWORD` | contraseña del keystore |
| `USUARIO_UPLOAD_KEY_ALIAS` | `usuario-upload` |
| `USUARIO_UPLOAD_KEY_PASSWORD` | contraseña de la llave |

Protege también los tags: en *Settings > Rules > Rulesets*, crea una regla para `v*.*.*-android` que restrinja quién puede crearlos y que impida borrarlos o moverlos.

### 2.4 Play Console

1. Crea las dos apps con sus `applicationId`.
2. Activa **Play App Signing** y deja que Google genere la llave de firma de la app.
3. La primera versión de cada app se sube **a mano** al track *Internal testing*, usando el AAB que generó CI (Play exige esa primera subida manual).
4. Registra el certificado de la llave de subida, si Play lo solicita (`keytool -export -rfc -keystore X-upload.jks -alias X-upload`).

## 3. Publicar una versión

1. Actualiza `config/app-version.json` (`version` y `versionCode`) en un PR y haz merge.
2. Crea y empuja el tag: `git tag v1.0.0-android && git push origin v1.0.0-android`. El tag debe coincidir con `version`; si no coincide, el workflow falla.
3. El workflow `Android Release (AAB firmado)` espera aprobación en el environment. Un revisor la aprueba.
4. Descarga los artefactos `app-conductor-aab` y `app-usuario-aab` (cada uno incluye su `.sha256`) y súbelos a *Internal testing*.

La publicación automática a Play (con una cuenta de servicio) se agregará en un paso posterior, cuando existan las fichas de las apps. La cuenta de servicio tendrá permiso solo de *Release to testing tracks*.

## 4. Rotación y respuesta a incidentes

- **Rotación preventiva:** cada 2 años o cuando salga del equipo alguien con acceso a la bóveda.
- **Sospecha de compromiso de la llave de subida:**
  1. Elimina de inmediato los secretos `*_UPLOAD_*` del environment.
  2. Genera una nueva llave de subida (paso 2.1).
  3. En Play Console, ve a *Integridad de la app > Firma de apps de Google Play > Solicitar restablecimiento de la llave de subida* y sube el certificado nuevo.
  4. Carga los secretos nuevos y destruye los respaldos de la llave anterior.
  5. Registra el incidente y revisa el historial de ejecuciones de `android-release`.

## 5. Guardas automáticas

- `buildTypes.release` declara `debuggable false`, `minifyEnabled true` y `shrinkResources true` en ambas apps.
- El workflow bloquea el release si el `capacitor.config.json` generado trae `webContentsDebuggingEnabled: true`.
- El workflow verifica la firma del AAB (`jarsigner -verify -strict`) y borra el keystore del runner al terminar.
- `android.yml` (en PRs) compila con un keystore desechable y nunca tiene acceso a las llaves reales.
