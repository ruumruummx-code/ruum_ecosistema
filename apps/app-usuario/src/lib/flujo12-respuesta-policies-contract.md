# Contrato de Respuesta Actualizada, Policies de Storage y Límites Server-Side (Flujo 12)
**Identificador**: `RUUM-CONTRATO-F12-RESPUESTA-POLICIES-LIMITES`  
**Ticket**: `RUUM-USR-F12-001` (Condición Bloqueante CB-3)  
**Versión**: `1.0.0`  
**Fecha**: `2026-11-04`  
**Estado**: `APROBADO_EN_CONTRATO`

---

## 1. Contexto y Objetivos

El endurecimiento del Flujo 12 establece tres garantías de integridad y seguridad:
1. **Eliminación de Recarga Ciega**: Evitar `router.refresh()` completo al guardar cambios, actualizando el estado de UI localmente a partir de la respuesta tipada de la RPC.
2. **Aislamiento Criptográfico y Temporal de Storage**:
   - TTL estricto de URLs firmadas en 15 minutos (900 segundos).
   - Políticas RLS en Supabase Storage que aíslan las imágenes por carpeta `${auth.uid()}`.
3. **Validación Defensiva Server-Side**:
   - Validar longitudes máximas y edad mínima en backend para evitar evasión de validaciones de cliente.

---

## 2. Respuesta Actualizada y Manejo de Estado en Cliente

### 2.1 Estructura del Resultado de la Saga
```ts
export interface ResultadoSagaPerfil {
  exito: boolean;
  version: number;
  usuario: Partial<Usuario>;
  fotoUrlFirmada: string | null;
}
```

### 2.2 Política de No Recarga (`router.refresh()`)
- Tras la ejecución exitosa de `ejecutarSagaActualizacionPerfil`:
  - `setVersion(resSaga.version)` actualiza la versión esperada localmente.
  - `setFotoPath(resSaga.usuario.foto_url)` actualiza la ruta del objeto en Storage.
  - `setFotoUrl(versionarFotoPerfil(resSaga.fotoUrlFirmada))` actualiza el preview de la imagen firmado.
  - Se notifica mediante evento `notificarFotoPerfilActualizada(usuario.id, url)` para componentes suscritos (ej. barra de navegación).
  - Se despliega feedback de éxito accesible (`role="status"`, "Los cambios se guardaron correctamente").
- **Prohibición**: Queda prohibido llamar `router.refresh()` de forma automática o síncrona en el submit, ya que destruye el estado reactivo, causa parpadeos de UI y puede resetear campos modificados por el usuario.

---

## 3. Políticas RLS en Supabase Storage (`fotos-perfil`)

### 3.1 Aislamiento Estricto por Usuario (`auth.uid()`)
El bucket `fotos-perfil` es privado (`public = false`). El acceso está protegido por Row Level Security (RLS) en `storage.objects`:

```sql
-- Política de inserción/subida (INSERT)
create policy "Usuarios suben su propia foto de perfil"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política de actualización (UPDATE)
create policy "Usuarios actualizan su propia foto de perfil"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política de lectura (SELECT)
create policy "Usuarios leen su propia foto de perfil"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política de eliminación (DELETE)
create policy "Usuarios eliminan su propia foto de perfil"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 3.2 TTL de URLs Firmadas (15 minutos = 900 s)
- Ninguna URL efímera con token de firma se almacena en la columna `foto_url` de la base de datos (únicamente se almacena el path relativo, e.g. `<uid>/perfil_<ts>.jpg`).
- Cuando se genera una URL de lectura en cliente o servidor:
  ```ts
  const { data } = await cliente.storage
    .from("fotos-perfil")
    .createSignedUrl(ruta, 900); // 900 segundos = 15 minutos
  ```
- Si la URL expira, la aplicación cliente renueva la URL firmada bajo demanda mediante `obtenerUrlFotoPerfilUsuario`.

---

## 4. Límites y Validaciones Server-Side

La función `validarLimitesDatosPersonalesServer(datos)` y la RPC en Postgres validan:

| Campo | Límite / Formato | Regla |
| :--- | :--- | :--- |
| `nombre` | 1 a 120 caracteres | Obligatorio |
| `telefono` | Máx. 20 caracteres | Formato E.164 MX (`+52...`) |
| `codigo_postal` | 5 dígitos | Regex `^[0-9]{5}$` |
| `pais` | Máx. 60 caracteres | Por defecto "México" |
| `estado` | Máx. 60 caracteres | Texto plano |
| `ciudad` | Máx. 80 caracteres | Texto plano |
| `colonia` | Máx. 80 caracteres | Texto plano |
| `calle` | Máx. 120 caracteres | Texto plano |
| `numero` | Máx. 30 caracteres | Texto plano |
| `referencias` | Máx. 300 caracteres | Opcional |
| `direccion_principal`| Máx. 500 caracteres | Concatenación formateada |
| `fecha_nacimiento` | No futura; no imposible; $\ge$ 18 años | Rechazo explícito si $> \text{current\_date}$, $< \text{1900-01-01}$, edad $> 125$, o edad $< 18$ años |
