"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import React from "react";
import Link from "next/link";
import { recordOperationalEvent } from "../lib/observability";

type Props = {
  children: React.ReactNode;
  /** Identificador para logging (ej: "panel", "evidencia", "global") */
  scope: string;
  /** Fallback opcional — si no se provee, se usa UI por defecto */
  fallback?: (props: { error: Error; reset: () => void }) => React.ReactNode;
};

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundaryConductor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No rompe operación — reporta a observability + Sentry (si existe)
    void recordOperationalEvent("native_crash", {
      scope: this.props.scope,
      message: error.message.slice(0, 240),
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    }, "error");

    // A3: window.Sentry no es un global del SDK (siempre no-op). SDK directo.
    try {
      void import("@sentry/nextjs")
        .then((Sentry) => Sentry.captureException(error, { extra: { scope: this.props.scope, componentStack: info.componentStack } }))
        .catch(() => {});
    } catch {}

    console.error(`[ErrorBoundary:${this.props.scope}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }
      return <FallbackConductor error={this.state.error} reset={this.handleReset} scope={this.props.scope} />;
    }
    return this.props.children;
  }
}

function FallbackConductor({ error, reset, scope }: { error: Error; reset: () => void; scope: string }) {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-6 py-12 text-center" role="alert" aria-live="assertive">
      <div className="rounded-lg border border-ui-line/40 bg-ui-card p-6 shadow-sm w-full">
        <h1 className="font-display text-lg font-black text-ui-fg">Algo salió mal{scope !== "global" ? ` en ${scope}` : ""}</h1>
        <p className="mt-2 font-body text-sm leading-6 text-ui-fg-muted">
          Ocurrió un error inesperado. No se perdió tu información — puedes reintentar o volver al panel.
        </p>
        {isDev && (
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-ui-muted p-3 text-left font-mono text-xs text-ui-danger/80 border border-ui-danger/20">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <BaseButton variant="ghost"
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ui-brand px-5 py-2.5 font-display text-sm font-bold text-ui-fg-muted hover:bg-ui-brand/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
          >
            Reintentar
          </BaseButton>
          <Link
            href="/panel"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg hover:border-ui-field"
          >
            Ir al panel
          </Link>
          <Link
            href="/viajes"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg hover:border-ui-field"
          >
            Ver Traslados
          </Link>
        </div>
        <p className="mt-4 font-body text-xs text-ui-fg-muted">
          Si el problema persiste, contacta soporte desde el panel. Error registrado automáticamente.
        </p>
      </div>
    </div>
  );
}


