# Tokens: inventario completo y contraste

Fuente: packages/ui/src/styles/tokens.css. La fixture usa exclusivamente los tokens base, sin contrast-tokens.css de app-usuario. @theme static conserva las variables no usadas para poder medirlas; no cambia valores.

## Inventario de los 180 tokens

Contraste no aplica a dimensiones, espacios, tipografía, radio, sombras o tiempos. Un color destinado a fondo no tiene que servir como texto. Se separan pares semánticos reales y aptitud hipotética como primer plano.

| Token | Fuente (línea: valor) | Light calculado | Dark calculado | Tipo |
|---|---|---|---|---|
| `--color-action-primary` | 52: var(--ruum-action-primary) | #0066ff | #4d94ff | color |
| `--color-action-primary-active` | 54: var(--ruum-action-primary-active) | #0043a8 | #6ba8ff | color |
| `--color-action-primary-hover` | 53: var(--ruum-action-primary-hover) | #0052cc | #6ba8ff | color |
| `--color-asphalt` | 23: #0a2342; 394: #0a2342 | #0a2342 | #0a2342 | color |
| `--color-border` | 50: var(--ruum-border) | #e6f0ff | #1a3a5c | color |
| `--color-border-strong` | 51: var(--ruum-border-strong) | #7a8dae | #2d4f73 | color |
| `--color-control` | 32: #16805a; 403: #4dd9a3 | #16805a | #4dd9a3 | color |
| `--color-control-soft` | 33: #e6f6ee; 404: #0a2e1f | #e6f6ee | #0a2e1f | color |
| `--color-danger` | 36: #c23648; 407: #ff6b7a | #c23648 | #ff6b7a | color |
| `--color-danger-action` | 60: var(--ruum-danger) | #c23648 | #c23648 | color |
| `--color-danger-action-active` | 62: var(--ruum-danger-active) | #86232f | #86232f | color |
| `--color-danger-action-hover` | 61: var(--ruum-danger-hover) | #a32c3c | #a32c3c | color |
| `--color-danger-soft` | 37: #fdecef; 408: #3d0f1a | #fdecef | #3d0f1a | color |
| `--color-disabled` | 43: var(--ruum-text-disabled) | #7a8dae | #6b7a99 | color |
| `--color-evidence` | 72: var(--color-mist-dim) | #e8eef4 | #061529 | color |
| `--color-focus` | 67: var(--ruum-focus) | #0066ff | #4d94ff | color |
| `--color-ink` | 21: #0a2342; 392: #f6f8fb | #0a2342 | #f6f8fb | color |
| `--color-ink-soft` | 22: #566889; 393: #a8b5cc | #566889 | #a8b5cc | color |
| `--color-mist` | 25: #ffffff; 396: #0a2342 | #ffffff | #0a2342 | color |
| `--color-mist-dim` | 26: #e8eef4; 397: #061529 | #e8eef4 | #061529 | color |
| `--color-navy` | 17: #0a2342 | #0a2342 | #0a2342 | color |
| `--color-ok` | 73: var(--color-control) | #16805a | #4dd9a3 | color |
| `--color-ok-soft` | 74: var(--color-control-soft) | #e6f6ee | #0a2e1f | color |
| `--color-on-danger` | 64: var(--ruum-on-danger) | #ffffff | #ffffff | color |
| `--color-on-primary` | 63: var(--ruum-on-primary) | #ffffff | #061529 | color |
| `--color-overlay` | 66: var(--ruum-overlay) | rgba(10, 35, 66, 0.6) | rgba(0, 0, 0, 0.7) | color |
| `--color-paper` | 70: var(--color-mist) | #ffffff | #0a2342 | color |
| `--color-paper-dim` | 71: var(--color-mist-dim) | #e8eef4 | #061529 | color |
| `--color-primary` | 40: var(--ruum-text-primary) | #0a2342 | #f6f8fb | color |
| `--color-route` | 29: #0066ff; 400: #4d94ff | #0066ff | #4d94ff | color |
| `--color-route-action` | 55: var(--ruum-route-action, var(--ruum-route)) | #1461e0 | #4d94ff | color |
| `--color-route-action-active` | 57: var(--ruum-route-active) | #0043a8 | #6ba8ff | color |
| `--color-route-action-hover` | 56: var(--ruum-route-hover) | #0052cc | #6ba8ff | color |
| `--color-route-dark` | 30: #0043a8; 401: #6ba8ff | #0043a8 | #6ba8ff | color |
| `--color-route-soft` | 31: #e8f0fe; 402: #0f2d52 | #e8f0fe | #0f2d52 | color |
| `--color-secondary` | 41: var(--ruum-text-secondary) | #566889 | #a8b5cc | color |
| `--color-signal` | 27: #00d1d1; 398: #00d1d1 | #00d1d1 | #00d1d1 | color |
| `--color-signal-soft` | 28: #e8f0fe; 399: #0f2d52 | #e8f0fe | #0f2d52 | color |
| `--color-steel` | 24: #566889; 395: #a8b5cc | #566889 | #a8b5cc | color |
| `--color-success` | 58: var(--ruum-success) | #16805a | #4dd9a3 | color |
| `--color-surface` | 48: var(--ruum-surface) | #ffffff | #0a2342 | color |
| `--color-surface-elevated` | 49: var(--ruum-surface-elevated) | #e8eef4 | #0f2d52 | color |
| `--color-surface-muted` | 65: var(--ruum-surface-subtle) | #eef2f8 | #0f2d52 | color |
| `--color-teal-deep` | 20: #007575 | #007575 | #007575 | color |
| `--color-tertiary` | 42: var(--ruum-text-tertiary) | #566889 | #a8b5cc | color |
| `--color-text-disabled` | 47: var(--ruum-text-disabled) | #7a8dae | #6b7a99 | color |
| `--color-text-primary` | 44: var(--ruum-text-primary) | #0a2342 | #f6f8fb | color |
| `--color-text-secondary` | 45: var(--ruum-text-secondary) | #566889 | #a8b5cc | color |
| `--color-text-tertiary` | 46: var(--ruum-text-tertiary) | #566889 | #a8b5cc | color |
| `--color-warn` | 34: #f5b400; 405: #ffc933 | #f5b400 | #ffc933 | color |
| `--color-warn-soft` | 35: #fff4d6; 406: #3d2e00 | #fff4d6 | #3d2e00 | color |
| `--color-warning` | 59: var(--ruum-warning) | #f5b400 | #ffc933 | color |
| `--font-body` | 77: var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif | sin valor en este tema | sin valor en este tema | no color / sin resolver |
| `--font-display` | 76: var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif | sin valor en este tema | sin valor en este tema | no color / sin resolver |
| `--font-mono-ruum` | 78: var(--font-mono-loaded), "IBM Plex Mono", ui-monospace, monospace | sin valor en este tema | sin valor en este tema | no color / sin resolver |
| `--radius-card` | 80: 1rem | 1rem | 1rem | no color / sin resolver |
| `--ruum-action` | 199: #0066ff; 291: #4d94ff; 429: #0066ff | #0066ff | #4d94ff | color |
| `--ruum-action-active` | 201: #0043a8; 293: #6ba8ff | #0043a8 | #6ba8ff | color |
| `--ruum-action-bg` | 152: #e8f0fe; 301: #0f2d52; 430: #e8f0fe | #e8f0fe | #0f2d52 | color |
| `--ruum-action-hover` | 200: #0052cc; 292: #6ba8ff | #0052cc | #6ba8ff | color |
| `--ruum-action-primary` | 227: #0066ff; 345: #4d94ff | #0066ff | #4d94ff | color |
| `--ruum-action-primary-active` | 232: #0043a8; 347: #6ba8ff | #0043a8 | #6ba8ff | color |
| `--ruum-action-primary-hover` | 231: #0052cc; 346: #6ba8ff | #0052cc | #6ba8ff | color |
| `--ruum-action-text` | 153: #1461e0; 302: #6ba8ff; 431: #1461e0 | #1461e0 | #6ba8ff | color |
| `--ruum-blue` | 148: #0066ff; 290: #4d94ff | #0066ff | #4d94ff | color |
| `--ruum-border` | 209: #e6f0ff; 297: #1a3a5c; 425: #e6f0ff; 474: #2d4f73 | #e6f0ff | #1a3a5c | color |
| `--ruum-border-input` | 211: #7a8dae; 296: #527ca8; 426: #7a8dae; 475: #4a6b8f | #7a8dae | #527ca8 | color |
| `--ruum-border-strong` | 210: #7a8dae; 339: #2d4f73; 469: #566889 | #7a8dae | #2d4f73 | color |
| `--ruum-brand` | 196: #00d1d1; 341: #00d1d1 | #00d1d1 | #00d1d1 | color |
| `--ruum-brand-dark` | 197: #008b8b; 342: #00b3b3 | #008b8b | #00b3b3 | color |
| `--ruum-brand-soft` | 198: #e6f6ee; 343: #0f2d52 | #e6f6ee | #0f2d52 | color |
| `--ruum-button-height` | 118: var(--ruum-button-height-street); 187: 52px | 52px | 52px | no color / sin resolver |
| `--ruum-button-height-street` | 188: 56px | 56px | 56px | no color / sin resolver |
| `--ruum-canvas` | 204: #ffffff; 321: #061529; 414: #ffffff | #ffffff | #061529 | color |
| `--ruum-danger` | 243: #c23648; 362: #c23648 | #c23648 | #c23648 | color |
| `--ruum-danger-active` | 245: #86232f; 364: #86232f | #86232f | #86232f | color |
| `--ruum-danger-hover` | 244: #a32c3c; 363: #a32c3c | #a32c3c | #a32c3c | color |
| `--ruum-dark-text-secondary` | 219: #c9cfda; 336: #a8b5cc | #c9cfda | #a8b5cc | color |
| `--ruum-dark-text-tertiary` | 220: #9aa2b5; 337: #6b7a99 | #9aa2b5 | #6b7a99 | color |
| `--ruum-elevation-1` | 183: 0 2px 10px rgba(13, 43, 94, 0.05) | 0 2px 10px rgba(13, 43, 94, 0.05) | 0 2px 10px rgba(13, 43, 94, 0.05) | no color / sin resolver |
| `--ruum-elevation-2` | 184: 0 8px 24px rgba(13, 43, 94, 0.1) | 0 8px 24px rgba(13, 43, 94, 0.1) | 0 8px 24px rgba(13, 43, 94, 0.1) | no color / sin resolver |
| `--ruum-emergency` | 247: #b3261e; 312: #ff4d3d | #b3261e | #ff4d3d | color |
| `--ruum-emergency-bg` | 160: #fdecef; 313: #3d0a05; 438: #fdecef | #fdecef | #3d0a05 | color |
| `--ruum-emergency-text` | 161: #b3261e; 314: #ff4d3d; 439: #b3261e | #b3261e | #ff4d3d | color |
| `--ruum-error` | 246: #c23648; 309: #ff6b7a | #c23648 | #ff6b7a | color |
| `--ruum-error-bg` | 158: #fdecef; 310: #3d0f1a; 436: #fdecef | #fdecef | #3d0f1a | color |
| `--ruum-error-text` | 159: #c23648; 311: #ff6b7a; 437: #c23648 | #c23648 | #ff6b7a | color |
| `--ruum-focus` | 223: #0066ff; 353: #4d94ff; 443: #0066ff | #0066ff | #4d94ff | color |
| `--ruum-focus-ring` | 224: rgba(0, 102, 255, 0.24); 354: rgba(77, 148, 255, 0.35); 458: rgba(77, 148, 255, 0.45) | rgba(0, 102, 255, 0.24) | rgba(77, 148, 255, 0.35) | color |
| `--ruum-font-body-size` | 171: 16px | 16px | 16px | no color / sin resolver |
| `--ruum-font-caption` | 173: 12px | 12px | 12px | no color / sin resolver |
| `--ruum-font-display` | 167: 40px | 40px | 40px | no color / sin resolver |
| `--ruum-font-family` | 166: "Inter", Arial, Calibri, sans-serif | "Inter", Arial, Calibri, sans-serif | "Inter", Arial, Calibri, sans-serif | no color / sin resolver |
| `--ruum-font-h1` | 168: 32px | 32px | 32px | no color / sin resolver |
| `--ruum-font-h2` | 169: 24px | 24px | 24px | no color / sin resolver |
| `--ruum-font-h3` | 170: 18px | 18px | 18px | no color / sin resolver |
| `--ruum-font-small` | 172: 14px | 14px | 14px | no color / sin resolver |
| `--ruum-gradient-action` | 233: var(--ruum-gradient-cta); 367: var(--ruum-gradient-cta); 445: var(--ruum-gradient-cta) | linear-gradient(90deg, #007575 0%, #0066ff 100%) | linear-gradient(90deg, #00b3b3 0%, #4d94ff 100%) | gradiente |
| `--ruum-gradient-cta` | 164: linear-gradient(90deg, #007575 0%, #0066ff 100%); 318: linear-gradient(90deg, #00b3b3 0%, #4d94ff 100%); 444: linear-gradient(90deg, #007575 0%, #0066ff 100%) | linear-gradient(90deg, #007575 0%, #0066ff 100%) | linear-gradient(90deg, #00b3b3 0%, #4d94ff 100%) | gradiente |
| `--ruum-gradient-highlight` | 368: linear-gradient(135deg, rgba(0, 209, 209, 0.10), rgba(77, 148, 255, 0.08)) | sin valor en este tema | linear-gradient(135deg, rgba(0, 209, 209, 0.10), rgba(77, 148, 255, 0.08)) | gradiente |
| `--ruum-gradient-route` | 165: linear-gradient(90deg, #00d1d1 0%, #0066ff 100%); 319: linear-gradient(90deg, #00d1d1 0%, #4d94ff 100%) | linear-gradient(90deg, #00d1d1 0%, #0066ff 100%) | linear-gradient(90deg, #00d1d1 0%, #4d94ff 100%) | gradiente |
| `--ruum-info` | 365: #6ba8ff | sin valor en este tema | #6ba8ff | color |
| `--ruum-input-height` | 189: 48px | 48px | 48px | no color / sin resolver |
| `--ruum-logo-bg` | 256: #ffffff; 376: #0a2342 | #ffffff | #0a2342 | color |
| `--ruum-logo-descriptor` | 258: #007575; 378: #00d1d1 | #007575 | #00d1d1 | color |
| `--ruum-logo-rr` | 255: #0a2342; 375: #ffffff | #0a2342 | #ffffff | color |
| `--ruum-logo-text` | 257: #0a2342; 377: #ffffff | #0a2342 | #ffffff | color |
| `--ruum-motion-easing` | 192: ease-out | ease-out | ease-out | no color / sin resolver |
| `--ruum-motion-micro` | 190: 150ms | 150ms | 150ms | no color / sin resolver |
| `--ruum-motion-transition` | 191: 250ms | 250ms | 250ms | no color / sin resolver |
| `--ruum-muted` | 149: #566889; 295: #a8b5cc; 335: #a8b5cc; 415: #566889 | #566889 | #a8b5cc | color |
| `--ruum-navy` | 145: #0a2342; 287: #0a2342 | #0a2342 | #0a2342 | color |
| `--ruum-neutral-bg` | 150: #eef2f8; 299: #1a2e4a; 427: #eef2f8 | #eef2f8 | #1a2e4a | color |
| `--ruum-neutral-text` | 151: #566889; 300: #a8b5cc; 428: #566889 | #566889 | #a8b5cc | color |
| `--ruum-on-danger` | 229: #ffffff; 349: #ffffff | #ffffff | #ffffff | color |
| `--ruum-on-primary` | 228: #ffffff; 348: #061529 | #ffffff | #061529 | color |
| `--ruum-overlay` | 230: rgba(10, 35, 66, 0.6); 380: rgba(0, 0, 0, 0.7); 446: rgba(10, 35, 66, 0.6) | rgba(10, 35, 66, 0.6) | rgba(0, 0, 0, 0.7) | color |
| `--ruum-primary` | 195: #0a2342; 351: #f6f8fb | #0a2342 | #f6f8fb | color |
| `--ruum-pulse` | 250: #00d1d1; 370: #00d1d1 | #00d1d1 | #00d1d1 | color |
| `--ruum-pulse-ink` | 252: #008b8b; 372: #a8b5cc | #008b8b | #a8b5cc | color |
| `--ruum-pulse-soft` | 251: #e8f0fe; 371: #0f2d52 | #e8f0fe | #0f2d52 | color |
| `--ruum-radius-2xl` | 265: 24px | 24px | 24px | no color / sin resolver |
| `--ruum-radius-button` | 267: 14px | 14px | 14px | no color / sin resolver |
| `--ruum-radius-card` | 269: 20px | 20px | 20px | no color / sin resolver |
| `--ruum-radius-field` | 268: 12px | 12px | 12px | no color / sin resolver |
| `--ruum-radius-full` | 266: 999px | 999px | 999px | no color / sin resolver |
| `--ruum-radius-lg` | 263: 16px | 16px | 16px | no color / sin resolver |
| `--ruum-radius-md` | 262: 12px | 12px | 12px | no color / sin resolver |
| `--ruum-radius-modal` | 270: 20px | 20px | 20px | no color / sin resolver |
| `--ruum-radius-sm` | 261: 8px | 8px | 8px | no color / sin resolver |
| `--ruum-radius-xl` | 264: 24px | 24px | 24px | no color / sin resolver |
| `--ruum-route` | 236: #0066ff; 356: #4d94ff | #0066ff | #4d94ff | color |
| `--ruum-route-action` | 237: #1461e0; 357: #4d94ff | sin valor en este tema | sin valor en este tema | no color / sin resolver |
| `--ruum-route-active` | 240: #0043a8; 360: #6ba8ff | #0043a8 | #6ba8ff | color |
| `--ruum-route-contrast` | 238: #0043a8; 358: #6ba8ff | #0043a8 | #6ba8ff | color |
| `--ruum-route-hover` | 239: #0052cc; 359: #6ba8ff | #0052cc | #6ba8ff | color |
| `--ruum-safety-button-bg` | 162: #b3261e; 315: #ff4d3d; 440: #b3261e | #b3261e | #ff4d3d | color |
| `--ruum-safety-button-text` | 163: #ffffff; 316: #061529; 441: #ffffff | #ffffff | #061529 | color |
| `--ruum-shadow-1` | 276: var(--ruum-elevation-1); 386: 0 2px 10px rgba(0, 0, 0, 0.3) | 0 2px 10px rgba(13, 43, 94, 0.05) | 0 2px 10px rgba(0, 0, 0, 0.3) | no color / sin resolver |
| `--ruum-shadow-2` | 277: var(--ruum-elevation-2); 387: 0 8px 24px rgba(0, 0, 0, 0.4) | 0 8px 24px rgba(13, 43, 94, 0.1) | 0 8px 24px rgba(0, 0, 0, 0.4) | no color / sin resolver |
| `--ruum-shadow-3` | 278: var(--ruum-elevation-2); 388: 0 8px 24px rgba(0, 0, 0, 0.4) | 0 8px 24px rgba(13, 43, 94, 0.1) | 0 8px 24px rgba(0, 0, 0, 0.4) | no color / sin resolver |
| `--ruum-shadow-4` | 279: 0 20px 48px rgba(13, 43, 94, 0.14); 389: 0 16px 36px rgba(0, 0, 0, 0.45) | 0 20px 48px rgba(13, 43, 94, 0.14) | 0 16px 36px rgba(0, 0, 0, 0.45) | no color / sin resolver |
| `--ruum-shadow-md` | 275: var(--ruum-elevation-2); 385: 0 8px 24px rgba(0, 0, 0, 0.4) | 0 8px 24px rgba(13, 43, 94, 0.1) | 0 8px 24px rgba(0, 0, 0, 0.4) | no color / sin resolver |
| `--ruum-shadow-sm` | 274: var(--ruum-elevation-1); 384: 0 2px 10px rgba(0, 0, 0, 0.3) | 0 2px 10px rgba(13, 43, 94, 0.05) | 0 2px 10px rgba(0, 0, 0, 0.3) | no color / sin resolver |
| `--ruum-shadow-xs` | 273: var(--ruum-elevation-1); 383: 0 2px 10px rgba(0, 0, 0, 0.3) | 0 2px 10px rgba(13, 43, 94, 0.05) | 0 2px 10px rgba(0, 0, 0, 0.3) | no color / sin resolver |
| `--ruum-space-12` | 176: 12px | 12px | 12px | no color / sin resolver |
| `--ruum-space-16` | 177: 16px | 16px | 16px | no color / sin resolver |
| `--ruum-space-20` | 178: 20px | 20px | 20px | no color / sin resolver |
| `--ruum-space-24` | 179: 24px | 24px | 24px | no color / sin resolver |
| `--ruum-space-32` | 180: 32px | 32px | 32px | no color / sin resolver |
| `--ruum-space-4` | 174: 4px | 4px | 4px | no color / sin resolver |
| `--ruum-space-40` | 181: 40px | 40px | 40px | no color / sin resolver |
| `--ruum-space-48` | 182: 48px | 48px | 48px | no color / sin resolver |
| `--ruum-space-8` | 175: 8px | 8px | 8px | no color / sin resolver |
| `--ruum-success` | 241: #16805a; 306: #4dd9a3 | #16805a | #4dd9a3 | color |
| `--ruum-success-bg` | 156: #e6f6ee; 307: #0a2e1f; 434: #e6f6ee | #e6f6ee | #0a2e1f | color |
| `--ruum-success-text` | 157: #0f6b48; 308: #4dd9a3; 435: #0f6b48 | #0f6b48 | #4dd9a3 | color |
| `--ruum-surface` | 205: #ffffff; 322: #0a2342; 416: #ffffff | #ffffff | #0a2342 | color |
| `--ruum-surface-brand` | 294: #0a2342 | sin valor en este tema | #0a2342 | color |
| `--ruum-surface-elevated` | 206: #e8eef4; 325: #0f2d52; 417: #e8eef4 | #e8eef4 | #0f2d52 | color |
| `--ruum-surface-raised` | 323: #0f2d52 | sin valor en este tema | #0f2d52 | color |
| `--ruum-surface-soft` | 324: #0f2d52 | sin valor en este tema | #0f2d52 | color |
| `--ruum-surface-strong` | 208: #0a2342; 327: #0a2342; 419: #0a2342 | #0a2342 | #0a2342 | color |
| `--ruum-surface-subtle` | 207: #eef2f8; 326: #0f2d52; 418: #eef2f8 | #eef2f8 | #0f2d52 | color |
| `--ruum-teal` | 146: #00d1d1; 288: #00d1d1 | #00d1d1 | #00d1d1 | color |
| `--ruum-teal-deep` | 147: #007575; 289: #007575; 442: #007575 | #007575 | #007575 | color |
| `--ruum-text` | 215: #0a2342; 329: #f6f8fb; 420: #0a2342 | #0a2342 | #f6f8fb | color |
| `--ruum-text-disabled` | 218: #7a8dae; 334: #6b7a99; 424: #7a8dae | #7a8dae | #6b7a99 | color |
| `--ruum-text-muted` | 333: #8293b0; 473: #a8b5cc | sin valor en este tema | #8293b0 | color |
| `--ruum-text-primary` | 214: #0a2342; 330: #f6f8fb; 421: #0a2342 | #0a2342 | #f6f8fb | color |
| `--ruum-text-secondary` | 216: #566889; 331: #a8b5cc; 422: #566889; 468: #3d4f6b; 472: #c9d5e8 | #566889 | #a8b5cc | color |
| `--ruum-text-tertiary` | 217: #566889; 332: #a8b5cc; 423: #566889 | #566889 | #a8b5cc | color |
| `--ruum-touch` | 185: 44px | 44px | 44px | no color / sin resolver |
| `--ruum-touch-street` | 186: 56px | 56px | 56px | no color / sin resolver |
| `--ruum-warning` | 242: #f5b400; 303: #ffc933 | #f5b400 | #ffc933 | color |
| `--ruum-warning-bg` | 154: #fff4d6; 304: #3d2e00; 432: #fff4d6 | #fff4d6 | #3d2e00 | color |
| `--ruum-warning-text` | 155: #7a4f00; 305: #ffc933; 433: #7a4f00 | #7a4f00 | #ffc933 | color |
| `--shadow-1` | 82: 0 1px 2px rgba(13, 43, 94, 0.04) | 0 1px 2px rgba(13, 43, 94, 0.04) | 0 1px 2px rgba(13, 43, 94, 0.04) | no color / sin resolver |
| `--shadow-2` | 83: 0 4px 12px rgba(13, 43, 94, 0.06) | 0 4px 12px rgba(13, 43, 94, 0.06) | 0 4px 12px rgba(13, 43, 94, 0.06) | no color / sin resolver |
| `--shadow-3` | 84: 0 10px 28px rgba(13, 43, 94, 0.10) | 0 10px 28px rgba(13, 43, 94, 0.10) | 0 10px 28px rgba(13, 43, 94, 0.10) | no color / sin resolver |
| `--shadow-4` | 85: 0 20px 48px rgba(13, 43, 94, 0.14) | 0 20px 48px rgba(13, 43, 94, 0.14) | 0 20px 48px rgba(13, 43, 94, 0.14) | no color / sin resolver |

## Pares y veredictos de contraste

Umbrales: texto normal 4.5:1; texto grande y UI esencial 3:1. Borde/foco se juzga como UI, no como texto. Disabled tiene exención normativa; su legibilidad sigue siendo un criterio interno del ticket. No se redondea antes de comparar.

| Tema | Primer plano | Fondo | Ratio | Normal | UI/grande | Uso/nota |
|---|---|---|---|---|---|---|
| light | `--ruum-text-primary` | `--ruum-surface` | 15.766:1 | sí | sí | texto |
| light | `--ruum-text-secondary` | `--ruum-surface` | 5.619:1 | sí | sí | texto |
| light | `--ruum-text-tertiary` | `--ruum-surface` | 5.619:1 | sí | sí | texto |
| light | `--ruum-text-disabled` | `--ruum-surface` | 3.361:1 | no | sí | disabled: exento WCAG; criterio interno |
| light | `--ruum-text-disabled` | `--ruum-neutral-bg` | 2.991:1 | no | no | disabled: exento WCAG; criterio interno |
| light | `--ruum-neutral-text` | `--ruum-neutral-bg` | 5.002:1 | sí | sí | texto |
| light | `--ruum-action-text` | `--ruum-action-bg` | 4.803:1 | sí | sí | texto |
| light | `--ruum-warning-text` | `--ruum-warning-bg` | 6.505:1 | sí | sí | texto |
| light | `--ruum-success-text` | `--ruum-success-bg` | 5.838:1 | sí | sí | texto |
| light | `--ruum-error-text` | `--ruum-error-bg` | 4.705:1 | sí | sí | texto |
| light | `--ruum-emergency-text` | `--ruum-emergency-bg` | 5.734:1 | sí | sí | texto |
| light | `--ruum-on-primary` | `--ruum-action-primary` | 4.834:1 | sí | sí | texto |
| light | `--ruum-on-danger` | `--ruum-danger` | 5.364:1 | sí | sí | texto |
| light | `--ruum-safety-button-text` | `--ruum-safety-button-bg` | 6.536:1 | sí | sí | texto |
| light | `--ruum-route` | `--ruum-surface` | 4.834:1 | sí | sí | texto |
| light | `--ruum-focus` | `--ruum-surface` | 4.834:1 | sí | sí | UI |
| light | `--ruum-border-input` | `--ruum-surface` | 3.361:1 | no | sí | UI |
| light | `--color-danger` | `--color-danger-soft` | 4.705:1 | sí | sí | texto |
| light | `--color-route-action` | `--color-route-soft` | 4.803:1 | sí | sí | texto |
| light | `ink/65` | `--ruum-surface` | 5.065:1 | sí | sí | texto |
| light | `ink/65` | `--ruum-surface-elevated` | 4.742:1 | sí | sí | texto |
| light | `ink/65` | `--color-danger-soft` | 4.815:1 | sí | sí | texto |
| light | `ink/70` | `--ruum-surface` | 5.969:1 | sí | sí | texto |
| light | `ink/70` | `--ruum-surface-elevated` | 5.528:1 | sí | sí | texto |
| light | `ink/70` | `--color-danger-soft` | 5.624:1 | sí | sí | texto |
| light | `--ruum-on-primary` | `--ruum-gradient-cta` | 4.834:1 | sí | sí | texto |
| light | `--ruum-on-primary` | `--ruum-gradient-route` | 1.902:1 | no | no | texto |
| light | `--ruum-on-primary` | `--ruum-gradient-action` | 4.834:1 | sí | sí | texto |
| dark | `--ruum-text-primary` | `--ruum-surface` | 14.819:1 | sí | sí | texto |
| dark | `--ruum-text-secondary` | `--ruum-surface` | 7.618:1 | sí | sí | texto |
| dark | `--ruum-text-tertiary` | `--ruum-surface` | 7.618:1 | sí | sí | texto |
| dark | `--ruum-text-disabled` | `--ruum-surface` | 3.655:1 | no | sí | disabled: exento WCAG; criterio interno |
| dark | `--ruum-text-disabled` | `--ruum-neutral-bg` | 3.175:1 | no | sí | disabled: exento WCAG; criterio interno |
| dark | `--ruum-neutral-text` | `--ruum-neutral-bg` | 6.616:1 | sí | sí | texto |
| dark | `--ruum-action-text` | `--ruum-action-bg` | 5.713:1 | sí | sí | texto |
| dark | `--ruum-warning-text` | `--ruum-warning-bg` | 8.592:1 | sí | sí | texto |
| dark | `--ruum-success-text` | `--ruum-success-bg` | 8.268:1 | sí | sí | texto |
| dark | `--ruum-error-text` | `--ruum-error-bg` | 5.958:1 | sí | sí | texto |
| dark | `--ruum-emergency-text` | `--ruum-emergency-bg` | 5.129:1 | sí | sí | texto |
| dark | `--ruum-on-primary` | `--ruum-action-primary` | 6.099:1 | sí | sí | texto |
| dark | `--ruum-on-danger` | `--ruum-danger` | 5.364:1 | sí | sí | texto |
| dark | `--ruum-safety-button-text` | `--ruum-safety-button-bg` | 5.563:1 | sí | sí | texto |
| dark | `--ruum-route` | `--ruum-surface` | 5.252:1 | sí | sí | texto |
| dark | `--ruum-focus` | `--ruum-surface` | 5.252:1 | sí | sí | UI |
| dark | `--ruum-border-input` | `--ruum-surface` | 3.609:1 | no | sí | UI |
| dark | `--color-danger` | `--color-danger-soft` | 5.958:1 | sí | sí | texto |
| dark | `--color-route-action` | `--color-route-soft` | 4.610:1 | sí | sí | texto |
| dark | `ink/65` | `--ruum-surface` | 6.974:1 | sí | sí | texto |
| dark | `ink/65` | `--ruum-surface-elevated` | 6.358:1 | sí | sí | texto |
| dark | `ink/65` | `--color-danger-soft` | 7.066:1 | sí | sí | texto |
| dark | `ink/70` | `--ruum-surface` | 7.871:1 | sí | sí | texto |
| dark | `ink/70` | `--ruum-surface-elevated` | 7.127:1 | sí | sí | texto |
| dark | `ink/70` | `--color-danger-soft` | 8.010:1 | sí | sí | texto |
| dark | `--ruum-on-primary` | `--ruum-gradient-cta` | 6.099:1 | sí | sí | texto |
| dark | `--ruum-on-primary` | `--ruum-gradient-route` | 6.099:1 | sí | sí | texto |
| dark | `--ruum-on-primary` | `--ruum-gradient-action` | 6.099:1 | sí | sí | texto |

La tabla completa de aptitud en tokens-calculados.json compara cada color como primer plano con canvas, surface y surface-elevated en ambos temas. No equivale a que un token de fondo deba cumplir como texto. Los gradientes se muestrean en 101 posiciones sRGB entre extremos; route-gradient no se declara defectuoso solo por una hipotética combinación con blanco si ese uso no existe.

## Tipografía y forma

- Escala declarada: display 40, h1 32, h2 24, h3 18, cuerpo 16, small 14 y caption 12 px.
- Pesos y line-height se expresan principalmente con utilidades por componente; no hay una escala semántica completa de esos dos ejes.
- Familias font-body/font-display dependen de --font-body-loaded y font-mono-ruum de --font-mono-loaded. Si faltan, las declaraciones quedan sin resolver. El showcase final no introduce un override de familia para ocultarlo. Debe comprobarse la fuente efectivamente cargada en cada app.
- Espacios: --ruum-space-4/8/12/16/20/24/32/40/48; muchos padding/gap usan utilidades y no esas variables.
- Elevaciones 1/2 y aliases --ruum-shadow-* conviven con sombras arbitrarias.
- Radios sm/md/lg/xl/2xl/full y button/field/card/modal conviven con literales y rounded-card.
- La consistencia de uso requiere co-revisión y SD-REM-009; no se cambiaron tokens para producir una aprobación.

## Controles inactivos

contraste-disabled.json registra colores calculados, opacidad y ratios en estados disabled/loading. Compone fondos sólidos y opacidad local; gradientes requieren además la tabla de tokens. Sus resultados se separan de violations de axe porque WCAG 1.4.3 exime controles inactivos. No se interpreta esa exención como aceptación automática de la exigencia interna del ticket.

[W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) · [W3C: contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
