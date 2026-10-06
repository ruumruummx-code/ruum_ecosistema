SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict urfMcyAiPJOqNLIngqJqjteeqbeuRmd9FF2RURSdiSRYgM8j4nH7oxlSklZc6f1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6
SET session_replication_role = 'replica';

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '8e573a3f-6ac2-4592-97a3-db187982b367', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"lomelinhectorm@gmail.com","user_id":"1fae6a1e-23f3-4d9b-b1c6-8d16ee7c6564","user_phone":""}}', '2026-10-04 12:48:14.83105+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '1fae6a1e-23f3-4d9b-b1c6-8d16ee7c6564', 'authenticated', 'authenticated', 'lomelinhectorm@gmail.com', '$2a$10$U0/6Ul8TB01iE/5D2WSQdeAUfR5RzIPN0pC2rPoWvdzK4WvOiPX7q', '2026-10-04 12:48:14.834035+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-10-04 12:48:14.822535+00', '2026-10-04 12:48:14.839875+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('1fae6a1e-23f3-4d9b-b1c6-8d16ee7c6564', '1fae6a1e-23f3-4d9b-b1c6-8d16ee7c6564', '{"sub": "1fae6a1e-23f3-4d9b-b1c6-8d16ee7c6564", "email": "lomelinhectorm@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-10-04 12:48:14.82909+00', '2026-10-04 12:48:14.829141+00', '2026-10-04 12:48:14.829141+00', '8c31fe95-485b-4bb7-a8a2-06052aba8798');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: politica_asignacion; Type: TABLE DATA; Schema: private; Owner: postgres
--

INSERT INTO "private"."politica_asignacion" ("id", "version", "ventana_solicitud_segundos", "tolerancia_puntualidad_min", "velocidad_aproximacion_kmh", "ubicacion_requerida_programados", "muestra_minima_puntualidad", "actualizado_en") VALUES
	(true, 1, 60, 15, 35.00, false, 5, '2026-10-04 12:44:15.281143+00');


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admins" ("id", "auth_user_id", "nombre", "creado_en", "rol_operativo") VALUES
	('00000000-0000-4000-8000-000000000001', NULL, 'Sistema ┬À Verificaci├│n autom├ítica Didit', '2026-10-04 12:44:14.928381+00', 'operador');


--
-- Data for Name: admin_capacidades; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conductores; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: operaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payouts_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sla_reglas_operativas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sla_reglas_operativas" ("id", "tipo_alerta", "tipo_servicio", "cliente_segmento", "horas_limite", "umbral_alerta_pct", "zona_horaria", "pausa_fuera_horario", "prioridad", "severidad_base", "activo", "creado_en", "actualizado_en") VALUES
	('f0d1d33d-1455-4acd-9987-1417ae394bc7', 'cuenta_nueva_usuario', 'general', 'general', 2.00, 80, 'America/Mexico_City', true, 60, 'media', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('fd3e1de7-096a-4f46-857b-f2548723b0fd', 'documentos_usuario', 'general', 'general', 4.00, 80, 'America/Mexico_City', true, 65, 'alta', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('4b6a49c3-c763-493e-882c-7c882c2a6fbc', 'conductor_primera_vez', 'general', 'general', 24.00, 80, 'America/Mexico_City', true, 55, 'media', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('13825c5d-ceef-4866-b127-53fc91047957', 'documentos_conductor', 'general', 'general', 24.00, 80, 'America/Mexico_City', true, 65, 'alta', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('1e4984ba-78c8-42e0-be32-1f6c31813753', 'traslado_sin_conductor', 'general', 'general', 2.00, 80, 'America/Mexico_City', true, 75, 'alta', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('e764a9b0-5c23-47e8-9902-3fd1c96c854a', 'conductor_sin_senal', 'general', 'general', 1.50, 80, 'America/Mexico_City', true, 80, 'alta', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('81c32032-c289-478a-b573-43a72b9a7fc8', 'incidencia_sin_responsable', 'general', 'general', 1.00, 80, 'America/Mexico_City', true, 70, 'media', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('e74d06d8-718e-4ddd-ba62-004c702dbadb', 'desviacion_ruta', 'general', 'general', 1.00, 80, 'America/Mexico_City', true, 85, 'alta', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00'),
	('a7ae3c1d-1b75-4e87-9b0b-cd27bdb34cb6', 'emergencia', 'general', 'general', 0.25, 1, 'America/Mexico_City', true, 100, 'critica', true, '2026-10-04 12:44:14.758909+00', '2026-10-04 12:44:14.758909+00');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehiculos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: traslados; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: alertas_sla_operacionales; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: alertas_sla_historial; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: asignaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: auditoria_admin_seguridad; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calificaciones_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cargas_traslados_masivos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: catalogo_vehiculos_tarifa; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."catalogo_vehiculos_tarifa" ("id", "marca", "modelo", "categoria_tarifa", "gama") VALUES
	('21a391d7-aeb4-4d39-b34b-e0318bdd72a6', 'Porsche', 'Panamera', 'ligero_a', 'alta'),
	('f10dfd4e-f2c7-49eb-8e1c-623d6a881c9a', 'Porsche', 'Taycan', 'ligero_a', 'alta'),
	('6c93736f-9639-4e07-b0a6-3e74c9e77832', 'Acura', 'Tsx 3.5l', 'ligero_a', 'alta'),
	('e9ae7619-7457-4852-a7da-de39e555c825', 'Acura', 'ILX', 'ligero_a', 'alta'),
	('b33ace8a-d394-4052-8cfb-311122860caa', 'Acura', 'INTEGRA', 'ligero_a', 'alta'),
	('05ad30de-ec21-4724-a896-4a1a65e8ca3a', 'Acura', 'TLX', 'ligero_a', 'alta'),
	('e6fdaa91-f862-4ad8-b64d-cb28b15b5872', 'Acura', 'Tl 3.5l', 'ligero_a', 'alta'),
	('6efe085d-14d2-4fd1-8472-ad2320c70236', 'Acura', 'Tl 3.7l', 'ligero_a', 'alta'),
	('5b32f875-0d48-4593-a2e2-a8b6b892d632', 'Acura', 'Rl', 'ligero_a', 'alta'),
	('4250b4de-feae-491e-9fe3-e2a304f68b04', 'Acura', 'Rlx', 'ligero_a', 'alta'),
	('fec5c57f-b7db-40aa-9a25-87ff0d9ba6a9', 'Acura', 'TSX 2.4L', 'ligero_a', 'alta'),
	('3be994ad-4dd7-44c0-9e37-7437fe40626e', 'Alfa Romeo', '4C', 'ligero_a', 'alta'),
	('a8d4f58e-24b8-4941-ba60-8efdb7a65a40', 'Alfa Romeo', 'Alfa Romeo 159 2.2 Jts Sport Plus Selespeed', 'ligero_a', 'alta'),
	('fc2cac4a-5d3b-4abd-bc82-b042a0b0d3d2', 'Alfa Romeo', 'Alfa Romeo 159 3.2 Sport Plus Awd Automatico', 'ligero_a', 'alta'),
	('bf31a908-354c-499a-a0d1-6f13eda43561', 'Alfa Romeo', 'Giulia', 'ligero_a', 'alta'),
	('ae513eda-9b99-4a83-8f9d-6082f4808d73', 'Alfa Romeo', 'Stelvio', 'ligero_a', 'alta'),
	('65b002fe-71c7-47d3-b5de-5c24c19451e3', 'Alfa Romeo', 'Alfa Romeo Mito Quadrifoglio Verde Manual', 'ligero_a', 'alta'),
	('0472db8e-8ad5-466a-8552-35197836ee21', 'Alfa Romeo', 'Alfa Romeo Giulietta Progression Manual', 'ligero_a', 'alta'),
	('bfc00d64-7d4b-4775-8a69-6bdb9c3894ed', 'Audi', 'A 1 1.4T', 'ligero_a', 'alta'),
	('8359360a-40b8-4502-8f40-6a69a8fba370', 'Audi', 'A1', 'ligero_a', 'alta'),
	('37e4400f-23e0-49bd-b1e0-c75f404fde42', 'Audi', 'A3 Sed├ín', 'ligero_a', 'alta'),
	('1d1b8286-f9d2-43c4-bea4-1d681a380154', 'Audi', 'A3-', 'ligero_a', 'alta'),
	('1907732d-d616-40e8-ad0e-8699f0ecc600', 'Audi', 'A4', 'ligero_a', 'alta'),
	('cc82d6c7-2106-467f-a35e-91590c9aa5b1', 'Audi', 'A4 1.8 Cabrio', 'ligero_a', 'alta'),
	('6a4ba111-92a5-411c-9062-909de211b266', 'Audi', 'A4 1.8T', 'ligero_a', 'alta'),
	('ab089239-fdbb-4e4c-a7ce-b92736934bf4', 'Audi', 'A4 2.0', 'ligero_a', 'alta'),
	('e11435bf-384b-4249-aeeb-bf512a0b3e5f', 'Audi', 'A4 2.0 Cabrio', 'ligero_a', 'alta'),
	('47cf34fc-6458-42b5-ad6d-ca0b07298e40', 'Audi', 'A4 3.0', 'ligero_a', 'alta'),
	('0ede6c0c-15ed-4df1-96cb-3e5c19a96458', 'Audi', 'A4 3.0 Cabrio', 'ligero_a', 'alta'),
	('fcabd768-f2ce-499d-87cd-ade83a792f96', 'Audi', 'A4 3.2', 'ligero_a', 'alta'),
	('9a1bff99-35fd-466d-a7c1-39d0f5ef1143', 'Audi', 'A5', 'ligero_a', 'alta'),
	('dee8a060-95a4-40a3-a9a5-a009122a4a52', 'Audi', 'A5 2.0', 'ligero_a', 'alta'),
	('3ad3a163-458e-48fa-a3ed-52a2651d3828', 'Audi', 'A5 3.2', 'ligero_a', 'alta'),
	('65775fff-b365-4809-95ca-6d399324cc27', 'Audi', 'A5 Cabrio', 'ligero_a', 'alta'),
	('2c9a98af-cc09-4b79-b3eb-e00593103cb6', 'Audi', 'A5 Coupe', 'ligero_a', 'alta'),
	('809dd84b-4060-4ad7-b7e5-7c1d242ee64c', 'Audi', 'A5 Sed├ín', 'ligero_a', 'alta'),
	('ed7f1f8f-e27c-4b43-8df5-f061390c40d2', 'Audi', 'A6', 'ligero_a', 'alta'),
	('cac9735f-e552-4da8-8b4d-a3f00e8b835b', 'Audi', 'A6 2.7 Biturbo', 'ligero_a', 'alta'),
	('52cc357d-e2e9-4d52-8251-a1b46da283e7', 'Audi', 'A6 2.8', 'ligero_a', 'alta'),
	('0b5d856a-95e7-46ac-b792-1e2fb7f00390', 'Audi', 'A6 3.0', 'ligero_a', 'alta'),
	('03af84da-f002-4719-b3bc-dce0736886fa', 'Audi', 'A6 3.2', 'ligero_a', 'alta'),
	('1e256756-6581-4b85-80e4-5e425ae24382', 'Audi', 'A6 4.2', 'ligero_a', 'alta'),
	('4fbcb166-38f1-46e7-8902-4e57c618811f', 'Audi', 'A7', 'ligero_a', 'alta'),
	('8ca32061-6b77-4238-b44b-26ce085cdb9d', 'Audi', 'A8', 'ligero_a', 'alta'),
	('ec86f013-d635-4729-a5e3-7f77c4af88b7', 'Audi', 'A8 4.2', 'ligero_a', 'alta'),
	('ffff0eb7-fefa-4354-8526-fc5065d69773', 'Audi', 'Q6 etron', 'ligero_a', 'alta'),
	('e0ee3385-f82a-457a-aec0-c0746b63d507', 'Audi', 'R8', 'ligero_a', 'alta'),
	('823379b1-0af4-46b4-8e74-886341077267', 'Audi', 'R8 Spyder', 'ligero_a', 'alta'),
	('8d13b401-b01f-4b5b-a142-f81048b912cc', 'Audi', 'RS 6', 'ligero_a', 'alta'),
	('7806b184-a176-4a4d-8c58-7520ed47e6fd', 'Audi', 'RS4 4.2', 'ligero_a', 'alta'),
	('2f50d1c4-739e-4758-a4f3-920ab0a4eaa6', 'Audi', 'RS5 4.2', 'ligero_a', 'alta'),
	('109ae493-e6f6-47f3-aff4-404501360569', 'Audi', 'RS6 Avant', 'ligero_a', 'alta'),
	('56c0ae69-11e6-4df7-8693-f45ebddc47f5', 'Audi', 'RS6 Sedan', 'ligero_a', 'alta'),
	('0e46e09b-b6fd-4186-9376-55a80b1754b4', 'Audi', 'S3 2.0', 'ligero_a', 'alta'),
	('d85f9bf5-316f-4c94-9e21-5997b590c067', 'Audi', 'S4 3.0', 'ligero_a', 'alta'),
	('e8eef06c-cb63-4146-8270-fb7b694ae4dc', 'Audi', 'S4 4.2', 'ligero_a', 'alta'),
	('cc1b73c7-b5ac-4591-b7be-928e3d7da2c5', 'Audi', 'S5 4.2', 'ligero_a', 'alta'),
	('5378bcf3-aa02-493e-ae82-27308128bf8e', 'Audi', 'S6', 'ligero_a', 'alta'),
	('af5f2686-c41c-4149-9669-596451395205', 'Audi', 'S8', 'ligero_a', 'alta'),
	('7f1f206e-a5aa-4049-acf3-0db2d0ed5008', 'Audi', 'Sportback', 'ligero_a', 'alta'),
	('a00f63fd-f74c-488e-9016-e2ff5c05dbdf', 'Audi', 'TTRS Coupe', 'ligero_a', 'alta'),
	('9d80e984-f3ec-4c13-9087-fe4ce3763b87', 'Audi', 'TTS Coupe', 'ligero_a', 'alta'),
	('ae7cbf2d-f4f1-4790-93c5-f6b1785c3428', 'Audi', 'TTS Roadster', 'ligero_a', 'alta'),
	('d53a5237-a844-4863-a1bf-48b1dca90fcc', 'Audi', 'S4 4.2 Cabrio', 'ligero_a', 'alta'),
	('596ec0db-3c87-47b3-ad80-d1c1d3d2698d', 'Audi', 'A1-', 'ligero_a', 'alta'),
	('e10c7792-271c-485f-a9ed-e87e7019be98', 'Audi', 'A3', 'ligero_a', 'alta'),
	('c4e52cc2-a46a-422f-9302-ffe2e9765081', 'Audi', 'Q2', 'ligero_a', 'alta'),
	('11e556e8-a910-436d-b900-db2608241598', 'Audi', 'A1*', 'ligero_a', 'alta'),
	('27209a21-2283-41df-bcaa-d4284159bf28', 'Audi', 'A3 Cabrio', 'ligero_a', 'alta'),
	('ff7ada1a-4218-4acb-b6ad-39d7a75c07a1', 'Audi', 'Q3', 'ligero_a', 'alta'),
	('2d104e9f-c4e2-4116-91ac-63e0b6916415', 'Audi', 'TT Coupe', 'ligero_a', 'alta'),
	('52f3865c-f555-41dd-a1f9-c181071fecd6', 'Audi', 'TT Roadster', 'ligero_a', 'alta'),
	('5aae870b-e5ca-4202-974c-49fff939a8ee', 'Audi', 'A5 2.0T Sportback', 'ligero_a', 'alta'),
	('7ac85de7-9ac2-4c40-8b94-88cde6d008f2', 'Audi', 'A5 3.2 Sportback', 'ligero_a', 'alta'),
	('8caaf89a-b8fc-422a-ad3e-b507948aacf8', 'Audi', 'A5 Sportback', 'ligero_a', 'alta'),
	('7b12bf1d-d850-4df5-99e8-bd75c99df50c', 'Bentley', 'Arnage R', 'ligero_a', 'alta'),
	('c9d6ee37-ac51-4306-aeb6-c0c992fc8ee0', 'Bentley', 'Azure', 'ligero_a', 'alta'),
	('a3302f0e-8ccc-4336-9974-9094b20fee9b', 'Bentley', 'Bentayga', 'ligero_a', 'alta'),
	('7d2682e4-c021-40b9-8f0e-c3c7bf09d5d6', 'Bentley', 'Continental', 'ligero_a', 'alta'),
	('5dd63bfb-188b-4fbd-bf15-140b11eba51f', 'Bentley', 'Flying Spur', 'ligero_a', 'alta'),
	('7ae4a938-8619-420a-a951-9402d8cede69', 'Bentley', 'Mulsanne', 'ligero_a', 'alta'),
	('6728ef55-58a8-4103-b107-353483a75c38', 'BMW', 'Serie 3-', 'ligero_a', 'alta'),
	('16fae417-c77e-4cae-9fce-f1b8a4a5543a', 'BMW', '118I', 'ligero_a', 'alta'),
	('5b5141e3-f748-4a72-a030-fe2572fc589d', 'BMW', '120I', 'ligero_a', 'alta'),
	('a7a4e37e-d3a7-4c14-91b4-a009d98196f6', 'BMW', '120i 3p', 'ligero_a', 'alta'),
	('41575166-9a01-4b34-af95-5d5fde567079', 'BMW', '125i Coupe', 'ligero_a', 'alta'),
	('4d12c28e-f4b9-4139-8c1c-6dc4b59eddd9', 'BMW', '130I', 'ligero_a', 'alta'),
	('16aac99c-7025-4f96-9c99-c8db1b3f1e67', 'BMW', '130i 3p', 'ligero_a', 'alta'),
	('5fcdfde3-d231-4cbe-aaa1-31841ff5a697', 'BMW', '135i Coupe', 'ligero_a', 'alta'),
	('4ba8d2b0-796d-4115-abc3-bad3f9cc9d89', 'BMW', '320I', 'ligero_a', 'alta'),
	('5e565394-a3ba-4ebb-8073-cbaf75372c1e', 'BMW', '325CI', 'ligero_a', 'alta'),
	('cffee2ad-4418-40c5-8d78-f762d1920314', 'BMW', '325CI Cabrio', 'ligero_a', 'alta'),
	('2df66848-ce90-4b41-b82c-b26b68840f6b', 'BMW', '325I', 'ligero_a', 'alta'),
	('a99c51ec-3455-4287-826c-248d271db800', 'BMW', '325I SDK', 'ligero_a', 'alta'),
	('440d83f0-73c2-40f3-989c-a6c48f9a4a8c', 'BMW', '325i Cabrio', 'ligero_a', 'alta'),
	('0aff4d5d-7a23-4bf9-871d-c3bddc8ecfd8', 'BMW', '325i Coupe', 'ligero_a', 'alta'),
	('ae574270-5ebf-4380-a7f1-b1a904307189', 'BMW', '330CI', 'ligero_a', 'alta'),
	('8f0710f4-66e2-4582-8399-254d042f711f', 'BMW', '330CI Cabrio', 'ligero_a', 'alta'),
	('59872775-d510-4f75-bfe8-5eac41f64995', 'BMW', '330I', 'ligero_a', 'alta'),
	('45f34169-6fd1-4d97-82e2-69c97ee272db', 'BMW', '335i', 'ligero_a', 'alta'),
	('5742689c-46ca-4123-b26a-071e169fae67', 'BMW', '335i Cabrio', 'ligero_a', 'alta'),
	('906b4db7-ed92-472b-8246-18c814b00c02', 'BMW', '335i Coupe', 'ligero_a', 'alta'),
	('dd9afa8b-6e5a-4a6c-978d-d78d57c202f9', 'BMW', '525I', 'ligero_a', 'alta'),
	('0c03c079-10b8-4a29-89ee-04327d593af8', 'BMW', '528I', 'ligero_a', 'alta'),
	('b3d29b48-1f27-4cbe-a50e-99148c9f8c92', 'BMW', '530I', 'ligero_a', 'alta'),
	('c42ed54d-2184-449e-823d-cfcb7e6ef6f7', 'BMW', '535I', 'ligero_a', 'alta'),
	('cef05d97-6897-43f2-9787-e14cf614f23e', 'BMW', '535i Gran Turismo', 'ligero_a', 'alta'),
	('f4c00b5b-11e5-4efc-bd4b-7d2367bfcd6d', 'BMW', '540I', 'ligero_a', 'alta'),
	('66b9c34e-c244-485c-b183-7395a3c96859', 'BMW', '545I', 'ligero_a', 'alta'),
	('e74b9a4f-0406-402a-88e9-3e20dc159692', 'BMW', '550I', 'ligero_a', 'alta'),
	('75037445-9006-429e-8fb2-7c6d3934efa5', 'BMW', '550i Gran Turismo', 'ligero_a', 'alta'),
	('f253ff51-214e-424a-b95b-a06559c94288', 'BMW', '645CI', 'ligero_a', 'alta'),
	('4ff70221-638a-4ca7-ba0e-5c3a42f76fa8', 'BMW', '645CI Cabrio', 'ligero_a', 'alta'),
	('388e6ad8-f50b-4c05-9819-477949550e89', 'BMW', '650I', 'ligero_a', 'alta'),
	('43c01cbd-6ed6-423f-b2d1-45383859fe3d', 'BMW', '650i Cabrio', 'ligero_a', 'alta'),
	('bb810478-3e97-431c-b948-007389d500de', 'BMW', '740I', 'ligero_a', 'alta'),
	('1679d9fe-6198-45e9-bfbc-5a71052188b1', 'BMW', '745I', 'ligero_a', 'alta'),
	('2464a3f9-83c7-4e6f-9e30-217c461c76a3', 'BMW', '750I', 'ligero_a', 'alta'),
	('5b918a26-5b0f-4c92-86d9-e96b32b69486', 'BMW', '760LI', 'ligero_a', 'alta'),
	('bb31b1c6-3864-46b6-895e-e7b72e6a53e7', 'BMW', 'M3', 'ligero_a', 'alta'),
	('50eb476f-9722-4466-908d-50e710a19ff4', 'BMW', 'M3 Cabrio', 'ligero_a', 'alta'),
	('fe7d7c1b-82a5-48b3-b564-c387873658b0', 'BMW', 'M3 Sedan', 'ligero_a', 'alta'),
	('d4937862-cfb4-4f05-890b-2d48a965a3c6', 'BMW', 'M5', 'ligero_a', 'alta'),
	('da459d90-71ec-46ed-9d6f-3ade4ac44436', 'BMW', 'M6', 'ligero_a', 'alta'),
	('f895a944-accf-405a-ae4e-510d28893f7d', 'BMW', 'Serie 1 Hatch', 'ligero_a', 'alta'),
	('fcfe457b-9adc-4c81-996c-9bff22efe984', 'BMW', 'Serie 1 M Coupe', 'ligero_a', 'alta'),
	('0453e3eb-69a0-4dae-bb0c-eef98c7397cc', 'BMW', 'Serie 1 Sed├ín', 'ligero_a', 'alta'),
	('e6e83cec-5ec0-43c1-b43c-2acdc55cfe26', 'BMW', 'Serie 2', 'ligero_a', 'alta'),
	('314b864d-c0a3-4455-b7da-01165032d2e6', 'BMW', 'Serie 3', 'ligero_a', 'alta'),
	('b93d0ac9-07bf-4f8a-959f-d765aebe3795', 'BMW', 'Serie 4', 'ligero_a', 'alta'),
	('9aa4eab5-c0f9-49bf-8137-3796e11e8ee5', 'BMW', 'Serie 5', 'ligero_a', 'alta'),
	('b2ef9395-0d9c-40d0-a626-34b56a4f729e', 'BMW', 'Serie 6', 'ligero_a', 'alta'),
	('dbac94c2-2d58-4bcd-b9bc-f2501ee9c2a4', 'BMW', 'Serie 7', 'ligero_a', 'alta'),
	('24436832-dc90-483b-a475-b119cc19ae86', 'BMW', 'Serie 8', 'ligero_a', 'alta'),
	('08a77362-9a4f-4a69-bfba-21f3e5e3e3a1', 'BMW', 'X1 Sdrive20i', 'ligero_a', 'alta'),
	('8f2a713f-b745-4266-9dc1-0efc95b3999f', 'BMW', 'X1 Xdrive25i', 'ligero_a', 'alta'),
	('01a9eb58-db59-455c-9df7-e6f2016a0e91', 'BMW', 'Z4-', 'ligero_a', 'alta'),
	('d854faaf-af7b-4f82-9cc9-048e9a29128a', 'BMW', 'i3', 'ligero_a', 'alta'),
	('1edd92dc-88ee-4dc1-9623-dbfb0bf9f04e', 'BMW', 'i4', 'ligero_a', 'alta'),
	('110baa74-2e5e-4eeb-8682-7d680e29245f', 'BMW', 'i5', 'ligero_a', 'alta'),
	('36077e22-add1-4c5b-abd4-3b58b979c9b0', 'BMW', 'i7', 'ligero_a', 'alta'),
	('01401d4d-2618-4df3-b068-3e7058cccb13', 'BMW', 'iX1', 'ligero_a', 'alta'),
	('a3a4c072-1529-41f4-92c5-3302cc99fa9b', 'BMW', 'X1 Xdrive 28i', 'ligero_a', 'alta'),
	('bf8a398e-c590-4998-a497-031a9bf98df5', 'BMW', 'XM', 'ligero_a', 'alta'),
	('ccaa2cc6-0a37-4d76-8020-896eb9eca945', 'BMW', 'Z4', 'ligero_a', 'alta'),
	('2a24c289-43b7-45fb-a47f-32ddf94a3120', 'BMW', 'i8', 'ligero_a', 'alta'),
	('341ddcfd-d5eb-4784-b31c-182d144d5606', 'Chirey', 'Arrizo 8', 'ligero_a', 'alta'),
	('a7b1c43b-3094-4087-96ff-6e93f0fa857a', 'Chrysler', 'CHRYSLER 300C', 'ligero_a', 'alta'),
	('fe347aa0-72f3-44c0-ac55-2c87975eef20', 'Chrysler', 'Charger', 'ligero_a', 'alta'),
	('31f29b65-9e65-4ff0-b27e-bf91b4f50070', 'Chrysler', 'Chrysler 300', 'ligero_a', 'alta'),
	('1437a427-3a5d-4220-a6c5-69d086189e85', 'Chrysler', 'Chrysler 200', 'ligero_a', 'alta'),
	('c6cbe5f2-c61f-497d-9e49-ee9e8e4230a2', 'Chrysler', 'Crossfire', 'ligero_a', 'alta'),
	('51dd23f3-6756-4ab3-9fe2-e76724918673', 'Chrysler', 'Challenger', 'ligero_a', 'alta'),
	('d65bbb44-bc59-4f19-ab0c-c3fea3d40e1d', 'Chrysler', 'Viper', 'ligero_a', 'alta'),
	('a140b600-9a93-486a-bc91-3d1de7f1315c', 'Fiat', '124 Spider', 'ligero_a', 'alta'),
	('6b00b5ce-676d-4a0b-b37d-d3ddd2e19a9a', 'Fiat', '500X', 'ligero_a', 'alta'),
	('f3a154bc-465a-4b3a-b8ce-47760cd2a7d5', 'Fiat', 'Stilo', 'ligero_a', 'alta'),
	('27ed3cf1-8a09-4a4b-9444-ad0ac30805f2', 'Ford Motor', 'Crown Victoria / Police Interceptor', 'ligero_a', 'alta'),
	('99711efd-6783-4004-a28c-ae008155217e', 'Ford Motor', 'Five Hundred', 'ligero_a', 'alta'),
	('8bb030eb-bbdd-46ac-ac8d-9d4ae4013ce9', 'Ford Motor', 'Sable', 'ligero_a', 'alta'),
	('a5f1d7e8-19ea-4c84-ab54-223f6c174b8c', 'Ford Motor', 'Ford GT', 'ligero_a', 'alta'),
	('9beda4b7-b48b-4f30-9c3a-4bc383f01b9e', 'General Motors', 'Regal', 'ligero_a', 'alta'),
	('df001064-3443-4ab1-8ded-58264ab5041d', 'General Motors', 'Ats 4p', 'ligero_a', 'alta'),
	('c3950b49-2641-4c9a-b303-058a8883e256', 'General Motors', 'Cts 2 Ptas', 'ligero_a', 'alta'),
	('fe00b8ed-56ff-4c22-8a9f-4245ff9ace67', 'General Motors', 'Cts 4 Ptas', 'ligero_a', 'alta'),
	('8b56bac0-d20c-48c1-8617-4061339a83b3', 'General Motors', 'De Ville 4 Ptas', 'ligero_a', 'alta'),
	('6122854c-4bc8-4bbd-b031-6a2f90d66481', 'General Motors', 'Impala', 'ligero_a', 'alta'),
	('04b756b4-24d4-4106-83fa-83c25ac83ce6', 'General Motors', 'Lacrosse', 'ligero_a', 'alta'),
	('f06c751a-b090-4a5f-938e-70d782800710', 'General Motors', 'Sts 4 Ptas', 'ligero_a', 'alta'),
	('d6aa7105-a671-4320-9df0-b0ce9c7af7b3', 'General Motors', 'Verano', 'ligero_a', 'alta'),
	('e29507ac-27b1-48b3-ab76-66926c55af17', 'General Motors', '147', 'ligero_a', 'alta'),
	('8355591e-02e5-49f1-9e64-3ea135dad10c', 'General Motors', '156', 'ligero_a', 'alta'),
	('c7f593fb-6fad-4ea5-b04c-8b1174e07896', 'General Motors', '9-3 Sport Sedan 4 Ptas', 'ligero_a', 'alta'),
	('8cc1944f-7bdd-4072-9f4d-7e9c5b4d6987', 'General Motors', '9-5 4 Ptas', 'ligero_a', 'alta'),
	('9b7e1ce6-ae3c-4b6c-b987-ef718fcc7a1d', 'General Motors', 'Bls 4 Ptas', 'ligero_a', 'alta'),
	('3d664add-be06-46c4-9b05-2e3e53ef6370', 'General Motors', 'Solstice 2 Ptas', 'ligero_a', 'alta'),
	('afcb72a2-280f-4ab3-947a-6db7ded91994', 'General Motors', 'Xlr 2 Ptas', 'ligero_a', 'alta'),
	('6f725810-0500-4b57-b1dc-de8d95878236', 'Honda', 'Accord', 'ligero_a', 'alta'),
	('ede91f9a-9b44-4b2d-8f88-012b2dd13e4c', 'Honda', 'Accord', 'ligero_a', 'alta'),
	('39121678-c63e-444a-b476-dc67deefe726', 'Honda', 'Accord 2pts', 'ligero_a', 'alta'),
	('70502c00-1dfd-4426-8ff1-9027a1190beb', 'Honda', 'Accord-', 'ligero_a', 'alta'),
	('3342f06b-ef42-4e2a-9c8d-ae833b670336', 'Honda', 'Crosstour', 'ligero_a', 'alta'),
	('60dab3df-4f37-4385-b79c-6e421e23627e', 'Honda', 'Prelude', 'ligero_a', 'alta'),
	('eab06da4-1b45-45cd-8584-6bddc92f643b', 'Hyundai', 'Genesis', 'ligero_a', 'alta'),
	('90566893-020e-48c3-a3b4-ac80366472b8', 'Hyundai', 'Veloster', 'ligero_a', 'alta'),
	('ecc9c4ac-684d-47ef-88f7-c219761772b8', 'Infiniti', 'G37 Coupe', 'ligero_a', 'alta'),
	('0320829b-f750-4aae-9373-0080b49035c4', 'Infiniti', 'G37 Sedan', 'ligero_a', 'alta'),
	('d74e35d5-ea78-4e5f-8b08-b75b0d150dfb', 'Infiniti', 'Infiniti', 'ligero_a', 'alta'),
	('aec2268b-df4b-4f91-81ea-ee3fc615eb3a', 'Infiniti', 'M', 'ligero_a', 'alta'),
	('612e02f3-c91c-4743-a5e5-4b2d36846331', 'Infiniti', 'Q50', 'ligero_a', 'alta'),
	('707bc52e-f6ed-48fa-8d24-e57b4a02f7ce', 'Infiniti', 'Q60', 'ligero_a', 'alta'),
	('09c1dfdc-5604-4857-be2a-cbe38271aee1', 'Infiniti', 'Q70', 'ligero_a', 'alta'),
	('76f81893-53e3-4dd5-865c-ce467d46eb23', 'Infiniti', 'QX30', 'ligero_a', 'alta'),
	('2765917a-9291-4866-924a-b7ae4fb23e73', 'Jaguar', 'E-Pace', 'ligero_a', 'alta'),
	('a74728b8-c582-4fc1-9d1e-46a05b5684ec', 'Jaguar', 'F Type', 'ligero_a', 'alta'),
	('7c327f3b-0abf-40ae-adac-b31cf5d07c0d', 'Jaguar', 'F-Pace', 'ligero_a', 'alta'),
	('b88ad7d6-b3a8-4ce9-acef-9683a0231b5f', 'Jaguar', 'I-Pace', 'ligero_a', 'alta'),
	('80953ccb-e8a9-4492-935f-af87dfd56741', 'Jaguar', 'S Type 3.0l', 'ligero_a', 'alta'),
	('0eba5423-78b2-4fba-abf3-4165b4bc9817', 'Jaguar', 'S Type 4.2l', 'ligero_a', 'alta'),
	('4e2cf06f-3726-475f-acac-656b94d66113', 'Jaguar', 'X Type 2.5l', 'ligero_a', 'alta'),
	('d1e6863f-4558-4742-bef5-e5836bc0c46b', 'Jaguar', 'X Type 3.0l', 'ligero_a', 'alta'),
	('fa8eeefd-0848-4f03-a8b9-0e000a3cea03', 'Jaguar', 'XE', 'ligero_a', 'alta'),
	('062c71fa-8857-4f1a-b0ed-c7c7ea85121d', 'Jaguar', 'XF', 'ligero_a', 'alta'),
	('278e0738-082b-44c8-845f-dd5b772c20be', 'Jaguar', 'XF 4.2L', 'ligero_a', 'alta'),
	('bb118c99-98c8-489d-8801-86aeb2ab35ed', 'Jaguar', 'XF 5.0L', 'ligero_a', 'alta'),
	('bd8cff7f-0d06-4c02-bd4c-51155989eb34', 'Jaguar', 'XJ', 'ligero_a', 'alta'),
	('16e4e8a1-2171-4759-a2b1-2b8cb4b65d41', 'Jaguar', 'XK', 'ligero_a', 'alta'),
	('20432d14-94ff-486f-b275-0fcab1ac957e', 'Jaguar', 'Xj Sedan Series', 'ligero_a', 'alta'),
	('2bb912b4-aea4-4d45-b762-31880e9f2620', 'Jaguar', 'F-Type', 'ligero_a', 'alta'),
	('489437ca-e5b7-48ef-8174-ed8ff3cdaca1', 'Jaguar', 'Xk Series', 'ligero_a', 'alta'),
	('d6d7311e-2c9d-4888-9296-288fcf3f23b9', 'KIA', 'Stinger', 'ligero_a', 'alta'),
	('67d3c60c-6438-474d-b7a6-4bd79c45d196', 'KIA', 'KIA ├ôptima', 'ligero_a', 'alta'),
	('89efe3f2-5475-482c-b82e-7966d6e32c79', 'Land Rover', 'Discovery', 'ligero_a', 'alta'),
	('e70d3d47-21ff-4881-bd9b-9203e9323d23', 'Land Rover', 'Discovery Sport', 'ligero_a', 'alta'),
	('bf5ca438-7291-487a-8756-e720e262769d', 'Land Rover', 'Range Rover', 'ligero_a', 'alta'),
	('e48b32d1-7780-465a-890a-9bda98d52faf', 'Land Rover', 'Range Rover Evoque', 'ligero_a', 'alta'),
	('086f485c-5e91-4d52-9fb4-c2f882af07e5', 'Land Rover', 'Range Rover Velar', 'ligero_a', 'alta'),
	('36a07122-47aa-4826-9198-a8e1669d14e0', 'Lexus', 'ES', 'ligero_a', 'alta'),
	('3cdf116d-a135-45d8-929b-25db3399cec8', 'Lexus', 'IS', 'ligero_a', 'alta'),
	('158f5349-48e5-44bd-99c3-c464caeb2550', 'Lexus', 'LC', 'ligero_a', 'alta'),
	('645d6360-7f8b-42d8-a90d-30c0414d883e', 'Lexus', 'LS', 'ligero_a', 'alta'),
	('ea080bc8-41a2-4ca4-9c5b-d4d7edf12a55', 'Lincoln', 'MKZ Hibrido', 'ligero_a', 'alta'),
	('6abac446-2b2b-425d-a268-1bb1db291fe0', 'Lincoln', 'MKZ-', 'ligero_a', 'alta'),
	('040ff180-e781-4f66-bdcc-a326a7b625da', 'Lincoln', 'Town Car', 'ligero_a', 'alta'),
	('51508b38-29bd-4016-aa14-e5b9ce51721c', 'Lincoln', 'Lincoln Continental', 'ligero_a', 'alta'),
	('15238909-36fb-474d-9e92-2a36e015f0ed', 'Lincoln', 'Lincoln Ls', 'ligero_a', 'alta'),
	('c88168e0-9219-463b-8aac-7e42bd19ea6d', 'Lincoln', 'MKZ', 'ligero_a', 'alta'),
	('b3600253-4d9d-4c24-b3d4-e3cdc71bd356', 'Lincoln', 'Milan', 'ligero_a', 'alta'),
	('6b966fc1-4128-492d-a88f-bd858d621795', 'Lincoln', 'Mks', 'ligero_a', 'alta'),
	('a155a57f-e24c-4546-b7ed-08840fd5fac0', 'Lincoln', 'Montego', 'ligero_a', 'alta'),
	('98cfb598-67cf-4f02-a808-c144a5b8c536', 'Lincoln', 'NAUTILUS', 'ligero_a', 'alta'),
	('a2bcb087-ff97-458a-9456-3d40e66168fd', 'Lynk&Co', '01', 'ligero_a', 'alta'),
	('a05699b3-22e5-4432-9500-75f8955785c6', 'Lynk&Co', '02', 'ligero_a', 'alta'),
	('09de2678-35fb-49ad-a43e-8dd138616055', 'Lynk&Co', '08', 'ligero_a', 'alta'),
	('7db6f27f-aaf9-48aa-804c-4514de8bd3c3', 'Lynk&Co', '09', 'ligero_a', 'alta'),
	('0424b3bd-9a78-4f7d-926b-b159f6496c0d', 'Mazda', 'Mazda 6', 'ligero_a', 'alta'),
	('91370602-5aa8-4d24-a5bf-3f17b0c7bff3', 'Mazda', 'Mx-5', 'ligero_a', 'alta'),
	('ec60d70b-290c-4e66-8417-befd00bae4ff', 'Mercedes Benz', 'C 200 K', 'ligero_a', 'alta'),
	('743350ec-c5af-4a28-942d-749da1280369', 'Mercedes Benz', 'C 230 K', 'ligero_a', 'alta'),
	('e201709b-b75d-44c7-91fd-5a60f9e5ba7b', 'Mercedes Benz', 'C 280', 'ligero_a', 'alta'),
	('eca7ca92-0cb7-43f4-9927-bb0ca9de4325', 'Mercedes Benz', 'C 320', 'ligero_a', 'alta'),
	('5a0fb2bd-466c-4f60-8784-6623b24fdbe1', 'Mercedes Benz', 'C 350', 'ligero_a', 'alta'),
	('e629abba-9f70-4472-bc1e-86cd494d0260', 'Mercedes Benz', 'C 55 Amg', 'ligero_a', 'alta'),
	('25a595e4-eebc-45b2-8858-c92d8deda513', 'Mercedes Benz', 'C 63 Amg', 'ligero_a', 'alta'),
	('54b05c2f-b614-4088-94a8-47316a013e4f', 'Mercedes Benz', 'CLE', 'ligero_a', 'alta'),
	('5ab67349-6797-480c-ac53-0b152c4e8168', 'Mercedes Benz', 'CLS', 'ligero_a', 'alta'),
	('6157a614-b9dc-4684-b3ba-5fe886457a27', 'Mercedes Benz', 'Cl 230 K', 'ligero_a', 'alta'),
	('bf49a60a-d078-43cf-80bf-25f00cda54c4', 'Mercedes Benz', 'Cl 500', 'ligero_a', 'alta'),
	('f98efbe1-6a63-4699-bbf4-4ef0886dd1e8', 'Mercedes Benz', 'Clase A Sedan', 'ligero_a', 'alta'),
	('182aa1d7-ea87-4668-b8e0-5eb60a7ceb23', 'Mercedes Benz', 'Clase A hatchback', 'ligero_a', 'alta'),
	('d207019a-1cce-4fe8-bcd6-f1138ba5a649', 'Mercedes Benz', 'Clase B', 'ligero_a', 'alta'),
	('437df868-c5d4-411e-8ea6-f28a3f3389ae', 'Mercedes Benz', 'Clase C 250 Coupe', 'ligero_a', 'alta'),
	('5a620272-aa3d-483d-972f-45ee8cfb32b0', 'Mercedes Benz', 'Clase C 350 Coupe', 'ligero_a', 'alta'),
	('628d4f81-65a9-48ae-b2bc-a825e73435f1', 'Mercedes Benz', 'Clase C Sedan', 'ligero_a', 'alta'),
	('a50867fc-7231-4d75-ba5a-754cfe29391d', 'Mercedes Benz', 'Clase C coupe', 'ligero_a', 'alta'),
	('477eac43-68d1-4f5d-981b-406d87034496', 'Mercedes Benz', 'Clase E coupe', 'ligero_a', 'alta'),
	('7b7581d4-8c14-497e-a4d3-a01cd1666d85', 'Mercedes Benz', 'Clase E sedan', 'ligero_a', 'alta'),
	('dc68bfb5-d0f7-463b-bf2f-b1c028891867', 'Mercedes Benz', 'Clase S coupe', 'ligero_a', 'alta'),
	('f5af38f3-3177-4cf3-bfc0-e52dbdb78f2c', 'Mercedes Benz', 'Clase S sedan', 'ligero_a', 'alta'),
	('ea8e2911-5830-49a0-af7c-c8d01ad27091', 'Mercedes Benz', 'Clase SL', 'ligero_a', 'alta'),
	('c5b4eaa6-44b6-4693-bb19-a9d9147cc79b', 'Mercedes Benz', 'Clk 280', 'ligero_a', 'alta'),
	('84aec06d-e26d-4328-8835-d788ae538be2', 'Mercedes Benz', 'Clk 280 C', 'ligero_a', 'alta'),
	('ae3490c2-079a-4931-9222-5be90859a12b', 'Mercedes Benz', 'Clk 320', 'ligero_a', 'alta'),
	('49703a73-5454-4457-8658-3c2fe2bc88b3', 'Mercedes Benz', 'Clk 320 C', 'ligero_a', 'alta'),
	('19df824a-f7d9-4f72-918d-55cd35d43a1e', 'Mercedes Benz', 'Clk 350', 'ligero_a', 'alta'),
	('f27ee8b3-271a-4bf6-9bfd-96dd3fc9dc06', 'Mercedes Benz', 'Clk 350 C', 'ligero_a', 'alta'),
	('184e1974-1465-4af7-847f-d96d4336fe66', 'Mercedes Benz', 'Clk 500', 'ligero_a', 'alta'),
	('7761122b-3677-4474-9b09-ea682e18ea95', 'Mercedes Benz', 'Clk 500 C', 'ligero_a', 'alta'),
	('7cc75072-131b-411a-8115-d836de8cc9ac', 'Mercedes Benz', 'Cls 350', 'ligero_a', 'alta'),
	('fd513f33-0943-40e3-b5d3-111a81a1c913', 'Mercedes Benz', 'Cls 500', 'ligero_a', 'alta'),
	('ab186e52-24c6-4913-9cc3-01f99be26f85', 'Mercedes Benz', 'E 250 Coupe', 'ligero_a', 'alta'),
	('fa54a70d-aa54-47a9-99c7-89edd626ef89', 'Mercedes Benz', 'E 280', 'ligero_a', 'alta'),
	('d622084e-556c-42a4-84bd-c0e38f26f36a', 'Mercedes Benz', 'E 350', 'ligero_a', 'alta'),
	('aab2e07d-8b95-4cf4-a8c2-f0324f7f8f87', 'Mercedes Benz', 'E 350 Convertible', 'ligero_a', 'alta'),
	('2ab579ea-8745-43d6-a9e7-1759926346b3', 'Mercedes Benz', 'E 350 Coupe', 'ligero_a', 'alta'),
	('e3a4045c-6ed6-4288-8581-9fb560b11304', 'Mercedes Benz', 'E 500', 'ligero_a', 'alta'),
	('97eece0a-da4f-4d4b-ac18-268740e832e0', 'Mercedes Benz', 'E 500 Convertible', 'ligero_a', 'alta'),
	('f5efca05-83ea-4584-ad62-dfece5cc45aa', 'Mercedes Benz', 'E 500 Coupe', 'ligero_a', 'alta'),
	('d9a12636-2e2a-4210-884c-dc286b286a44', 'Mercedes Benz', 'E 55 Amg', 'ligero_a', 'alta'),
	('d7677212-ffe4-4614-960d-e914e4df1888', 'Mercedes Benz', 'E 63 Amg', 'ligero_a', 'alta'),
	('d6c79334-54b7-4d55-b658-687d6eb196e8', 'Mercedes Benz', 'E250', 'ligero_a', 'alta'),
	('72bc428c-9d5c-4a7c-abf2-b4c67b5a5fda', 'Mercedes Benz', 'EQE', 'ligero_a', 'alta'),
	('ccdb0385-90ed-47bb-91fd-0b952f559c89', 'Mercedes Benz', 'EQS', 'ligero_a', 'alta'),
	('2f4228fd-3894-4f86-a711-988fedd39060', 'Mercedes Benz', 'S 430', 'ligero_a', 'alta'),
	('cc3f9381-ead1-4096-a94c-1c8af18a8fab', 'Mercedes Benz', 'S 500', 'ligero_a', 'alta'),
	('262f7b3e-f84f-4123-b299-6446165c4aa8', 'Mercedes Benz', 'SLC', 'ligero_a', 'alta'),
	('1fdc87a8-0c97-4ffd-8e7b-ba08137db1a0', 'Mercedes Benz', 'Sl 500', 'ligero_a', 'alta'),
	('729fa905-f310-4a92-b463-2d1fb76c2f7e', 'Mercedes Benz', 'Sl 55 Amg', 'ligero_a', 'alta'),
	('8826d4a8-1810-4330-903a-36d4801fa653', 'Mercedes Benz', 'Slk 200 K', 'ligero_a', 'alta'),
	('51078003-d9be-4f5d-b9bb-9d36d718a611', 'Mercedes Benz', 'Slk 350', 'ligero_a', 'alta'),
	('9e8399f0-1d64-42b8-bbae-674e66822561', 'Mercedes Benz', 'Sls Amg', 'ligero_a', 'alta'),
	('f95081d6-f06f-431b-b2e2-ca30328d36cc', 'Mercedes Benz', 'A 190', 'ligero_a', 'alta'),
	('d9865b8d-310f-4c5a-ac49-70c5fe162e18', 'Mercedes Benz', 'CLA', 'ligero_a', 'alta'),
	('dd430607-1cff-4ab6-a3e5-fe90de18123d', 'MG Motor', 'MG7', 'ligero_a', 'alta'),
	('5afd7a42-84cf-4dc7-be05-56cda95f1616', 'MG Motor', 'CYBERSTER', 'ligero_a', 'alta'),
	('62ff2a97-05ae-48da-865a-5de59944046f', 'MG ROVER', 'Mg Tf', 'ligero_a', 'alta'),
	('4382b604-8cc0-44e4-a70f-98f3e99d8d2f', 'MG ROVER', 'Mg Zr', 'ligero_a', 'alta'),
	('8df414df-10ed-4227-9ae2-ae81886a21f2', 'MG ROVER', 'Mg Zt', 'ligero_a', 'alta'),
	('8a3ebcdb-a9bb-4847-8c08-eec89c8791d4', 'MG ROVER', 'R75', 'ligero_a', 'alta'),
	('72099eea-ef6a-4851-b850-6839b90714c5', 'Mini', 'MINI Countryman E', 'ligero_a', 'alta'),
	('f71f099c-c1e8-4f2d-a0af-1ad5a67e29d7', 'Mini', 'MINI Aceman', 'ligero_a', 'alta'),
	('e13a53b4-4a82-44f9-b7f2-882f7a15b20f', 'Mini', 'MINI E', 'ligero_a', 'alta'),
	('5d270a4d-decc-4bcc-96d8-c883c7f777b5', 'Mini', 'Cooper Conv', 'ligero_a', 'alta'),
	('d3e39a27-e03f-45d1-a13c-77ed07ab5f03', 'Mini', 'MINI 3 PTAS', 'ligero_a', 'alta'),
	('a60191fb-d1a2-4b29-ba03-640118d5234a', 'Mini', 'MINI 5 PTAS', 'ligero_a', 'alta'),
	('52382ec5-10db-43f2-bc3e-054a86f38c14', 'Mini', 'MINI CLUBMAN', 'ligero_a', 'alta'),
	('642512d0-2559-487e-9305-8d9e53cd1699', 'Mini', 'MINI CONVERTIBLE', 'ligero_a', 'alta'),
	('156db9f5-75fd-4cdf-8167-4ce4706ee0d5', 'Mini', 'MINI COUPE', 'ligero_a', 'alta'),
	('ded57d8e-8396-4ed7-80c1-8b7cc017df18', 'Mini', 'MINI E', 'ligero_a', 'alta'),
	('6c03614f-968c-4ee0-800f-5b2b12d33f9f', 'Mini', 'MINI PACEMAN', 'ligero_a', 'alta'),
	('236ae007-5cee-4dd2-92f3-cfc398596480', 'Mini', 'MINI ROADSTER', 'ligero_a', 'alta'),
	('49565271-095b-4fb1-8b38-8b5401ebc3fa', 'Mini', 'Cooper S Jcw', 'ligero_a', 'alta'),
	('412ab693-f392-4dd5-8b71-f4da7389344c', 'Mini', 'Countryman S', 'ligero_a', 'alta'),
	('66d20682-c7cf-4b1b-8390-e697e5f74b8b', 'Mini', 'Cooper S', 'ligero_a', 'alta'),
	('c3a30ac5-a6e5-4cda-a46f-4d188bb41557', 'Mini', 'Cooper S Clubman', 'ligero_a', 'alta'),
	('3584c7ce-2773-4e57-b864-84f8efeb1e6a', 'Mini', 'Cooper S Conv', 'ligero_a', 'alta'),
	('9729fd13-a1f7-4a08-a5aa-90707df39990', 'Mitsubishi', 'Lancer Evolution', 'ligero_a', 'alta'),
	('8fb52b38-be1b-4b8a-96fd-efec6f5c23b6', 'Mitsubishi', 'Eclipse', 'ligero_a', 'alta'),
	('885c65b7-f153-44fd-8d0e-5944e03fff35', 'Mitsubishi', 'Eclipse Conv', 'ligero_a', 'alta'),
	('0b3ca554-e236-499e-b8cf-60f5c3b15ae9', 'Nissan', 'Altima', 'ligero_a', 'alta'),
	('cddb903f-48bd-4fb0-974f-3847aaeefbb6', 'Nissan', 'Altima Coupe', 'ligero_a', 'alta'),
	('0920db6f-5213-45c7-ac5b-c439f36d7d86', 'Nissan', 'Infinity I35', 'ligero_a', 'alta'),
	('72ad7a11-37eb-4600-b06f-61ab5a837fc0', 'Nissan', 'Infinity Q45-M45', 'ligero_a', 'alta'),
	('b62ffaf9-74e8-4994-8d4e-dede8e52e2d6', 'Nissan', 'Maxima', 'ligero_a', 'alta'),
	('3aaeebee-1481-4612-9150-69f8a73e4b64', 'Nissan', '350 Z', 'ligero_a', 'alta'),
	('60dea1d5-d380-43d1-9e06-7af0e06e307e', 'Nissan', '370 Z', 'ligero_a', 'alta'),
	('4b8da449-6703-497e-b1aa-061ce718c08d', 'Nissan', 'Z', 'ligero_a', 'alta'),
	('3e233c84-ed54-42e7-b126-5b444946214d', 'Nissan', 'Almera Dep', 'ligero_a', 'alta'),
	('a785d854-1028-47c2-9f9f-d8fdbada6d3e', 'Peugeot', 'Rcz', 'ligero_a', 'alta'),
	('5cffdd44-b184-4b27-80a9-a5b53de73e61', 'Peugeot', '406 Coupe', 'ligero_a', 'alta'),
	('53020465-d732-4e69-985b-8802f52414ff', 'Peugeot', '406 St Aut', 'ligero_a', 'alta'),
	('03edc81e-24ba-4c0a-aa97-e38ac63da4e3', 'Peugeot', '406 Sv V6', 'ligero_a', 'alta'),
	('46a188ac-c37a-408c-a30e-ec327aa6145d', 'Peugeot', '407', 'ligero_a', 'alta'),
	('10ee7fc3-8fda-4e0e-9d54-bbe97e040501', 'Peugeot', '508', 'ligero_a', 'alta'),
	('aed2228e-6cd5-4496-996b-a61b3b4cb52c', 'Peugeot', '607 Pack', 'ligero_a', 'alta'),
	('a5754d51-b08c-42f7-be3f-0a34773c3623', 'Renault', 'Safrane', 'ligero_a', 'alta'),
	('e2f89117-c10f-4d3a-bac4-07031219775d', 'Renault', 'Laguna', 'ligero_a', 'alta'),
	('e7a4bbd9-f2bf-4b44-bbf3-6321e2f800d6', 'Renault', 'Sandero R.S. 2.0', 'ligero_a', 'alta'),
	('ed806eab-c5dc-4a1c-a87a-3c02ad500902', 'Renault', 'Sandero', 'ligero_a', 'alta'),
	('30354ec9-087c-4028-8961-5b6de56505a1', 'Renault', 'Clio RS', 'ligero_a', 'alta'),
	('81c99e30-be46-43b0-a914-3450f687cf28', 'Renault', 'Clio Renault Sport', 'ligero_a', 'alta'),
	('fcec08e0-e2bb-49ba-84be-906f339fc6f3', 'SEAT', 'Leon', 'ligero_a', 'alta'),
	('8605f877-388f-4d1a-8937-47f800681724', 'SEAT', 'Leon Cupra', 'ligero_a', 'alta'),
	('50ed7d7e-66ec-44a4-9bf3-704e155614b6', 'SEAT', 'Leon Sc 2p', 'ligero_a', 'alta'),
	('d3fe763c-f8ad-46e3-8c17-7edf8ed5d02c', 'Smart', 'FORTWO', 'ligero_a', 'alta'),
	('61196afb-1c32-4662-a310-64bdcfa4c2cf', 'Smart', 'FORTWO', 'ligero_a', 'alta'),
	('c6292851-843e-47aa-bac8-13721a77b68c', 'Smart', 'Forfour', 'ligero_a', 'alta'),
	('412d82eb-b97c-4fd2-9b3b-2b78fb14c9ca', 'Subaru', 'Legacy', 'ligero_a', 'alta'),
	('84a3428e-03e8-4fa1-b6c9-ddca440bd1c6', 'Subaru', 'Legacy 2.0', 'ligero_a', 'alta'),
	('82a72b83-f6ad-4dbf-8939-516d55ca3679', 'Subaru', 'Legacy 2.5i', 'ligero_a', 'alta'),
	('c32d1881-5a01-4503-8903-0b9a897489a2', 'Subaru', 'Legacy 3.0', 'ligero_a', 'alta'),
	('59004fd9-3b3f-45d2-9095-8d4ee5def7c6', 'Subaru', 'Legacy 3.6', 'ligero_a', 'alta'),
	('902ca5ce-7336-47b3-adae-b9ec93465948', 'Subaru', 'Subaru BRZ', 'ligero_a', 'alta'),
	('7d84b255-726e-4695-8944-394813cafc28', 'Subaru', 'WRX', 'ligero_a', 'alta'),
	('a34d2b04-3b28-4ff9-8c49-a86994b0bc82', 'Subaru', 'WRX STI', 'ligero_a', 'alta'),
	('38c70a9f-c8ab-4ea2-b630-dac4de964dad', 'Suzuki', 'Kizashi', 'ligero_a', 'alta'),
	('66ddfeb4-e2cd-4462-97d4-769e3a1cc424', 'Toyota', 'Camry', 'ligero_a', 'alta'),
	('d579d7b1-f47c-41f3-82d4-7dceac2662b9', 'Toyota', 'Prius', 'ligero_a', 'alta'),
	('7443f4e7-0327-4730-be9d-4fd3e9dfa220', 'Toyota', 'Solara', 'ligero_a', 'alta'),
	('ea75683e-0041-473b-a5ad-102fb37db8f4', 'Toyota', 'GR Corolla', 'ligero_a', 'alta'),
	('3f443ea8-963c-446a-922a-37c16d09acb1', 'Toyota', 'GR Yaris', 'ligero_a', 'alta'),
	('a6e1e16a-bbd5-4732-aa08-ffb562819205', 'Toyota', 'Mr2', 'ligero_a', 'alta'),
	('d065bb6c-1789-4662-b235-1e94c588a9ae', 'Volkswagen', 'EOS', 'ligero_a', 'alta'),
	('291f86d4-19c3-410b-8433-4e5bbd695391', 'Volkswagen', 'Passat', 'ligero_a', 'alta'),
	('546dd2c4-276d-4ccc-98f8-ac907950109a', 'Volkswagen', 'Passat Cc', 'ligero_a', 'alta'),
	('9f15457c-ac7d-42ce-b4c5-ad7d484e153b', 'Volkswagen', 'GTI', 'ligero_a', 'alta'),
	('440ce7f2-74d9-4d33-a851-7744cea51acd', 'Volkswagen', 'Golf Gti', 'ligero_a', 'alta'),
	('8463f519-5ee5-426b-b9e5-c9f3e98355e4', 'Volvo', 'C70 T5', 'ligero_a', 'alta'),
	('bc42a645-b987-4efb-bb7c-296f5c6ffdf1', 'Volvo', 'C30 2.4i', 'ligero_a', 'alta'),
	('86a29df3-b090-441f-97e6-174e64da1a8a', 'Volvo', 'C30 T5', 'ligero_a', 'alta'),
	('abe0c341-b2ab-40de-b70a-5a0f698c0eb7', 'Volvo', 'C40', 'ligero_a', 'alta'),
	('342bb424-a6bb-40c0-9409-eb0141a6ac02', 'Volvo', 'S60', 'ligero_a', 'alta'),
	('95483eb9-7a22-4c2e-8806-a0baaece2ce9', 'Volvo', 'S60 R', 'ligero_a', 'alta'),
	('ffe1dcde-8e8c-4172-91b1-2f6e6efa2484', 'Volvo', 'S60 T6', 'ligero_a', 'alta'),
	('86c54528-6a98-4a72-8e89-285faf5cc78a', 'Volvo', 'V40', 'ligero_a', 'alta'),
	('2cb121dc-e6e6-4bd7-a12c-ca62b0802761', 'Volvo', 'V40 II', 'ligero_a', 'alta'),
	('3468d4b5-f8c5-4175-8109-7b83bdfd571c', 'Volvo', 'V40 T4', 'ligero_a', 'alta'),
	('27fbae27-15b4-4cd8-95dc-b056507edb23', 'Volvo', 'V40 T5', 'ligero_a', 'alta'),
	('e38b90da-5d6d-49dc-9ff3-b2fa2a8f2541', 'Volvo', 'V40cc', 'ligero_a', 'alta'),
	('7a2021dd-5023-4586-a184-edf8aa8f74fc', 'Volvo', 'V40cc T5 Awd', 'ligero_a', 'alta'),
	('3d9593c5-775d-49a0-8c2b-d4afaae059df', 'Volvo', 'V40cc T5 Fwd', 'ligero_a', 'alta'),
	('7fb8a717-c4fc-42d9-afdc-d1e8a6ac6d10', 'Volvo', 'V60', 'ligero_a', 'alta'),
	('16de534a-bb15-4e96-9251-f6091ffa9ed2', 'Volvo', 'XC40', 'ligero_a', 'alta'),
	('a06e3cf1-36aa-4ded-a296-602c905f31bf', 'Volvo', 'S60 III', 'ligero_a', 'alta'),
	('8dd03dc0-9790-404d-82d8-3eae9e3412be', 'Volvo', 'C70 Cabrio', 'ligero_a', 'alta'),
	('0c69fe34-c28b-4ef8-8a5e-ee9d899acd6a', 'Volvo', 'S40 2.0t', 'ligero_a', 'alta'),
	('ca0994a8-00a2-45fc-8f76-39c12d288a09', 'Volvo', 'S40 T5', 'ligero_a', 'alta'),
	('f99469e9-44a3-4753-aa50-21b642fe10a3', 'Volvo', 'S60 2.5t', 'ligero_a', 'alta'),
	('737fbe54-7da4-498c-a903-8eb498321897', 'Volvo', 'S60 CC', 'ligero_a', 'alta'),
	('f3a9e563-df1a-480a-8766-315db6d15aa1', 'Volvo', 'S60 II', 'ligero_a', 'alta'),
	('bb260557-d62d-4612-86c6-34d2e7f5fd09', 'Volvo', 'S80 2.5t', 'ligero_a', 'alta'),
	('3a09f68c-d4b3-4b72-92a7-68197dec69aa', 'Volvo', 'S80 3.2', 'ligero_a', 'alta'),
	('42307e06-4c97-4b75-8ca3-58448fe3e608', 'Volvo', 'S80 T6', 'ligero_a', 'alta'),
	('fc6f1186-e78c-49da-9d44-2c9b410980c4', 'Volvo', 'S80 V8', 'ligero_a', 'alta'),
	('82a1c9ca-925d-45b0-9fb0-daa5fc84174d', 'Volvo', 'S90', 'ligero_a', 'alta'),
	('3646d5cb-d05b-4dc5-b97b-31feec815fe8', 'Volvo', 'V50 T5', 'ligero_a', 'alta'),
	('62b662ba-f64e-4b0b-998a-a9afcdac308e', 'Volvo', 'V60 CC', 'ligero_a', 'alta'),
	('66ed7a32-f2a5-4e74-a4d2-b5473de34254', 'Volvo', 'S 60 1.6', 'ligero_a', 'alta'),
	('381d7694-d0ba-45dd-8d33-301951474074', 'Zeekr', '001', 'ligero_a', 'alta'),
	('347d5f04-e8d3-4be4-bc5c-0fa6b6c116bc', 'Zeekr', '7X', 'ligero_a', 'alta'),
	('838e0050-a009-4b1d-94ed-1b29f0101b4e', 'Zeekr', 'X', 'ligero_a', 'alta'),
	('8b2360fa-06ff-4117-b1dd-16004e0bce85', 'Auteco', 'D2S 150', 'ligero_a', 'entrada'),
	('76fc7595-ca69-4c70-b170-253779f45c06', 'Auteco', 'D2S 250', 'ligero_a', 'entrada'),
	('b9501357-78d5-4b24-bd10-3816369086ae', 'Changan', 'ALSVIN', 'ligero_a', 'entrada'),
	('c764ecdd-b23f-4e70-9d17-360498a9f67a', 'Chrysler', 'Vision', 'ligero_a', 'entrada'),
	('d67ba350-0eb3-4c4e-801c-6dcf710a56cd', 'Chrysler', 'Atos', 'ligero_a', 'entrada'),
	('37ae6046-64d7-40ac-82fc-48fd47a42826', 'Chrysler', 'I10', 'ligero_a', 'entrada'),
	('3b8a3b82-af43-4ee3-8488-695dfa540014', 'Chrysler', 'Verna 3 Ptas', 'ligero_a', 'entrada'),
	('94939c02-59f0-45c3-a1c7-58495edf4598', 'Chrysler', 'Verna 4 Ptas', 'ligero_a', 'entrada'),
	('3053c28a-923e-48a6-911e-7ba1bfcd81c6', 'Chrysler', 'Attitude', 'ligero_a', 'entrada'),
	('54f414fc-3395-4a8b-a7bc-a1c8f5979120', 'Fiat', 'Fiat 500-', 'ligero_a', 'entrada'),
	('b494dcb1-67b4-4db0-9a15-8b97f6de6c92', 'Fiat', 'Albea Sedan', 'ligero_a', 'entrada'),
	('5659acb2-a31d-4f2b-b2ce-d3dfbce5186a', 'Fiat', 'Argo', 'ligero_a', 'entrada'),
	('a8fd7bd6-ebad-4fed-aba1-706dffe8b91d', 'Fiat', 'Mobi', 'ligero_a', 'entrada'),
	('825b02c8-731a-4def-92f9-394b68dddac5', 'Fiat', 'Palio 1.8r', 'ligero_a', 'entrada'),
	('6ae53427-4c5d-4468-931b-a59f0efcb595', 'Fiat', 'Palio Adventure', 'ligero_a', 'entrada'),
	('efb3c7fd-5736-4740-ac7a-8be6307b54bc', 'Fiat', 'Palio Hatchback', 'ligero_a', 'entrada'),
	('89729f71-7183-4b43-9fe7-959c60536bc1', 'Fiat', 'Palio Sedan', 'ligero_a', 'entrada'),
	('d25c7b29-3af2-4791-bf1c-0b87a916d076', 'Fiat', 'Uno', 'ligero_a', 'entrada'),
	('caae6622-3e9a-4df7-b4b4-13db047ec198', 'Fiat', 'Bravo', 'ligero_a', 'entrada'),
	('d8e07403-e554-44ff-8ee7-70fc23472fbf', 'Fiat', 'Fiat 500', 'ligero_a', 'entrada'),
	('21207a3f-0c99-4cec-a6fa-a02e1034129c', 'Fiat', 'Panda 4x2d', 'ligero_a', 'entrada'),
	('4c238b10-ef32-4f28-8f2f-df7d43b37cea', 'Fiat', 'Panda 4x2m', 'ligero_a', 'entrada'),
	('21c99b3f-a6b7-4f57-9720-e3ee71509340', 'Fiat', 'Panda 4x4', 'ligero_a', 'entrada'),
	('7e7a3e13-e9fc-43e0-a427-a2103ce360bb', 'Ford Motor', 'Fiesta Ikon', 'ligero_a', 'entrada'),
	('9dbb0df4-272c-45ab-802b-3a53cbd0bd6a', 'Ford Motor', 'Fiesta NA 5 DR', 'ligero_a', 'entrada'),
	('c3233b42-bae8-4e36-9906-a151226e8f41', 'Ford Motor', 'Fiesta NA Sedan', 'ligero_a', 'entrada'),
	('87a81476-2fa1-4de7-9259-d02da6e176f5', 'Ford Motor', 'Fiesta Sedan / Ikon Notch', 'ligero_a', 'entrada'),
	('61391152-3792-4590-89fb-0bbb8c1c39d5', 'Ford Motor', 'Fiesta St', 'ligero_a', 'entrada'),
	('afed7799-8572-4011-8f31-efffbffbb576', 'Ford Motor', 'Fiesta', 'ligero_a', 'entrada'),
	('ad620f0b-8aca-47c8-bb9e-85fef9924665', 'Ford Motor', 'Fiesta Sedan / Ikon Notch', 'ligero_a', 'entrada'),
	('41bdb6ae-6424-47df-84a9-253054ddca24', 'Ford Motor', 'Ka', 'ligero_a', 'entrada'),
	('f350aaba-d9af-45f2-8f26-0a72156a696d', 'Ford Motor', 'Figo 5 DR', 'ligero_a', 'entrada'),
	('496851cf-b358-49c1-b392-5b9f8655b493', 'Ford Motor', 'Figo Sedan', 'ligero_a', 'entrada'),
	('569c92ea-5de7-4343-89f7-7e2f35da96a5', 'Ford Motor', 'Ikon Hatch', 'ligero_a', 'entrada'),
	('0bd7ed6e-87ba-48ec-8c11-827943e46eaa', 'Geely', 'Emgrand', 'ligero_a', 'entrada'),
	('9d719a9f-7eb4-404c-98f5-5fbacc748d2a', 'General Motors', 'Aveo-', 'ligero_a', 'entrada'),
	('2776bb95-32a6-4d1e-ba3c-4494fe9b5bed', 'General Motors', 'Chevy 3 Ptas', 'ligero_a', 'entrada'),
	('ebd9d64d-1381-420c-893c-fdae210e7271', 'General Motors', 'Chevy 4 PTAS', 'ligero_a', 'entrada'),
	('b92c5e04-5392-40ea-a603-c5619b327bf9', 'General Motors', 'Chevy 5 Ptas', 'ligero_a', 'entrada'),
	('08e95bc1-70b8-4355-81b4-150a07415192', 'General Motors', 'G3 4 PTAS-', 'ligero_a', 'entrada'),
	('8d44ed03-1135-44cb-a3ba-7eb9404cf18f', 'General Motors', 'G3 5 PTAS-', 'ligero_a', 'entrada'),
	('985c0e8d-6c8d-45bc-9184-d6ba7d97af08', 'General Motors', 'Sonic 5 PTS-', 'ligero_a', 'entrada'),
	('94f15528-d2a2-4feb-b54d-81bb05dc2803', 'General Motors', 'Sonic-', 'ligero_a', 'entrada'),
	('640ee683-893a-4998-93ac-b4caed2611ac', 'General Motors', 'Corsa 5 Ptas', 'ligero_a', 'entrada'),
	('e2b32476-2de1-49ea-98ef-ac87f19d8c7f', 'General Motors', 'Corsa Sedan 4 Ptas', 'ligero_a', 'entrada'),
	('2a8b1a63-6a81-4e16-abdc-cfc3aac5e715', 'General Motors', 'Aveo', 'ligero_a', 'entrada'),
	('c3d0a51e-8a54-46dd-a5f2-4d5836bb289c', 'General Motors', 'Aveo HB', 'ligero_a', 'entrada'),
	('5484c56b-9fb9-45b4-ac78-7b888154a46d', 'General Motors', 'G3 4 Ptas', 'ligero_a', 'entrada'),
	('a1a49bb7-946d-467a-b143-80a0a91e477d', 'General Motors', 'Matiz 5 Ptas', 'ligero_a', 'entrada'),
	('e034ef71-43a9-46eb-81b6-7a5cefd57a82', 'General Motors', 'Sonic', 'ligero_a', 'entrada'),
	('3f295f79-e90a-440e-8fea-e9efc74a7cb8', 'General Motors', 'Spark EV 5 Ptas.', 'ligero_a', 'entrada'),
	('ad499ae6-5ee8-4a8e-a1db-18c034cadfeb', 'General Motors', 'Spark NG', 'ligero_a', 'entrada'),
	('4f40fa71-29d6-457e-8bb5-bd791d5dd136', 'General Motors', 'Bolt', 'ligero_a', 'entrada'),
	('7a63f56c-33c6-439c-817d-e2782073feee', 'General Motors', 'Sonic 5 PTS', 'ligero_a', 'entrada'),
	('19233b7d-f8df-449a-8d9d-5e0885b11994', 'General Motors', 'Volt 4 Ptas.', 'ligero_a', 'entrada'),
	('e98b184e-48f6-4a6e-9c69-a30adb9a94ec', 'General Motors', 'Beat', 'ligero_a', 'entrada'),
	('80d3922a-f879-4067-bbd5-c6971e917c0b', 'General Motors', 'Beat 4 PTAS.', 'ligero_a', 'entrada'),
	('40ed6804-b867-4fed-864f-e3bba86a11cf', 'General Motors', 'Spark', 'ligero_a', 'entrada'),
	('8b206854-9a7b-46fb-b799-5322c0d90120', 'General Motors', 'Palio 4 Ptas', 'ligero_a', 'entrada'),
	('1f472ba8-e6c1-4bd7-9ff6-02bea2d00f95', 'General Motors', 'Palio 5 Ptas', 'ligero_a', 'entrada'),
	('ce666fe8-08c4-49b6-81e5-2028eea0d1bd', 'General Motors', 'Palio Adventurer', 'ligero_a', 'entrada'),
	('85d22a93-8107-4b13-ae7a-4949e386b0d1', 'Great Wall Motor', 'ORA 03', 'ligero_a', 'entrada'),
	('f62f4246-203f-4eca-9b87-0cfa67fbd476', 'Honda', 'Fit-', 'ligero_a', 'entrada'),
	('e36ece33-3cb3-4ccf-b835-a6f0f4e8cc9c', 'Honda', 'Fit', 'ligero_a', 'entrada'),
	('5ec24655-4484-4b05-b75f-d570daf8a843', 'Hyundai', 'Accent Hatchback', 'ligero_a', 'entrada'),
	('a2f645da-71d5-4b43-9da1-e2710a5fe275', 'Hyundai', 'Accent Sedan', 'ligero_a', 'entrada'),
	('6b65ddc0-519b-4ae4-8faa-e70f77d6a389', 'Hyundai', 'Grand I10', 'ligero_a', 'entrada'),
	('325ddcfe-3e10-4827-af0f-3732ad2eec84', 'Hyundai', 'Grand I10 Sed├ín', 'ligero_a', 'entrada'),
	('7a084561-3fda-4370-b7c0-623908a47bab', 'JAC', 'E 30x', 'ligero_a', 'entrada'),
	('678d2318-74c6-4257-aa67-30e133afca24', 'JAC', 'E J4', 'ligero_a', 'entrada'),
	('38efa26c-6791-483f-8dd5-c31ef57076eb', 'JAC', 'J4', 'ligero_a', 'entrada'),
	('65de5e6b-a887-4717-87af-dd373cedd0d3', 'KIA', 'KIA K3 Hatchback', 'ligero_a', 'entrada'),
	('46ac12fa-7a9b-4326-9df1-3832fe938cc1', 'KIA', 'KIA K3 Sed├ín', 'ligero_a', 'entrada'),
	('09798522-664b-4b83-81ba-be7492b33281', 'KIA', 'KIA R├¡o Sedan-', 'ligero_a', 'entrada'),
	('d8324d51-fa18-4afc-8013-abad0add187b', 'KIA', 'Kia R├¡o Hatchback-', 'ligero_a', 'entrada'),
	('71676fe3-a7dc-4135-a63c-a37c442e2656', 'KIA', 'KIA R├¡o Hatchback', 'ligero_a', 'entrada'),
	('2c73917e-b72b-4bbb-98ee-7c99ff4a4ed3', 'KIA', 'KIA R├¡o Sedan', 'ligero_a', 'entrada'),
	('5c9e05d7-47d9-4b92-866f-8dcb803a62e7', 'Mazda', 'Mazda 2 Hatchback', 'ligero_a', 'entrada'),
	('d7c5c19c-be2f-4375-8b77-49212e3287b3', 'Mazda', 'Mazda 2 Sed├ín', 'ligero_a', 'entrada'),
	('058cc578-4e65-44eb-906c-502d45fd9159', 'Mazda', 'Mazda 2-', 'ligero_a', 'entrada'),
	('8f2a571f-30e1-48ae-bcd5-d62ab29b1be7', 'Mazda', 'Mazda 2', 'ligero_a', 'entrada'),
	('b1a8364b-1f42-44f9-ab54-be626e6f8d9c', 'MG Motor', 'MG3', 'ligero_a', 'entrada'),
	('d78106c6-507d-49e4-8aea-be4e45d35d78', 'MG Motor', 'MG3HEV', 'ligero_a', 'entrada'),
	('8bde34f9-9d83-43fd-88d5-6040fb7f0f74', 'MG Motor', 'MG4', 'ligero_a', 'entrada'),
	('15e7cfcc-6367-464f-99b0-82de054617d3', 'Mini', 'Cooper', 'ligero_a', 'entrada'),
	('7ee1367a-82bc-4d2d-b3b1-9a9eb284a1bd', 'Mitsubishi', 'Space Star', 'ligero_a', 'entrada'),
	('d96a4342-a76b-46ea-b15c-7a7973090547', 'Mitsubishi', 'Mirage', 'ligero_a', 'entrada'),
	('5454ec78-f831-45fc-8a75-3e296f6bf2b9', 'Mitsubishi', 'Mirage G4', 'ligero_a', 'entrada'),
	('1bb3e7d6-e0a9-48bc-a0af-903c74a02e54', 'MOTORNATION', 'BAIC D20', 'ligero_a', 'entrada'),
	('937fc33d-df10-4475-8f9d-0d9cd0bcba6c', 'MOTORNATION', 'BAIC X25', 'ligero_a', 'entrada'),
	('9c8e1aa0-da54-492a-a761-6d2706006785', 'MOTORNATION', 'CHANGAN ALSVIN', 'ligero_a', 'entrada'),
	('f7e976c4-5b5b-4cd6-bb3c-bf37ff78866e', 'MOTORNATION', 'JMC EV-BLACK', 'ligero_a', 'entrada'),
	('4f0762ca-9887-4e42-989d-8512c09a55f8', 'Nissan', 'March', 'ligero_a', 'entrada'),
	('22725160-a86e-443a-a8bb-e24c99af5279', 'Nissan', 'Platina 4 PTS', 'ligero_a', 'entrada'),
	('da420ccc-b673-46a9-a3f5-dbdf404e10d0', 'Nissan', 'Tsuru 4 PTS', 'ligero_a', 'entrada'),
	('d289a807-b3c9-4583-b31e-32d27efc65c1', 'Nissan', 'Aprio', 'ligero_a', 'entrada'),
	('b7915a7a-5a05-4762-b925-5d07bfb496a8', 'Nissan', 'Micra', 'ligero_a', 'entrada'),
	('0a2d0cae-1a30-4f76-a54c-c7e18a02b4a0', 'Omoda', 'O5', 'ligero_a', 'entrada'),
	('b3ba2872-0cf9-408b-b845-11bf9983b192', 'Peugeot', '301', 'ligero_a', 'entrada'),
	('d0ec011e-afa8-466b-ace5-17bf0e88cef6', 'Peugeot', '206 3p', 'ligero_a', 'entrada'),
	('b6ed5585-da33-4a18-81f3-bc25ad72f22d', 'Peugeot', '206 5p', 'ligero_a', 'entrada'),
	('30bf9100-d9b9-46d2-9181-5b0547eab761', 'Peugeot', '206 Cc', 'ligero_a', 'entrada'),
	('9c1ee3cd-c42f-45e6-a659-5fb9478c95cf', 'Peugeot', '206 Sw', 'ligero_a', 'entrada'),
	('60b374fd-1894-46b5-932e-344a11ec525d', 'Peugeot', '207 3p', 'ligero_a', 'entrada'),
	('6a7fd547-7b48-465b-a8b7-f6f60717aeb7', 'Peugeot', '207 Compact', 'ligero_a', 'entrada'),
	('e4279cf4-0950-437e-beec-53dd9517d852', 'Peugeot', '207 Compact 3p', 'ligero_a', 'entrada'),
	('5afd1b78-e843-47f7-8063-7cab2829ff63', 'Peugeot', '207 Compact 5p', 'ligero_a', 'entrada'),
	('04a0464d-b4e1-4004-82b3-4cb4189ce7e7', 'Peugeot', '207 Sedan', 'ligero_a', 'entrada'),
	('bf1a4676-cde3-496b-84d9-742a3a2af456', 'Peugeot', '208', 'ligero_a', 'entrada'),
	('1443aff0-30eb-43d0-83f6-b68343d70bb0', 'Peugeot', 'Nuevo 207', 'ligero_a', 'entrada'),
	('7f1e2559-22e7-4099-b9ec-b6533fc333e7', 'Renault', 'Clio', 'ligero_a', 'entrada'),
	('b331bf40-0ff8-4946-967e-b83e18917bac', 'Renault', 'Kwid', 'ligero_a', 'entrada'),
	('ed8ca34f-f99e-444a-b1b8-7e16f78564dd', 'Renault', 'Logan', 'ligero_a', 'entrada'),
	('745d6452-8d27-47f8-b678-de3481d1179e', 'Renault', 'Kwid e-Tech', 'ligero_a', 'entrada'),
	('738e4c53-c00a-4512-a6e6-ccf1c591cad2', 'Renault', 'Scala', 'ligero_a', 'entrada'),
	('0c495a85-648a-4dcb-8476-439a8a27a07e', 'Renault', 'Twizy', 'ligero_a', 'entrada'),
	('7d9eb592-21b3-43d7-9195-b58bdfdfec11', 'Renault', 'Euro Clio', 'ligero_a', 'entrada'),
	('eac184d8-4fc8-4d3d-b28f-62ed10ba031d', 'Renault', 'MEGANE E-TECH', 'ligero_a', 'entrada'),
	('7f19d3e1-e837-4c4b-86db-abb4c7c685dd', 'Renault', 'ZOE', 'ligero_a', 'entrada'),
	('c075dccf-44b1-46c6-b9f5-9b97bf47c8b4', 'SEAT', 'Exeo', 'ligero_a', 'entrada'),
	('0741be16-2f0d-4ee6-938c-722d4f8aced3', 'SEAT', 'Altea', 'ligero_a', 'entrada'),
	('7c89466b-fd19-4652-8795-46ba6479a19d', 'SEAT', 'Cordoba', 'ligero_a', 'entrada'),
	('44aec625-08b7-416e-b15b-e9e91e861cfb', 'SEAT', 'Freetrack', 'ligero_a', 'entrada'),
	('e1733389-19ba-463e-938e-64f85585bdf9', 'SEAT', 'Ibiza', 'ligero_a', 'entrada'),
	('fd95422a-1518-4557-810e-78928cd52110', 'SEAT', 'Ibiza 2 Ptas', 'ligero_a', 'entrada'),
	('ae0f4e17-b015-4365-8a6c-9ce71360f503', 'SEAT', 'Ibiza 4 Ptas', 'ligero_a', 'entrada'),
	('65c4adcb-5e5c-4646-97a7-9a20a97e6359', 'Smart', 'Roadster', 'ligero_a', 'entrada'),
	('1521dd8b-0dd5-4cb7-bfba-5c866c2c8cc5', 'Smart', 'Otros Smart', 'ligero_a', 'entrada'),
	('d2a41d9b-5859-47f8-bec6-5416eed3d8b3', 'Suzuki', 'Baleno', 'ligero_a', 'entrada'),
	('479dd964-ef60-47da-8302-47d6b02c0461', 'Suzuki', 'DZIRE', 'ligero_a', 'entrada'),
	('174193eb-e8f0-42b8-b5f2-501b0b302df2', 'Suzuki', 'Ignis', 'ligero_a', 'entrada'),
	('9df542f7-718e-4e61-ba20-af0c13cea16b', 'Suzuki', 'SWIFT BG', 'ligero_a', 'entrada'),
	('61bde1a8-d078-4cd4-9da4-3cc91c0d4275', 'Suzuki', 'Swift', 'ligero_a', 'entrada'),
	('89d85e6b-067e-47b8-96a3-732f0e668167', 'Toyota', 'Yaris-R', 'ligero_a', 'entrada'),
	('c4d497c8-bc06-41a4-ae95-f2bc5bd01e04', 'Toyota', 'Yaris Hatchback', 'ligero_a', 'entrada'),
	('7c547a14-d86a-4ba7-b5c7-260b9de89090', 'Toyota', 'Prius-C', 'ligero_a', 'entrada'),
	('3eb41a66-a771-40dc-bf20-818beeacb937', 'Toyota', 'Yaris Hatchback', 'ligero_a', 'entrada'),
	('2d81fdb6-cd87-472a-80d8-420c0337653a', 'Toyota', 'Yaris Sedan', 'ligero_a', 'entrada'),
	('456ef4a2-a0ad-4688-907e-0e1aff872903', 'Toyota', 'Yaris Hatchback', 'ligero_a', 'entrada'),
	('e7b09b13-1ece-4f7d-846d-056f5a481061', 'Toyota', 'Yaris Sedan', 'ligero_a', 'entrada'),
	('9d428fc4-0c04-4eb9-bfa6-404e4d2c0be2', 'Volkswagen', 'Sedan', 'ligero_a', 'entrada'),
	('f7069025-d3bb-461e-a96f-44dc404cb82a', 'Volkswagen', 'Derby', 'ligero_a', 'entrada'),
	('67e389ed-9673-4320-957e-a9ce3cbe1ad0', 'Volkswagen', 'Crossfox', 'ligero_a', 'entrada'),
	('66a0a207-2df0-4aa1-a336-2bc2be984e13', 'Volkswagen', 'Gol', 'ligero_a', 'entrada'),
	('3da6c0ca-80bc-4864-91b7-861fbd1b6dd7', 'Volkswagen', 'Gol Sedan', 'ligero_a', 'entrada'),
	('d89ebe94-7bab-43f5-9758-724aab2c6850', 'Volkswagen', 'Lupo 2 Ptas', 'ligero_a', 'entrada'),
	('d7e119de-59f7-4095-882d-bceadc0b5745', 'Volkswagen', 'Lupo 4 Ptas', 'ligero_a', 'entrada'),
	('28016352-3511-4a61-9f18-d8b1ec66bdf0', 'Volkswagen', 'Pointer 2 Ptas', 'ligero_a', 'entrada'),
	('c6362315-a224-49dc-9166-cf109636daa9', 'Volkswagen', 'Pointer 4 Ptas', 'ligero_a', 'entrada'),
	('bab9e87d-fa85-4435-ab88-43e3ebb4c969', 'Volkswagen', 'Polo 4 Ptas', 'ligero_a', 'entrada'),
	('a918da13-dfef-4e4f-8526-c9f6a73bd03e', 'Volkswagen', 'Polo 5 Ptas', 'ligero_a', 'entrada'),
	('803efdcd-d66b-483a-8ded-f0d9f7817f65', 'Volkswagen', 'UP!', 'ligero_a', 'entrada'),
	('49860374-b3aa-4f44-a67b-e277581b30c7', 'Volkswagen', 'Virtus', 'ligero_a', 'entrada'),
	('462c7081-2bca-4a33-bd69-3307191d64ee', 'Volkswagen', 'Volkswagen Tera', 'ligero_a', 'entrada'),
	('25c1693e-8d4d-4bb7-8550-621dc74fc122', 'Volkswagen', 'Polo GTI', 'ligero_a', 'entrada'),
	('73967306-9824-446c-8ba9-ba155a6effdf', 'Volkswagen', 'Polo 4 Ptas', 'ligero_a', 'entrada'),
	('02253456-de9d-49d1-8c77-5fb24b7f7456', 'Volkswagen', 'Vento', 'ligero_a', 'entrada'),
	('ec44eb8a-3f17-4159-9efd-e92859c3076f', 'Volkswagen', 'Virtus', 'ligero_a', 'entrada'),
	('72b8ca4f-e9a4-4b98-bc7f-4fb2c2695c4e', 'Auteco', 'E-VAN S1.0T PRO', 'ligero_b', 'entrada'),
	('4f630ae8-b764-46d7-8845-dceb3a8ccf47', 'Auteco', 'E-Van B2.4T', 'ligero_b', 'entrada'),
	('be8133ea-bc65-4986-9213-266f99411cab', 'Changan', 'HONOR S', 'ligero_b', 'entrada'),
	('3bde4c27-2179-4674-ba8a-18c3aa2a50dd', 'Chrysler', 'Chrysler Pacifica', 'ligero_b', 'entrada'),
	('87b55593-f847-41fc-b7f5-09125bf448a9', 'Chrysler', 'Grand Caravan', 'ligero_b', 'entrada'),
	('9d9c8f04-4401-4a60-83a5-b461f29b6809', 'Chrysler', 'Voyager Town&Country LTD', 'ligero_b', 'entrada'),
	('65481970-1ba3-46a2-b8a7-0d5db9b7c716', 'Chrysler', 'Voyager Town&Country LX', 'ligero_b', 'entrada'),
	('f1cd6a0c-f279-4fc6-a101-25fb2675d9d9', 'Chrysler', 'Voyager', 'ligero_b', 'entrada'),
	('4f6bcea3-0f0b-465e-8a14-42d2d04a1756', 'Ford Motor', 'Freestar', 'ligero_b', 'entrada'),
	('a8b71c1c-029d-4676-9789-400a0e90ea59', 'Ford Motor', 'Club Wagon', 'ligero_b', 'entrada'),
	('ffe9fdf9-20b2-4f24-9f02-e5ecb719b712', 'Ford Motor', 'Econoline', 'ligero_b', 'entrada'),
	('85b82e3f-b8c9-4079-a81c-94da3c1c48ac', 'Ford Motor', 'Expedition', 'ligero_b', 'entrada'),
	('c500e55d-fea0-4d83-8f9d-500ab0156faa', 'General Motors', 'Escalade ESV SUV AWD', 'ligero_b', 'entrada'),
	('8210a37c-0dc2-4ae9-91d2-684de5f1da23', 'General Motors', 'Escalade EXT UUV 4X4', 'ligero_b', 'entrada'),
	('2545d3ae-f582-40d6-9655-872c30c24af2', 'General Motors', 'Brightdrop', 'ligero_b', 'entrada'),
	('ca4cef04-3ddb-4c26-920c-0754b05938fb', 'General Motors', 'Chevrolet Express MAX Cargo Van', 'ligero_b', 'entrada'),
	('e8541cb6-40fe-4b50-b73e-0cf648ccd240', 'General Motors', 'Tornado Van', 'ligero_b', 'entrada'),
	('2d1fb1a6-c10d-40f2-acb5-c10fab9ebbb5', 'General Motors', 'Chevrolet Express Cargo Van', 'ligero_b', 'entrada'),
	('3c55b4c2-8c67-4911-95a0-27a879adf02a', 'General Motors', 'Chevrolet Express Cutaway', 'ligero_b', 'entrada'),
	('d7c7086d-ab74-4d74-bfc8-04227da197a2', 'General Motors', 'Chevrolet Express Passenger Van', 'ligero_b', 'entrada'),
	('251f807e-dd56-42a4-987d-87bf83b5a345', 'General Motors', 'Escalade ESV SUV AWD', 'ligero_b', 'entrada'),
	('e1b336b4-1a96-4f08-8e20-1d3bdcb2374e', 'General Motors', 'Escalade Suv', 'ligero_b', 'entrada'),
	('1614d24f-34e8-4a1c-b590-81939c15fc79', 'General Motors', 'H2 Sut', 'ligero_b', 'entrada'),
	('c9b1e6a8-8d9a-4823-b6e6-2feb10c2ddc8', 'General Motors', 'H2 Suv', 'ligero_b', 'entrada'),
	('aacea5f1-9c22-48f8-9c0a-59b20692c975', 'General Motors', 'Montana Sv6 Van', 'ligero_b', 'entrada'),
	('5785fe0a-a5e2-410a-9496-c5135e8d8489', 'General Motors', 'Uplander Van', 'ligero_b', 'entrada'),
	('3a1de960-cb1d-4a98-b3a6-aee90bd32f39', 'General Motors', 'Venture Van', 'ligero_b', 'entrada'),
	('6783cae8-25db-42c9-a828-e0a3af78ff2f', 'Honda', 'Odyssey', 'ligero_b', 'entrada'),
	('fa929dd2-9beb-4546-bbfb-0139f7172b85', 'Honda', 'Odyssey', 'ligero_b', 'entrada'),
	('bbeb1548-1bf5-42b5-8d54-ff1fed782362', 'Hyundai', 'Starex', 'ligero_b', 'entrada'),
	('abe9607d-5b44-4d16-9e91-98734d56e397', 'JAC', 'E SUNRAY', 'ligero_b', 'entrada'),
	('01a09818-9dbf-436c-8c26-e485e6d2b75e', 'JAC', 'E Sunray City', 'ligero_b', 'entrada'),
	('a1038b02-639f-4245-99a2-08e60d8d9156', 'JAC', 'SUNRAY', 'ligero_b', 'entrada'),
	('702a813a-b348-4c23-931d-727cc9b66d03', 'JAC', 'Sunray City', 'ligero_b', 'entrada'),
	('86f68c5a-c512-43ca-bca9-42fa16bede80', 'KIA', 'Sedona', 'ligero_b', 'entrada'),
	('0abb492a-368f-42b2-8324-6cc28c554294', 'Lincoln', 'Aviator', 'ligero_b', 'entrada'),
	('b49c0b19-2155-40d0-bbc9-b40680b8b3de', 'Lincoln', 'Mariner', 'ligero_b', 'entrada'),
	('2d78f6ce-53aa-49be-bcb9-0f22fb1c6d32', 'Lincoln', 'Navigator', 'ligero_b', 'entrada'),
	('eff316b9-0240-4e51-a667-ded6c8067803', 'Mitsubishi', 'Grandis', 'ligero_b', 'entrada'),
	('1e72c562-f054-4ab5-807d-aeb81cfcf08d', 'MOTORNATION', 'BAIC M50S', 'ligero_b', 'entrada'),
	('646f2207-291a-455a-904e-23080de72a0e', 'MOTORNATION', 'DFSK EC35', 'ligero_b', 'entrada'),
	('a63777ab-9d99-4f0f-b715-711b8f1012fe', 'Nissan', 'NV2500 V8 Toldo Alto', 'ligero_b', 'entrada'),
	('d935c177-fa5f-4bb2-91dc-ea0f171e20e0', 'Nissan', 'NV2500 V6 Toldo Alto', 'ligero_b', 'entrada'),
	('5dc380ae-37e0-43e4-81a0-79d681406c87', 'Nissan', 'NV2500 V6 Toldo Bajo', 'ligero_b', 'entrada'),
	('274611bb-f635-496b-a8e9-3356711a1f62', 'Nissan', 'NV2500 V8 Toldo Bajo', 'ligero_b', 'entrada'),
	('4e5dc6d7-248f-495b-b0aa-32bae4d17f7f', 'Nissan', 'Quest', 'ligero_b', 'entrada'),
	('1a7c6592-1dab-4d9e-899b-ba6a7cfdb234', 'Peugeot', 'Partner Rapid', 'ligero_b', 'entrada'),
	('3e477ce3-e6f5-4fc6-83fc-da522df8a90b', 'Peugeot', 'E-Partner', 'ligero_b', 'entrada'),
	('a1cb45a9-d9cc-4282-b852-112bf1978939', 'Renault', 'Master', 'ligero_b', 'entrada'),
	('79f4ce27-c047-47cf-aa5c-8e2d60bc3ac5', 'Renault', 'Master E- Tech el├®ctrico', 'ligero_b', 'entrada'),
	('5c02c3cd-7095-4367-a963-4c8a42b583a6', 'SEAT', 'Alhambra', 'ligero_b', 'entrada'),
	('e04fdac3-676f-45ff-8a46-b10d9301297f', 'Toyota', 'Sienna', 'ligero_b', 'entrada'),
	('3b71886c-507e-4c81-9938-905b077385f1', 'Volkswagen', 'Routan', 'ligero_b', 'entrada'),
	('e3f420e9-47bc-4d39-946b-48bc03b715e4', 'Volkswagen', 'Sharan', 'ligero_b', 'entrada'),
	('c9e46573-d02d-4a12-a249-beddefa09d17', 'Porsche', 'Cayenne', 'ligero_b', 'media'),
	('6a0e8e18-5e27-4abd-8a9d-87d75ba213e2', 'Porsche', 'Macan', 'ligero_b', 'media'),
	('5e628e05-c3b8-4f04-8048-4e83af1c512c', 'Changan', 'Eado Plus', 'ligero_a', 'media'),
	('cb00e51b-0b6a-4f88-b20f-9b08a2176ff3', 'Changan', 'Eado Plus IDD', 'ligero_a', 'media'),
	('2e386255-b2ca-43d3-b538-f82544cdbf44', 'Chrysler', 'PT Cruiser', 'ligero_a', 'media'),
	('04b30539-5fb0-41f4-a7fc-c61f0bdc3cff', 'Chrysler', 'Pt Cruiser Conv', 'ligero_a', 'media'),
	('8c56c4ee-a126-498a-a15c-ed4df9a12624', 'Chrysler', 'Nuevo Attitude', 'ligero_a', 'media'),
	('41cedc9d-f13e-4a6a-9d8a-3fd2f689e2f1', 'Chrysler', 'Avenger', 'ligero_a', 'media'),
	('ae23f7bb-f298-427b-8309-c056a480d6a4', 'Chrysler', 'Caliber', 'ligero_a', 'media'),
	('0f64d282-cb08-4adb-b660-3b2d99873689', 'Chrysler', 'Cirrus', 'ligero_a', 'media'),
	('122f4047-3dcd-4656-9cd4-19c17ef428b9', 'Chrysler', 'Cirrus Coupe', 'ligero_a', 'media'),
	('58982c44-0288-432b-ba1a-a7c98879eb9b', 'Chrysler', 'Dart', 'ligero_a', 'media'),
	('0311c343-d74f-426b-9684-37c544bf3f54', 'Chrysler', 'Neon', 'ligero_a', 'media'),
	('568d68a0-cea9-4351-b61f-16c19095e23c', 'Chrysler', 'Stratus', 'ligero_a', 'media'),
	('85a350f2-0bfc-461d-82a6-5ae47a175127', 'Chrysler', 'Dodge Neon', 'ligero_a', 'media'),
	('db2e0c20-fbd5-426f-865b-a4cbefd5058d', 'Fiat', 'Nuevo Palio', 'ligero_a', 'media'),
	('68a0de66-1f86-4bab-b377-d4933358f680', 'Fiat', 'Grande Punto 3 Ptas', 'ligero_a', 'media'),
	('99c2172b-18d7-4397-a01f-0587336a46f2', 'Fiat', 'Grande Punto 5 Ptas', 'ligero_a', 'media'),
	('0a8bec59-e301-44b6-b7db-ac86d4f5559a', 'Fiat', 'Grande Punto Turbo', 'ligero_a', 'media'),
	('f227a8f6-df33-466f-a876-11b1e09bf0ef', 'Fiat', '500L', 'ligero_a', 'media'),
	('15b49f30-0fb6-41f2-96ba-4b0bf1e9ce8c', 'Fiat', 'Linea', 'ligero_a', 'media'),
	('c086b30f-36d7-40b6-a555-fe9f6ecc21dc', 'Ford Motor', 'Focus ZX3', 'ligero_a', 'media'),
	('ec38c110-e3da-4f82-b004-04f8046c0bdd', 'Ford Motor', 'Fusion', 'ligero_a', 'media'),
	('9e87bce7-fef8-4577-bd94-b8dde96e364e', 'Ford Motor', 'Fusion Hibrido', 'ligero_a', 'media'),
	('55c7fd18-5009-4ef3-ba64-60aec2cc59af', 'Ford Motor', 'Focus St', 'ligero_a', 'media'),
	('9ec81232-fa6d-469c-9150-6b805946c7cc', 'Ford Motor', 'Mondeo', 'ligero_a', 'media'),
	('77cec6ea-be18-488c-b53d-feef3e055ce3', 'Ford Motor', 'Focus Sedan', 'ligero_a', 'media'),
	('3e75ad16-68ac-421f-b58b-1c2e99181275', 'Ford Motor', 'Focus 5 Dr', 'ligero_a', 'media'),
	('47731416-fe61-4697-8164-c81d6cf353b9', 'General Motors', 'Cruze 4 PTAS-', 'ligero_a', 'media'),
	('b671b57e-3cc2-4201-93e9-2e381f085135', 'General Motors', 'Cruze 5 Ptas', 'ligero_a', 'media'),
	('b3fad731-a3b2-45c4-be80-1c5e67d5ade3', 'General Motors', 'HHR 5 PTAS', 'ligero_a', 'media'),
	('b8ff640b-71ac-41e5-8bc0-d1fbd51125fb', 'General Motors', 'Onix', 'ligero_a', 'media'),
	('8b71c4cb-8bf9-4c54-82ea-b41b5c0238db', 'General Motors', 'Sunfire 4 Ptas', 'ligero_a', 'media'),
	('6c2125a3-b65c-4280-a0d8-f2aafa63a188', 'General Motors', 'Sunfire GT 2 Ptas', 'ligero_a', 'media'),
	('598f9d44-3b6f-43f6-beca-7a7a2794b1a0', 'General Motors', 'Vectra 4 Ptas', 'ligero_a', 'media'),
	('a6536f4c-733e-4ed9-8c19-00184f0b5ef7', 'General Motors', 'Zafira Monocab', 'ligero_a', 'media'),
	('53f40700-1b88-4b87-91a4-89ae9ffba327', 'General Motors', 'Astra 3 Ptas', 'ligero_a', 'media'),
	('8806d04e-cc7d-42c7-8d3f-12733ba39a73', 'General Motors', 'Astra 4 Ptas', 'ligero_a', 'media'),
	('7cb5d736-a547-4ae8-80f7-75dd3c28579d', 'General Motors', 'Astra 5 Ptas', 'ligero_a', 'media'),
	('69a43aa7-7ac1-49aa-b854-3598b969b779', 'General Motors', 'Meriva Monocab', 'ligero_a', 'media'),
	('c6d6d908-1220-4b03-82a5-f2874c00d0b3', 'General Motors', 'Cavalier 4 Ptas', 'ligero_a', 'media'),
	('e9b3c8ab-ebd3-41ce-83af-c98568e5f75b', 'General Motors', 'Onix', 'ligero_a', 'media'),
	('a724b89f-5eea-4b6d-a3b1-5538c6f36f33', 'General Motors', 'Cruze 4 Ptas', 'ligero_a', 'media'),
	('7516e8c4-17a3-445d-8112-aebb525fe3b6', 'General Motors', 'Epica', 'ligero_a', 'media'),
	('6fd2951d-d458-4215-a699-db30023ed268', 'General Motors', 'Optra', 'ligero_a', 'media'),
	('c344db1c-63a7-4537-9646-87a4bdc841cb', 'General Motors', 'G5 2 Ptas', 'ligero_a', 'media'),
	('44461bfb-7603-4243-8abc-68813bf3d51f', 'General Motors', 'G5 4 Ptas', 'ligero_a', 'media'),
	('348715a0-717a-47de-9dd4-1b27652218ff', 'General Motors', 'G6 4 Ptas', 'ligero_a', 'media'),
	('189b4017-0cce-496f-b7a9-1a33b9edb9c7', 'General Motors', 'Grand Am 4 Ptas', 'ligero_a', 'media'),
	('20022f9a-5a46-4ae0-ba5b-6faf58adcdde', 'General Motors', 'Malibu 4 Ptas', 'ligero_a', 'media'),
	('e4930f1e-f8d4-435b-9408-e93fdd0b0b05', 'Honda', 'Honda City', 'ligero_a', 'media'),
	('a350e4d0-eb95-4783-a13b-3598beb1df2a', 'Honda', 'Civic', 'ligero_a', 'media'),
	('14535c01-fb16-4b06-a808-8e7417b75647', 'Honda', 'Civic 2pts Ta', 'ligero_a', 'media'),
	('3007d051-d416-4562-b158-5f135ba1dfe7', 'Honda', 'Civic Si', 'ligero_a', 'media'),
	('6d379bc5-c755-47a3-bbbe-51ddd2d0d2ca', 'Honda', 'Honda City', 'ligero_a', 'media'),
	('de4edc72-ec26-4f8c-93fc-413dbcf69c76', 'Honda', 'Civic', 'ligero_a', 'media'),
	('fb77cbe9-aa67-4a12-8f7d-45bfa600752c', 'Honda', 'Civic 2pts Ta', 'ligero_a', 'media'),
	('2bcdc742-3ef3-45c7-b416-d7e3960e7f28', 'Honda', 'Civic 2pts Tm', 'ligero_a', 'media'),
	('a1a462bc-0284-4617-942a-0d5cafa908a7', 'Honda', 'Civic Ima', 'ligero_a', 'media'),
	('6d329390-9c8c-4f89-8edb-978ea55bd526', 'Honda', 'Insight Hybrid', 'ligero_a', 'media'),
	('dc7bdcb9-4906-4d68-8647-2a1c010a3416', 'Honda', 'Honda City', 'ligero_a', 'media'),
	('dd1731f2-a671-4f5c-9546-1f731c93a39b', 'Honda', 'CR-Z', 'ligero_a', 'media'),
	('4aa547d5-121a-4e37-a298-60274c67043e', 'Honda', 'Honda City', 'ligero_a', 'media'),
	('66e12c99-964a-47ed-a835-77340a0094c8', 'Hyundai', 'HB20 HATCHBACK', 'ligero_a', 'media'),
	('1d6566dd-30de-461d-8fe7-f58e7f33cebc', 'Hyundai', 'HB20 SEDAN', 'ligero_a', 'media'),
	('1baaf0fa-2709-4cd0-855a-81690bef6459', 'Hyundai', 'Ioniq', 'ligero_a', 'media'),
	('49c6d71d-f602-48cc-a2f8-92c6a893a903', 'Hyundai', 'Ioniq 5', 'ligero_a', 'media'),
	('0db4b32f-30d1-4d35-98cb-a2349f46ddd1', 'Hyundai', 'Elantra', 'ligero_a', 'media'),
	('de849ab4-495b-4bc6-9476-494faee1b904', 'Hyundai', 'Sonata', 'ligero_a', 'media'),
	('6d100d9c-9c2a-4501-9529-6306a1eaf302', 'JAC', 'E 10X', 'ligero_a', 'media'),
	('d227f02e-9575-4545-ba92-c7dc3c3e3096', 'JAC', 'E J7', 'ligero_a', 'media'),
	('2c05f214-eb06-4142-95d6-8395acd4e12f', 'JAC', 'J7', 'ligero_a', 'media'),
	('33a86cf6-0ff1-40a3-be46-9dbb91dc3d09', 'JAC', 'Traveler', 'ligero_a', 'media'),
	('ff64ee67-707a-4a0c-8560-126d09c2b4e3', 'KIA', 'Forte Hatchback', 'ligero_a', 'media'),
	('59449f2f-a381-427f-abe9-78af960397ab', 'KIA', 'Forte-', 'ligero_a', 'media'),
	('1a9c1110-8ecc-4e58-bd1c-d36ec1e192e1', 'KIA', 'K4 Hatchback', 'ligero_a', 'media'),
	('b72578a7-84c1-4f72-a5fa-388dc4a08b37', 'KIA', 'K4 Sed├ín', 'ligero_a', 'media'),
	('f0fad1aa-4f04-4fee-afbe-aeba6431b8ad', 'KIA', 'Forte', 'ligero_a', 'media'),
	('26b9aa5c-f54d-43fe-8c0c-a41f59e754bd', 'KIA', 'Forte Hatchback', 'ligero_a', 'media'),
	('537306ff-988e-44bb-a13a-671fca7a4c61', 'Mazda', 'Mazda 3 Hatchback', 'ligero_a', 'media'),
	('69f88988-08c2-44a2-912b-fc77e47de968', 'Mazda', 'Mazda 3 Sed├ín-', 'ligero_a', 'media'),
	('245a5f30-df61-4069-8e1e-1f4d7d6d0987', 'Mazda', 'Mazda 3 Hatchback', 'ligero_a', 'media'),
	('5f4f101b-1762-429d-951f-721f977f94cf', 'Mazda', 'Mazda 3 Sed├ín', 'ligero_a', 'media'),
	('93b9cbd4-cad5-450f-8184-ebb348c1fdce', 'Mazda', 'Mazda 5', 'ligero_a', 'media'),
	('ccdf460f-11c9-4bc2-a736-a06aaa094b60', 'Mercedes Benz', 'B 200', 'ligero_a', 'media'),
	('695404f5-198a-46f2-bc5a-abdac000a329', 'Mercedes Benz', 'A 160', 'ligero_a', 'media'),
	('0a450d21-847e-4fc0-836f-2d4b8a87892a', 'MG Motor', 'GT', 'ligero_a', 'media'),
	('dc92723a-188f-421e-b952-82f0e321ff43', 'MG Motor', 'MG5', 'ligero_a', 'media'),
	('9c261795-f6fe-4aa3-90db-78094184a55a', 'Mitsubishi', 'Galant', 'ligero_a', 'media'),
	('bee08a38-b294-4e52-9cf5-ebe96248ca2f', 'Mitsubishi', 'Lancer', 'ligero_a', 'media'),
	('69a2de9c-959b-44f8-870f-7ec25e151e37', 'MOTORNATION', 'BAIC EU5', 'ligero_a', 'media'),
	('c181a292-8ceb-4143-8e71-b657643d69cc', 'MOTORNATION', 'BAIC U5', 'ligero_a', 'media'),
	('a5b9bb8e-e6e8-4d19-bb8f-6b7b229b1648', 'Nissan', 'Note', 'ligero_a', 'media'),
	('0df2ac0d-0f58-4d69-9458-f0823ba5691b', 'Nissan', 'Sentra', 'ligero_a', 'media'),
	('68e44492-f19a-484c-90be-8b25191050cd', 'Nissan', 'Sentra 4 PTS', 'ligero_a', 'media'),
	('c59d04f8-1f79-4cb5-b8e3-bc6c879c8364', 'Nissan', 'Sentra SE R', 'ligero_a', 'media'),
	('81711444-49a2-4d55-95cf-7d923a3ff2ae', 'Nissan', 'Tiida 5 PTS', 'ligero_a', 'media'),
	('f54426b2-eb41-4965-ba3b-8013b6f11afa', 'Nissan', 'Tiida Sedan', 'ligero_a', 'media'),
	('185aa82b-5cdf-4106-a48b-b4fd0be73277', 'Nissan', 'Versa', 'ligero_a', 'media'),
	('eb02b815-5984-4945-8b28-70dce2e6dcd8', 'Nissan', 'Juke', 'ligero_a', 'media'),
	('ca765784-09ba-4cbb-ab8f-cfa5d3521f5f', 'Nissan', 'Leaf', 'ligero_a', 'media'),
	('a6c1970d-103c-403e-952f-c06031986081', 'Nissan', 'Almera 4 Pts', 'ligero_a', 'media'),
	('abbf11d4-21b9-4cb1-8534-46e20aa16cb5', 'Peugeot', '307 4p', 'ligero_a', 'media'),
	('ceade697-bca5-495a-81d5-e7f6de4a15c1', 'Peugeot', 'Grand Raid', 'ligero_a', 'media'),
	('a3797fcd-1d8b-4c9a-b56d-8b7567e5674d', 'Peugeot', '207 CC', 'ligero_a', 'media'),
	('aceb8736-5961-4bf2-a03e-107c12061aa2', 'Peugeot', '207 Rc', 'ligero_a', 'media'),
	('a10787aa-d084-4e10-858d-9c7664c25dc9', 'Peugeot', '307 3p', 'ligero_a', 'media'),
	('2504430c-2fcc-4a61-ad71-27a55d025903', 'Peugeot', '307 5p', 'ligero_a', 'media'),
	('7859830c-6269-449c-b840-8a1040de5bfd', 'Peugeot', '307 Break', 'ligero_a', 'media'),
	('31634736-0a47-4a86-a569-37393a575295', 'Peugeot', '307 Cc', 'ligero_a', 'media'),
	('4dbff152-a22c-47d6-8d2e-589e1414cda6', 'Peugeot', '307 Sw', 'ligero_a', 'media'),
	('0b59974e-a481-4be7-8bdb-61aca4de155f', 'Peugeot', '308', 'ligero_a', 'media'),
	('ae82d4f2-9574-4308-8842-5cae99fa59ad', 'Peugeot', '308 Cc', 'ligero_a', 'media'),
	('1466f5c6-01ac-4c92-928e-cc0441f9d94f', 'Peugeot', 'Grand Raid Hdi', 'ligero_a', 'media'),
	('aa6d6deb-8047-4658-a608-2e31115c29ea', 'Renault', 'Scenic', 'ligero_a', 'media'),
	('b137744e-47ae-4ea3-946b-bb11dbb8a44c', 'Renault', 'Kangoo 7 Plazas', 'ligero_a', 'media'),
	('66204a1d-cbfe-406a-9c5d-5a1bae4772d0', 'Renault', 'Kangoo Vp', 'ligero_a', 'media'),
	('c0df85df-c0b1-4ec7-8c7e-50c17afca4d6', 'Renault', 'Kardian', 'ligero_a', 'media'),
	('e3e0384c-9394-48e8-b691-f82a0933d088', 'Renault', 'Stepway', 'ligero_a', 'media'),
	('4d03d49b-b64d-45cb-bfea-06b59d06f195', 'Renault', 'Fluence', 'ligero_a', 'media'),
	('48337f59-080f-46ec-b054-74a088555e62', 'Renault', 'Megane II 3 Ptas', 'ligero_a', 'media'),
	('785a2bae-1aec-418c-8705-738704232c2f', 'Renault', 'Megane II 3 Ptas Sport', 'ligero_a', 'media'),
	('3be75714-32bb-4dc4-a0a1-22bb4ac8460c', 'Renault', 'Megane II 5 Ptas', 'ligero_a', 'media'),
	('cf6b0903-5406-4134-9cca-a3f03e55dbf4', 'Renault', 'Megane Ii Cc', 'ligero_a', 'media'),
	('1802ef44-1c2b-475c-8619-294812117507', 'Renault', 'Megane II Gt 3 Ptas', 'ligero_a', 'media'),
	('24dfe14b-af75-41c1-b753-9828b3cef6a6', 'Renault', 'Megane II Gt 5 Ptas', 'ligero_a', 'media'),
	('bb672c93-2d1d-4d0c-86ae-db27bcec2c3b', 'Renault', 'Scenic II', 'ligero_a', 'media'),
	('604ae8fb-0ebe-4097-b007-52d4144d3324', 'Renault', 'Megane II Sedan', 'ligero_a', 'media'),
	('3017cb38-5de5-4938-9f66-b9cbe66b25d0', 'SEAT', 'Nuevo Toledo', 'ligero_a', 'media'),
	('0b412392-3133-459d-978f-b305298d4c3d', 'SEAT', 'Leon ST', 'ligero_a', 'media'),
	('6554fff8-9e64-4d52-95bf-68bbf1a82e8d', 'SEAT', 'Leon Sc 2p', 'ligero_a', 'media'),
	('eba76027-ecce-4d96-ad7c-1de514883b73', 'SEAT', 'Toledo', 'ligero_a', 'media'),
	('aa25e9b4-4848-44f1-aa50-50ed0d244766', 'Subaru', 'Impreza', 'ligero_a', 'media'),
	('2b6f93fc-5e69-4d96-9409-0b182cb3ea01', 'Subaru', 'Impreza HB', 'ligero_a', 'media'),
	('22707378-98c0-456e-ba4b-85ab48b3f8b1', 'Suzuki', 'Ciaz', 'ligero_a', 'media'),
	('5606b8bc-cdd7-4a4c-90a1-8b58152a1647', 'Suzuki', 'Ertiga', 'ligero_a', 'media'),
	('81c8037d-78a6-406b-8c29-b95345c94ad4', 'Suzuki', 'Aerio Ta', 'ligero_a', 'media'),
	('3ce0c2c4-63a8-4e7a-b81f-8c8d1319fac3', 'Suzuki', 'Aerio Tm', 'ligero_a', 'media'),
	('87ca83ac-071c-473f-a4be-f563731d2057', 'Suzuki', 'Sx4 Sedan Ta', 'ligero_a', 'media'),
	('3b89fcff-7a03-47b2-817b-f4595685c496', 'Suzuki', 'Sx4 Sedan Tm', 'ligero_a', 'media'),
	('78295940-a8df-46b8-9eaf-7ec442691cb9', 'Suzuki', 'Sx4 X-Over Ta', 'ligero_a', 'media'),
	('0b4c0fef-4812-43ee-85ef-d267b1663397', 'Suzuki', 'Sx4 X-Over Tm', 'ligero_a', 'media'),
	('66b64b00-e046-4326-9eb4-9f79808dac73', 'Toyota', 'Corolla', 'ligero_a', 'media'),
	('0d7338b2-8c37-4578-9ddf-177675e20410', 'Toyota', 'Matrix', 'ligero_a', 'media'),
	('8a56fbaf-4a2f-4c9b-bcef-2c40494dd812', 'Toyota', 'Corolla', 'ligero_a', 'media'),
	('8fc9948d-faf1-44d1-a736-3f7727154abc', 'Toyota', 'Avanza', 'ligero_a', 'media'),
	('99b40cf3-96fd-4047-b90c-c3121885e248', 'Volkswagen', 'Beetle', 'ligero_a', 'media'),
	('72328a04-6898-4db6-82a9-48e8be0de7f8', 'Volkswagen', 'Beetle Cabrio', 'ligero_a', 'media'),
	('22d30b90-2d6a-4ce1-a52d-408c0368d5d1', 'Volkswagen', 'Bora', 'ligero_a', 'media'),
	('323ec2a8-edca-4e61-9c46-729bd6b5178b', 'Volkswagen', 'Bora TDI', 'ligero_a', 'media'),
	('de4f3f77-7edc-419e-b60d-a23a6217be71', 'Volkswagen', 'Golf Variant-/Crossgolf', 'ligero_a', 'media'),
	('0fad0eb5-18aa-42a8-857a-d080b6db01de', 'Volkswagen', 'Golf-', 'ligero_a', 'media'),
	('ea609b26-7a9f-4e41-b7b8-5feb3009c775', 'Volkswagen', 'Jetta', 'ligero_a', 'media'),
	('b8bd3d86-98b0-46f2-a3c5-ff160d739cba', 'Volkswagen', 'Jetta 4 PTAS', 'ligero_a', 'media'),
	('7bd78594-e01a-44c0-bbc0-fe5d8cc7aaee', 'Volkswagen', 'Jetta TDI', 'ligero_a', 'media'),
	('84aa5163-a12a-4e14-ba99-a08f5f72b6a7', 'Volkswagen', 'Nuevo Jetta', 'ligero_a', 'media'),
	('9824204b-c49e-4b05-bc96-561fa3e99ac0', 'Volkswagen', 'Nuevo Jetta TDI', 'ligero_a', 'media'),
	('239748bb-7895-4189-8b20-005b6a01ce44', 'Volkswagen', 'Sportwagen', 'ligero_a', 'media'),
	('1b0eb38a-65ff-4a89-a9fc-5da3bffc0142', 'Volkswagen', 'Sport Van', 'ligero_a', 'media'),
	('a322d58c-c4a9-41cf-8c15-5dc77e288c39', 'Volkswagen', 'Golf', 'ligero_a', 'media'),
	('ab4573ea-a73d-4f83-9b13-a355f678f203', 'Volkswagen', 'Pointer Wagon', 'ligero_a', 'media'),
	('8e283dd8-083c-4cc2-a3bc-3487904072e8', 'Acura', 'ADX', 'ligero_b', 'media'),
	('0e269080-2b55-4556-a598-c18d29e7a6a5', 'Acura', 'Mdx', 'ligero_b', 'media'),
	('f4ca60fb-0fae-4532-8f7d-a7a0340e7f5d', 'Acura', 'ZDX', 'ligero_b', 'media'),
	('c75f6c41-02bf-4a7b-b7c6-f9432853c310', 'Acura', 'Mdx', 'ligero_b', 'media'),
	('91c11058-6ef8-45c8-b5d1-7ac8fbd4c195', 'Acura', 'Rdx', 'ligero_b', 'media'),
	('3adff771-087a-4142-81cc-0d9ac9990a5b', 'Alfa Romeo', 'TONALE', 'ligero_b', 'media'),
	('c2837686-069f-468b-bf56-cb419f24250b', 'Alfa Romeo', 'Junior', 'ligero_b', 'media'),
	('d5b4eeaf-f9e7-4640-93b1-534fd0a3bced', 'Audi', 'Q5', 'ligero_b', 'media'),
	('8b351403-288b-4c17-afd8-3f1ef159c687', 'Audi', 'Audi Q7 3.0 TDI', 'ligero_b', 'media'),
	('9308dbdc-e923-4f3c-93e5-b52f53ff61c3', 'Audi', 'Audi Q7 4.2', 'ligero_b', 'media'),
	('be4e7ff9-f1f5-42de-8312-b2ef566c4f67', 'Audi', 'Q5 2.0T', 'ligero_b', 'media'),
	('b624633a-d2b3-4930-9351-e7b332025dab', 'Audi', 'Q5 3.0 TDI', 'ligero_b', 'media'),
	('d47851df-5e2a-45ee-89b8-30fdffd389fe', 'Audi', 'Q5 3.2', 'ligero_b', 'media'),
	('df9996b2-289c-43e9-a552-df56e5b9cb3d', 'Audi', 'Q7', 'ligero_b', 'media'),
	('ee085b73-894f-4f2f-935e-23e0c8d0a39e', 'Audi', 'Q7 3.0T FSI', 'ligero_b', 'media'),
	('8f524e57-0328-46ed-a781-219569c803c9', 'Audi', 'Q8', 'ligero_b', 'media'),
	('9a99b5a7-d5da-4347-9c2f-82a75601a25c', 'Audi', 'e-tron', 'ligero_b', 'media'),
	('8c0f0cc4-1fbe-4be2-920c-45af2c63f5e6', 'Audi', 'Audi Q7 3.6', 'ligero_b', 'media'),
	('e4c0e4b3-3e43-44e7-a067-99cdee63b3fc', 'Audi', 'Audi Q7 4.2 TDI', 'ligero_b', 'media'),
	('72341e87-6a3b-48ba-860b-01007d5af679', 'Audi', 'Q7-', 'ligero_b', 'media'),
	('62988527-bb10-4559-a7b6-4e1a55c3bec5', 'Audi', 'Q3-', 'ligero_b', 'media'),
	('900cc132-e9dd-4039-87b1-6e9fb6c6617e', 'Audi', 'Q 3', 'ligero_b', 'media'),
	('7a5c3e15-4c6d-4d25-98a5-85ae9ed8ff1b', 'Audi', 'Q3 SB', 'ligero_b', 'media'),
	('962e6f6e-2f97-4418-b1e6-8c797fc565d2', 'Auteco', 'E-TRUCK B2.0T', 'ligero_b', 'media'),
	('cfc6ab69-73da-4b67-9a03-b2a28124b30b', 'Auteco', 'RICH 6 EV', 'ligero_b', 'media'),
	('6883b6d2-4c66-45bd-8536-cd84a9a234c8', 'Auteco', 'Rich 7EV 4x4', 'ligero_b', 'media'),
	('e806f884-869f-43a4-804e-81754a8d7de0', 'BMW', 'X1', 'ligero_b', 'media'),
	('d68612e4-384b-4a9a-82d9-08fbf478dfa6', 'BMW', 'X2', 'ligero_b', 'media'),
	('6df96b4b-85d7-44f0-a942-bd887b887577', 'BMW', 'X5 M', 'ligero_b', 'media'),
	('350b365d-bbbb-4bf9-a97c-1d3bac564b30', 'BMW', 'X6 M', 'ligero_b', 'media'),
	('af9391f8-0be6-4c63-bf8a-b110b5ef281a', 'BMW', 'iX', 'ligero_b', 'media'),
	('dab0ecb7-6280-4b49-b776-6affc601beeb', 'BMW', 'iX2', 'ligero_b', 'media'),
	('4be265ed-73e1-4c5c-aca5-91b4f33490cc', 'BMW', 'X3 2.5I', 'ligero_b', 'media'),
	('cdcaecdc-ef4b-4614-83bf-a986f1ec7204', 'BMW', 'X3 3.0I', 'ligero_b', 'media'),
	('a97280b4-90e0-48b0-91a4-e375a368fba0', 'BMW', 'iX3', 'ligero_b', 'media'),
	('3855c93a-f108-4ffb-9474-dd616bbaf3d9', 'BMW', 'X3', 'ligero_b', 'media'),
	('a66ed187-9574-4517-b313-392c4d56d0c2', 'BMW', 'X3 Xdrive 28ia', 'ligero_b', 'media'),
	('41f5c932-bacb-4610-b7da-51538e14e76b', 'BMW', 'X3 Xdrive35ia', 'ligero_b', 'media'),
	('62497391-214a-4e0f-b2e2-d968ae34b8b5', 'BMW', 'X4', 'ligero_b', 'media'),
	('06a3ce7d-b1e3-47c9-8267-402cb0565f35', 'BMW', 'X5', 'ligero_b', 'media'),
	('b8a2984b-4888-44a7-b5a7-8762338b7812', 'BMW', 'X5 3.0I', 'ligero_b', 'media'),
	('48f1fb3b-b2ad-4d48-8ea4-2692014a3007', 'BMW', 'X5 4.4I', 'ligero_b', 'media'),
	('a975ab62-406d-46ee-ba00-7a96d00dacc8', 'BMW', 'X5 4.8I', 'ligero_b', 'media'),
	('4f434c58-d5c6-42aa-935d-ffb4cc48d3a2', 'BMW', 'X5 Xdrive35I', 'ligero_b', 'media'),
	('d38ff136-34a5-4a8d-b164-4f22cb6b7ae9', 'BMW', 'X5 Xdrive50I', 'ligero_b', 'media'),
	('40d227e7-f472-405d-bd72-3225c928b4ca', 'BMW', 'X6', 'ligero_b', 'media'),
	('9a99d20d-1929-4ffa-8643-257f7d01e5dd', 'BMW', 'X7', 'ligero_b', 'media'),
	('a048d984-7936-46ed-8995-e469108226f2', 'Changan', 'CS35 PLUS', 'ligero_b', 'media'),
	('a5ed0b27-b002-4397-9ac4-af009a9bad1f', 'Changan', 'CS55 PLUS', 'ligero_b', 'media'),
	('5ebe2475-7228-472a-95bf-280da231f86a', 'Changan', 'CS55 Plus IDD', 'ligero_b', 'media'),
	('9b4f5e66-7599-4cd9-bf3f-e37bf56bbaa9', 'Changan', 'CS75', 'ligero_b', 'media'),
	('29047af3-0da2-4ebd-941c-8b915f008335', 'Changan', 'CS95', 'ligero_b', 'media'),
	('969d508c-3e37-4cc5-8352-45dce812fd6d', 'Changan', 'DEEPAL S07 BEV', 'ligero_b', 'media'),
	('0be53f50-99d3-48f9-a59c-8120b6c7a320', 'Changan', 'DEEPAL S07 REEV', 'ligero_b', 'media'),
	('b3e9acd4-b444-4ef5-9b3c-dc163f949d26', 'Changan', 'UNI-K', 'ligero_b', 'media'),
	('e5adc796-73cc-49ea-9b03-6fbdcfeb9e19', 'Changan', 'HUNTER CHASIS', 'ligero_b', 'media'),
	('c4107b87-dfab-4c4f-b00c-e55e558070e1', 'Changan', 'HUNTER PLUS', 'ligero_b', 'media'),
	('fe7b75b2-6176-46eb-b0ee-ef99447eff8e', 'Changan', 'HUNTER WORK', 'ligero_b', 'media'),
	('b2e3f22a-4fc3-4cb8-9b87-49bed772634c', 'Changan', 'NEW STAR TRUCK', 'ligero_b', 'media'),
	('06a639c3-a22d-4791-acbc-0e36ee11078d', 'Chirey', 'Tiggo 2', 'ligero_b', 'media'),
	('8fdf2f07-5f39-4509-a740-3f24322fcd67', 'Chirey', 'Tiggo 4', 'ligero_b', 'media'),
	('e6295ebe-14ee-43f5-93aa-a8b8bb3f8f0b', 'Chirey', 'Tiggo 7', 'ligero_b', 'media'),
	('e7695fa6-d83c-4f34-ba46-db294573c8a9', 'Chirey', 'Tiggo 7 Pro e+', 'ligero_b', 'media'),
	('140e4c87-a820-431c-8d32-f5983cd92df5', 'Chirey', 'Tiggo 8', 'ligero_b', 'media'),
	('ab9bc6f7-b4a0-4e45-bafa-e02e8be99e1a', 'Chirey', 'Tiggo 8 Pro e+', 'ligero_b', 'media'),
	('8bc22080-d321-4ac9-8b1f-88608db49694', 'Chrysler', 'Jeep Compass-', 'ligero_b', 'media'),
	('e81fb01d-abc1-4b8b-9c48-201c2b768a0b', 'Chrysler', 'Journey', 'ligero_b', 'media'),
	('70023bfe-61bd-4928-aa6f-87f4ab4c3954', 'Chrysler', 'Promaster', 'ligero_b', 'media'),
	('318700b2-aa21-4e48-8541-0a919423562d', 'Chrysler', 'Commander', 'ligero_b', 'media'),
	('030d04e4-c678-4073-9f76-fe51c1005b30', 'Chrysler', 'Renegade', 'ligero_b', 'media'),
	('815085f8-34a6-42f9-97f6-a5656e9d6e48', 'Chrysler', 'Pacifica', 'ligero_b', 'media'),
	('5884764b-7d92-4f13-bfba-fe2c0b6f72e1', 'Chrysler', 'Journey', 'ligero_b', 'media'),
	('2b87ec97-7d93-4e48-ab77-5bdc1d4f59cf', 'Chrysler', 'H100 Van', 'ligero_b', 'media'),
	('59c5b5c1-dead-47ef-8c0b-35ffe240b856', 'Chrysler', 'H100 Wagon', 'ligero_b', 'media'),
	('0e98fbcd-2476-40dc-8b22-bf408e2bab03', 'Chrysler', 'Aspen', 'ligero_b', 'media'),
	('59ac46bb-1497-41ee-ac5e-b41da8ba3335', 'Chrysler', 'Cherokee', 'ligero_b', 'media'),
	('68b65922-c50e-4b5a-933a-af07277f1053', 'Chrysler', 'Commander Xk', 'ligero_b', 'media'),
	('b4a17733-6f69-493b-bfc0-7bdfbfcab0bc', 'Chrysler', 'Durango', 'ligero_b', 'media'),
	('594f0e96-5b3f-4bca-89f3-0885dc1f1573', 'Chrysler', 'Grand Cherokee', 'ligero_b', 'media'),
	('10189317-7589-4b6a-913a-f7714085c296', 'Chrysler', 'Jeep Compass', 'ligero_b', 'media'),
	('8139cc16-d340-4bbe-acba-0c330b238210', 'Chrysler', 'Liberty', 'ligero_b', 'media'),
	('0fbb0480-1867-4304-a346-38d48ffa404e', 'Chrysler', 'Nitro', 'ligero_b', 'media'),
	('a0c45c35-8435-4ce2-8d4d-a838df0fd5c4', 'Chrysler', 'Patriot', 'ligero_b', 'media'),
	('5be77bd0-7a3d-4a03-8a56-3344ae3485d6', 'Chrysler', 'Wagoneer', 'ligero_b', 'media'),
	('ff83b633-af2a-4cff-8a90-648ecb673e32', 'Chrysler', 'Wrangler', 'ligero_b', 'media'),
	('84ddca18-0ae9-4abb-81fa-14dbfe693b9e', 'Chrysler', 'Crew Cab-', 'ligero_b', 'media'),
	('f89808d9-27d2-4141-bf01-0bfecb4862ad', 'Chrysler', 'RAM 1200', 'ligero_b', 'media'),
	('cd7dd342-350a-4c5c-8641-da78afdeea29', 'Chrysler', 'RAM 1500-', 'ligero_b', 'media'),
	('fa3efb3c-16c7-40cb-a444-77481f57d6c0', 'Chrysler', 'RAM 2500-', 'ligero_b', 'media'),
	('2f498add-3757-4482-9ab8-6d1e00a62d1a', 'Chrysler', 'RAM 4000', 'ligero_b', 'media'),
	('aad6a74a-cb53-44a8-93d9-25d6e193b69e', 'Chrysler', 'RAM 4000 Diesel', 'ligero_b', 'media'),
	('2c0b5088-26c9-4409-bcbc-d03eaf92e4ca', 'Chrysler', 'Promaster Rapid', 'ligero_b', 'media'),
	('036ef167-ac86-4c09-8468-1b7dbfdebc09', 'Chrysler', 'RAM 700', 'ligero_b', 'media'),
	('50b947a4-d63c-4e59-8ae3-da4a8f379ca7', 'Chrysler', 'H100', 'ligero_b', 'media'),
	('174927e0-297d-4721-b4c4-d469e3aa7a03', 'Chrysler', 'Crew Cab', 'ligero_b', 'media'),
	('df0a5ab7-4d91-4c84-b37c-c6d23b644b1e', 'Chrysler', 'Dakota', 'ligero_b', 'media'),
	('e5f0230d-cd81-4790-9c30-ced94d3708ed', 'Chrysler', 'JT', 'ligero_b', 'media'),
	('94cf86cf-9808-4f41-9503-06366d84561c', 'Chrysler', 'Mega Cab', 'ligero_b', 'media'),
	('0a40167d-1d9c-4ade-80b7-7a6f03663c4b', 'Chrysler', 'Quad Cab', 'ligero_b', 'media'),
	('f8324f39-2de6-48e9-957c-f0b21cd2666f', 'Chrysler', 'RAM 4000', 'ligero_b', 'media'),
	('8247105b-f94c-44a7-984d-0e3c8c6e10a5', 'Chrysler', 'RAM DS', 'ligero_b', 'media'),
	('dd507bc0-838a-402a-86f2-1fa6347d67df', 'Chrysler', 'Ram 1500', 'ligero_b', 'media'),
	('68185c90-44e9-4fe5-9b8f-1b4c4d7f7503', 'Chrysler', 'Ram 2500', 'ligero_b', 'media'),
	('ff4d377a-b590-4da6-bf00-6095bb86157d', 'Chrysler', 'Dodge 1000', 'ligero_b', 'media'),
	('cd2b5c74-0d4b-45e2-bc11-24c51558bc8e', 'Fiat', 'FASTBACK', 'ligero_b', 'media'),
	('95c1f0b3-0c10-4f84-acc9-d6f51a92a316', 'Fiat', 'Idea', 'ligero_b', 'media'),
	('8704d833-94c3-46da-85f5-2ecbb67e2f6e', 'Fiat', 'Pulse', 'ligero_b', 'media'),
	('55b21b8c-5ea5-4885-8736-87ddfa78b599', 'Fiat', 'Strada Adventure', 'ligero_b', 'media'),
	('496797bc-14bd-49a6-892f-be2d97c1558d', 'Fiat', 'Ducato', 'ligero_b', 'media'),
	('bdc3c9df-53d3-44ba-9f6e-2994edd5c212', 'Ford Motor', 'Ranger', 'ligero_b', 'media'),
	('8c5fabd7-eaa2-4424-9a71-45aafbd76d7f', 'Ford Motor', 'Ranger Crew Cab', 'ligero_b', 'media'),
	('e4f0617f-02c1-40b1-8d1b-7f4c5689ebc9', 'Ford Motor', 'Courier', 'ligero_b', 'media'),
	('dc9926f8-a02a-4bc9-8e2c-0ddde4efd9f5', 'Ford Motor', 'E-Transit', 'ligero_b', 'media'),
	('491a9a45-be5b-4d8e-9f47-4ae52abadfd8', 'Ford Motor', 'F 250 Super Duty', 'ligero_b', 'media'),
	('e3cd8806-3531-42b1-82ca-ff475be81f7a', 'Ford Motor', 'F-350', 'ligero_b', 'media'),
	('1d36a1eb-6162-48e3-b729-d25b9af70fd8', 'Ford Motor', 'F-450', 'ligero_b', 'media'),
	('780a71e6-be52-4c85-b90f-7bee98125e0e', 'Ford Motor', 'F-550', 'ligero_b', 'media'),
	('f0ed6569-e0bc-48b6-8cc0-42f7e5020821', 'Ford Motor', 'F450 Diesel', 'ligero_b', 'media'),
	('dc116269-830a-482c-b1fd-d539dd1494b9', 'Ford Motor', 'F550 Diesel', 'ligero_b', 'media'),
	('73e23f83-5525-41bf-8156-f9f54ade5a37', 'Ford Motor', 'Lobo Crew Cab', 'ligero_b', 'media'),
	('cc0bccaa-fa55-4704-9934-bf043671e705', 'Ford Motor', 'Lobo Regular Cab', 'ligero_b', 'media'),
	('8b471ac4-646e-4ab0-a24a-13973149a572', 'Ford Motor', 'New F150 / F-150', 'ligero_b', 'media'),
	('46335d83-0a0c-4d7d-b2ce-5ef03700db18', 'Ford Motor', 'Ranger Chassis', 'ligero_b', 'media'),
	('5381ab93-6c76-4dae-af5f-e7ff44ebfba7', 'Ford Motor', 'Ranger Larga', 'ligero_b', 'media'),
	('e73be806-124a-4aff-8667-9d561d1ef54c', 'Ford Motor', 'Transit Courier', 'ligero_b', 'media'),
	('47954456-5c5d-4ec7-afdb-8f3ea75ecb2c', 'Ford Motor', 'Bronco Sport', 'ligero_b', 'media'),
	('1b459f81-c32f-4673-aed2-d75659b3b46d', 'Ford Motor', 'Mustang Mach-E', 'ligero_b', 'media'),
	('213034e2-397c-4374-a103-c1c3f89e630f', 'Ford Motor', 'Ecosport', 'ligero_b', 'media'),
	('0214d134-243f-4cbe-88d4-db91005ee5ce', 'Ford Motor', 'Edge', 'ligero_b', 'media'),
	('525f8c77-c981-4385-a6bd-730460361017', 'Ford Motor', 'Territory', 'ligero_b', 'media'),
	('2be48b7d-deb7-4db5-b69c-6f5effca6b43', 'Ford Motor', 'Bronco', 'ligero_b', 'media'),
	('57e588bc-ece6-4c94-874d-1808601bd96c', 'Ford Motor', 'Escape', 'ligero_b', 'media'),
	('abfa91d9-bffc-4088-ac19-2c2619cd2fc3', 'Ford Motor', 'Escape HEV', 'ligero_b', 'media'),
	('978a4a47-a8ee-498d-ad41-c61e87606ba6', 'Ford Motor', 'Excursion', 'ligero_b', 'media'),
	('5d4e66b6-a11c-48f3-be93-9f0b7d4da149', 'Ford Motor', 'Explorer', 'ligero_b', 'media'),
	('27d6eb23-f310-42e4-84ff-ef3d0c0e6d0f', 'Ford Motor', 'Explorer Sport Trac', 'ligero_b', 'media'),
	('53f26fbe-2219-4eaf-9a94-23a095f0f603', 'Ford Motor', 'Transit', 'ligero_b', 'media'),
	('142b8e45-def8-42a5-b97c-5bf4b1edc2ee', 'Ford Motor', 'Transit Pasajeros', 'ligero_b', 'media'),
	('1bc789c8-f91d-4255-8847-cb54a36cafcb', 'Ford Motor', 'F 150', 'ligero_b', 'media'),
	('85e576c1-5876-4aba-9ba3-a448043895ec', 'Ford Motor', 'F 250', 'ligero_b', 'media'),
	('ecc1c3ca-3eac-4648-be41-1f964be92dda', 'Ford Motor', 'F 350', 'ligero_b', 'media'),
	('1d9ee8ce-a41c-4842-b141-5928540ade39', 'Ford Motor', 'F 450', 'ligero_b', 'media'),
	('97616efe-ac42-4b8f-8735-1cb524cdbb73', 'Ford Motor', 'F 450 Diesel', 'ligero_b', 'media'),
	('2a30e210-c849-48e8-8dc1-593ec81f1aa9', 'Ford Motor', 'F 550', 'ligero_b', 'media'),
	('5a553505-ddfe-4e30-8434-045c4c368547', 'Ford Motor', 'F 550 Diesel', 'ligero_b', 'media'),
	('c8f69224-7e0a-4e97-9312-874b31fe662d', 'Ford Motor', 'H - 215', 'ligero_b', 'media'),
	('7a4f2f4a-9e6c-4c3a-8331-9e45539cece7', 'Ford Motor', 'Maverick', 'ligero_b', 'media'),
	('771c4c18-157a-44b6-9c7c-943ae48226f7', 'Foton', 'MILER', 'ligero_b', 'media'),
	('078638d9-c6d7-4175-b286-ad78ac0f6d10', 'Foton', 'S3', 'ligero_b', 'media'),
	('ed28ca44-a06f-4ab3-a088-e244a95fb143', 'Foton', 'S3 EV', 'ligero_b', 'media'),
	('cdc8145b-f476-4ae4-aa86-6d3592c5b199', 'Foton', 'TM 3', 'ligero_b', 'media'),
	('4e6921b7-3739-4ad2-b71e-544b1dbf667c', 'Foton', 'TM EV', 'ligero_b', 'media'),
	('054b5d93-3f9f-49fd-8130-adb1d8793a4a', 'Foton', 'TUNLAND', 'ligero_b', 'media'),
	('3a015988-7845-457b-9714-917b0faf99af', 'Foton', 'Tunland EV', 'ligero_b', 'media'),
	('d0965418-4151-4011-8c74-fa33d5e23f74', 'Foton', 'WONDER', 'ligero_b', 'media'),
	('118ba78e-f392-4c47-a6e4-6682ab2bf15e', 'Foton', 'Wonder EV', 'ligero_b', 'media'),
	('93393713-cfb2-4ee6-bf11-0eb63d1d9f6e', 'Foton', 'HI VAN EV', 'ligero_b', 'media'),
	('6ef0b49d-839f-451a-949c-7787efbef472', 'Foton', 'HI-VAN', 'ligero_b', 'media'),
	('fdfc1ea8-e6ee-48a1-b5fe-a2f6d956ad5c', 'Foton', 'VIEW', 'ligero_b', 'media'),
	('6dfbb970-7128-4317-9726-c621ea272481', 'Foton', 'VIEW EV', 'ligero_b', 'media'),
	('d29907fa-0059-43ff-a113-69661842558d', 'Geely', 'Cityray', 'ligero_b', 'media'),
	('1f26a13b-bc66-4e21-8939-ad63e461d159', 'Geely', 'Coolray', 'ligero_b', 'media'),
	('97cbfdfd-6e18-4f5b-ae14-880f20af1fc6', 'Geely', 'EX2', 'ligero_b', 'media'),
	('1523f875-3bcd-4400-8fa5-cb70f6641afc', 'Geely', 'EX5', 'ligero_b', 'media'),
	('21e01a8e-7935-4f1f-b142-45af8ddf32ce', 'Geely', 'EX5 EM-i', 'ligero_b', 'media'),
	('31e5b23a-c406-4b39-82bf-77b222261f37', 'Geely', 'Geometry C', 'ligero_b', 'media'),
	('c428cc0b-f1d3-458a-8a15-5a9179c2a299', 'Geely', 'Gx3 Pro', 'ligero_b', 'media'),
	('0e76def8-610f-4268-a0ac-8f6a0fef088b', 'Geely', 'Monjaro', 'ligero_b', 'media'),
	('8cfedc04-2c3c-4553-83ca-ea8c33afef78', 'Geely', 'Okavango', 'ligero_b', 'media'),
	('db85ae40-baa8-4b46-8ae6-ed8fd6365048', 'Geely', 'Starray', 'ligero_b', 'media'),
	('e53b9195-d478-4048-a913-574e46ce31bf', 'General Motors', 'Avalanche UUV', 'ligero_b', 'media'),
	('cefecdec-7a5d-403b-a0ee-48a2105fd7b9', 'General Motors', 'Cheyenne Doble Cabina', 'ligero_b', 'media'),
	('979d1763-3efd-4ff1-bdcb-cef3c9e8ceb7', 'General Motors', 'Cheyenne Cabina Regular', 'ligero_b', 'media'),
	('d2fb8c8f-adb6-4adb-aede-7f8e3df94bf2', 'General Motors', 'GMC Sierra Doble Cabina', 'ligero_b', 'media'),
	('b3217f71-9798-40a5-8988-40dc68811ce1', 'General Motors', 'Kodiak Chassis Cab Class 6 PBV23,900', 'ligero_b', 'media'),
	('4128539f-b835-4a30-b145-1858dd0a5248', 'General Motors', 'Kodiak Chassis Cab Class 7 PBV33,000', 'ligero_b', 'media'),
	('94026f9a-8d7b-46bf-a756-82ed37b1890b', 'General Motors', 'Kodiak Chassis Cab Class 8 PBV36,000', 'ligero_b', 'media'),
	('66bc7bba-e97e-489f-b874-70f2558d0d69', 'General Motors', 'Sierra Cabina Regular', 'ligero_b', 'media'),
	('401f9a7e-745b-4cd7-95f3-40e547044b37', 'General Motors', 'Sierra Doble Cabina', 'ligero_b', 'media'),
	('39492658-c84e-493c-8a1a-e9355b6e0bf2', 'General Motors', 'Silverado 1500 Cabina Regular-', 'ligero_b', 'media'),
	('6e6421f0-a10f-49b2-bd5e-554bb91357b0', 'General Motors', 'Silverado 2500 Cabina Regular-', 'ligero_b', 'media'),
	('a5b2b9fd-f6a4-41b2-a6e4-de2f57344afe', 'General Motors', 'Silverado 2500 Doble Cabina-', 'ligero_b', 'media'),
	('5a576d79-ee83-4070-b5ca-c1319e0626c3', 'General Motors', 'Silverado 3500 Chassis Cab', 'ligero_b', 'media'),
	('d3f4a311-1245-48de-83a9-4ebb1b77b6dc', 'General Motors', 'Silverado 3500 HD Chassis Cab Heavy Duty', 'ligero_b', 'media'),
	('d359c61d-0c60-4d97-aae8-a7426e1d3cbc', 'General Motors', 'Silverado Cabina Regular', 'ligero_b', 'media'),
	('74dd2986-5398-4e33-bf88-2882448c9e1e', 'General Motors', 'Silverado Doble Cabina', 'ligero_b', 'media'),
	('7f4104e8-029e-46e0-b174-98cdb6802d87', 'General Motors', 'Montana Crew Cab', 'ligero_b', 'media'),
	('9c548311-1c3e-4df4-ad76-f1126e9f7a3e', 'General Motors', 'S10', 'ligero_b', 'media'),
	('430468b5-cd7e-44b0-a6cd-38cc0b4a33f1', 'General Motors', 'Tornado Pickup', 'ligero_b', 'media'),
	('fe6de104-8842-4299-ab27-16b1f263d8e8', 'General Motors', 'Luv Cabina Regular', 'ligero_b', 'media'),
	('4b8c5adb-9bcf-4dbe-a330-67f0712baa01', 'General Motors', 'Luv Chasis Cabina', 'ligero_b', 'media'),
	('0fa70214-61fb-4f84-84cb-433054f46047', 'General Motors', 'Luv Doble Cabina', 'ligero_b', 'media'),
	('8b244abe-1016-4dfc-8748-78c543737f0c', 'General Motors', 'S10 Max Cabina Regular', 'ligero_b', 'media'),
	('d8753386-d5e1-4968-b662-27d39861b454', 'General Motors', 'S10 Max Chassis', 'ligero_b', 'media'),
	('e5bea678-d902-46c8-8091-d18080ef0c70', 'General Motors', 'S10 Max Doble Cabina', 'ligero_b', 'media'),
	('919d81ff-bf90-49bb-9387-243bba7efcb6', 'General Motors', 'Canyon', 'ligero_b', 'media'),
	('f9ab0e46-b6fd-486b-9535-97c6eace8a63', 'General Motors', 'Canyon Crew Cab 4x4', 'ligero_b', 'media'),
	('c5a4925d-064a-41ec-b789-18ac5fd3a0b2', 'General Motors', 'Cheyenne Doble Cabina', 'ligero_b', 'media'),
	('faba15a3-f89b-4e09-82ee-d3ebec2507e4', 'General Motors', 'Colorado Doble Cabina', 'ligero_b', 'media'),
	('6feaa8be-7c58-4133-ba08-0291778c76e7', 'General Motors', 'GMC Sierra Cabina Regular', 'ligero_b', 'media'),
	('1e38a54b-7d93-4236-a972-990e1e6ed56f', 'General Motors', 'Hummer EV Pickup', 'ligero_b', 'media'),
	('2101245b-f41d-4f7e-8bce-b80b7734f7a4', 'General Motors', 'P-30 Fwd Control Chassis', 'ligero_b', 'media'),
	('ee8c5e6f-2557-47db-8659-61d56dc2ba04', 'General Motors', 'Sierra Doble Cabina', 'ligero_b', 'media'),
	('39b5f69b-3495-41e0-90bb-efb2ef1163c4', 'General Motors', 'Silverado 1500 Cabina Regular', 'ligero_b', 'media'),
	('7de5c073-2587-4615-b507-223c0b8fb6f4', 'General Motors', 'Silverado 2500 Cabina Extendida', 'ligero_b', 'media'),
	('c5481a04-935e-4388-9a48-865d6c411f36', 'General Motors', 'Silverado 2500 Cabina Regular', 'ligero_b', 'media'),
	('18ae491f-461d-4dc7-8554-03639b7735ee', 'General Motors', 'Silverado 2500 Cheyenne Crew Cab 4x4', 'ligero_b', 'media'),
	('9769457e-ba25-4b41-8e9b-fc29564b7438', 'General Motors', 'Silverado 2500 Doble Cabina', 'ligero_b', 'media'),
	('67b9ecb5-5433-4502-9c61-e97444732309', 'General Motors', 'Colorado Cabina Regular', 'ligero_b', 'media'),
	('86d01412-9e93-4069-958e-36b5a692d3c3', 'General Motors', 'Colorado Doble Cabina', 'ligero_b', 'media'),
	('d0589755-b5b7-4704-bb39-d7356edc7a11', 'General Motors', 'Aztek SUV', 'ligero_b', 'media'),
	('f804a023-ca8e-4249-9f47-a664dec54e4e', 'General Motors', 'Blazer', 'ligero_b', 'media'),
	('230dae47-2c26-4b0a-8025-2f084a4146a5', 'General Motors', 'Blazer EV', 'ligero_b', 'media'),
	('dbd50f4a-eb44-4179-86b6-e7028ee0f6ab', 'General Motors', 'Captiva Sport', 'ligero_b', 'media'),
	('aa4888fc-cb12-4277-9679-e498eec89648', 'General Motors', 'Equinox EV', 'ligero_b', 'media'),
	('7c8c923f-b272-4b6a-a8a8-0b3e0be03d6c', 'General Motors', 'Equinox SUV-', 'ligero_b', 'media'),
	('98f40091-023b-46e7-8789-2d4b1d7cf3f1', 'General Motors', 'Escalade IQ Suv', 'ligero_b', 'media'),
	('8b86ae4e-92df-4993-8ca3-65777d056ebd', 'General Motors', 'Escalade IQL Suv', 'ligero_b', 'media'),
	('a44e4762-d50d-4fa5-a7b4-222d8973126f', 'General Motors', 'Optiq', 'ligero_b', 'media'),
	('68e28d7c-0bc9-409c-a979-353ebfd42eb8', 'General Motors', 'SRX SUV-', 'ligero_b', 'media'),
	('dc415dc9-a48d-43a3-b57f-888c99e3f488', 'General Motors', 'Suburban SUV-', 'ligero_b', 'media'),
	('587b9538-b52e-4ecf-995a-269708568152', 'General Motors', 'Terrain SUV-', 'ligero_b', 'media'),
	('bc4e1b64-1efa-48c9-ae8b-69a4fc677751', 'General Motors', 'Trax', 'ligero_b', 'media'),
	('cd84aee8-b313-4562-acf8-d61501d25f60', 'General Motors', 'Tracker', 'ligero_b', 'media'),
	('c49c5f15-395a-4f62-9b7e-465eb0676d9b', 'General Motors', 'Terrain Suv', 'ligero_b', 'media'),
	('fabc0972-2935-4652-8300-012d924550d7', 'General Motors', 'Tracker Suv', 'ligero_b', 'media'),
	('93ee724a-eda3-4adc-bd25-d2e12ca4caa5', 'General Motors', 'Captiva SUV', 'ligero_b', 'media'),
	('f3c7ae46-f213-43a6-a26a-58edfa440bb6', 'General Motors', 'Envision SUV', 'ligero_b', 'media'),
	('59d4bba4-9550-4329-908b-2a09b6fe0378', 'General Motors', 'Groove SUV', 'ligero_b', 'media'),
	('2ab7f86c-5d0a-4c91-9657-a0f6effd94ec', 'General Motors', 'Spark EUV 4 dr.', 'ligero_b', 'media'),
	('72022cd2-fa8c-4f9e-b8b9-bd85605c6845', 'General Motors', 'Encore', 'ligero_b', 'media'),
	('463722ba-fb11-4760-bbab-9be5083f33b1', 'General Motors', 'Envista SUV', 'ligero_b', 'media'),
	('1aaeb5d7-6d94-4d75-b916-b43403eca905', 'General Motors', 'Acadia', 'ligero_b', 'media'),
	('45594337-2e1f-4790-90ab-f614510055d6', 'General Motors', 'Bolt EUV', 'ligero_b', 'media'),
	('b46aa06b-25f2-4733-afef-746065f04c03', 'General Motors', 'Enclave', 'ligero_b', 'media'),
	('c351f06e-c333-4db3-a0fa-fc2395ce0fe0', 'General Motors', 'Equinox Suv', 'ligero_b', 'media'),
	('f059d7bd-9933-4eec-aef2-26353d3101dc', 'General Motors', 'H3 Suv', 'ligero_b', 'media'),
	('3b4549e9-c802-4d84-8efa-db741985831b', 'General Motors', 'H3 T', 'ligero_b', 'media'),
	('ab96d5f7-6502-4e95-a999-85e0c1df13fb', 'General Motors', 'Hummer EV SUV', 'ligero_b', 'media'),
	('59201c41-24ec-4d4a-abd4-65a44d9f6177', 'General Motors', 'Lyriq SUV', 'ligero_b', 'media'),
	('70333f55-ae96-4857-b275-196b3b61a368', 'General Motors', 'Pontiac Torrent Suv', 'ligero_b', 'media'),
	('a09cc9dc-715b-4499-8719-7c604fd60146', 'General Motors', 'Sonora Suv', 'ligero_b', 'media'),
	('9ad425e6-82e7-4ab6-b448-b14252d31c1f', 'General Motors', 'Srx Suv', 'ligero_b', 'media'),
	('22b44e23-55a9-40db-aebd-060780766e3b', 'General Motors', 'Suburban Suv', 'ligero_b', 'media'),
	('7eb6cb9b-0b77-42fe-8c7b-0cbc72c9c376', 'General Motors', 'Tahoe', 'ligero_b', 'media'),
	('d6dead8f-4dc0-4f4d-be74-dd875b8081e7', 'General Motors', 'Trailblazer Suv', 'ligero_b', 'media'),
	('f7ce452b-2098-416b-9882-7557f5adb679', 'General Motors', 'Traverse Suv', 'ligero_b', 'media'),
	('2f85758d-9d88-4ed5-8075-283ff8452003', 'General Motors', 'XT5 SUV', 'ligero_b', 'media'),
	('a957cd20-abef-40d1-80d7-3266331c7d59', 'General Motors', 'Xt4 Suv', 'ligero_b', 'media'),
	('ff428845-6bac-41cd-8024-282f8f754a70', 'General Motors', 'Yukon Suv', 'ligero_b', 'media'),
	('58c9c0b9-74a7-4e82-a82e-5f097c84abd0', 'General Motors', 'Yukon XL', 'ligero_b', 'media'),
	('e778fa07-dfc5-4185-b6a7-ae30d23bff98', 'Great Wall Motor', 'POER', 'ligero_b', 'media'),
	('dd99ab9e-bfbf-4352-9c7c-c020aca4204f', 'Great Wall Motor', 'POER 500', 'ligero_b', 'media'),
	('4bc70d61-8878-4873-8da7-6e2268aed51d', 'Great Wall Motor', 'HAVAL H6', 'ligero_b', 'media'),
	('2fa9df65-6b41-40a5-ba0d-b3490a1dd08f', 'Great Wall Motor', 'HAVAL Jolion', 'ligero_b', 'media'),
	('2f914406-765d-41e4-bc0f-5efa966a91c9', 'Great Wall Motor', 'Ora 5', 'ligero_b', 'media'),
	('3f41dcb2-8c26-4334-8175-ce86e47d2878', 'Great Wall Motor', 'TANK 300', 'ligero_b', 'media'),
	('9a3cbafe-5389-40e4-8245-9972fe0486e5', 'Great Wall Motor', 'TANK 500', 'ligero_b', 'media'),
	('2025049c-1e5a-457c-89cc-07ef0a2877a2', 'Honda', 'Ridgeline', 'ligero_b', 'media'),
	('ef55a89c-9ffa-4ff2-9b45-9881d451e10e', 'Honda', 'CR-V-', 'ligero_b', 'media'),
	('ac8f145a-09b7-430d-82b7-3ff8287966b0', 'Honda', 'HR-V-', 'ligero_b', 'media'),
	('90189dbe-33b5-407b-a1b6-69895e0971e8', 'Honda', 'CR-V', 'ligero_b', 'media'),
	('34d15bc4-e982-4c53-b30f-364d88793e3b', 'Honda', 'CR-V-', 'ligero_b', 'media'),
	('6172bce3-c385-40e7-b5e7-277e6dda1af2', 'Honda', 'Honda Pilot', 'ligero_b', 'media'),
	('b1e2a866-1123-4d20-add0-98924c637561', 'Honda', 'BR-V', 'ligero_b', 'media'),
	('2a31fcc4-c4b5-4602-b714-19ba35833a31', 'Honda', 'BR-V', 'ligero_b', 'media'),
	('4b31c76b-2f04-4cc6-bddf-f37537dbadde', 'Hyundai', 'Palisade', 'ligero_b', 'media'),
	('d3ede51f-5288-4a3f-a0cb-12f4790e50a0', 'Hyundai', 'Santa FE 7 P', 'ligero_b', 'media'),
	('725d6ad6-a2cb-4cf1-8b25-e955c7f8ae7b', 'Hyundai', 'Santa Fe', 'ligero_b', 'media'),
	('a8ccd0ee-dbce-4477-a27f-3cba9b9a9ef5', 'Hyundai', 'Creta', 'ligero_b', 'media'),
	('af1ee0e7-2562-4e8d-b088-05ce278e20c1', 'Hyundai', 'IX35', 'ligero_b', 'media'),
	('b4177dc0-0993-45f5-824f-399484fed210', 'Hyundai', 'Tucson', 'ligero_b', 'media'),
	('a8ed0107-073c-4018-a570-477f53dbeaec', 'Infiniti', 'QX50', 'ligero_b', 'media'),
	('c8816b11-1757-4930-87e5-9a88f383f44f', 'Infiniti', 'QX55', 'ligero_b', 'media'),
	('43087785-ecc3-49b2-a169-fe4d0967e38c', 'Infiniti', 'FX', 'ligero_b', 'media'),
	('6d74b101-5130-4d86-8b3c-802c3ca4b70b', 'Infiniti', 'Infiniti Jx', 'ligero_b', 'media'),
	('879d81ad-255d-4606-9481-10d4d47f25f2', 'Infiniti', 'QX', 'ligero_b', 'media'),
	('a14273f8-c610-46b7-b2ec-7475fa3429a0', 'Infiniti', 'QX60', 'ligero_b', 'media'),
	('8b8e0f2e-d940-4068-83ca-44f01a102285', 'Infiniti', 'QX70', 'ligero_b', 'media'),
	('9e0cfac2-2c9a-48f9-9982-4291f6e8dd70', 'Infiniti', 'QX80', 'ligero_b', 'media'),
	('736eaff0-81fe-4905-bcc4-4e6bc528f46b', 'Isuzu', 'ELF 200', 'ligero_b', 'media'),
	('89aa2318-71ec-49d1-afdd-4b1c16c526e9', 'Isuzu', 'ELF 300', 'ligero_b', 'media'),
	('53b43301-a044-4024-981a-d5eff6e274fb', 'Isuzu', 'ELF 350', 'ligero_b', 'media'),
	('d93bf875-3b6c-4a0f-a86e-accebff1e495', 'Isuzu', 'ELF100', 'ligero_b', 'media'),
	('d2333961-adaf-4de3-9279-1cc5285fe823', 'JAC', 'E Sei 1', 'ligero_b', 'media'),
	('5fd0e6c2-aed6-4d79-830d-998be8a452f6', 'JAC', 'E Sei 2', 'ligero_b', 'media'),
	('1c1e60d2-3b29-4546-9a05-0d5b8a394990', 'JAC', 'E Sei 4', 'ligero_b', 'media'),
	('0d2f9265-4894-4b32-a95f-e20d80a048dc', 'JAC', 'ESei4 Pro', 'ligero_b', 'media'),
	('33f77db5-3fbb-4378-9862-037e13379d39', 'JAC', 'JAC2', 'ligero_b', 'media'),
	('8632ce95-27dc-4f30-87ed-3c51c785689d', 'JAC', 'JAC4', 'ligero_b', 'media'),
	('f22f6663-957f-46df-a7fa-4a63e0e33213', 'JAC', 'JAC6', 'ligero_b', 'media'),
	('4c2c33bc-46d7-4d92-b016-dc0b5492105f', 'JAC', 'JAC8', 'ligero_b', 'media'),
	('0cc1fb89-911a-49bb-95b9-f01960e6398e', 'JAC', 'SEI7 PRO', 'ligero_b', 'media'),
	('0cb64f19-3aef-4aa7-b13b-250af8b19769', 'JAC', 'Sei2', 'ligero_b', 'media'),
	('2bc4f891-2be8-41dd-9476-8152310f1cb9', 'JAC', 'Sei3', 'ligero_b', 'media'),
	('9f3d3979-6968-4615-88dc-7b73b592f22f', 'JAC', 'Sei4', 'ligero_b', 'media'),
	('68b3785e-c716-4349-9683-54567d1eaa14', 'JAC', 'Sei4 Pro', 'ligero_b', 'media'),
	('fb271f4e-f564-49a5-8383-11504c56e885', 'JAC', 'Sei6 Pro', 'ligero_b', 'media'),
	('04f190aa-7ff6-4ee1-91c1-daadd6893cb9', 'JAC', 'Sei7', 'ligero_b', 'media'),
	('d5f3b059-2a33-47f3-8daa-a224f9591e38', 'JAC', 'E Frison T8', 'ligero_b', 'media'),
	('4e00d8b2-6cf6-4d11-96bd-928a1913b97a', 'JAC', 'E X350', 'ligero_b', 'media'),
	('573c0ab8-49f7-4e3d-89c8-b6adce1fff15', 'JAC', 'EX450', 'ligero_b', 'media'),
	('b2a455e0-1687-453c-be7d-361b4632f2a0', 'JAC', 'Frison', 'ligero_b', 'media'),
	('06320cf9-8466-482a-8e03-9e26b5c2e422', 'JAC', 'GML X150 EV', 'ligero_b', 'media'),
	('c7d24eeb-935a-41d2-a517-9e2b8226ac2a', 'JAC', 'X 200', 'ligero_b', 'media'),
	('f7b8ecd0-21b4-4658-8964-5b2feb268426', 'JAC', 'X250', 'ligero_b', 'media'),
	('44b46943-94c9-4346-b9cc-e332b6bb2854', 'JAC', 'X350', 'ligero_b', 'media'),
	('fe67606f-8168-434d-8909-f0f629025089', 'JETOUR', 'Dashing', 'ligero_b', 'media'),
	('610c9078-6fee-4ec2-829d-e1b2251d06c7', 'JETOUR', 'T2', 'ligero_b', 'media'),
	('f2bb3354-f5ef-4b80-ab1c-9cce52f7acb8', 'JETOUR', 'X70', 'ligero_b', 'media'),
	('0e29f38e-9e99-481f-8a5a-217a97ee7164', 'JETOUR', 'X70 Plus', 'ligero_b', 'media'),
	('d0b59c44-4993-4d56-8fcd-6e83e5ddbbab', 'Jetour Soueast', 'Dashing', 'ligero_b', 'media'),
	('ae44bc06-a1f5-4961-9a80-74da5fadeb22', 'Jetour Soueast', 'G700 PHEV', 'ligero_b', 'media'),
	('24cc0145-2d88-4751-8926-25ecf3bc06c3', 'Jetour Soueast', 'S06 i-DM', 'ligero_b', 'media'),
	('892b2ac0-212f-4315-829c-12e6b8baf6ca', 'Jetour Soueast', 'S07', 'ligero_b', 'media'),
	('c73a3243-8be3-4971-9928-30c8b9c4bb07', 'Jetour Soueast', 'S08 i-DM', 'ligero_b', 'media'),
	('b80fd1c5-4b49-4559-ad81-b5b926880d66', 'Jetour Soueast', 'S09', 'ligero_b', 'media'),
	('6504b657-c1c1-400b-a642-b0d1df0d70f4', 'Jetour Soueast', 'T1', 'ligero_b', 'media'),
	('9795ed3b-4cf7-4237-86b5-32890e8183bf', 'Jetour Soueast', 'T1 i-DM', 'ligero_b', 'media'),
	('73d036c3-c4c5-4647-a383-1d5061b29ba3', 'Jetour Soueast', 'T2', 'ligero_b', 'media'),
	('3637f933-a7b8-410f-8f40-40723a4492a5', 'Jetour Soueast', 'T2 i-DM', 'ligero_b', 'media'),
	('e788ea06-7e4d-403e-82f5-5e6a39a2977f', 'Jetour Soueast', 'X70', 'ligero_b', 'media'),
	('d14e5f85-dbff-4172-85e6-ea96ed7a364b', 'Jetour Soueast', 'X70 Plus', 'ligero_b', 'media'),
	('8cc22147-4b66-40c1-b22d-2107b2e365f9', 'KIA', 'Tucson', 'ligero_b', 'media'),
	('53c9e6f8-cafb-4a65-ad58-681b7bc80352', 'KIA', 'Seltos-', 'ligero_b', 'media'),
	('faee43ff-39f1-43a2-aeab-8a400d0e2c06', 'KIA', 'Sonet', 'ligero_b', 'media'),
	('7b483838-f62f-4a00-94c7-5cf10e4bead1', 'KIA', 'EV6', 'ligero_b', 'media'),
	('147f3e91-fac5-4c14-bd68-cd728dbcbd64', 'KIA', 'KIA Niro', 'ligero_b', 'media'),
	('982516ee-2d95-4f37-af60-1bf9b7fa255a', 'KIA', 'SPORTAGE', 'ligero_b', 'media'),
	('c0ea3c0e-1b6c-49a3-99e3-0894321fbfed', 'KIA', 'Soul', 'ligero_b', 'media'),
	('bd34f545-c8c0-4bbd-ace4-d1139e1ec592', 'KIA', 'Sportage', 'ligero_b', 'media'),
	('13dafde9-8775-46f5-bb08-92372b3415be', 'KIA', 'Sportage HEV', 'ligero_b', 'media'),
	('c4b4172f-d534-4dd8-a299-e167a6907457', 'KIA', 'Sorento', 'ligero_b', 'media'),
	('ade250c3-7dc2-4aca-aaaf-533d05b9a8b9', 'KIA', 'Telluride', 'ligero_b', 'media'),
	('7b4da3ac-98d7-4a33-9e84-f7202414f7c9', 'KIA', 'Seltos', 'ligero_b', 'media'),
	('0bc6b3fa-777b-4f67-8fdb-7c9c6ea063c1', 'Land Rover', 'Defender', 'ligero_b', 'media'),
	('0b315faf-6cba-48ec-9cb2-5f9e295bdb20', 'Land Rover', 'Evoque', 'ligero_b', 'media'),
	('947484c1-2644-48e6-8250-011cfe1008ad', 'Land Rover', 'Freelander 2.5', 'ligero_b', 'media'),
	('ae567b4c-bbe1-43e4-a42f-971619a66a4c', 'Land Rover', 'Lr2', 'ligero_b', 'media'),
	('a4393095-3d42-4edb-bb30-4b48359428ec', 'Land Rover', 'Lr3/Lr4', 'ligero_b', 'media'),
	('95c6dd2c-d4e2-4b84-a5b0-1748ed931e0b', 'Land Rover', 'Range Rover', 'ligero_b', 'media'),
	('21a0c4be-65aa-4e0b-920b-1b9f300f66ce', 'Land Rover', 'Range Rover Sport', 'ligero_b', 'media'),
	('8f3fb7ff-9baa-413f-bb7f-5e0675f5e833', 'Leapmotor', 'B10', 'ligero_b', 'media'),
	('61062c4a-58a3-4bad-8d82-e90adf527899', 'Lexus', 'NX', 'ligero_b', 'media'),
	('6cee4515-7b90-4b91-9c9f-f309df5c70dc', 'Lexus', 'RX', 'ligero_b', 'media'),
	('2706a547-f942-4e5d-a0f6-c21fa4e2eae9', 'Lexus', 'TX', 'ligero_b', 'media'),
	('8abce151-ec83-4e73-8ed7-4295cc67ffbd', 'Lexus', 'GX', 'ligero_b', 'media'),
	('d7b61e16-b799-4da5-91f2-49e3d38d3398', 'Lexus', 'LX', 'ligero_b', 'media'),
	('bce396f4-1553-4a66-a726-63c9bbd33b63', 'Lexus', 'UX', 'ligero_b', 'media'),
	('fde2e71f-e0cc-4877-9b96-8410740690de', 'Lincoln', 'Corsair', 'ligero_b', 'media'),
	('3cff2569-f934-4ebb-8f73-1fd64c60d835', 'Lincoln', 'AVIATOR', 'ligero_b', 'media'),
	('62860ec7-4b9f-45c3-8747-85d2d22ccde6', 'Lincoln', 'Aviator Grand Touring', 'ligero_b', 'media'),
	('dab6818b-8627-4ea3-82c8-a2640a7ea962', 'Lincoln', 'MKC', 'ligero_b', 'media'),
	('12fc1ab4-9da5-4502-b438-1bf7d21d726d', 'Lincoln', 'Mark Lt', 'ligero_b', 'media'),
	('b5bc65ad-b0dd-4852-923e-9666adff512d', 'Mazda', 'CX-3', 'ligero_b', 'media'),
	('6d0b3c05-dc42-43d4-904f-ec477afb5ad9', 'Mazda', 'CX-30', 'ligero_b', 'media'),
	('f031d310-9c45-4702-a750-7a5f1c03ce2e', 'Mazda', 'CX-50', 'ligero_b', 'media'),
	('7cdd2f0f-1764-45b8-9de2-c57abdc1a1b2', 'Mazda', 'CX-3', 'ligero_b', 'media'),
	('d511cad7-2197-4ad7-aeb6-651a4466fabd', 'Mazda', 'CX-5', 'ligero_b', 'media'),
	('da773555-94d4-4624-8faf-ab916fbb1d1d', 'Mazda', 'CX-70', 'ligero_b', 'media'),
	('fa80d384-360f-406f-9ab5-365c34c0aa47', 'Mazda', 'CX-9', 'ligero_b', 'media'),
	('1369a088-95fb-4da5-8103-aa441ea5ce78', 'Mazda', 'CX-90', 'ligero_b', 'media'),
	('982a5057-6ae4-4d30-96ce-e9fc44735805', 'Mazda', 'Cx-7', 'ligero_b', 'media'),
	('e926233d-2f3f-4f5c-ac0c-7a2d9eb78db8', 'Mazda', 'BT-50', 'ligero_b', 'media'),
	('76db5e8b-01a2-4e66-ac07-ac96203b7f23', 'Mercedes Benz', 'GLB', 'ligero_b', 'media'),
	('49ce16d5-0e9c-432c-882b-e1d1132a9f20', 'Mercedes Benz', 'EQA', 'ligero_b', 'media'),
	('0d838958-cb2f-44e7-9861-1c9271f877ab', 'Mercedes Benz', 'EQC', 'ligero_b', 'media'),
	('3476853c-b78e-42be-9f7a-54e164d15d8f', 'Mercedes Benz', 'GLA', 'ligero_b', 'media'),
	('99015404-1844-4eb5-9924-8001675b2d70', 'Mercedes Benz', 'GLC', 'ligero_b', 'media'),
	('6fd1d5d1-f8fa-4ff2-ba23-ccfeab55f633', 'Mercedes Benz', 'GLK 280', 'ligero_b', 'media'),
	('090a2ec9-4f5b-43a0-a107-3faf7148be92', 'Mercedes Benz', 'GLK 350', 'ligero_b', 'media'),
	('5f542075-aab4-42d8-9afd-a76f7cf37c6f', 'Mercedes Benz', 'Gl 500', 'ligero_b', 'media'),
	('0414044c-ef9f-48f6-9175-e72b110eb2a7', 'Mercedes Benz', 'R 350', 'ligero_b', 'media'),
	('353dc76e-e672-4102-96e1-20a19a281535', 'Mercedes Benz', 'Sprinter', 'ligero_b', 'media'),
	('03b8452c-a524-48e9-94b6-4efc07772570', 'Mercedes Benz', 'Vito Carga', 'ligero_b', 'media'),
	('35a8dca5-b859-4fba-8ff0-ca398d733681', 'Mercedes Benz', 'Vito Pasaje', 'ligero_b', 'media'),
	('93f20255-9eab-428a-b50a-386a9f931922', 'Mercedes Benz', 'Clase G', 'ligero_b', 'media'),
	('95362702-a4e6-4b87-9f71-1b27d6d3e741', 'Mercedes Benz', 'G 500', 'ligero_b', 'media'),
	('30241df9-7204-403c-8029-9a28b7f19e92', 'Mercedes Benz', 'Clase V', 'ligero_b', 'media'),
	('422eed00-841d-473f-b0f3-97eefb852957', 'Mercedes Benz', 'Vito', 'ligero_b', 'media'),
	('91a4706e-9bef-4591-b908-ce25fe78f307', 'Mercedes Benz', 'Clase GLE', 'ligero_b', 'media'),
	('163f769d-77a4-4a26-8862-e6864b3082f3', 'Mercedes Benz', 'Clase GLS', 'ligero_b', 'media'),
	('7402bd3e-af10-4375-895e-75e54811c525', 'Mercedes Benz', 'EQE SUV', 'ligero_b', 'media'),
	('702a6758-419b-4d51-a15e-2b23d36eafed', 'Mercedes Benz', 'EQS SUV', 'ligero_b', 'media'),
	('71c6791d-05ab-491b-9333-a947571174eb', 'Mercedes Benz', 'Gl 450', 'ligero_b', 'media'),
	('0327e916-2673-46be-8c22-9b6a9df4b3ae', 'Mercedes Benz', 'Ml 350', 'ligero_b', 'media'),
	('0507b110-80a6-4001-9fa6-b45b7a2cac5d', 'Mercedes Benz', 'Ml 500', 'ligero_b', 'media'),
	('584042ac-2016-4bbf-b5d5-e7d9b1a4a04d', 'Mercedes Benz', 'Ml 63 Amg', 'ligero_b', 'media'),
	('e3ae1b28-9005-49c9-8427-13141b9fd67c', 'Mercedes Benz', 'R 500', 'ligero_b', 'media'),
	('310fa469-45ce-4c73-a395-aae6f8eddc19', 'Mercedes Benz', 'EQB', 'ligero_b', 'media'),
	('6467a7a0-b3e4-49b9-ab65-383678b693e6', 'Mercedes Benz', 'Cab Chassis', 'ligero_b', 'media'),
	('cd208441-52e2-455c-8a0e-e003a46cea3a', 'Mercedes Benz', 'Cargo Van', 'ligero_b', 'media'),
	('02a31641-59e3-4570-868f-621c188ef07b', 'Mercedes Benz', 'Wagon', 'ligero_b', 'media'),
	('feec640c-1478-4420-8954-3b4863666cbe', 'MG Motor', 'HS', 'ligero_b', 'media'),
	('4a124689-b892-4687-bb35-fa33a60f2ca5', 'MG Motor', 'HS PHEV', 'ligero_b', 'media'),
	('271449ee-972e-4998-be9f-f9328925898a', 'MG Motor', 'HSHEV', 'ligero_b', 'media'),
	('9f4ff30f-e343-4cf3-80ee-f742cdf9de52', 'MG Motor', 'IMLS7', 'ligero_b', 'media'),
	('70841c48-57a2-40ac-9f0c-2c1255481675', 'MG Motor', 'MG One', 'ligero_b', 'media'),
	('607c10c0-aa43-4e2d-a5cc-9c971e3d8179', 'MG Motor', 'RX5', 'ligero_b', 'media'),
	('522a11a7-d323-463c-acdb-82c2052f57ab', 'MG Motor', 'RX8', 'ligero_b', 'media'),
	('e429929b-154e-4109-92b9-e92e03bf37d4', 'MG Motor', 'RX9', 'ligero_b', 'media'),
	('6ce1e336-3dc5-4b14-af8b-d58bb7579529', 'MG Motor', 'ZS', 'ligero_b', 'media'),
	('6a8a9738-2e95-49f5-b55d-54cdad4bcc2f', 'MG Motor', 'ZSEV', 'ligero_b', 'media'),
	('e6182e02-4323-4512-839d-75336603635a', 'MG Motor', 'ZSHEV', 'ligero_b', 'media'),
	('b5adac4b-a991-4376-9198-b50a8713d4c4', 'MG Motor', 'eHS', 'ligero_b', 'media'),
	('dd801fc7-b122-45cb-a515-35005fa9274c', 'MG Motor', 'P9', 'ligero_b', 'media'),
	('17070d0e-a2ea-4e87-afb9-f79312bdfe5f', 'Mini', 'MINI COUNTRYMAN', 'ligero_b', 'media'),
	('eb141fb9-91a5-4d53-b1da-a847a7304b89', 'Mitsubishi', 'ASX', 'ligero_b', 'media'),
	('687853cc-8692-4fbf-819b-bba384c7c0a4', 'Mitsubishi', 'Endeavor', 'ligero_b', 'media'),
	('6a3a573f-0af4-42bc-9136-66510176fbe3', 'Mitsubishi', 'Outlander Sport', 'ligero_b', 'media'),
	('776b5fb3-1d98-4068-a4d9-58bbba40a38d', 'Mitsubishi', 'Xpander', 'ligero_b', 'media'),
	('dc44c0a9-ce36-4a53-92f2-e6652511c687', 'Mitsubishi', 'Eclipse Cross', 'ligero_b', 'media'),
	('591c3106-8d8f-4fc3-b536-488864d06e7c', 'Mitsubishi', 'Montero', 'ligero_b', 'media'),
	('8c427c10-f102-4784-a3e4-32d3751eca1e', 'Mitsubishi', 'Montero Limited', 'ligero_b', 'media'),
	('10d263e1-aef9-4d15-9d14-dee5484d1fa3', 'Mitsubishi', 'Outlander', 'ligero_b', 'media'),
	('c4b61843-5cb9-425e-a060-9474df607796', 'Mitsubishi', 'Outlander PHEV', 'ligero_b', 'media'),
	('babecbcf-c39d-4b99-a072-00a3c5c3e1ff', 'Mitsubishi', 'Montero Sport', 'ligero_b', 'media'),
	('380de490-40f0-4f4f-b83d-f0435ec39a8f', 'Mitsubishi', 'L200', 'ligero_b', 'media'),
	('d067d026-31f1-4ef4-bcdf-46e5fd431910', 'MOTORNATION', 'BAIC BJ20', 'ligero_b', 'media'),
	('cb817f71-f44e-4e93-9cd2-99eac46d6938', 'MOTORNATION', 'BAIC BJ40', 'ligero_b', 'media'),
	('b060e775-63a4-48fe-bd37-f2706f05fcca', 'MOTORNATION', 'BAIC X30', 'ligero_b', 'media'),
	('ec6ba838-43ee-423b-b259-60a28db34ed5', 'MOTORNATION', 'BAIC X55', 'ligero_b', 'media'),
	('520298c2-6138-47ce-90d2-7bdee1ce3aa7', 'MOTORNATION', 'BAIC X65', 'ligero_b', 'media'),
	('02090048-4361-4a82-b58f-da3bcab1b7da', 'MOTORNATION', 'CHANGAN CS35PLUS', 'ligero_b', 'media'),
	('2737dedf-aa2a-43ef-b1fb-38c82278ecc4', 'MOTORNATION', 'CHANGAN CS55PLUS', 'ligero_b', 'media'),
	('2be9c9d6-45b0-43da-a110-3280b0df851d', 'MOTORNATION', 'CHANGAN CS75PLUS', 'ligero_b', 'media'),
	('97fa003e-7b27-46b8-b968-d26c362d6221', 'MOTORNATION', 'CHANGAN UNI-K', 'ligero_b', 'media'),
	('25dc3421-bf46-4aa0-83e3-b3c3f7751ddc', 'MOTORNATION', 'CHANGAN UNI-T', 'ligero_b', 'media'),
	('9c07824b-63db-477f-aa90-e587c81d65b1', 'MOTORNATION', 'DFSK 500', 'ligero_b', 'media'),
	('fca9e989-eb02-43f6-9d88-886a0400f6a5', 'MOTORNATION', 'DFSK 600', 'ligero_b', 'media'),
	('5d408f76-eb84-46d7-8ae3-696a9d86dbbd', 'MOTORNATION', 'DFSK E5', 'ligero_b', 'media'),
	('fbb422cf-b36d-4952-8d65-0bad64523380', 'MOTORNATION', 'GLORY 500', 'ligero_b', 'media'),
	('dea6b8c6-48df-4f4f-bc3e-163a479f2b3f', 'MOTORNATION', 'SERES 5 EV', 'ligero_b', 'media'),
	('55b1a434-efdc-4102-935f-67af5a72d026', 'MOTORNATION', 'T77', 'ligero_b', 'media'),
	('c839f0ed-17f6-4dc6-8b3a-f9fcc6732ad4', 'MOTORNATION', 'BAIC X35', 'ligero_b', 'media'),
	('623b3564-e58e-401f-9c68-e8e785277567', 'MOTORNATION', 'CHANGAN HUNTER', 'ligero_b', 'media'),
	('16498de2-c6ed-47b6-87a3-af913f8473ca', 'MOTORNATION', 'JMC GRAND AVENUE', 'ligero_b', 'media'),
	('40e61281-2c93-4e20-8986-35df104fe08a', 'MOTORNATION', 'JMC VIGUS', 'ligero_b', 'media'),
	('a3b248ee-4ffd-4342-a712-6076a8345998', 'MOTORNATION', 'SERES 5 MAX', 'ligero_b', 'media'),
	('8d2c46e4-00e4-424e-b525-95758784624f', 'MOTORNATION', 'STAR TRUCK', 'ligero_b', 'media'),
	('69588c95-7a14-4a38-8385-e5ec6f66f0db', 'Nissan', 'Kicks', 'ligero_b', 'media'),
	('6918d472-e270-42a2-8d9d-2d1f339dcc2c', 'Nissan', 'NV 200 Cargo', 'ligero_b', 'media'),
	('11d7b2cd-0210-4b81-968f-77ab834eead8', 'Nissan', 'NV 200 NY TAXI', 'ligero_b', 'media'),
	('b893d2fd-1bfa-47e4-bc86-508bbc5b17f5', 'Nissan', 'KAIT', 'ligero_b', 'media'),
	('31243f82-f444-4e1a-a9c0-22a09ebf59fb', 'Nissan', 'Armada', 'ligero_b', 'media'),
	('5cb660d5-9c38-4453-b4e2-720f79202120', 'Nissan', 'Xterra', 'ligero_b', 'media'),
	('eb966b5d-735d-477c-b466-0f2e32f8cffe', 'Nissan', 'Magnite', 'ligero_b', 'media'),
	('750bd1cc-5bb6-4e0d-8ef3-8cc449492a25', 'Nissan', 'Murano', 'ligero_b', 'media'),
	('3a48f3fc-ff02-44ce-8e3a-a97622ff1217', 'Nissan', 'Pathfinder', 'ligero_b', 'media'),
	('a883f178-b8ed-4768-890b-2ea2bd4b41c0', 'Nissan', 'Rogue', 'ligero_b', 'media'),
	('b96c73a0-072e-466b-9eed-7448af1caf12', 'Nissan', 'Urvan Panel', 'ligero_b', 'media'),
	('adadb47f-8307-4304-93a5-70bdd0088a62', 'Nissan', 'Urvan Panel Diesel', 'ligero_b', 'media'),
	('bd2395ff-ffe9-428e-ac25-b9f8f09ec197', 'Nissan', 'Urvan Pasajeros', 'ligero_b', 'media'),
	('582f7e22-e9a5-4706-954f-5310131d0cf6', 'Nissan', 'Urvan Pasajeros Diesel', 'ligero_b', 'media'),
	('f552ea40-2901-4882-8ce2-95f16746cd23', 'Nissan', 'Xtrail', 'ligero_b', 'media'),
	('919e5947-ce0b-493a-9558-1885a57986ab', 'Nissan', 'Chasis Largo', 'ligero_b', 'media'),
	('85af4574-d519-4e93-af08-fa038b2084df', 'Nissan', 'Chasis Largo Diesel', 'ligero_b', 'media'),
	('74300f36-bdd2-47b1-be35-9d6098ebb938', 'Nissan', 'Estacas Largo', 'ligero_b', 'media'),
	('c38eb1a7-9b39-419a-a6fe-05ed3f316c00', 'Nissan', 'Frontier L4', 'ligero_b', 'media'),
	('f4fdcf15-1486-41c9-845e-b94df34c6de6', 'Nissan', 'NP300', 'ligero_b', 'media'),
	('5f48db81-0555-4b0c-8248-d284ecfaf3da', 'Nissan', 'Pickup Doble Cabina', 'ligero_b', 'media'),
	('ea2a4fc7-96d9-4ea1-9b52-0c62e883fef2', 'Nissan', 'Pickup Doble Cabina Diesel', 'ligero_b', 'media'),
	('25c1a1ca-e619-42a1-81e1-74ecea306a02', 'Nissan', 'Pickup King Cab STD', 'ligero_b', 'media'),
	('caef4ea8-3a6c-4d64-a4d5-33c8776401c5', 'Nissan', 'Pickup Largo', 'ligero_b', 'media'),
	('2269376f-ac34-4afd-bc77-80b5321e9c2b', 'Nissan', 'Pickup Largo Diesel', 'ligero_b', 'media'),
	('ede6c6fc-6cf7-4992-a773-f3f6dee57efb', 'Nissan', 'Frontier V4', 'ligero_b', 'media'),
	('a90bf9ad-7a9d-4e02-ba60-d64a4c45d0fd', 'Nissan', 'Cabstar Mediano', 'ligero_b', 'media'),
	('db11188e-2f2a-4948-a3de-e9525567760f', 'Nissan', 'Cabstar Small', 'ligero_b', 'media'),
	('473b1679-1aa8-44c5-8da9-e403aae2aa7a', 'Nissan', 'Frontier V6', 'ligero_b', 'media'),
	('2addcde6-cbf5-4847-8487-ea4e0e3094cb', 'Nissan', 'Titan', 'ligero_b', 'media'),
	('407f75b2-1b44-4843-b52e-d728ffddc337', 'Nissan', 'Frontier Diesel', 'ligero_b', 'media'),
	('fc0d0192-0d9a-4d6a-ab8e-5c3584cdb446', 'Omoda', 'C5', 'ligero_b', 'media'),
	('eb5f6185-f5a1-4de9-bc11-5393212d7ece', 'Omoda', 'Jaecoo 7', 'ligero_b', 'media'),
	('4fd240ca-805f-4bbe-a33a-a34517d85574', 'Peugeot', '2008', 'ligero_b', 'media'),
	('1bc562a3-485a-409f-aaa6-1437f2a61c43', 'Peugeot', '3008', 'ligero_b', 'media'),
	('e2e2f427-4d80-47f2-a08f-54175579b50f', 'Peugeot', '5008', 'ligero_b', 'media'),
	('4d79c668-52b9-4a90-a76c-f684cb6930ef', 'Peugeot', 'LANDTREK', 'ligero_b', 'media'),
	('57cca8fa-0943-40a0-a081-df76592c1d51', 'Peugeot', 'Partner', 'ligero_b', 'media'),
	('493c9396-d3c6-4b22-843a-a3c751e3f4e4', 'Peugeot', 'RIFTER', 'ligero_b', 'media'),
	('9b282763-3c4e-415e-b24e-a89c1928fc60', 'Peugeot', 'Expert Cargo Van', 'ligero_b', 'media'),
	('80143365-e678-4480-9195-0342a6939be2', 'Peugeot', 'Expert Hdi', 'ligero_b', 'media'),
	('b7deb867-48b2-4a9a-a243-b6c4650bc3c8', 'Peugeot', 'Partner', 'ligero_b', 'media'),
	('4fb45c31-d1fe-42de-b699-f38598289677', 'Peugeot', 'Partner Tepee Outdoor', 'ligero_b', 'media'),
	('b697ce25-5e20-4e5e-be95-49f1fb19db12', 'Peugeot', 'Manager Hdi', 'ligero_b', 'media'),
	('0e0d851f-6f28-4388-b81d-f41b882e5964', 'Renault', 'Boreal', 'ligero_b', 'media'),
	('a940be6a-4729-43b3-9652-468e0626427c', 'Renault', 'Captur', 'ligero_b', 'media'),
	('589b9ed9-2fad-4702-8616-f0185fb0156b', 'Renault', 'Duster', 'ligero_b', 'media'),
	('5d4543e9-9337-4c4d-9c10-a513b906d178', 'Renault', 'Arkana', 'ligero_b', 'media'),
	('a454ec1c-7b72-4fa7-9f52-2369257d329f', 'Renault', 'Koleos', 'ligero_b', 'media'),
	('bfd4a226-d702-49b0-b651-47b1cba60c7a', 'Renault', 'Nueva Koleos', 'ligero_b', 'media'),
	('1bf22115-f4db-4401-80b5-8afe6d9c4f00', 'Renault', 'Traffic Vu L2h2', 'ligero_b', 'media'),
	('d1a3b3b9-e455-4c8d-b163-f825b755399a', 'Renault', 'Traffic Carga', 'ligero_b', 'media'),
	('dc2f47f7-f1ad-4a66-9eaa-e2e062bf8a7b', 'Renault', 'Traffic Pasajeros', 'ligero_b', 'media'),
	('097c98af-6697-4a83-9148-856ec7704fa4', 'Renault', 'Kangoo', 'ligero_b', 'media'),
	('6e334f07-a750-49f3-82c4-689071b0136d', 'Renault', 'Kangoo Diesel', 'ligero_b', 'media'),
	('f82bebe7-de5e-4e77-910e-77f517cd3b4f', 'Renault', 'Kangoo ZE', 'ligero_b', 'media'),
	('53ce0ae8-8473-4415-99fc-6944ac0776ea', 'Renault', 'Oroch', 'ligero_b', 'media'),
	('6b489c78-22d3-46e4-8ef0-d70c22dcb028', 'SEAT', 'Tarraco', 'ligero_b', 'media'),
	('15fa3b7a-46d8-42b6-869b-250995186120', 'SEAT', 'Arona', 'ligero_b', 'media'),
	('8333e997-d4f8-4cd5-bb1c-59e22a15415c', 'SEAT', 'CUPRA Formentor', 'ligero_b', 'media'),
	('d6666110-19ec-48cc-9a55-2db5c89636ca', 'SEAT', 'CUPRA Terramar', 'ligero_b', 'media'),
	('e4dac2f1-f12e-4045-b3be-402a495b95e3', 'SEAT', 'Ateca', 'ligero_b', 'media'),
	('e933750f-e31d-49b9-bace-4245522a64e9', 'Subaru', 'B9 Tribeca', 'ligero_b', 'media'),
	('3e17bd0b-0c9f-4e05-91f5-be09a470610d', 'Subaru', 'Crosstrek', 'ligero_b', 'media'),
	('bbef548f-2a66-403b-93f1-a77978ce49e2', 'Subaru', 'Crosstrek MHEV', 'ligero_b', 'media'),
	('2627dc97-e98e-4b19-bd52-b66eebf905f2', 'Subaru', 'Forester', 'ligero_b', 'media'),
	('0f019c43-fe65-47a4-9d38-2fec13c17e5f', 'Subaru', 'Forester e-BOXER HEV', 'ligero_b', 'media'),
	('dbf3108f-139a-4761-b5aa-7d1efa5aa6ae', 'Subaru', 'Outback', 'ligero_b', 'media'),
	('d8953609-fae2-41e6-8b8d-1b5b5b6ee06a', 'Subaru', 'Trailseeker', 'ligero_b', 'media'),
	('4e644d91-54c0-4d29-8899-85b525ccd35f', 'Subaru', 'XV', 'ligero_b', 'media'),
	('19e65b55-1c2a-4a42-9e6e-5e17738d8d4c', 'Suzuki', 'XL7', 'ligero_b', 'media'),
	('9e53640a-a53c-4988-ab0f-3a07cd8f1f38', 'Suzuki', 'S Cross', 'ligero_b', 'media'),
	('b6325ffd-a04b-41ee-be9a-0d3ff5de21e3', 'Suzuki', 'Vitara', 'ligero_b', 'media'),
	('66a9b443-7ce4-4167-9cf5-2c38ef2679c3', 'Suzuki', 'FRONX', 'ligero_b', 'media'),
	('3a256b83-ceb7-419e-b346-067918fc851f', 'Suzuki', 'Grand Vitara', 'ligero_b', 'media'),
	('523ddd2e-9abb-4624-8e6f-694656084df3', 'Suzuki', 'Grand Vitara', 'ligero_b', 'media'),
	('31d47cc7-dc93-4331-a842-9b13fff43edf', 'Suzuki', 'Grand Vitara 4x4', 'ligero_b', 'media'),
	('e3a75e3f-cc37-445e-a8a3-2a5b2e12e699', 'Suzuki', 'JIMNY', 'ligero_b', 'media'),
	('8dd851e7-5cfe-4783-8724-db8f554408d9', 'Toyota', 'Rav4', 'ligero_b', 'media'),
	('e74f9129-48fc-46b2-84b1-272b709f4fed', 'Toyota', 'Corolla Cross', 'ligero_b', 'media'),
	('b8bee7ec-6224-4a85-80e2-f38dde9e1b01', 'Toyota', 'Highlander', 'ligero_b', 'media'),
	('a8559037-f3c9-4020-8624-82fd7bbf48bc', 'Toyota', 'Rush', 'ligero_b', 'media'),
	('199fa0ca-11c8-41fc-8fc7-8f4fb9625fd9', 'Toyota', 'Sequoia', 'ligero_b', 'media'),
	('62d84300-e9ac-4e85-b3ef-1df792af8f06', 'Toyota', 'RAIZE', 'ligero_b', 'media'),
	('5270f31f-eaa3-44b0-ab47-0fd8ff5b017c', 'Toyota', '4Runner', 'ligero_b', 'media'),
	('a0cf383a-4737-442f-9d87-53c17c17c661', 'Toyota', '4runner', 'ligero_b', 'media'),
	('2cfac056-804d-4020-aed0-cf70944ffd19', 'Toyota', 'Fjcruiser', 'ligero_b', 'media'),
	('750499be-acd3-412d-885e-d1b0a2a8dde0', 'Toyota', 'Hiace P', 'ligero_b', 'media'),
	('11ceb59f-e2ff-4926-8742-a06d387b03bd', 'Toyota', 'Hiace V', 'ligero_b', 'media'),
	('7b7b4b57-6173-4de1-8c5f-d2d3d62eb361', 'Toyota', 'Highlander', 'ligero_b', 'media'),
	('82ba2ce4-ea89-408c-86e8-e08b528d8f9f', 'Toyota', 'Lcruiser', 'ligero_b', 'media'),
	('4b654261-779d-4695-883c-65f72c58eb2a', 'Toyota', 'Rav4', 'ligero_b', 'media'),
	('4f408a4e-7a78-41d2-aea4-5a73b866371b', 'Toyota', 'C-HR', 'ligero_b', 'media'),
	('f1313225-9acf-4cbf-a233-4f71d4adeef9', 'Toyota', 'Tacoma', 'ligero_b', 'media'),
	('2d51b56e-85a9-4118-9935-dca966df4507', 'Toyota', 'Tacoma-', 'ligero_b', 'media'),
	('d35d6075-8190-4e31-9dd5-ab006f25b350', 'Toyota', 'Tacoma', 'ligero_b', 'media'),
	('d8e12baa-df25-4c76-9a9a-0c97b4fc2712', 'Toyota', 'Tundra', 'ligero_b', 'media'),
	('5c433bcc-3237-4431-98f5-49fbd6df2c81', 'Toyota', 'Hilux Cc', 'ligero_b', 'media'),
	('ba0edaab-7feb-40f9-a10a-cacf5dc84b53', 'Toyota', 'Hilux Dc', 'ligero_b', 'media'),
	('9610bdba-f70b-40f4-ab4a-ee83a25f7c28', 'Toyota', 'Hilux Sc', 'ligero_b', 'media'),
	('ce6b2bf7-e623-4a3e-a208-0aca15a8b95c', 'Volkswagen', 'Taos', 'ligero_b', 'media'),
	('4c71ad9a-0ff5-48bb-a79a-a12cadf6b080', 'Volkswagen', 'Tiguan-', 'ligero_b', 'media'),
	('62c23a47-f614-4277-b2b0-901a016a480d', 'Volkswagen', 'Eurovan Carga', 'ligero_b', 'media'),
	('9fa6ead7-aa96-4da4-a35e-6374f331feac', 'Volkswagen', 'Eurovan Pasajeros', 'ligero_b', 'media'),
	('ec8e652e-3e6f-4e4d-9f11-6c795297b610', 'Volkswagen', 'Tiguan', 'ligero_b', 'media'),
	('5d2fab5a-7622-47d9-8213-0546dee42045', 'Volkswagen', 'Transporter Carga', 'ligero_b', 'media'),
	('c30efa06-6649-4fb0-9ab5-48f2414b19e6', 'Volkswagen', 'Transporter Pasajeros', 'ligero_b', 'media'),
	('f12e7a23-6ef9-4842-8ff5-a16f1a745f2c', 'Volkswagen', 'Nivus', 'ligero_b', 'media'),
	('893ebdad-805f-412b-ba30-ca24a50f49ed', 'Volkswagen', 'T-Cross', 'ligero_b', 'media'),
	('6e0c010a-f3da-489c-b393-f217bd52bfa5', 'Volkswagen', 'Touareg', 'ligero_b', 'media'),
	('17c14333-ed57-4d82-b238-342ae58f174b', 'Volkswagen', 'Cross Sport', 'ligero_b', 'media'),
	('9263ea2a-19b4-4f81-a1de-1fcd196f7408', 'Volkswagen', 'ID.4', 'ligero_b', 'media'),
	('fab77950-6e7b-49c3-b45a-7b6bafc8cd3d', 'Volkswagen', 'Teramont', 'ligero_b', 'media'),
	('f3de6167-e647-44ef-beae-bc6a4161c9cc', 'Volkswagen', 'T-Cross', 'ligero_b', 'media'),
	('6f7e7890-583a-47ef-bc53-90d36ea896a2', 'Volkswagen', 'Taigun', 'ligero_b', 'media'),
	('cd489cee-4229-43f0-a3ba-13c405c35ad1', 'Volkswagen', 'Crafter chasis', 'ligero_b', 'media'),
	('49abd7b0-91f7-49be-95a3-58a15a348206', 'Volkswagen', 'e-Crafter', 'ligero_b', 'media'),
	('071f6e52-c1a7-4db8-826c-e66e789f0ac0', 'Volkswagen', 'Crafter', 'ligero_b', 'media'),
	('01a30a9f-12e1-4948-bb65-d930ad6b42f0', 'Volkswagen', 'Amarok', 'ligero_b', 'media'),
	('168f6788-a78e-433a-9365-2fbcaf210d20', 'Volkswagen', 'Vw Van', 'ligero_b', 'media'),
	('27286535-b6e0-4c94-8e6d-ba3440738fad', 'Volkswagen', 'Pointer Pick Up', 'ligero_b', 'media'),
	('f1e274e1-3013-42a8-a8d9-fd195ee6bdaf', 'Volkswagen', 'Saveiro', 'ligero_b', 'media'),
	('f6c2b1ab-95b6-4b92-b86b-19faf74ecbdd', 'Volkswagen', 'Volkswagen Caddy', 'ligero_b', 'media'),
	('b96761c3-3760-4f02-aa15-d11d5dc35046', 'Volvo', 'XC60', 'ligero_b', 'media'),
	('81c8f9a6-f49e-48c1-93a9-64f31bce9e53', 'Volvo', 'EX30', 'ligero_b', 'media'),
	('6166a8fe-45e5-49a2-a3b0-8d4a2faefbe9', 'Volvo', 'EX90', 'ligero_b', 'media'),
	('54f9a444-b6e1-4d77-bdeb-9c0a2a4f1d24', 'Volvo', 'XC60 II', 'ligero_b', 'media'),
	('b6f3b2ba-aa4e-4184-b703-8d11c926ace8', 'Volvo', 'XC90 3.2', 'ligero_b', 'media'),
	('8766bcf5-058e-4086-960e-1be10d6deb64', 'Volvo', 'XC90 II', 'ligero_b', 'media'),
	('ec91f052-d704-47f0-814b-62c54602adf5', 'Volvo', 'XC90 V8', 'ligero_b', 'media'),
	('b2d75d5d-0698-4f6e-a6ee-6142e6f50a28', 'Volvo', 'Xc70 2.5t', 'ligero_b', 'media'),
	('3c39f2c9-0efa-4a93-8118-07ccf39ac211', 'Volvo', 'Xc90', 'ligero_b', 'media'),
	('d1d56c2f-43f0-41fa-afd8-3279e0987091', 'Volvo', 'Xc90 T6', 'ligero_b', 'media'),
	('a9347cbf-8a27-4bed-9ca9-fcd2a8cf4086', 'Porsche', 'Cayman', 'ligero_a', 'premium'),
	('e3e8bad1-1dfc-4e09-a33d-fb2b1f9ef1ca', 'Porsche', '718 Boxster', 'ligero_a', 'premium'),
	('f1cdf189-27ed-490e-bd31-15499d5e669f', 'Porsche', '911 Carrera', 'ligero_a', 'premium'),
	('102d5db8-ccd1-45c8-89af-3b963e683626', 'Porsche', '911 Carrera / Turbo / GT', 'ligero_a', 'premium'),
	('176a611a-f614-46f2-8a7a-ccd8202f0716', 'Porsche', '911 Turbo', 'ligero_a', 'premium'),
	('b9d698eb-51af-40e2-916f-5f7780328257', 'Porsche', 'Boxster', 'ligero_a', 'premium'),
	('299e951f-25f0-48c1-a4d6-f3526bf65740', 'Porsche', 'Gt3 / Gt2 / Carrera Gt', 'ligero_a', 'premium'),
	('b92d420d-c8b6-47ae-846b-3d5acda80ed9', 'Acura', 'NSX', 'ligero_a', 'premium'),
	('212c2fbf-ae19-47e0-897c-5ff7192fd897', 'Ford Motor', 'Mustang', 'ligero_a', 'premium'),
	('606f926d-ee6c-46e7-be81-c5b642d46e93', 'General Motors', 'Camaro Convertible', 'ligero_a', 'premium'),
	('7e6528c6-0918-42b5-bb85-42c515236261', 'General Motors', 'Camaro Convertible', 'ligero_a', 'premium'),
	('ed990bbe-2c20-43b1-9c68-479b9005417b', 'General Motors', 'Corvette 2 Pts. Convertible', 'ligero_a', 'premium'),
	('c4de5b2c-708b-40c0-9ffe-610e10325840', 'General Motors', 'Camaro', 'ligero_a', 'premium'),
	('e4b9779d-8faa-468d-9d97-51e3a25f8af9', 'General Motors', 'Camaro', 'ligero_a', 'premium'),
	('56087cf1-78e1-48ab-9518-5f99bd228d8a', 'General Motors', 'Corvette', 'ligero_a', 'premium'),
	('b56b02c5-6c9a-4d06-8282-733a8bd2daee', 'Mercedes Benz', 'AMG GT', 'ligero_a', 'premium'),
	('ddfa4bff-1e91-47c5-949c-157520d83117', 'Nissan', 'GT-R', 'ligero_a', 'premium'),
	('d80ca652-545a-4e32-ab12-a73e24803b5d', 'Toyota', 'GR Supra', 'ligero_a', 'premium');


--
-- Data for Name: certificacion_pago_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."certificacion_pago_conductor" ("certificacion", "porcentaje", "actualizado_en", "actualizado_por_admin_id") VALUES
	('estandar', 40.00, '2026-10-04 12:44:14.142149+00', NULL),
	('tipo_b', 45.00, '2026-10-04 12:44:14.142149+00', NULL),
	('federal', 48.00, '2026-10-04 12:44:14.142149+00', NULL),
	('premium', 52.00, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: certificaciones_operativas_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: claves_idempotencia; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: competencias_asignacion; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: configuracion_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."configuracion_admin" ("clave", "nombre", "descripcion", "categoria", "valor", "version", "actualizada_en", "actualizada_por") VALUES
	('zonas_operacion', 'Zonas de operacion', 'Cobertura geografica, bloqueo fuera de cobertura y zonas activas para operar traslados.', 'operacion', '{"zonas": [{"activa": true, "codigo": "mx_cdmx", "nombre": "Ciudad de M├®xico"}], "permitir_fuera_cobertura": false}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('tipos_servicio_vehiculo', 'Tipos de servicio y vehiculo', 'Catalogo operativo admitido para solicitudes, asignacion y compatibilidad vehicular.', 'operacion', '{"servicios": ["traslado_local", "traslado_foraneo"], "vehiculos": ["sedan", "suv", "pickup", "van"]}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('reglas_evidencia', 'Reglas de evidencia', 'Evidencia minima obligatoria por etapa del traslado.', 'operacion', '{"inicio": {"fotos_minimas": 4, "requiere_odometro": true}, "entrega": {"fotos_minimas": 4, "requiere_firma": true}}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('estados_traslado', 'Estados de traslado', 'Candados normativos para transiciones, cierres, cancelaciones y reasignaciones.', 'operacion', '{"bloquear_cierre_sin_evidencias": true, "reasignacion_conductor_requiere_motivo": true, "cancelacion_especial_requiere_supervisor": true, "cierre_con_incidencia_requiere_aprobacion": true}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('plantillas_notificacion', 'Plantillas de notificacion', 'Canales y reglas para avisos transaccionales de usuarios, conductores y empresas.', 'comunicacion', '{"canales": ["push", "email"], "notificar_cancelacion": true, "recordatorio_minutos_antes": 60, "notificar_incidencia_critica": true}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('metodos_pago', 'Metodos de pago', 'Metodos aceptados por Ruum Ruum, pasarela principal y reglas de conciliacion/cobro.', 'finanzas', '{"habilitados": ["transferencia", "tarjeta"], "proveedor_pasarela": "stripe", "requiere_referencia": true, "conciliacion_automatica": false, "bloquear_sin_pago_confirmado": false, "permitir_credito_corporativo": true}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('datos_fiscales', 'Datos fiscales', 'Datos fiscales de Ruum Ruum como emisor y requisitos fiscales obligatorios para clientes fisicos o morales.', 'finanzas', '{"pais": "MX", "ruum": {"rfc": "", "razon_social": "", "regimen_fiscal": "", "correo_facturacion": "", "codigo_postal_fiscal": ""}, "moneda": "MXN", "iva_porcentaje": 16, "requisitos_cliente": {"persona_moral": {"constancia_obligatoria": true, "razon_social_obligatoria": true}, "persona_fisica": {"rfc_obligatorio": true, "constancia_obligatoria": false}}, "requiere_constancia_fiscal": true, "bloquear_facturacion_sin_datos": true}', 1, '2026-10-04 12:44:14.658213+00', NULL),
	('seguridad', 'Seguridad', 'Politicas administrativas de sesion, motivos, aprobacion dual, MFA y cambios criticos.', 'seguridad', '{"sesion_minutos": 60, "mfa_requerido_direccion": true, "motivo_minimo_caracteres": 10, "intentos_fallidos_maximos": 5, "aprobacion_dual_cambios_criticos": true, "reautenticacion_cambios_criticos_minutos": 15}', 1, '2026-10-04 12:44:14.658213+00', NULL);


--
-- Data for Name: configuracion_contactos_soporte; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."configuracion_contactos_soporte" ("ambiente", "soporte_telefono", "soporte_correo", "emergencia_telefono", "actualizado_en") VALUES
	('production', '5669522178', 'ruum.ruum.mx@gmail.com', '911', '2026-10-04 12:44:14.387036+00'),
	('staging', '5500000000', 'soporte-conductores-pruebas@example.test', '5500000911', '2026-10-04 12:44:14.387036+00'),
	('development', '5500000000', 'soporte-conductores-pruebas@example.test', '5500000911', '2026-10-04 12:44:14.387036+00'),
	('test', '5500000000', 'soporte-conductores-pruebas@example.test', '5500000911', '2026-10-04 12:44:14.387036+00');


--
-- Data for Name: solicitudes_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: consentimientos_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tarifas_politica_versiones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: evidencia_inspecciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custodia_eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: evidencia_fotos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custodia_evento_fotos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: datos_bancarios_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dispositivos_push; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: disputas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documento_conductor_transiciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."documento_conductor_transiciones" ("origen", "destino") VALUES
	('en_revision', 'aprobado'),
	('en_revision', 'rechazado'),
	('en_revision', 'reemplazado'),
	('aprobado', 'vencido'),
	('aprobado', 'reemplazado'),
	('rechazado', 'reemplazado'),
	('vencido', 'reemplazado');


--
-- Data for Name: documentos_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documentos_identidad_storage_validados; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documentos_identidad_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documentos_storage_validados; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edge_function_rate_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresa_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."empresa_roles" ("clave", "nombre", "descripcion", "es_sistema") VALUES
	('owner', 'Owner', 'Due├▒o de la empresa: control total, ├║ltimo responsable.', true),
	('admin', 'Administrador', 'Administra equipo, operaciones y facturaci├│n.', true),
	('operations_manager', 'Operations Manager', 'Gestiona operaciones, traslados y sucursales.', true),
	('dispatcher', 'Dispatcher', 'Crea traslados y asigna conductores.', true),
	('finance', 'Finanzas', 'Ve y gestiona facturaci├│n y reportes.', true),
	('viewer', 'Viewer', 'Solo lectura operativa.', true);


--
-- Data for Name: empresa_miembros; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresa_rol_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."empresa_rol_permisos" ("rol_clave", "permiso") VALUES
	('owner', 'operation:create'),
	('owner', 'operation:view'),
	('owner', 'operation:update'),
	('owner', 'transfer:create'),
	('owner', 'transfer:view'),
	('owner', 'transfer:cancel'),
	('owner', 'driver:view'),
	('owner', 'driver:assign'),
	('owner', 'billing:view'),
	('owner', 'billing:manage'),
	('owner', 'reports:view'),
	('owner', 'team:manage'),
	('owner', 'location:view'),
	('owner', 'location:manage'),
	('admin', 'operation:create'),
	('admin', 'operation:view'),
	('admin', 'operation:update'),
	('admin', 'transfer:create'),
	('admin', 'transfer:view'),
	('admin', 'transfer:cancel'),
	('admin', 'driver:view'),
	('admin', 'driver:assign'),
	('admin', 'billing:view'),
	('admin', 'billing:manage'),
	('admin', 'reports:view'),
	('admin', 'team:manage'),
	('admin', 'location:view'),
	('admin', 'location:manage'),
	('operations_manager', 'operation:create'),
	('operations_manager', 'operation:view'),
	('operations_manager', 'operation:update'),
	('operations_manager', 'transfer:create'),
	('operations_manager', 'transfer:view'),
	('operations_manager', 'transfer:cancel'),
	('operations_manager', 'driver:view'),
	('operations_manager', 'driver:assign'),
	('operations_manager', 'reports:view'),
	('operations_manager', 'location:view'),
	('operations_manager', 'location:manage'),
	('dispatcher', 'operation:view'),
	('dispatcher', 'transfer:create'),
	('dispatcher', 'transfer:view'),
	('dispatcher', 'driver:view'),
	('dispatcher', 'driver:assign'),
	('dispatcher', 'location:view'),
	('finance', 'operation:view'),
	('finance', 'transfer:view'),
	('finance', 'billing:view'),
	('finance', 'billing:manage'),
	('finance', 'reports:view'),
	('viewer', 'operation:view'),
	('viewer', 'transfer:view'),
	('viewer', 'driver:view'),
	('viewer', 'billing:view'),
	('viewer', 'reports:view'),
	('viewer', 'location:view');


--
-- Data for Name: empresa_sucursales; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas_cambios_sensibles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas_condiciones_comerciales_versiones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas_datos_fiscales_versiones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas_documentos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: estado_operativo_transiciones_validas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."estado_operativo_transiciones_validas" ("estado_actual", "estado_siguiente") VALUES
	('draft', 'requested'),
	('draft', 'cancelled'),
	('requested', 'confirmed'),
	('requested', 'cancelled'),
	('confirmed', 'planned'),
	('confirmed', 'cancelled'),
	('planned', 'assigned'),
	('planned', 'cancelled'),
	('assigned', 'pickup_in_progress'),
	('assigned', 'in_transit'),
	('assigned', 'failed'),
	('assigned', 'cancelled'),
	('pickup_in_progress', 'vehicle_received'),
	('pickup_in_progress', 'failed'),
	('pickup_in_progress', 'cancelled'),
	('vehicle_received', 'in_transit'),
	('vehicle_received', 'failed'),
	('vehicle_received', 'cancelled'),
	('in_transit', 'delivery_in_progress'),
	('in_transit', 'failed'),
	('in_transit', 'cancelled'),
	('delivery_in_progress', 'delivered'),
	('delivery_in_progress', 'failed'),
	('delivery_in_progress', 'cancelled'),
	('delivered', 'closed'),
	('assigned', 'planned');


--
-- Data for Name: estado_transiciones_validas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."estado_transiciones_validas" ("estado_actual", "estado_siguiente") VALUES
	('usuario_pendiente_verificacion', 'usuario_verificado'),
	('usuario_verificado', 'solicitud_creada'),
	('solicitud_creada', 'documentacion_pendiente'),
	('solicitud_creada', 'servicio_cancelado'),
	('documentacion_pendiente', 'documentacion_en_revision'),
	('documentacion_pendiente', 'servicio_cancelado'),
	('documentacion_en_revision', 'documentacion_validada'),
	('documentacion_en_revision', 'documentacion_pendiente'),
	('documentacion_en_revision', 'servicio_cancelado'),
	('documentacion_validada', 'cotizacion_generada'),
	('cotizacion_generada', 'servicio_confirmado'),
	('cotizacion_generada', 'servicio_cancelado'),
	('servicio_confirmado', 'pendiente_de_conductor'),
	('servicio_confirmado', 'servicio_cancelado'),
	('pendiente_de_conductor', 'conductor_asignado'),
	('pendiente_de_conductor', 'servicio_cancelado'),
	('conductor_asignado', 'conductor_en_camino_al_origen'),
	('conductor_asignado', 'servicio_cancelado'),
	('conductor_asignado', 'traslado_fallido'),
	('conductor_en_camino_al_origen', 'conductor_en_punto_de_recoleccion'),
	('conductor_en_camino_al_origen', 'incidencia_reportada'),
	('conductor_en_punto_de_recoleccion', 'verificacion_vehiculo_en_proceso'),
	('conductor_en_punto_de_recoleccion', 'incidencia_reportada'),
	('conductor_en_punto_de_recoleccion', 'traslado_fallido'),
	('conductor_en_punto_de_recoleccion', 'servicio_cancelado'),
	('verificacion_vehiculo_en_proceso', 'evidencia_inicial_en_proceso'),
	('verificacion_vehiculo_en_proceso', 'traslado_fallido'),
	('evidencia_inicial_en_proceso', 'evidencia_inicial_completada'),
	('evidencia_inicial_completada', 'vehiculo_recibido'),
	('vehiculo_recibido', 'traslado_en_curso'),
	('traslado_en_curso', 'llegada_a_destino'),
	('traslado_en_curso', 'incidencia_reportada'),
	('incidencia_reportada', 'traslado_en_curso'),
	('incidencia_reportada', 'traslado_fallido'),
	('incidencia_reportada', 'llegada_a_destino'),
	('llegada_a_destino', 'evidencia_final_en_proceso'),
	('evidencia_final_en_proceso', 'evidencia_final_completada'),
	('evidencia_final_completada', 'entrega_confirmada'),
	('entrega_confirmada', 'pago_pendiente'),
	('entrega_confirmada', 'pago_completado'),
	('pago_pendiente', 'pago_completado'),
	('pago_completado', 'servicio_cerrado'),
	('servicio_cerrado', 'dano_no_reportado_en_revision'),
	('servicio_cerrado', 'disputa_abierta'),
	('dano_no_reportado_en_revision', 'reclamo_abierto'),
	('dano_no_reportado_en_revision', 'cierre_operativo_con_incidencia_abierta'),
	('reclamo_abierto', 'reclamo_resuelto'),
	('reclamo_resuelto', 'disputa_abierta'),
	('cierre_operativo_con_incidencia_abierta', 'reclamo_resuelto'),
	('cierre_operativo_con_incidencia_abierta', 'disputa_abierta'),
	('cierre_operativo_con_incidencia_abierta', 'disputa_resuelta'),
	('disputa_abierta', 'disputa_resuelta'),
	('solicitud_creada', 'cotizacion_generada'),
	('documentacion_pendiente', 'cotizacion_generada'),
	('documentacion_en_revision', 'cotizacion_generada'),
	('cotizacion_generada', 'cotizacion_aceptada'),
	('cotizacion_aceptada', 'servicio_confirmado'),
	('cotizacion_aceptada', 'servicio_cancelado'),
	('entrega_confirmada', 'servicio_cerrado'),
	('conductor_asignado', 'pendiente_de_conductor');


--
-- Data for Name: eventos_observabilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: eventos_operativos_app; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: eventos_registro_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: expediente_conductor_transiciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."expediente_conductor_transiciones" ("origen", "destino") VALUES
	('borrador', 'correo_pendiente'),
	('correo_pendiente', 'datos_incompletos'),
	('correo_pendiente', 'documentos_pendientes'),
	('datos_incompletos', 'documentos_pendientes'),
	('documentos_pendientes', 'listo_para_enviar'),
	('listo_para_enviar', 'en_revision'),
	('en_revision', 'requiere_correccion'),
	('en_revision', 'aprobado'),
	('en_revision', 'rechazado'),
	('requiere_correccion', 'datos_incompletos'),
	('requiere_correccion', 'documentos_pendientes'),
	('requiere_correccion', 'listo_para_enviar'),
	('aprobado', 'suspendido'),
	('suspendido', 'aprobado'),
	('suspendido', 'rechazado');


--
-- Data for Name: exportaciones_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feature_flags_app; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: filas_carga_traslados_masivos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gastos_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: historial_estados_solicitud_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: historial_estados_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: incidencias; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: incidencia_evidencia_fotos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: incidencia_historial; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sesiones_proxy_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: llamadas_enmascaradas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mensajes_chat; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: metas_registro_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."metas_registro_conductor" ("clave", "nombre", "operador", "objetivo", "severidad", "activo", "actualizado_en") VALUES
	('conversion_envio_pct', 'Conversion a envio', 'min', 65.00, 'alta', true, '2026-10-04 12:44:14.808108+00'),
	('errores_otp', 'Errores OTP', 'max', 20.00, 'media', true, '2026-10-04 12:44:14.808108+00'),
	('errores_rpc', 'Errores RPC', 'max', 10.00, 'alta', true, '2026-10-04 12:44:14.808108+00'),
	('fallos_documentos', 'Fallos de documentos', 'max', 15.00, 'media', true, '2026-10-04 12:44:14.808108+00'),
	('tiempo_promedio_revision_segundos', 'Revision promedio', 'max', 86400.00, 'alta', true, '2026-10-04 12:44:14.808108+00');


--
-- Data for Name: modo_prueba_supervisada; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notas_internas_solicitud_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notas_internas_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notificaciones_admin_operativas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notificaciones_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notificaciones_push_entregas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: obs_edge_errors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: obs_retencion_politicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."obs_retencion_politicas" ("tabla", "dias", "descripcion", "creado_en", "actualizado_en") VALUES
	('obs_rpc_latency', 90, 'Latencias de RPC: 90 d├¡as.', '2026-10-04 12:44:15.707434+00', '2026-10-04 12:44:15.707434+00'),
	('obs_edge_errors', 180, 'Errores de Edge Functions: 180 d├¡as.', '2026-10-04 12:44:15.707434+00', '2026-10-04 12:44:15.707434+00'),
	('eventos_operativos_app', 180, 'Telemetr├¡a de apps: 180 d├¡as.', '2026-10-04 12:44:15.707434+00', '2026-10-04 12:44:15.707434+00'),
	('eventos_observabilidad', 180, 'Logs centralizados: 180 d├¡as.', '2026-10-04 12:44:15.707434+00', '2026-10-04 12:44:15.707434+00'),
	('registro_auditoria', 730, 'Auditor├¡a operacional: 2 a├▒os, solo direcci├│n purga.', '2026-10-04 12:44:15.707434+00', '2026-10-04 12:44:15.707434+00');


--
-- Data for Name: obs_rpc_latency; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: politicas_version_app; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."politicas_version_app" ("plataforma", "version_minima", "version_recomendada", "version_vigente", "mensaje", "funcionalidades_incompatibles", "actualizado_en") VALUES
	('android', '1.0.0', '1.0.0', '1.0.0', 'Ruum Ruum Conductor 1.0.0 es la versi├│n operativa vigente.', '{}', '2026-10-04 12:44:14.547727+00');


--
-- Data for Name: preferencias_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: preferencias_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: puntualidad_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reclamos_seguro; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: registro_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sla_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sla_policies" ("codigo", "nombre", "descripcion", "horas_limite", "warning_pct", "severidad", "prioridad_base", "activo", "creado_en", "actualizado_en") VALUES
	('asignacion', 'Tiempo m├íximo de asignaci├│n', 'De solicitud confirmada a conductor asignado.', 2.00, 75, 'alta', 75, true, '2026-10-04 12:44:15.645552+00', '2026-10-04 12:44:15.645552+00'),
	('recoleccion', 'Ventana de recolecci├│n', 'De solicitud a veh├¡culo recibido.', 24.00, 80, 'alta', 70, true, '2026-10-04 12:44:15.645552+00', '2026-10-04 12:44:15.645552+00'),
	('entrega', 'Ventana de entrega', 'De veh├¡culo recibido a entrega confirmada.', 48.00, 80, 'alta', 70, true, '2026-10-04 12:44:15.645552+00', '2026-10-04 12:44:15.645552+00'),
	('sin_gps', 'Tiempo m├íximo sin GPS', 'Sin se├▒al GPS en viaje activo.', 0.50, 80, 'alta', 85, true, '2026-10-04 12:44:15.645552+00', '2026-10-04 12:44:15.645552+00'),
	('respuesta_incidencia', 'Tiempo de respuesta a incidencia', 'De incidencia abierta a primera atenci├│n/resoluci├│n.', 4.00, 75, 'alta', 80, true, '2026-10-04 12:44:15.645552+00', '2026-10-04 12:44:15.645552+00');


--
-- Data for Name: sla_empresa_politicas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sla_evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sla_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sla_operacion_politicas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: solicitudes_aprobacion_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: solicitudes_asignacion; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: solicitudes_cambio_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tarifas_condicion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_condicion" ("condicion", "factor", "actualizado_en", "actualizado_por_admin_id") VALUES
	('nueva', 1.10, '2026-10-04 12:44:14.142149+00', NULL),
	('seminueva', 1.00, '2026-10-04 12:44:14.142149+00', NULL),
	('rescate_mecanico', 1.25, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: tarifas_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_config" ("id", "tarifa_hora", "tope_factor_variable", "actualizado_en", "actualizado_por_admin_id", "nombre_version", "estado", "vigente_desde", "notas") VALUES
	(true, 21.50, 2.00, '2026-10-04 12:44:15.616269+00', NULL, 'Pol├¡tica tarifaria RT-12', 'vigente', '2026-10-04 12:44:14.266926+00', NULL);


--
-- Data for Name: tarifas_dia; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_dia" ("dia", "factor", "actualizado_en", "actualizado_por_admin_id") VALUES
	('entre_semana', 1.00, '2026-10-04 12:44:14.142149+00', NULL),
	('fin_semana', 1.10, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: tarifas_gama; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_gama" ("gama", "factor", "actualizado_en", "actualizado_por_admin_id") VALUES
	('entrada', 1.00, '2026-10-04 12:44:14.142149+00', NULL),
	('media', 1.15, '2026-10-04 12:44:14.142149+00', NULL),
	('alta', 1.40, '2026-10-04 12:44:14.142149+00', NULL),
	('premium', 1.80, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: tarifas_horario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_horario" ("horario", "factor", "actualizado_en", "actualizado_por_admin_id") VALUES
	('diurno', 1.00, '2026-10-04 12:44:14.142149+00', NULL),
	('nocturno', 1.15, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: tarifas_vehiculo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tarifas_vehiculo" ("id", "categoria", "rango", "base", "por_km", "actualizado_en", "actualizado_por_admin_id") VALUES
	('92402eca-ab03-4ebd-be6c-804810a3cddd', 'ligero_a', 'rango_1', 650.00, 7.00, '2026-10-04 12:44:14.142149+00', NULL),
	('d221d951-5bf5-4a86-ab29-ca812f63f014', 'ligero_a', 'rango_2', 700.00, 7.00, '2026-10-04 12:44:14.142149+00', NULL),
	('3f7e9140-8b50-4ff5-8a2e-c9e35373d677', 'ligero_a', 'rango_3', 720.00, 7.00, '2026-10-04 12:44:14.142149+00', NULL),
	('7dab938e-c7ee-45de-b35e-19813d5cb095', 'ligero_a', 'rango_4', 750.00, 7.00, '2026-10-04 12:44:14.142149+00', NULL),
	('82c94dad-2d10-4531-9c4f-ee0188de149f', 'ligero_b', 'rango_1', 700.00, 7.50, '2026-10-04 12:44:14.142149+00', NULL),
	('540e66a2-c0e1-4a66-bf56-d9288f78a25d', 'ligero_b', 'rango_2', 750.00, 7.50, '2026-10-04 12:44:14.142149+00', NULL),
	('938e2e15-ed21-438c-92f9-3cce25b25ce3', 'ligero_b', 'rango_3', 780.00, 7.50, '2026-10-04 12:44:14.142149+00', NULL),
	('2c0b736e-1298-4663-8f39-4683a565c9c8', 'ligero_b', 'rango_4', 820.00, 7.50, '2026-10-04 12:44:14.142149+00', NULL),
	('9b5769d2-4ae6-46ac-ba55-45cdeacf7401', 'mediano', 'rango_1', 1100.00, 11.00, '2026-10-04 12:44:14.142149+00', NULL),
	('0b170b07-7f01-48c0-81ae-da667477f80c', 'mediano', 'rango_2', 1800.00, 11.00, '2026-10-04 12:44:14.142149+00', NULL),
	('3de63607-d0d4-414a-b77b-d35e79660a81', 'mediano', 'rango_3', 2600.00, 11.00, '2026-10-04 12:44:14.142149+00', NULL),
	('3e009c0b-c05f-463c-a845-732607f3e46b', 'mediano', 'rango_4', 3800.00, 11.00, '2026-10-04 12:44:14.142149+00', NULL),
	('f0486eb3-557f-4c24-a9a8-c618d105c4d0', 'camion', 'rango_1', 1800.00, 16.00, '2026-10-04 12:44:14.142149+00', NULL),
	('510fea1b-5620-41ee-a7e5-f085a31bee58', 'camion', 'rango_2', 3200.00, 16.00, '2026-10-04 12:44:14.142149+00', NULL),
	('c4d5e355-f5da-4eaf-9ec7-1a0512cef657', 'camion', 'rango_3', 4800.00, 16.00, '2026-10-04 12:44:14.142149+00', NULL),
	('1c63d162-b36d-4896-b252-30ba0c8fc2d2', 'camion', 'rango_4', 7200.00, 16.00, '2026-10-04 12:44:14.142149+00', NULL);


--
-- Data for Name: ubicaciones_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tracking_salud_traslado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tracking_sesiones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: traslado_paradas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: verificaciones_identidad_didit; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: versiones_documento_consentimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."versiones_documento_consentimiento" ("tipo_documento", "version", "hash_documento", "referencia", "vigente_desde", "vigente_hasta") VALUES
	('terminos_servicio', 1, '2b251d14e214b646cc5c1fbac552489caf45e616494cc205a7df0b239621a202', '/docs-legales/terminos-y-condiciones-ruum-ruum.docx', '2026-07-03 00:00:00+00', NULL),
	('aviso_privacidad', 1, 'a7a799394029c1d4b1e86918b1e3a18d495e3376ffcc561f3e7fe6836f6ef8cf', '/docs-legales/aviso-de-privacidad-ruum-ruum.docx', '2026-07-03 00:00:00+00', NULL),
	('autorizacion_antecedentes', 1, '45036a337744aa53a347074ff5799556703836cae347a42095cb281e23d232eb', 'declaracion://autorizacion-antecedentes/v1', '2026-07-03 00:00:00+00', NULL),
	('declaracion_suspensiones', 1, '4cd02aa1ca0ff1d4617ea8f7e226a0f6153385f0b96faee0aab6f9b221dc43a1', 'declaracion://sin-suspensiones/v1', '2026-07-03 00:00:00+00', NULL);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('evidencia', 'evidencia', NULL, '2026-10-04 12:44:13.601557+00', '2026-10-04 12:44:13.601557+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('documentos-conductor', 'documentos-conductor', NULL, '2026-10-04 12:44:13.646656+00', '2026-10-04 12:44:13.646656+00', false, false, 10485760, '{image/jpeg,image/png,image/webp,application/pdf}', NULL, 'STANDARD'),
	('documentos-identidad', 'documentos-identidad', NULL, '2026-10-04 12:44:13.61142+00', '2026-10-04 12:44:13.61142+00', false, false, 10485760, '{image/jpeg,image/png,application/pdf}', NULL, 'STANDARD'),
	('fotos-perfil', 'fotos-perfil', NULL, '2026-10-04 12:44:13.627272+00', '2026-10-04 12:44:13.627272+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('fotos-perfil-conductor', 'fotos-perfil-conductor', NULL, '2026-10-04 12:44:14.378505+00', '2026-10-04 12:44:14.378505+00', false, false, 5242880, '{image/jpeg,image/png,image/webp}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: custodia_eventos_n_orden_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."custodia_eventos_n_orden_seq"', 1, false);


--
-- Name: eventos_observabilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."eventos_observabilidad_id_seq"', 1, false);


--
-- Name: obs_edge_errors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."obs_edge_errors_id_seq"', 1, false);


--
-- Name: obs_rpc_latency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."obs_rpc_latency_id_seq"', 1, false);


--
-- Name: tarifas_politica_versiones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tarifas_politica_versiones_id_seq"', 1, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict urfMcyAiPJOqNLIngqJqjteeqbeuRmd9FF2RURSdiSRYgM8j4nH7oxlSklZc6f1

RESET ALL;
SET session_replication_role = 'origin';
