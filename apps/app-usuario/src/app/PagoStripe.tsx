"use client";

import { useEffect, useRef, useState } from "react";
import type { Appearance, Stripe, StripeElements } from "@stripe/stripe-js";
import { Button, Aviso } from "@ruum/ui";
import { crearClienteNavegador } from "../lib/supabase-browser";

const clavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export function tieneStripePublicoConfigurado(): boolean {
  return Boolean(clavePublica);
}

export interface PagoStripeProps {
  clientSecretExterno?: string;
  returnPath?: string;
  trasladoId: string;
  monto?: number | null;
  onPagado: () => void;
  compacto?: boolean;
  formId?: string;
  onEstadoPago?: (estado: { listo: boolean; procesando: boolean }) => void;
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

async function crearPaymentIntent(
  trasladoId: string,
): Promise<{ clientSecret?: string; pagoConfirmado?: boolean }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no está configurado para iniciar el cobro.");
  }

  const cliente = crearClienteNavegador();
  const { data: sesion, error: errorSesion } = await cliente.auth.getSession();
  if (errorSesion) throw errorSesion;

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
    } catch {
      throw new Error(
        `La función de pago respondió con un formato inválido (${respuesta.status}).`,
      );
    }
  }

  if (!respuesta.ok) {
    throw new Error(
      data?.error ?? `No pudimos iniciar el cobro (${respuesta.status}).`,
    );
  }

  // El backend reconcilió un cobro ya exitoso en Stripe (webhook con lag o
  // fallido): no hay Elements que montar, el pago ya está confirmado.
  if (data?.pagoConfirmado) {
    return { pagoConfirmado: true };
  }

  if (!data?.clientSecret) {
    throw new Error("La función de pago no devolvió clientSecret.");
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
  returnPath,
}: PagoStripeProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    async function iniciar() {
      try {
        setError(null);
        setClientSecret(null);

        if (monto != null && monto <= 0) {
          setError(
            "Tarifa no válida para pago ($0). Nuestro equipo revisará la cotización antes de solicitar cobro.",
          );
          return;
        }

        if (!clavePublica) {
          setError(
            "Stripe no está configurado en este entorno. Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
          );
          return;
        }

        const inicio = clientSecretExterno ? { clientSecret: clientSecretExterno } : await crearPaymentIntent(trasladoId);
        if (inicio.pagoConfirmado) {
          // El backend encontró el cobro ya exitoso y lo reconcilió: no se
          // monta Elements (Stripe lo rechazaría por estado terminal).
          if (!reconciliadoNotificado.current) {
            reconciliadoNotificado.current = true;
            onPagadoRef.current();
          }
          return;
        }

        const mod = await import("@stripe/react-stripe-js");
        const { loadStripe } = await import("@stripe/stripe-js");
        const promesaStripe = loadStripe(clavePublica);
        /* Elements recibe la promesa (su contrato documentado); se espera aparte
           solo para detectar clave inválida, porque loadStripe resuelve null. */
        const stripe = await promesaStripe;
        if (!stripe) {
          throw new Error(
            "No fue posible inicializar Stripe con la clave pública configurada.",
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
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "No pudimos iniciar el cobro con Stripe.";
        if (msg.includes("Failed to load Stripe.js")) {
          setError(
            "No se pudo cargar la pasarela de pagos de Stripe (Stripe.js). Verifica tu conexión a internet o si algún bloqueador de anuncios está interfiriendo.",
          );
        } else {
          setError(msg);
        }
      }
    }

    void iniciar();
  }, [trasladoId, reintento, monto, clientSecretExterno]);

  if (error) {
    return (
      <div
        className="grid gap-3"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <Aviso tono="danger">{error}</Aviso>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReintento((valor) => valor + 1)}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret || !stripeModule) {
    return (
      <div className="grid gap-4" aria-label="Preparando el cobro seguro">
        <div className="h-12 animate-pulse rounded-xl bg-[#141F32]" />
        <div className="h-12 animate-pulse rounded-xl bg-[#141F32]" />
        <div className="h-11 animate-pulse rounded-xl bg-[#141F32]" />
      </div>
    );
  }

  const { Elements, PaymentElement, useStripe, useElements, stripePromise } =
    stripeModule;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: aparienciaStripe, locale: compacto ? "es" : "auto" }}
    >
      <FormularioPagoReal
        returnPath={returnPath}
        trasladoId={trasladoId}
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
        setError(errorPago.message ?? "No pudimos procesar el pago.");
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
        "Stripe no confirmó el pago. Revisa el estado de tu tarjeta e inténtalo de nuevo.",
      );
      setEnviando(false);
      enviandoRef.current = false;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al procesar el cobro.",
      );
      setEnviando(false);
      enviandoRef.current = false;
    }
  }

  if (aprobado) return <p role="status">Stripe aprobó tu pago. Estamos confirmando los traslados; no vuelvas a pagar. Si la conciliación tarda, consulta su estado desde esta pantalla.</p>;
  if (enProceso) {
    return (
      <div className="grid gap-3 text-left" role="status" aria-live="polite" aria-atomic="true">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
          <p className="font-display text-xs font-bold text-amber-300">
            Tu pago está en proceso de confirmación
          </p>
          <p className="mt-1 font-body text-[11px] leading-relaxed text-[#94A3B8]">
            Elegiste un método que se acredita en minutos u horas. Te avisaremos
            en cuanto Stripe confirme el cobro; no necesitas pagar de nuevo.
          </p>
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
