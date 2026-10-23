# UI-CND-05 / UX-CND-03: teclado nativo y safe areas

## Regla de certificación

GO requiere la matriz completa aprobada en Android físico o WebView de un emulador Android, y CI verde para el mismo candidato. Una prueba Chromium de escritorio con dimensiones móviles o `visualViewport` simulado no cumple este gate. Un preflight o una captura tampoco equivale a PASS.

El GO de este ticket acredita teclado/layout. La liberación completa conserva los demás criterios y responsables del [runbook de producción](../../../../docs/runbooks/CLOSE-P1-GO-NO-GO-ROLLBACK.md).

## Preparación

1. Identificar commit, cambios locales, ambiente, URL, versión/versionCode y SHA-256 del APK instalado. Para certificar, el candidato debe corresponder al código que pasó CI; un despliegue verde de otro commit no basta. Usar cuentas y datos de QA.
2. Instalar el candidato en Android. Comprobar `adb devices -l` (estado `device`) y `adb -s SERIAL shell getprop sys.boot_completed` (`1`). El emulador debe tener un IME nativo instalado y habilitado; desactivar su teclado físico o activar la opción de mostrar el teclado virtual.
3. Registrar modelo, API de Android, versión de Android System WebView, IME, orientación y resolución/densidad. Probar el tamaño compacto 320×568 CSS cuando el dispositivo/emulador lo permita y la resolución nativa del equipo.
4. Desde `apps/app-conductor`, con Node 24, ejecutar el recolector:

```powershell
pnpm test:android:native --serial SERIAL --apk C:/ruta/conductor-candidato.apk
```

`RUUM_ADB_PATH` permite elegir el ADB del SDK. Las evidencias se guardan en `artifacts/android-native/FECHA-CASO/`. El script devuelve código 2 si falta un Android autorizado y arrancado. No instala APK, no introduce credenciales, no cambia ajustes del dispositivo y nunca concede GO automáticamente.

## Matriz obligatoria

Repetir las filas con navegación por gestos y por tres botones; también con recorte de pantalla/notch real o configurado mediante las opciones de desarrollador del emulador. Conservar y restaurar la configuración original. Repetir apertura/cierre del teclado y rotación vertical/horizontal.

| Flujo | Interacción nativa | Verificación |
|---|---|---|
| Login | Tocar Correo y Contraseña; introducir datos de QA; avanzar con Siguiente/Enter del IME | Campo enfocado visible, error anunciado, Entrar accesible y pulsable con teclado abierto. Recuperación accesible mediante el scroll interno. |
| Registro / Cuenta | Recorrer todos los campos, incluido el último; correo, teléfono, contraseña y confirmación | Ningún campo queda detrás del IME; Crear cuenta/Siguiente permanece alcanzable sin desplazar el documento raíz. Validar errores antes de avanzar con una cuenta de QA. |
| Registro / Identidad | Completar campos y controles del paso, volver y avanzar | Identidad mantiene foco/contexto; el siguiente paso es accesible con IME visible. |
| Registro / Licencia | Completar campos y abrir el selector nativo de fecha cuando corresponda | Campo, selector, permisos/consentimientos y acción siguiente no quedan obstruidos. Un selector de fecha se registra como selector nativo, no como teclado probado. |
| Perfil | Recorrer cada pestaña y sus inputs editables; abrir confirmación de sesión para datos protegidos | Input y Guardar cambios accesibles; diálogo y cierre dentro del área visible; los valores y la pestaña se conservan al cerrar el teclado. Guardar únicamente datos de QA. |
| Safe areas | Notch, barra de estado, indicador de gestos, tres botones y rotación; repetir con IME | Cabecera, retorno, barra inferior y CTA no invaden recortes o gestos. Tras cerrar IME se recupera el alto; no queda hueco residual ni doble scroll raíz. |

Abrir el teclado tocando el input en Android. `fill()`, foco por JavaScript o alterar `visualViewport` sin IME visible no son evidencia suficiente. El scroll interno legítimo puede usarse para alcanzar el envío sin cerrar el teclado; comprobar visualmente y por pulsación que no exista una capa interceptando el CTA.

Para cada campo/CTA, conservar captura completa del dispositivo con IME visible, su nombre, resultado de la pulsación y, mediante depuración de WebView cuando esté disponible, su rectángulo respecto de `visualViewport` y `elementFromPoint`. No guardar contraseñas, tokens ni datos personales reales.

```powershell
pnpm test:android:native --serial SERIAL --apk C:/ruta/conductor-candidato.apk --case login-correo --keyboard
pnpm test:android:native --serial SERIAL --apk C:/ruta/conductor-candidato.apk --case perfil-envio --keyboard
```

El recolector exige Conductor en primer plano, IME confirmado por Android con `--keyboard` y coincidencia SHA-256 entre el APK instalado y el candidato. Captura con `adb exec-out screencap`, sin transformar la imagen. Guarda únicamente señales seleccionadas del IME, no su dump completo. El estado `EVIDENCE_CAPTURED` requiere revisión posterior; no significa PASS.

## Cierre

Registrar por fila: candidato, configuración, campo/CTA, IME confirmado, captura/log, resultado y defecto encontrado. La ausencia de evidencia deja la fila pendiente.

Consultar todos los checks del SHA candidato y conservar enlaces a la ejecución de CI. Las suites locales de UI complementan este gate, pero no sustituyen CI ni Android. Con cambios locales sin publicar, el CI remoto aún no certifica ese código.

Solo marcar GO de teclado/layout cuando todas las filas estén PASS, los defectos P1 estén resueltos y CI esté verde para ese candidato. En otro caso registrar NO-GO con los bloqueos concretos. No promover ni desplegar como parte de esta prueba.
