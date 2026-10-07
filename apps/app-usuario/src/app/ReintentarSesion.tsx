"use client";

export function BotonReintentarSesion() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="user-v2-primary-button inline-flex items-center justify-center px-6"
    >
      Reintentar
    </button>
  );
}
