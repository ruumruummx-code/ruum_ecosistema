# MobileButton

Botón móvil para una acción, con variantes `primary`, `secondary`, `quiet` y `danger`. Admite atributos nativos de botón, `children`, `loading`, `disabled`, `icon`, `iconRight`, `fullWidth` y `stickyBottom`.

```tsx
<MobileButton loading={enviando} onClick={enviar}>
  Enviar reporte
</MobileButton>
```

Durante `loading` conserva el contenido visible y su nombre accesible, añade un spinner decorativo `aria-hidden="true"`, se deshabilita y expone `aria-busy="true"`. Los iconos laterales se retiran temporalmente. Al terminar recupera los iconos y su disponibilidad, salvo que `disabled` continúe activo.

SD-REM-003 adopta la conservación del contenido de la opción A, manteniéndolo **visible** para que también se identifique la acción en curso. No añade texto duplicado `sr-only` ni genera otro `aria-label`. Los nombres explícitos del consumidor mediante `aria-label` o `aria-labelledby` mantienen la precedencia nativa de ARIA; conviene usarlos solo cuando aporten información necesaria y sean coherentes con el texto visible.

El componente no cambia el nombre por sí mismo. Para conservarlo durante todo el ciclo, el consumidor debe mantener también sus `children` y cualquier etiqueta explícita. Un `aria-busy={false}` externo no puede desactivar el estado de carga real; fuera de carga se respeta el valor externo.

Uso incorrecto:

```tsx
<MobileButton loading>{/* sin texto ni nombre explícito */}</MobileButton>
```

El spinner no sustituye una etiqueta. Tampoco debe darse un nombre que contradiga la acción visible.

`aria-busy` expone el estado, pero su anuncio hablado depende de la tecnología de asistencia. No se añade una región viva genérica: el consumidor debe anunciar resultados o errores según su flujo. La verificación con NVDA/VoiceOver y la revisión de tokens SD-REM-001 siguen sus gates independientes. La emulación táctil no certifica lectura en un dispositivo físico.
