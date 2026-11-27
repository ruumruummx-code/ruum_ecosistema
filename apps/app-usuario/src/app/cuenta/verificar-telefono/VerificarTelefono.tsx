"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { Button, Card, CardContent, Input, Label, PageHeader } from "@ruum/ui/base";
import { obtenerHeadersCsrfAsync } from "@/lib/csrf";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";

type Etapa = "inicial" | "codigo_enviado" | "verificado";

const COOLDOWN_REENVIO_SEG = 60;

/**
 * Verificación del teléfono para cuentas creadas mientras el SMS estuvo
 * suspendido. Reutiliza los endpoints del registro y confirma en
 * /api/cuenta/telefono/verificar. Sin este paso no se puede solicitar el
 * primer traslado.
 */
export function VerificarTelefono() {
  const [cargando, setCargando] = useState(true);
  const [telefono, setTelefono] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("inicial");
  const [enviando, setEnviando] = useState(false);
  const [esperaReenvio, setEsperaReenvio] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      return;
    }
    let activo = true;
    crearClienteNavegador()
      .auth.getUser()
      .then(({ data }) => {
        if (!activo) return;
        const digitos = String(data.user?.user_metadata?.telefono ?? "").replace(/\D/g, "").slice(-10);
        setTelefono(digitos.length === 10 ? digitos : null);
        if (data.user?.user_metadata?.telefono_verificado !== false) setEtapa("verificado");
      })
      .catch(() => {
        if (activo) setError("No pudimos cargar los datos de tu cuenta. Intenta recargar la página.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (esperaReenvio <= 0) return;
    const timer = setInterval(() => {
      setEsperaReenvio((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [esperaReenvio]);

  async function llamar(url: string, cuerpo: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" }),
      body: JSON.stringify(cuerpo),
    });
    const datos = (await res.json().catch(() => ({}))) as { error?: string; token?: string };
    if (!res.ok) throw new Error(datos.error ?? "No pudimos completar la verificación.");
    return datos;
  }

  async function enviarCodigo() {
    if (!telefono || enviando || esperaReenvio > 0) return;
    setEnviando(true);
    setError(null);
    try {
      await llamar("/api/auth/phone-verify/send", { telefono });
      setEtapa("codigo_enviado");
      setEsperaReenvio(COOLDOWN_REENVIO_SEG);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el código.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const { token } = await llamar("/api/auth/phone-verify/verify", { telefono, codigo });
      await llamar("/api/cuenta/telefono/verificar", { token });
      setEtapa("verificado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos verificar el código.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-lg content-start gap-4 bg-ui-bg px-4 py-6">
      <PageHeader
        titulo="Verifica tu teléfono"
        descripcion="Lo usamos para que el conductor y Soporte puedan contactarte durante el traslado."
      />
      <Card>
        <CardContent className="grid gap-4 p-4">
          {cargando ? (
            <p role="status" className="text-sm text-ui-fg-muted">Cargando información de tu teléfono…</p>
          ) : etapa === "verificado" ? (
            <>
              <div role="status"><Aviso tono="success">Tu teléfono está verificado.</Aviso></div>
              <Button asChild>
                <Link href="/viajes/nuevo">Solicitar traslado</Link>
              </Button>
            </>
          ) : !telefono ? (
            <p className="text-sm text-ui-fg-muted">
              Tu cuenta no tiene un teléfono registrado. <Link href="/soporte" className="font-semibold text-ui-brand underline">Contacta a Soporte</Link>.
            </p>
          ) : etapa === "inicial" ? (
            <>
              <p className="text-sm text-ui-fg-muted">Te enviaremos un código por SMS al número terminado en {telefono.slice(-4)}.</p>
              <Button onClick={enviarCodigo} disabled={enviando}>{enviando ? "Enviando…" : "Enviar código"}</Button>
            </>
          ) : (
            <form onSubmit={confirmarCodigo} className="grid gap-3" noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="codigo-sms">Código de 6 dígitos</Label>
                <Input
                  id="codigo-sms"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <Button type="submit" disabled={enviando || codigo.length !== 6}>{enviando ? "Verificando…" : "Verificar"}</Button>
              <Button type="button" variant="ghost" onClick={enviarCodigo} disabled={enviando || esperaReenvio > 0}>
                {esperaReenvio > 0 ? `Reenviar código en ${esperaReenvio} s` : "Reenviar código"}
              </Button>
            </form>
          )}
          {error && <div role="alert"><Aviso tono="danger">{error}</Aviso></div>}
        </CardContent>
      </Card>
    </main>
  );
}
