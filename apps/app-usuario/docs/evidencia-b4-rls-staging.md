# B4 — Evidencia de aislamiento RLS en staging

**13 de noviembre de 2026, 21:19, Ciudad de México. Sonda aprobada. B4 cerrado.**

| Entorno | Proyecto | Corrida |
| --- | --- | --- |
| Staging | `ruum-ruum-staging` (`ytqhzrbmiczzwzzuzgbq`) | `f7b65b66` |

| Tabla | A lee su fila | B lee su fila | A lee la fila de B | B lee la fila de A |
| --- | ---: | ---: | ---: | ---: |
| `usuarios` | 1 | 1 | 0 | 0 |
| `traslados` | 1 | 1 | 0 | 0 |
| `pagos` | 1 | 1 | 0 | 0 |
| `checkout_traslados_masivos` | 1 | 1 | 0 | 0 |

En ambas direcciones, `PATCH /rest/v1/traslados` devolvió HTTP 200 y `[]` con `Prefer: return=representation`. Cada propietario releyó su traslado con su JWT y confirmó que el nombre de contacto conservaba el valor original. Resultado de la corrida 8/8 lecturas propias, 8/8 lecturas cruzadas vacías, 2/2 escrituras cruzadas sin efecto y 0 fugas observadas.

## Preparación y credenciales

La consulta `GET /auth/v1/settings`, con la llave `anon` de staging, devolvió HTTP 200 con `disable_signup=false`, `mailer_autoconfirm=false` y `external.email=true`. El usuario autorizó la preparación administrativa de las cuentas confirmadas y sus filas sintéticas. El intento preliminar de insertar el vehículo de A con su sesión devolvió HTTP 403 (`42501`). Se prepararon los vehículos y traslados por vía administrativa, igual que los pagos y checkouts sintéticos. El traslado de A se reutilizó al completar los campos obligatorios del checkout (`idempotency_key` y `route_hash`). Los pagos son registros de prueba sin cobros de Stripe.

Para la matriz RLS se inició sesión por contraseña con la llave `anon` (`POST /auth/v1/token?grant_type=password`). Se verificaron el emisor de staging, el identificador de cada cuenta y el rol `authenticated` en ambos JWT. Todas las operaciones `GET` y `PATCH` de la matriz enviaron `apikey: <anon de staging>` y `Authorization: Bearer <JWT del actor>`. Se omiten credenciales, llaves y tokens de la evidencia.

## Consultas y salidas de la sonda

Node 24.13.0, código de salida 0. Cada registro incluye la consulta REST y su respuesta. `actor` identifica el JWT usado y `objetivo` identifica al propietario de la fila. Los identificadores pertenecen al lote sintético.

```jsonl
{"setup":"cuenta confirmada","label":"A","auth":"22370d84-5727-40fe-8dd4-5dbf183c632a","email":"qa.b4.f7b65b66.a@ruum.test"}
{"setup":"sesión validada","label":"A","http":200,"role":"authenticated","sub":"22370d84-5727-40fe-8dd4-5dbf183c632a","iss":"https://ytqhzrbmiczzwzzuzgbq.supabase.co/auth/v1"}
{"setup":"identificadores de filas","label":"A","ids":{"usuarios":"f8e05d8d-16cf-493c-b6b2-91cba370f29f","vehiculos":"382910b9-fac1-48dd-ab96-6a547d22deab","traslados":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0","pagos":"369b5f03-484f-4fbf-9074-15a89dd24874","checkout_traslados_masivos":"968fd535-9d6c-42a7-99e6-da679e8ebb63"}}
{"setup":"cuenta confirmada","label":"B","auth":"03dd969b-a489-4c91-b12d-0b5ae34c4168","email":"qa.b4.f7b65b66.b@ruum.test"}
{"setup":"sesión validada","label":"B","http":200,"role":"authenticated","sub":"03dd969b-a489-4c91-b12d-0b5ae34c4168","iss":"https://ytqhzrbmiczzwzzuzgbq.supabase.co/auth/v1"}
{"setup":"identificadores de filas","label":"B","ids":{"usuarios":"f9b5469e-24b5-4844-a654-35c6e75afb0e","vehiculos":"46c889ca-d37b-4f6d-b4ee-58a2576165d4","traslados":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c","pagos":"57314ff6-5c60-480a-9d27-6c93c6a8acfa","checkout_traslados_masivos":"0243cb36-099b-4388-a2c8-0b8908527106"}}
{"actor":"A","objetivo":"A","method":"GET","path":"/rest/v1/usuarios?id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f&select=id,auth_user_id","http":200,"body":[{"id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f","auth_user_id":"22370d84-5727-40fe-8dd4-5dbf183c632a"}]}
{"actor":"A","objetivo":"A","method":"GET","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[{"id":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0","usuario_id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f","contacto_entrega_nombre":"QA B4 f7b65b66 A"}]}
{"actor":"A","objetivo":"A","method":"GET","path":"/rest/v1/pagos?id=eq.369b5f03-484f-4fbf-9074-15a89dd24874&select=id,traslado_id","http":200,"body":[{"id":"369b5f03-484f-4fbf-9074-15a89dd24874","traslado_id":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0"}]}
{"actor":"A","objetivo":"A","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.968fd535-9d6c-42a7-99e6-da679e8ebb63&select=id,auth_user_id","http":200,"body":[{"id":"968fd535-9d6c-42a7-99e6-da679e8ebb63","auth_user_id":"22370d84-5727-40fe-8dd4-5dbf183c632a"}]}
{"actor":"A","objetivo":"B","method":"GET","path":"/rest/v1/usuarios?id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e&select=id,auth_user_id","http":200,"body":[]}
{"actor":"A","objetivo":"B","method":"GET","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[]}
{"actor":"A","objetivo":"B","method":"GET","path":"/rest/v1/pagos?id=eq.57314ff6-5c60-480a-9d27-6c93c6a8acfa&select=id,traslado_id","http":200,"body":[]}
{"actor":"A","objetivo":"B","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.0243cb36-099b-4388-a2c8-0b8908527106&select=id,auth_user_id","http":200,"body":[]}
{"actor":"A","objetivo":"B","method":"PATCH","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id,contacto_entrega_nombre","peticion":{"contacto_entrega_nombre":"Actualización cruzada B4 A"},"http":200,"body":[]}
{"actor":"B","objetivo":"B","method":"GET","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[{"id":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c","usuario_id":"f9b5469e-24b5-4844-a654-35c6e75afb0e","contacto_entrega_nombre":"QA B4 f7b65b66 B"}]}
{"actor":"B","objetivo":"B","method":"GET","path":"/rest/v1/usuarios?id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e&select=id,auth_user_id","http":200,"body":[{"id":"f9b5469e-24b5-4844-a654-35c6e75afb0e","auth_user_id":"03dd969b-a489-4c91-b12d-0b5ae34c4168"}]}
{"actor":"B","objetivo":"B","method":"GET","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[{"id":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c","usuario_id":"f9b5469e-24b5-4844-a654-35c6e75afb0e","contacto_entrega_nombre":"QA B4 f7b65b66 B"}]}
{"actor":"B","objetivo":"B","method":"GET","path":"/rest/v1/pagos?id=eq.57314ff6-5c60-480a-9d27-6c93c6a8acfa&select=id,traslado_id","http":200,"body":[{"id":"57314ff6-5c60-480a-9d27-6c93c6a8acfa","traslado_id":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c"}]}
{"actor":"B","objetivo":"B","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.0243cb36-099b-4388-a2c8-0b8908527106&select=id,auth_user_id","http":200,"body":[{"id":"0243cb36-099b-4388-a2c8-0b8908527106","auth_user_id":"03dd969b-a489-4c91-b12d-0b5ae34c4168"}]}
{"actor":"B","objetivo":"A","method":"GET","path":"/rest/v1/usuarios?id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f&select=id,auth_user_id","http":200,"body":[]}
{"actor":"B","objetivo":"A","method":"GET","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[]}
{"actor":"B","objetivo":"A","method":"GET","path":"/rest/v1/pagos?id=eq.369b5f03-484f-4fbf-9074-15a89dd24874&select=id,traslado_id","http":200,"body":[]}
{"actor":"B","objetivo":"A","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.968fd535-9d6c-42a7-99e6-da679e8ebb63&select=id,auth_user_id","http":200,"body":[]}
{"actor":"B","objetivo":"A","method":"PATCH","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id,contacto_entrega_nombre","peticion":{"contacto_entrega_nombre":"Actualización cruzada B4 B"},"http":200,"body":[]}
{"actor":"A","objetivo":"A","method":"GET","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id,contacto_entrega_nombre","http":200,"body":[{"id":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0","usuario_id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f","contacto_entrega_nombre":"QA B4 f7b65b66 A"}]}
{"result":{"own":8,"cross":8,"denied":2,"leaks":0}}
```

## Cierre

Nina verificó la evidencia, según confirmó el solicitante. Con su autorización se eliminaron las dos cuentas temporales y las diez filas del lote `f7b65b66` en `ruum-ruum-staging`. Antes de borrar, se verificaron los correos y las relaciones de propiedad de las filas. Se usó el acceso administrativo de staging para la limpieza posterior a la sonda.

Las diez lecturas de verificación devolvieron HTTP 200 con `[]`. Las dos consultas de Auth devolvieron HTTP 404 con `user_not_found`.

```jsonl
{"label":"A","method":"DELETE","path":"/rest/v1/pagos?id=eq.369b5f03-484f-4fbf-9074-15a89dd24874&select=id,traslado_id&traslado_id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0","http":200,"body":[{"id":"369b5f03-484f-4fbf-9074-15a89dd24874","traslado_id":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0"}]}
{"label":"B","method":"DELETE","path":"/rest/v1/pagos?id=eq.57314ff6-5c60-480a-9d27-6c93c6a8acfa&select=id,traslado_id&traslado_id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c","http":200,"body":[{"id":"57314ff6-5c60-480a-9d27-6c93c6a8acfa","traslado_id":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c"}]}
{"label":"A","method":"DELETE","path":"/rest/v1/checkout_traslados_masivos?id=eq.968fd535-9d6c-42a7-99e6-da679e8ebb63&select=id,auth_user_id&auth_user_id=eq.22370d84-5727-40fe-8dd4-5dbf183c632a","http":200,"body":[{"id":"968fd535-9d6c-42a7-99e6-da679e8ebb63","auth_user_id":"22370d84-5727-40fe-8dd4-5dbf183c632a"}]}
{"label":"B","method":"DELETE","path":"/rest/v1/checkout_traslados_masivos?id=eq.0243cb36-099b-4388-a2c8-0b8908527106&select=id,auth_user_id&auth_user_id=eq.03dd969b-a489-4c91-b12d-0b5ae34c4168","http":200,"body":[{"id":"0243cb36-099b-4388-a2c8-0b8908527106","auth_user_id":"03dd969b-a489-4c91-b12d-0b5ae34c4168"}]}
{"label":"A","method":"DELETE","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id&usuario_id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f","http":200,"body":[{"id":"c7c153ca-1f04-427d-9b4a-7c53fcc90ec0","usuario_id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f"}]}
{"label":"B","method":"DELETE","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id&usuario_id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e","http":200,"body":[{"id":"b3fb5b77-6e51-490d-925d-7e7495d2bf1c","usuario_id":"f9b5469e-24b5-4844-a654-35c6e75afb0e"}]}
{"label":"A","method":"DELETE","path":"/rest/v1/vehiculos?id=eq.382910b9-fac1-48dd-ab96-6a547d22deab&select=id,usuario_id&usuario_id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f","http":200,"body":[{"id":"382910b9-fac1-48dd-ab96-6a547d22deab","usuario_id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f"}]}
{"label":"B","method":"DELETE","path":"/rest/v1/vehiculos?id=eq.46c889ca-d37b-4f6d-b4ee-58a2576165d4&select=id,usuario_id&usuario_id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e","http":200,"body":[{"id":"46c889ca-d37b-4f6d-b4ee-58a2576165d4","usuario_id":"f9b5469e-24b5-4844-a654-35c6e75afb0e"}]}
{"label":"A","method":"DELETE","path":"/rest/v1/usuarios?id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f&select=id,auth_user_id&auth_user_id=eq.22370d84-5727-40fe-8dd4-5dbf183c632a","http":200,"body":[{"id":"f8e05d8d-16cf-493c-b6b2-91cba370f29f","auth_user_id":"22370d84-5727-40fe-8dd4-5dbf183c632a"}]}
{"label":"B","method":"DELETE","path":"/rest/v1/usuarios?id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e&select=id,auth_user_id&auth_user_id=eq.03dd969b-a489-4c91-b12d-0b5ae34c4168","http":200,"body":[{"id":"f9b5469e-24b5-4844-a654-35c6e75afb0e","auth_user_id":"03dd969b-a489-4c91-b12d-0b5ae34c4168"}]}
{"label":"A","method":"DELETE","path":"/auth/v1/admin/users/22370d84-5727-40fe-8dd4-5dbf183c632a","http":200}
{"label":"B","method":"DELETE","path":"/auth/v1/admin/users/03dd969b-a489-4c91-b12d-0b5ae34c4168","http":200}
{"label":"A","method":"GET","path":"/rest/v1/pagos?id=eq.369b5f03-484f-4fbf-9074-15a89dd24874&select=id,traslado_id","http":200,"body":[]}
{"label":"A","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.968fd535-9d6c-42a7-99e6-da679e8ebb63&select=id,auth_user_id","http":200,"body":[]}
{"label":"A","method":"GET","path":"/rest/v1/traslados?id=eq.c7c153ca-1f04-427d-9b4a-7c53fcc90ec0&select=id,usuario_id","http":200,"body":[]}
{"label":"A","method":"GET","path":"/rest/v1/vehiculos?id=eq.382910b9-fac1-48dd-ab96-6a547d22deab&select=id,usuario_id","http":200,"body":[]}
{"label":"A","method":"GET","path":"/rest/v1/usuarios?id=eq.f8e05d8d-16cf-493c-b6b2-91cba370f29f&select=id,auth_user_id","http":200,"body":[]}
{"label":"A","method":"GET","path":"/auth/v1/admin/users/22370d84-5727-40fe-8dd4-5dbf183c632a","http":404,"code":"user_not_found"}
{"label":"B","method":"GET","path":"/rest/v1/pagos?id=eq.57314ff6-5c60-480a-9d27-6c93c6a8acfa&select=id,traslado_id","http":200,"body":[]}
{"label":"B","method":"GET","path":"/rest/v1/checkout_traslados_masivos?id=eq.0243cb36-099b-4388-a2c8-0b8908527106&select=id,auth_user_id","http":200,"body":[]}
{"label":"B","method":"GET","path":"/rest/v1/traslados?id=eq.b3fb5b77-6e51-490d-925d-7e7495d2bf1c&select=id,usuario_id","http":200,"body":[]}
{"label":"B","method":"GET","path":"/rest/v1/vehiculos?id=eq.46c889ca-d37b-4f6d-b4ee-58a2576165d4&select=id,usuario_id","http":200,"body":[]}
{"label":"B","method":"GET","path":"/rest/v1/usuarios?id=eq.f9b5469e-24b5-4844-a654-35c6e75afb0e&select=id,auth_user_id","http":200,"body":[]}
{"label":"B","method":"GET","path":"/auth/v1/admin/users/03dd969b-a489-4c91-b12d-0b5ae34c4168","http":404,"code":"user_not_found"}
```
