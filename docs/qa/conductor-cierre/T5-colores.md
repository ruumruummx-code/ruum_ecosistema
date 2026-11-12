# T5 · Decisiones sobre colores fijos

No se modifican los valores de los tokens ni se agregan colores a la paleta.
Los SVG decorativos adoptan los pares semánticos del tema del conductor;
su apariencia se adapta a claro y oscuro.

| Archivo en `apps/app-conductor/src/app` | Decisión | Token o motivo |
|---|---|---|
| `viajes/TrasladosIcon.tsx` | Migrar | `surface`, `surface-secondary`, `border`, `action`, `action-active`, `action-soft`, `pending`, `primary`, `border-strong`, con prefijo `--conductor-` |
| `global-error.tsx` | Mantener | Fallo del layout raíz: el tema y las hojas de estilo pueden no estar disponibles; paleta autónoma existente |
| `viajes/OfferRoutePreview.tsx` | Migrar | El fallback es SVG del DOM: `--conductor-surface`, `success-soft`, `action`, `brand`; la imagen cartográfica remota conserva su paleta |
| `layout.tsx` | Mantener | `theme-color` es metadato del navegador y no resuelve variables CSS |
| `auth/callback/route.ts` | Mantener | HTML autónomo sin las hojas de estilo de Next; colores locales para la respuesta de autenticación |
| `viajes/[id]/MapaRutaConduccion.tsx` | Migrar | El trazo referencial es SVG del DOM: `--conductor-brand` |
| `viajes/ViajesMapa.tsx` | Migrar | El marcador es un nodo DOM y sí hereda variables: `--conductor-pending-soft`, `primary`, `shadow` |
| `registro/AccountStep.tsx` | Mantener | Bandera de México; identidad nacional independiente del tema |
| `components/ConductorNav.tsx` | Migrar | `--conductor-on-action`, eliminando el fallback hexadecimal |

Las excepciones conservadas tienen comentario junto al código. La matriz de
capturas T4 permite revisar los SVG y superficies en ambos temas. La fixture
no presenta mapas reales con coordenadas: la revisión del mapa remoto y de sus
marcadores sobre cartografía real sigue siendo una limitación de esa matriz.
