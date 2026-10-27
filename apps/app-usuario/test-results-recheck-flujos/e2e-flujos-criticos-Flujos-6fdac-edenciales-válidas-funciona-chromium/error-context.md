# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\flujos-criticos.spec.ts >> Flujos críticos de la aplicación >> el login con credenciales válidas funciona
- Location: tests\e2e\flujos-criticos.spec.ts:98:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "domcontentloaded"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Saltar al contenido principal" [ref=e2] [cursor=pointer]:
    - /url: "#contenido-principal"
  - main [ref=e4]:
    - generic [ref=e5]:
      - generic "Barra superior de inicio de sesión" [ref=e6]:
        - link [ref=e7] [cursor=pointer]:
          - /url: /
          - img "Ruum Ruum" [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e10]: ¿Primera vez aquí?
          - link "Regístrate gratis" [ref=e11] [cursor=pointer]:
            - /url: /registro
          - button "Seleccionar idioma" [ref=e13] [cursor=pointer]:
            - generic [ref=e14]: ES
      - generic [ref=e17]:
        - region "Información de bienvenida y propuesta de valor" [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: MOVILIDAD INTELIGENTE
            - heading "Tu traslado, en orden." [level=1] [ref=e23]
            - generic [ref=e24]:
              - generic [ref=e25]: Rápido
              - generic [ref=e30]: Seguro
              - generic [ref=e36]: Confiable
          - paragraph [ref=e80]: PERSONAS • EMPRESAS • CIUDADES EN MOVIMIENTO
        - region "Formulario de inicio de sesión" [ref=e81]:
          - generic [ref=e82]:
            - generic [ref=e83]:
              - generic "Ruum Ruum" [ref=e84]:
                - img "Ruum Ruum" [ref=e85]
              - generic [ref=e86]: Ruum Ruum
              - paragraph [ref=e87]: Tu traslado, en orden.
            - generic [ref=e88]:
              - heading "Inicia sesión — Iniciar sesión | Bienvenido de nuevo" [level=2] [ref=e89]:
                - text: Inicia sesión
                - generic [ref=e90]: — Iniciar sesión | Bienvenido de nuevo
              - paragraph [ref=e91]: Accede a tu cuenta para continuar
            - generic [ref=e92]:
              - generic [ref=e93]:
                - generic [ref=e94]: Correo electrónico
                - textbox "Correo electrónico" [ref=e96]:
                  - /placeholder: lomelinhectorm@gmail.com
                  - text: usuario.e2e@correo.test
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - generic [ref=e99]: Contraseña
                  - link "¿La olvidaste?" [ref=e100] [cursor=pointer]:
                    - /url: /recuperar-password
                - generic [ref=e101]:
                  - textbox "Contraseña" [ref=e102]:
                    - /placeholder: ••••••••
                    - text: ClaveE2E123!
                  - button "Mostrar contraseña" [ref=e103] [cursor=pointer]
              - button "Iniciar sesión" [ref=e107] [cursor=pointer]
            - generic [ref=e116]:
              - paragraph [ref=e117]:
                - text: ¿No tienes cuenta?
                - link "Regístrate gratis" [ref=e118] [cursor=pointer]:
                  - /url: /registro
              - paragraph [ref=e119]:
                - text: ¿Primera vez aquí?
                - link "Conoce cómo funciona Ruum" [ref=e120] [cursor=pointer]:
                  - /url: /onboarding
            - region "Garantías de seguridad" [ref=e121]:
              - generic [ref=e122]: Datos protegidos
              - generic [ref=e127]: Cifrado TLS/SSL
              - generic [ref=e132]: Tu información segura
          - paragraph [ref=e138]:
            - text: Al continuar, aceptas nuestros
            - link "Términos y condiciones" [ref=e139] [cursor=pointer]:
              - /url: /legal/terminos
            - text: "y"
            - link "Aviso de privacidad" [ref=e140] [cursor=pointer]:
              - /url: /legal/privacidad
  - alert [ref=e142]
  - generic [ref=e149]:
    - button "Open Next.js Dev Tools" [ref=e150]
    - generic [ref=e154]:
      - button "Open issues overlay" [ref=e155]:
        - generic [ref=e156]:
          - generic [aria-hidden] [ref=e157]: "0"
          - generic [ref=e158]: "1"
        - generic [ref=e159]: Issue
      - button "Collapse issues badge" [ref=e160]
  - alert [ref=e163]
```

# Test source

```ts
  5   |   esperarHidratacion,
  6   |   rutaActual,
  7   | } from "./fixtures/navegacion";
  8   | 
  9   | /**
  10  |  * Rutas que este archivo cubre y que también existen como páginas:
  11  |  * /login · /registro · /viajes/nuevo (wizard de traslado) · /verificacion (Didit) ·
  12  |  * /soporte · /mis-viajes.
  13  |  *
  14  |  * Estas pruebas validan que la aplicación entrega el HTML que el usuario necesita:
  15  |  * que el login muestra el formulario, que el registro pide nombre+teléfono, que el
  16  |  * wizard muestra origen/destino y que las rutas privadas responden. Si la app se
  17  |  * rompe y devuelve la página vacía de error, la prueba falla.
  18  |  */
  19  | 
  20  | /**
  21  |  * T-03: las afirmaciones de redirección/autenticación validan el resultado final,
  22  |  * no el estado intermedio de un fetch. Sin sesión, la prueba exige la URL exacta
  23  |  * con su query (?next=…&reason=authentication_required); con sesión, exige que la
  24  |  * ruta resuelva al destino. Esto hace que la prueba falle si se rompe el
  25  |  * middleware o la sesión.
  26  |  */
  27  | 
  28  | /** Bloquea el endpoint de tarifas y devuelve una respuesta determinista. */
  29  | async function mockearTarifa(
  30  |   page: import("@playwright/test").Page,
  31  |   tarifa: number,
  32  |   disponible = true,
  33  | ) {
  34  |   await page.route("**/api/ruta", (route) =>
  35  |     route.fulfill({
  36  |       json: { distanciaKm: 12.5, tiempoEstimadoHoras: 0.5, tarifa },
  37  |     })
  38  |   );
  39  |   await page.route("**/rest/v1/rpc/usuario_previsualizar_tarifa", async (route) => {
  40  |     const origen = new URL(
  41  |       process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3012"}`
  42  |     ).origin;
  43  |     const headers = {
  44  |       "access-control-allow-origin": origen,
  45  |       "access-control-allow-credentials": "true",
  46  |       "access-control-allow-headers":
  47  |         route.request().headers()["access-control-request-headers"] ??
  48  |         "apikey,authorization,content-type,x-client-info,x-supabase-api-version",
  49  |       "access-control-allow-methods": "POST,OPTIONS",
  50  |     };
  51  |     if (route.request().method() === "OPTIONS") {
  52  |       await route.fulfill({ status: 204, headers, body: "" });
  53  |       return;
  54  |     }
  55  |     await route.fulfill({
  56  |       status: 200,
  57  |       headers,
  58  |       contentType: "application/json",
  59  |       json: disponible
  60  |         ? { disponible: true, tarifa, categoria: "ligero_a", gama: "media" }
  61  |         : { disponible: false, motivo: "Tarifa especial requerida" },
  62  |     });
  63  |   });
  64  |   await page.route("**/api.mapbox.com/**", (route) =>
  65  |     route.fulfill({
  66  |       status: 200,
  67  |       contentType: "application/json",
  68  |       headers: { "access-control-allow-origin": "*" },
  69  |       json: {
  70  |         features: [{
  71  |           place_name: "Ciudad de México, México",
  72  |           center: [-99.1332, 19.4326],
  73  |           geometry: { coordinates: [-99.1332, 19.4326] },
  74  |         }],
  75  |       },
  76  |     })
  77  |   );
  78  | }
  79  | 
  80  | test.describe("Flujos críticos de la aplicación", () => {
  81  |   test("la aplicación carga y el login responde", async ({ page }) => {
  82  |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  83  |     await expect(page.getByRole("heading", { name: /Inicia sesión/ })).toBeVisible();
  84  |     // formulario de acceso presente con sus campos reales
  85  |     await expect(page.locator("#login-email")).toBeVisible();
  86  |     await expect(page.locator("#login-password")).toBeVisible();
  87  |     await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  88  |   });
  89  | 
  90  |   test("el formulario de login muestra errores cuando faltan datos", async ({ page }) => {
  91  |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  92  |     await esperarHidratacion(page);
  93  |     await page.getByRole("button", { name: "Iniciar sesión" }).click();
  94  |     // validación del lado del cliente: el usuario ve qué falta
  95  |     await expect(page.getByText("Introduce tu correo electrónico.")).toBeVisible();
  96  |   });
  97  | 
  98  |   test("el login con credenciales válidas funciona", async ({ page }) => {
  99  |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  100 |     await esperarHidratacion(page);
  101 |     await page.locator("#login-email").fill("usuario.e2e@correo.test");
  102 |     await page.locator("#login-password").fill("ClaveE2E123!");
  103 |     await page.getByRole("button", { name: "Iniciar sesión" }).click();
  104 | 
> 105 |     await page.waitForURL("/", { timeout: 30_000, waitUntil: "domcontentloaded" });
      |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  106 |     expect(await rutaActual(page)).toBe("/");
  107 |   });
  108 | 
  109 |   test("el login con credenciales inválidas muestra un mensaje claro", async ({ page }) => {
  110 |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  111 |     await esperarHidratacion(page);
  112 |     await page.locator("#login-email").fill("no-existe@correo.test");
  113 |     await page.locator("#login-password").fill("ClaveIncorrecta123");
  114 |     await page.getByRole("button", { name: "Iniciar sesión" }).click();
  115 | 
  116 |     await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible({ timeout: 30_000 });
  117 |   });
  118 | 
  119 |   test("el registro de usuario muestra el formulario con los campos correctos", async ({ page }) => {
  120 |     await page.goto("/registro", { waitUntil: "domcontentloaded" });
  121 |     // formulario de registro: nombre, apellido y teléfono
  122 |     await expect(page.locator("h1")).toContainText("Crear cuenta");
  123 |     await expect(page.locator("#nombre")).toBeVisible();
  124 |     await expect(page.locator("#apellido")).toBeVisible();
  125 |     await expect(page.locator("#telefono")).toBeVisible();
  126 |   });
  127 | 
  128 |   test("el registro valida el formato del teléfono antes de avanzar", async ({ page }) => {
  129 |     await page.goto("/registro", { waitUntil: "domcontentloaded" });
  130 |     await esperarHidratacion(page);
  131 | 
  132 |     await page.locator("#nombre").fill("Persona");
  133 |     await page.locator("#apellido").fill("E2E");
  134 |     await page.locator("#telefono").fill("123");
  135 |     await page.getByRole("button", { name: "Continuar" }).click();
  136 | 
  137 |     await expect(page.getByText("El teléfono debe tener 10 dígitos.")).toBeVisible();
  138 |   });
  139 | 
  140 |   test("el registro completa el OTP y avanza a credenciales", async ({ page }) => {
  141 |     // Sin bypass en build de producción: el OTP se intercepta en la red.
  142 |     // El mock del dev server (123456) está desactivado cuando NODE_ENV=production,
  143 |     // así que sin este route la prueba fallaría en CI.
  144 |     await page.route("**/api/auth/phone-verify/send", (route) => route.fulfill({ json: { ok: true } }));
  145 |     await page.route("**/api/auth/phone-verify/verify", (route) => route.fulfill({ json: { ok: true, token: "e2e-otp-token" } }));
  146 |     await page.route("**/api/auth/signup", (route) =>
  147 |       route.fulfill({
  148 |         json: {
  149 |           ok: true,
  150 |           requiereConfirmacion: true,
  151 |           correo: "persona.e2e@correo.test",
  152 |           user: { id: "e2e-user-id", email: "persona.e2e@correo.test" },
  153 |         },
  154 |       })
  155 |     );
  156 | 
  157 |     await page.goto("/registro", { waitUntil: "domcontentloaded" });
  158 |     await esperarHidratacion(page);
  159 | 
  160 |     await page.locator("#nombre").fill("Persona");
  161 |     await page.locator("#apellido").fill("E2E");
  162 |     await page.locator("#telefono").fill("5512345678");
  163 |     await page.getByRole("button", { name: "Continuar" }).click();
  164 | 
  165 |     // Con la verificación telefónica suspendida avanza directo a credenciales;
  166 |     // si el modal de OTP está activo, se completa el código antes de continuar.
  167 |     await expect(
  168 |       page.getByText("Elige tus credenciales").or(page.getByRole("dialog"))
  169 |     ).toBeVisible();
  170 |     if (await page.getByRole("dialog").isVisible()) {
  171 |       await expect(page.getByRole("dialog")).toContainText("Verifica tu número celular");
  172 |       await page.locator("#codigo-sms").fill("123456");
  173 |       await page.getByRole("button", { name: "Verificar y continuar" }).click();
  174 |     }
  175 | 
  176 |     // paso 2: credenciales — el wizard de registro pide email y contraseña
  177 |     await expect(page.getByText("Elige tus credenciales")).toBeVisible({ timeout: 15_000 });
  178 |     await page.locator("#email").fill("persona.e2e@correo.test");
  179 |     await expect(page.locator("#password")).toBeVisible();
  180 | 
  181 |     // una contraseña débil explica exactamente qué falta
  182 |     await page.locator("#password").fill("debil");
  183 |     await page.locator("#password").blur();
  184 |     await expect(page.locator("#password-requisitos")).toContainText("Una mayúscula");
  185 |   });
  186 | 
  187 |   test("el registro con datos válidos envía a la pantalla de confirmación", async ({ page }) => {
  188 |     await page.route("**/api/auth/phone-verify/send", (route) => route.fulfill({ json: { ok: true } }));
  189 |     await page.route("**/api/auth/phone-verify/verify", (route) => route.fulfill({ json: { ok: true, token: "e2e-otp-token" } }));
  190 |     await page.route("**/api/auth/signup", (route) =>
  191 |       route.fulfill({
  192 |         json: {
  193 |           ok: true,
  194 |           requiereConfirmacion: true,
  195 |           correo: "persona.e2e@correo.test",
  196 |           user: { id: "e2e-user-id", email: "persona.e2e@correo.test" },
  197 |         },
  198 |       })
  199 |     );
  200 | 
  201 |     await page.goto("/registro", { waitUntil: "domcontentloaded" });
  202 |     await esperarHidratacion(page);
  203 |     await page.locator("#nombre").fill("Persona");
  204 |     await page.locator("#apellido").fill("E2E");
  205 |     await page.locator("#telefono").fill("5512345678");
```