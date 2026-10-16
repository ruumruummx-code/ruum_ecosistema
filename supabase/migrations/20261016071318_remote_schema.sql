SET local check_function_bodies = off;

REVOKE ALL ON TABLE "public"."claves_idempotencia" FROM "anon";

REVOKE ALL ON TABLE "public"."claves_idempotencia" FROM "authenticated";

ALTER TABLE "public"."claves_idempotencia"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estado_operativo_transiciones_validas"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_actualizado_en()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.actualizado_en = now();
  return new;
end;
$function$;

ALTER VIEW "public"."conductores_publicos" SET (security_invoker=true);

CREATE POLICY "Block client access to idempotency keys" ON "public"."claves_idempotencia"
  FOR ALL
  TO "anon", "authenticated"
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow public reads of valid transitions" ON "public"."estado_operativo_transiciones_validas"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

