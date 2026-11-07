# Documento Normativo de Exención de Disabled (SD-REM-001)

## 1. Fundamento Legal y Normativo (WCAG 2.1)
El Criterio de Éxito 1.4.3 de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1, Nivel AA) establece textualmente en sus excepciones:
> *"Incidental: El texto o las imágenes de texto que forman parte de un componente de interfaz de usuario inactivo no tienen requisitos mínimos de contraste."*

Asimismo, la sección 508 de la Rehabilitation Act (EE.UU.) y la norma europea EN 301 549 adoptan idéntica exención para controles en estado inoperable/deshabilitado.

## 2. Postura de Producto y Diseño de Sistemas RUUM
Aunque la norma exime legalmente el contraste mínimo de 4.5:1 en elementos disabled, RUUM adopta el siguiente estándar de UX y legibilidad:
1. **Diferenciación inequívoca:** Los controles disabled utilizan `opacity: 0.55` (`disabled:opacity-55`) y `cursor: not-allowed` sobre superficies neutrales para indicar claramente la indisponibilidad al usuario vidente.
2. **Semántica asistiva:** Se garantiza siempre el atributo nativo `disabled` o `aria-disabled="true"` para que tecnologías asistivas informen del estado sin ambigüedad.
3. **Legibilidad razonable:** El token `--ruum-text-disabled` mantiene contraste de 3.2:1 en claro y 3.1:1 en oscuro sobre canvas/surface, superando el umbral de 3:1 de elementos gráficos.

## 3. Dictamen
La exención de controles deshabilitados es **legítima, estandarizada y justificada normativamente**. Se valida su aplicación en `Button`, `MobileButton`, `MobileRow`, `Input`, `Select` y `Textarea`.
