"use client";

import { useEffect, useRef, useState } from "react";
import type { Appearance, Stripe, StripeElements } from "@stripe/stripe-js";
import { Button, Aviso } from "@ruum/ui";
import Link from "next/link";
import { crearClienteNavegador } from "../lib/supabase-browser";
import { obtenerHeadersCsrfAsync } from "../lib/csrf";
import { logStructuredError, logStructuredWarn, logStructuredInfo } from "../lib/logger";

const clavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const TIMEOUT_INICIO_PAGO_MS =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_TIMEOUT_MS
    ? Number(process.env.NEXT_PUBLIC_STRIPE_TIMEOUT_MS)
    : 15_000;

export const TIMEOUT_AVISO_ESPERA_MS =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_AVISO_MS
    ? Number(process.env.NEXT_PUBLIC_STRIPE_AVISO_MS)
    : 5_000;

/* Configuración de apariencia institucional oscura para Stripe Elements */
const aparienciaStripe: Appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#FFC400",
    colorBackground: "#0A1220",
    colorText: "#F8F8F5",
    colorDanger: "#F43F5E",
    fontFamily: "Inter, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      borderColor: "#1C2A3E",
      backgroundColor: "#070D18",
      color: "#FFFFFF",
      boxShadow: "none",
    },
    ".Input:focus": {
      borderColor: "#FFC400",
      boxShadow: "0 0 0 2px rgba(255, 196, 0, 0.25)",
    },
    ".Tab": {
      borderColor: "#1C2A3E",
      backgroundColor: "#0A1220",
      color: "#94A3B8",
    },
    ".Tab--selected": {
      borderColor: "#FFC400",
      backgroundColor: "#141F32",
      color: "#FFC400",
    },
    ".Tab:focus": {
      boxShadow: "0 0 0 2px rgba(255, 196, 0, 0.25)",
    },
    ".Label": {
      color: "#94A3B8",
      fontSize: "12px",
      fontWeight: "600",
    },
  },
};

export function obtenerClavePublica(propKey?: string): string | undefined {
  return (
    propKey ||
    clavePublica ||
    (typeof window !== "undefined"
      ? (window as unknown as { __STRIPE_PK__?: string }).__STRIPE_PK__
      : undefined)
  );
}

export function tieneStripePublicoConfigurado(): boolean {
  return Boolean(obtenerClavePublica());
}

export interface PagoStripeProps {
  clientSecretExterno?: string;
  stripePublishableKey?: string;
  returnPath?: string;
  trasladoId: string;
  monto?: number | null;
  onPagado: () => void;
  compacto?: boolean;
  formId?: string;
  onEstadoPago?: (estado: { listo: boolean; procesando: boolean }) => void;
  timeoutMs?: number;
}

/** El SDK de Stripe se carga por import() dinámico (fuera del bundle inicial) y
 *  se guarda en estado porque los hooks viajan como props: `useStripe` /
 *  `useElements` no pueden invocarse tras un render condicional. Los tipos de
 *  los componentes salen del propio paquete para no redeclararlos. */
interface ModuloStripe {
  Elements: (typeof import("@stripe/react-stripe-js"))["Elements"];
  PaymentElement: (typeof import("@stripe/react-stripe-js"))["PaymentElement"];
  useStripe: () => Stripe | null;
  useElements: () => StripeElements | null;
  stripePromise: Promise<Stripe | null>;
}

/**
 * Consulta de estado previo del traslado para garantizar idempotencia y evitar
 * cobros duplicados antes de crear un nuevo intento (AC-4, AC-5).
 */
async function consultarEstadoPagoPrevio(
  trasladoId: string,
  signal?: AbortSignal,
): Promise<{ pagado: boolean; monto?: number; estadoTraslado?: string }> {
  // Si no es un UUID estándar de traslado (ej. cargas masivas como "carga-1"), omitir
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trasladoId)) {
    return { pagado: false };
  }
  try {
    const res = await fetch(`/api/viajes/${encodeURIComponent(trasladoId)}/estado-pago`, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    if (!res.ok) return { pagado: false };
    const data = (await res.json()) as { pagado?: boolean; monto?: number; estadoTraslado?: string };
    return {
      pagado: Boolean(data.pagado),
      monto: typeof data.monto === "number" ? data.monto : undefined,
      estadoTraslado: data.estadoTraslado,
    };
  } catch (err) {
    logStructuredWarn("pago-stripe", "consulta_estado_previo_error", err, { trasladoId });
    return { pagado: false };
  }
}

async function crearPaymentIntent(
  trasladoId: string,
  signal?: AbortSignal,
): Promise<{ clientSecret?: string; pagoConfirmado?: boolean }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    logStructuredError("pago-stripe", "configuracion_supabase_ausente", undefined, { trasladoId });
    throw new Error("El servicio de pagos no está disponible en este momento. Por favor intenta más tarde.");
  }

  const cliente = crearClienteNavegador();
  const { data: sesion, error: errorSesion } = await cliente.auth.getSession();
  if (errorSesion) {
    logStructuredError("pago-stripe", "error_sesion_supabase", errorSesion, { trasladoId });
    throw errorSesion;
  }

  const token = sesion.session?.access_token;
  if (!token) {
    throw new Error("Tu sesión expiró. Inicia sesión de nuevo para pagar.");
  }

  const respuesta = await fetch(
    `${supabaseUrl}/functions/v1/crear-payment-intent`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ traslado_id: trasladoId }),
      signal,
    },
  );

  const texto = await respuesta.text();
  let data: {
    clientSecret?: string;
    pagoConfirmado?: boolean;
    error?: string;
  } | null = null;
  if (texto) {
    try {
      data = JSON.parse(texto) as {
        clientSecret?: string;
        pagoConfirmado?: boolean;
        error?: string;
      };
    } catch (errJson) {
      logStructuredError("pago-stripe", "respuesta_pago_invalida", errJson, {
        trasladoId,
        status: respuesta.status,
      });
      throw new Error("Tuvimos un problema al conectar con el procesador de pagos. Por favor intenta de nuevo.");
    }
  }

  if (!respuesta.ok) {
    logStructuredWarn("pago-stripe", "error_crear_payment_intent", undefined, {
      trasladoId,
      status: respuesta.status,
      errorBackend: data?.error,
    });
    throw new Error(
      "Tuvimos un problema temporal al procesar la sesión de pago seguro. Por favor intenta más tarde o contacta a soporte.",
    );
  }

  // El backend reconcilió un cobro ya exitoso en Stripe (webhook con lag o fallido)
  if (data?.pagoConfirmado) {
    return { pagoConfirmado: true };
  }

  if (!data?.clientSecret) {
    logStructuredError("pago-stripe", "client_secret_ausente", undefined, { trasladoId, status: respuesta.status });
    throw new Error("No pudimos generar la sesión de pago segura. Por favor intenta de nuevo.");
  }

  return { clientSecret: data.clientSecret };
}

/**
 * Componente principal de cobro con Stripe Elements conectado a la pasarela real
 */
export function PagoStripe({
  trasladoId,
  monto,
  onPagado,
  compacto = false,
  formId,
  onEstadoPago,
  clientSecretExterno,
  stripePublishableKey,
  returnPath,
  timeoutMs = TIMEOUT_INICIO_PAGO_MS,
}: PagoStripeProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const [verificandoEstadoPrevio, setVerificandoEstadoPrevio] = useState(false);
  const [pagoYaConfirmado, setPagoYaConfirmado] = useState(false);
  const [mensajeEspera, setMensajeEspera] = useState<string>(
    "Conectando con la pasarela de pagos segura... Esto toma solo unos segundos."
  );
  const [stripeModule, setStripeModule] = useState<ModuloStripe | null>(null);
  const [reintento, setReintento] = useState(0);
  const reconciliadoNotificado = useRef(false);
  const onPagadoRef = useRef(onPagado);

  useEffect(() => {
    onPagadoRef.current = onPagado;
  }, [onPagado]);

  useEffect(() => {
    onEstadoPago?.({ listo: false, procesando: false });
  }, [trasladoId, reintento, onEstadoPago]);

  useEffect(() => {
    let timerTimeout: NodeJS.Timeout | null = null;
    let timerAviso: NodeJS.Timeout | null = null;
    const abortCtrl = new AbortController();

    async function iniciar() {
      try {
        setError(null);
        setTiempoAgotado(false);
        setClientSecret(null);
        setCustomerSessionClientSecret(undefined);
        setMensajeEspera("Conectando con la pasarela de pagos segura... Esto toma solo unos segundos.");

        if (monto != null && monto <= 0) {
          setError(
            "Tarifa no válida para pago ($0). Nuestro equipo revisará la cotización antes de solicitar cobro.",
          );
          return;
        }

        const pkEfectiva = obtenerClavePublica(stripePublishableKey);
        if (!pkEfectiva) {
          logStructuredError("pago-stripe", "clave_publica_ausente", undefined, { trasladoId });
          setError(
            "La pasarela de pago seguro no está disponible temporalmente. Nuestro equipo ya ha sido notificado. Por favor intenta más tarde o contacta a soporte.",
          );
          return;
        }

        // Timer para mensaje intermedio de tranquilidad (AC-2)
        timerAviso = setTimeout(() => {
          setMensajeEspera(
            "Estamos verificando que tu traslado no tenga cobros previos y preparando la conexión segura. Por favor espera unos momentos...",
          );
        }, TIMEOUT_AVISO_ESPERA_MS);

        // Timer para plazo de espera controlado (AC-1, AC-3)
        timerTimeout = setTimeout(() => {
          abortCtrl.abort("timeout");
        }, timeoutMs);

        abortCtrl.signal.addEventListener(
          "abort",
          () => {
            if (abortCtrl.signal.reason === "timeout") {
              logStructuredWarn("pago-stripe", "timeout_inicio_pago", undefined, {
                trasladoId,
                timeoutMs,
              });
              setTiempoAgotado(true);
            }
          },
          { once: true },
        );

        // Consulta de estado previo para garantizar idempotencia antes de crear intento (AC-4, AC-5)
        if (!clientSecretExterno) {
          setVerificandoEstadoPrevio(true);
          const previo = await consultarEstadoPagoPrevio(trasladoId, abortCtrl.signal);
          setVerificandoEstadoPrevio(false);

          if (previo.pagado) {
            logStructuredInfo("pago-stripe", "pago_previo_detectado_al_iniciar", { trasladoId });
            setPagoYaConfirmado(true);
            return;
          }
        }

        const inicio = clientSecretExterno
          ? { clientSecret: clientSecretExterno }
          : await crearPaymentIntent(trasladoId, abortCtrl.signal);

        if (inicio.pagoConfirmado) {
          // El backend encontró el cobro ya exitoso y lo reconcilió: no se
          // monta Elements (Stripe lo rechazaría por estado terminal).
          setPagoYaConfirmado(true);
          if (!reconciliadoNotificado.current) {
            reconciliadoNotificado.current = true;
            onPagadoRef.current();
          }
          return;
        }

        const intentId = inicio.clientSecret?.split("_secret_")[0];
        if (intentId && /^pi_[A-Za-z0-9]+$/.test(intentId)) {
          const sesion = await fetch("/api/cuenta/metodos-pago", {
            method: "POST",
            headers: await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" }),
            body: JSON.stringify({ accion: "sesion", intentId }),
            signal: abortCtrl.signal,
          });
          const datosSesion = await sesion.json();
          if (!sesion.ok) {
            logStructuredWarn("pago-stripe", "fallo_sesion_metodos_pago", undefined, {
              trasladoId,
              error: datosSesion.error,
            });
          } else {
            setCustomerSessionClientSecret(datosSesion.customerSessionClientSecret ?? undefined);
          }
        }

        const mod = await import("@stripe/react-stripe-js");
        const { loadStripe } = await import("@stripe/stripe-js");
        const promesaStripe = loadStripe(pkEfectiva);
        const stripe = await promesaStripe;
        if (!stripe) {
          logStructuredError("pago-stripe", "load_stripe_null", undefined, { trasladoId });
          throw new Error(
            "No fue posible inicializar Stripe ni la pasarela de pago seguro. Verifica tu conexión e intenta de nuevo.",
          );
        }

        setStripeModule({
          Elements: mod.Elements,
          PaymentElement: mod.PaymentElement,
          useStripe: mod.useStripe,
          useElements: mod.useElements,
          stripePromise: promesaStripe,
        });

        setClientSecret(inicio.clientSecret ?? null);
      } catch (err: unknown) {
        if (abortCtrl.signal.aborted && abortCtrl.signal.reason === "timeout") {
          logStructuredWarn("pago-stripe", "timeout_inicio_pago", undefined, {
            trasladoId,
            timeoutMs,
          });
          setTiempoAgotado(true);
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          // Cancelación por desmontaje del componente
          return;
        }
        logStructuredError("pago-stripe", "error_inicio_pago", err, { trasladoId });
        const msg =
          err instanceof Error
            ? err.message
            : "No pudimos iniciar el cobro seguro.";
        if (msg.includes("Failed to load Stripe.js")) {
          setError(
            "No se pudo cargar la pasarela de pagos de Stripe. Verifica tu conexión a internet o si algún bloqueador de anuncios está interfiriendo.",
          );
        } else if (
          msg.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") ||
          msg.includes("clientSecret") ||
          msg.includes("Supabase") ||
          msg.includes("Postgres")
        ) {
          setError(
            "Tuvimos un problema temporal al procesar la pasarela de pago seguro. Nuestro equipo técnico fue notificado. Por favor intenta más tarde o contacta a soporte.",
          );
        } else {
          setError(msg);
        }
      } finally {
        if (timerAviso) clearTimeout(timerAviso);
        if (timerTimeout) clearTimeout(timerTimeout);
      }
    }

    void iniciar();

    return () => {
      if (timerAviso) clearTimeout(timerAviso);
      if (timerTimeout) clearTimeout(timerTimeout);
      abortCtrl.abort();
    };
  }, [trasladoId, reintento, monto, clientSecretExterno, timeoutMs]);

  // Pantalla de comprobante recuperable cuando el pago ya está confirmado (AC-9)
  if (pagoYaConfirmado) {
    return (
      <div
        className="grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">✅</span>
          <h3 className="font-display text-sm font-bold text-emerald-400">
            Pago ya confirmado previamente
          </h3>
        </div>
        <p className="font-body text-xs text-slate-300">
          El pago correspondiente a este traslado ya fue registrado y acreditado en el sistema. No se realizó ningún cargo duplicado.
        </p>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0A1220] p-3 text-[11px] text-slate-400 space-y-1">
          <p><strong className="text-slate-200">Referencia de traslado:</strong> {trasladoId}</p>
          {monto ? <p><strong className="text-slate-200">Monto:</strong> ${monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p> : null}
          <p><strong className="text-slate-200">Estado:</strong> Confirmado en pasaporte digital</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={returnPath ?? `/viajes/${trasladoId}`}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Ver pasaporte digital
          </Link>
          <Link
            href="/mis-viajes"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Ir a mis traslados
          </Link>
        </div>
      </div>
    );
  }

  // Pantalla con salida contextual ante agotamiento del plazo de espera (AC-3)
  if (tiempoAgotado) {
    return (
      <div
        className="grid gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">⏱️</span>
          <h3 className="font-display text-sm font-bold text-amber-300">
            La conexión tardó más de lo esperado
          </h3>
        </div>
        <p className="font-body text-xs leading-relaxed text-slate-300">
          No se realizó ningún cargo a tu cuenta. La pasarela de pago demoró en responder, pero tu traslado sigue protegido. ¿Qué deseas hacer?
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setTiempoAgotado(false);
              setReintento((valor) => valor + 1);
            }}
          >
            Reintentar conexión
          </Button>
          <Link
            href={returnPath ?? "/mis-viajes"}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Volver a mis traslados
          </Link>
          <Link
            href={`/soporte?motivo=pago&traslado=${encodeURIComponent(trasladoId)}`}
            className="text-xs text-amber-300 underline hover:text-amber-200"
          >
            Contactar a soporte
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="grid gap-3 text-left"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <Aviso tono="danger">{error}</Aviso>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReintento((valor) => valor + 1)}
          >
            Reintentar
          </Button>
          <Link
            href={returnPath ?? "/mis-viajes"}
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Volver a mis traslados
          </Link>
          <Link
            href={`/soporte?motivo=pago&traslado=${encodeURIComponent(trasladoId)}`}
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Contactar a soporte
          </Link>
        </div>
      </div>
    );
  }

  // Esqueleto con mensaje útil durante la preparación y verificación de espera (AC-2)
  if (!clientSecret || !stripeModule) {
    return (
      <div
        className="grid gap-3.5 rounded-2xl border border-slate-800 bg-[#0A1220]/60 p-4 text-left"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="font-display text-xs font-semibold text-slate-200">
            {verificandoEstadoPrevio
              ? "Comprobando estado previo del traslado..."
              : "Preparando pasarela de pago seguro"}
          </p>
        </div>
        <p className="font-body text-xs text-slate-400 leading-relaxed">
          {mensajeEspera}
        </p>
        <div className="grid gap-2.5 pt-1">
          <div className="h-10 animate-pulse rounded-xl bg-[#141F32]" />
          <div className="h-10 animate-pulse rounded-xl bg-[#141F32]" />
        </div>
      </div>
    );
  }

  const { Elements, PaymentElement, useStripe, useElements, stripePromise } =
    stripeModule;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, customerSessionClientSecret, appearance: aparienciaStripe, locale: compacto ? "es" : "auto" }}
    >
      <FormularioPagoReal
        returnPath={returnPath}
        trasladoId={trasladoId}
        monto={monto}
        onPagado={onPagado}
        PaymentElement={PaymentElement}
        useStripe={useStripe}
        useElements={useElements}
        compacto={compacto}
        formId={formId}
        onEstadoPago={onEstadoPago}
      />
    </Elements>
  );
}

/* Formulario conectado a Stripe Elements Real */
function FormularioPagoReal({
  returnPath,
  trasladoId,
  monto,
  onPagado,
  PaymentElement,
  useStripe,
  useElements,
  compacto,
  formId,
  onEstadoPago,
}: {
  returnPath?: string;
  trasladoId: string;
  monto?: number | null;
  onPagado: () => void;
  PaymentElement: (typeof import("@stripe/react-stripe-js"))["PaymentElement"];
  useStripe: () => Stripe | null;
  useElements: () => StripeElements | null;
  compacto?: boolean;
  formId?: string;
  onEstadoPago?: PagoStripeProps["onEstadoPago"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementoListo, setElementoListo] = useState(false);
  // RC-06: métodos asíncronos (OXXO/SPEI) quedan en `processing`; no es un
  // pago confirmado todavía.
  const [enProceso, setEnProceso] = useState(false);
  const [aprobado, setAprobado] = useState(false);
  const enviandoRef = useRef(false);

  useEffect(() => {
    onEstadoPago?.({
      // RC-06: en estado "en proceso" el formulario no se monta; se expone
      // `listo:false` para que el botón externo (modo compacto) se deshabilite.
      listo: enProceso || aprobado ? false : Boolean(stripe && elements && elementoListo),
      procesando: enviando,
    });
  }, [stripe, elements, elementoListo, enviando, enProceso, aprobado, onEstadoPago]);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${returnPath ?? `/viajes/${trasladoId}?pago=exitoso`}`
        : `http://localhost:3000/viajes/${trasladoId}?pago=exitoso`;

    try {
      const { error: errorPago, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (errorPago) {
        logStructuredWarn("pago-stripe", "error_confirmar_pago_stripe", undefined, {
          trasladoId,
          codigo: errorPago.code,
          declinacion: errorPago.decline_code,
        });
        setError(errorPago.message ?? "No pudimos procesar el cobro con la tarjeta proporcionada.");
        setEnviando(false);
        enviandoRef.current = false;
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        setAprobado(true);
        await onPagado();
        setEnviando(false);
        enviandoRef.current = false;
        return;
      }

      // RC-06: "processing" NO es un pago confirmado (métodos asíncronos como
      // OXXO o transferencia). No se llama onPagado; se muestra un estado
      // pendiente hasta que el webhook confirme el cobro.
      if (paymentIntent?.status === "processing") {
        setEnProceso(true);
        setEnviando(false);
        enviandoRef.current = false;
        return;
      }

      setError(
        "No pudimos confirmar la acreditación del pago. Revisa el estado de tu método de pago e inténtalo de nuevo.",
      );
      setEnviando(false);
      enviandoRef.current = false;
    } catch (err) {
      logStructuredError("pago-stripe", "excepcion_confirmar_pago", err, { trasladoId });
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al procesar el cobro seguro.",
      );
      setEnviando(false);
      enviandoRef.current = false;
    }
  }

  // Comprobante recuperable de pago aprobado (AC-9)
  if (aprobado) {
    return (
      <div
        className="grid gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🎉</span>
          <h3 className="font-display text-sm font-bold text-emerald-400">
            Stripe aprobó tu pago con éxito
          </h3>
        </div>
        <p className="font-body text-xs text-slate-300 leading-relaxed">
          Stripe aprobó tu pago. Estamos confirmando los traslados; no vuelvas a pagar. Si la conciliación tarda, consulta su estado desde esta pantalla.
        </p>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0A1220] p-3 text-[11px] text-slate-400 space-y-1">
          <p><strong className="text-slate-200">Referencia de traslado:</strong> {trasladoId}</p>
          {monto ? <p><strong className="text-slate-200">Monto confirmado:</strong> ${monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p> : null}
          <p><strong className="text-slate-200">Comprobante:</strong> Acreditado en pasaporte digital</p>
        </div>
        <div className="pt-2">
          <Link
            href={returnPath ?? `/viajes/${trasladoId}?pago=exitoso`}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Ver detalles del traslado
          </Link>
        </div>
      </div>
    );
  }

  // Comprobante de pago pendiente de acreditación (métodos asíncronos) (AC-8, AC-9)
  if (enProceso) {
    return (
      <div className="grid gap-3 text-left" role="status" aria-live="polite" aria-atomic="true">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="font-display text-xs font-bold text-amber-300">
            Tu pago está en proceso de confirmación
          </p>
          <p className="mt-1 font-body text-[11px] leading-relaxed text-[#94A3B8]">
            Elegiste un método que se acredita en minutos u horas. Te avisaremos
            en cuanto se confirme el cobro; no necesitas pagar de nuevo.
          </p>
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-[#0A1220] p-2.5 text-[11px] text-slate-400">
            <p><strong className="text-slate-200">Referencia:</strong> {trasladoId}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/mis-viajes"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              Ir a mis traslados
            </Link>
            <Link
              href={`/soporte?motivo=pago&traslado=${encodeURIComponent(trasladoId)}`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs text-amber-300 underline"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={confirmar}
      className={compacto ? "min-h-0 text-left" : "space-y-4 text-left"}
    >
      {!compacto && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-left">
          <div className="flex items-center gap-2 font-display text-xs font-bold text-emerald-400">
            <span>🔒</span>
            <span>Pago protegido con Stripe · Cifrado SSL de 256 bits</span>
          </div>
          <p className="mt-1 font-body text-[11px] leading-relaxed text-[#94A3B8]">
            Tus datos bancarios están cifrados y nunca se almacenan en nuestros
            servidores.
          </p>
        </div>
      )}

      <div
        className={
          compacto
            ? "rounded-xl bg-[#0A1220] p-3"
            : "rounded-xl border border-[#1C2A3E] bg-[#0A1220] p-4"
        }
      >
        <PaymentElement
          onReady={() => setElementoListo(true)}
          options={
            compacto
              ? { layout: "tabs", paymentMethodOrder: ["card", "oxxo"] }
              : undefined
          }
        />
      </div>

      {error && <Aviso tono="danger">{error}</Aviso>}

      {!compacto && (
        <button
          type="submit"
          disabled={!stripe || enviando}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FFC400] font-display text-xs sm:text-sm font-black uppercase tracking-wide text-[#0B111B] shadow-lg shadow-[#FFC400]/20 transition hover:bg-[#e6b000] active:scale-[0.99] disabled:opacity-50"
        >
          {enviando
            ? "Procesando pago con Stripe…"
            : "Pagar y confirmar traslado"}
        </button>
      )}

      {!compacto && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-body text-[11px] text-[#64748B]">
          <span className="font-semibold text-slate-400">Aceptamos:</span>
          <span className="rounded bg-[#141F32] border border-[#1C2A3E] px-2 py-0.5 text-[#94A3B8]">
            Visa
          </span>
          <span className="rounded bg-[#141F32] border border-[#1C2A3E] px-2 py-0.5 text-[#94A3B8]">
            Mastercard
          </span>
          <span className="rounded bg-[#141F32] border border-[#1C2A3E] px-2 py-0.5 text-[#94A3B8]">
            American Express
          </span>
          <span className="rounded bg-[#141F32] border border-[#1C2A3E] px-2 py-0.5 text-[#94A3B8]">
            SPEI
          </span>
        </div>
      )}
    </form>
  );
}
