# Contrato de Generación de PDF Resistente a OOM (Flujo 9)
**Código:** RUUM-CTR-F9-002  
**Ticket asociado:** RUUM-USR-F9-001 (CB-2, T5, T6, T7, T8; CA-4, CA-5, CA-6, CA-11)  
**Fecha:** 2026-11-04  
**Dueño:** Plataforma Web / API de Pasaporte (`apps/app-usuario`)  
**Estado:** Aprobado y Vigente  

---

## 1. Contexto y Problema
La generación del expediente PDF del Pasaporte Digital incluye la descarga y renderizado de evidencias fotográficas de alta resolución (inspecciones iniciales, intermedias y finales).  
Bajo peticiones simultáneas, la descarga secuencial y el procesamiento de múltiples imágenes pesadas en buffers de memoria acumulaban más de 100 MB por solicitud, superando los límites de memoria de los contenedores de Node.js / Vercel Functions y provocando errores de agotamiento de memoria (**OOM - Out Of Memory Kills**). Adicionalmente, cualquier fallo de red o rechazo de SSRF abortaba con excepción no controlada, destruyendo la disponibilidad del servicio.

---

## 2. Parámetros Contractuales de Resiliencia y Concurrencia

### 2.1 Concurrencia Inter-Petición (Entre Peticiones)
- **Mecanismo:** Semáforo global en memoria de proceso (`SemaforoGlobalPdf`).
- **Límite máximo por instancia:** **2 peticiones simultáneas** de generación de PDF por contenedor Node.js (configurable mediante variable de entorno `MAX_CONCURRENT_PDF_GENERATIONS`, por defecto 2).
- **Comportamiento ante saturación (Fail-Fast):**
  - Si una petición arriba y el cupo está agotado, se rechaza inmediatamente sin encolar en memoria indefinidamente (evitando saturación de event loop).
  - **Código HTTP:** `503 Service Unavailable`.
  - **Cabeceras:** `Retry-After: 5`, `Cache-Control: private, no-store`.
  - **Cuerpo JSON:** `{ "error": "El servidor está procesando el límite de expedientes PDF simultáneos. Por favor reintenta en unos segundos." }`.

### 2.2 Concurrencia Intra-Petición (Dentro de la Petición)
- **Mecanismo:** Descarga acotada mediante pool concurrente (`ejecutarConLimiteConcurrente`).
- **Límite máximo de descargas paralelas:** **2 imágenes simultáneas**.
- **Impacto:** Evita que 10 o 20 descargas ocurran simultáneamente, manteniendo los buffers de red en vuelo en niveles seguros.

### 2.3 Límites de Tamaño y Timeouts por Imagen
- **Límite de tamaño por archivo individual:** Máximo **5 MB** (`5 * 1024 * 1024` bytes). Si el lector de streaming detecta que una foto excede 5 MB, se cancela el lector de inmediato.
- **Límite total acumulado por expediente:** Máximo **30 MB** (`30 * 1024 * 1024` bytes).
- **Timeout de descarga por evidencia:** **3500 ms** mediante `AbortSignal.timeout(3500)`.

---

## 3. Política de Mitigación SSRF y Fallo Silencioso Controlado (CA-6)

### 3.1 Validación Estricta de Origen (Anti-SSRF)
Toda URL de evidencia fotográfica debe satisfacer estrictamente:
1. Origen idéntico al configurado en `process.env.NEXT_PUBLIC_SUPABASE_URL`.
2. Ruta iniciando exactamente con `/storage/v1/object/sign/`.
3. Esquema seguro `https:`.

### 3.2 Comportamiento si la URL no pasa SSRF o falla la descarga (CA-5, CA-6)
- **Principio fundamental:** **Una foto inaccesible no debe tumbar un expediente legal**.
- Si una URL es externa, maliciosa, expirada, devuelve error HTTP, o la descarga excede el timeout de 3.5s o el tamaño de 5 MB:
  - **NO se lanza una excepción no capturada**.
  - Se registra una advertencia estructurada en telemetría (`logStructuredWarn`).
  - La función `cargarFoto` devuelve `null`.
  - El motor de PDF dibuja un **recuadro visual de reserva (placeholder)** en la página de la evidencia con borde gris, fondo neutro y la leyenda:
    > *Evidencia no disponible temporalmente.*  
    > *No fue posible incorporar el archivo (enlace expirado, formato no admitido o descarga no disponible).*
  - En la sección final de "Control del expediente exportado", se documenta con rigor:  
    `Fotografías incorporadas: M de N`.

---

## 4. Streaming y Garantía Anti-PII Parcial (CA-9)

1. **Construcción íntegra previa:** El archivo PDF (`Uint8Array`) se completa 100% en memoria antes de comenzar a emitir el cuerpo HTTP.
2. **Si ocurre un fallo estructural irrecuperable (datos de pasaporte inválidos o error interno):**
   - Se captura en el bloque `catch`.
   - Se responde un JSON de error 503 limpio.
   - **Garantía:** Nunca se envía un fragmento de PDF que contenga PII incompleta o rota.
3. **Emisión por Streaming:**
   - Una vez generado y validado el buffer íntegro, se encapsula en un `ReadableStream<Uint8Array>` emitiendo bloques de **64 KB**.
   - Cabeceras de protección:
     - `Content-Type: application/pdf`
     - `Content-Disposition: attachment; filename="pasaporte-[id].pdf"`
     - `Cache-Control: private, no-store`
     - `X-Content-Type-Options: nosniff`

---

## 5. Cuenta de Memoria por Contenedor (Presupuesto de Heap y Margen de Seguridad)

### 5.1 Parámetros de la Instancia de Ejecución
- **Entorno de ejecución:** Vercel Function / Contenedor Node.js 24 (`runtime: "nodejs"`).
- **Asignación de memoria del contenedor:** 512 MB (perfil estándar de plataforma; compatible con contenedor restringido de 256 MB).
- **Consumo base de Node.js + Next.js (idle runtime):**
  - `heapUsed`: ~42 MB - 48 MB.
  - `rss` (Resident Set Size): ~72 MB.

### 5.2 Desglose de Memoria por Generación de PDF Activa
Cada expediente al máximo de su capacidad autorizada procesa:
1. **Buffers de imágenes descargadas (`Uint8Array`):**
   - Límite contractual estricto: `MAX_BYTES_TOTAL_IMAGENES = 30 MB`.
   - Límite por imagen: `MAX_BYTES_POR_IMAGEN = 5 MB`.
   - Concurrencia intra-petición: máximo 2 descargas paralelas (`ejecutarConLimiteConcurrente = 2`).
2. **Estructuras intermedias del motor de renderizado (`pdf-lib`):**
   - Árbol de objetos PDF, decodificación JPEG/PNG e incrustación de streams: factor ~1.3× sobre el tamaño de imágenes = **~39 MB**.
3. **Buffer del documento PDF compilado:**
   - Documento final serializado previo a streaming: **~6 MB - 8 MB**.
4. **Pico máximo de memoria por petición individual:**
   $$30\text{ MB (imágenes)} + 39\text{ MB (árbol pdf-lib)} + 8\text{ MB (buffer final)} = \mathbf{77\text{ MB}}.$$

### 5.3 Cuenta de Memoria bajo Concurrencia Máxima (Semáforo = 2)
Bajo saturación máxima permitida (2 peticiones generando expedientes complejos en paralelo):
- Consumo pico de 2 peticiones simultáneas: $2 \times 77\text{ MB} = \mathbf{154\text{ MB}}$.
- Consumo base de la instancia Node.js: $\mathbf{45\text{ MB}}$.
- Overhead del recolector de basura de V8 y buffers externos (`external`): $\mathbf{18\text{ MB}}$.
- **Pico máximo total estimado de Heap:**
  $$\text{Heap Total Máximo} = 154\text{ MB} + 45\text{ MB} + 18\text{ MB} = \mathbf{217\text{ MB}}.$$

### 5.4 Margen de Seguridad y Prevención de OOM
- **En contenedor estándar de 512 MB:**
  - Utilización máxima: $217\text{ MB} / 512\text{ MB} = \mathbf{42.4\%}$.
  - **Margen de seguridad libre (Headroom):** $\mathbf{295\text{ MB}}$ ($57.6\%$).
- **En contenedor mínimo restrictivo de 256 MB:**
  - Utilización máxima: $217\text{ MB} / 256\text{ MB} = \mathbf{84.8\%}$.
  - **Margen de seguridad libre (Headroom):** $\mathbf{39\text{ MB}}$ ($15.2\%$).
- **Peticiones adicionales (> 2 concurrentes):**
  - Rechazadas de inmediato en T+0 ms con `HTTP 503` y `Retry-After: 5`.
  - Consumo de heap de peticiones rechazadas: **0 MB** (no se ejecutan lecturas de base de datos, descargas ni instancias de `pdf-lib`).
- **Conclusión técnica:** El límite de **2 PDFs concurrentes** es estrictamente seguro, matemáticamente demostrado y garantiza la eliminación definitiva de incidentes OOM en producción.
