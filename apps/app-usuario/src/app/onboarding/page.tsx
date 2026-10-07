"use client";

import Link from "next/link";
import { useState } from "react";

const PASOS = [
  {
    folio: "01 / RUTA",
    titulo: "Tu auto no viaja a ciegas.",
    descripcion: "Cada traslado tiene una ruta, un conductor identificado y un horario visible desde el inicio.",
    visual: "ruta" as const,
  },
  {
    folio: "02 / CUSTODIA",
    titulo: "Sabes quién lleva tu vehículo.",
    descripcion: "Consulta la identidad, certificación y datos operativos del conductor antes de entregar las llaves.",
    visual: "credencial" as const,
  },
  {
    folio: "03 / EVIDENCIA",
    titulo: "El camino queda documentado.",
    descripcion: "Fotografías, kilometraje y firma de entrega forman un expediente consultable al terminar.",
    visual: "evidencia" as const,
  },
];

function RutaVisual() {
  return (
    <div className="user-road-route" aria-label="Ruta de ejemplo de origen a destino">
      <div className="user-road-route__point">
        <span className="user-road-route__marker">A</span>
        <span><strong>Origen</strong><small>Col. Americana</small></span>
      </div>
      <div className="user-road-route__line" aria-hidden="true"><span>18 KM</span></div>
      <div className="user-road-route__point user-road-route__point--end">
        <span className="user-road-route__marker">B</span>
        <span><strong>Destino</strong><small>Zapopan Centro</small></span>
      </div>
    </div>
  );
}

function CredencialVisual() {
  return (
    <div className="user-road-credential" aria-label="Ejemplo de credencial de conductor certificado">
      <div className="user-road-credential__top">
        <span className="user-road-eyebrow">CONDUCTOR CERTIFICADO</span>
        <span className="user-road-plate"><i /> VIGENTE</span>
      </div>
      <div className="user-road-credential__body">
        <div className="user-road-avatar" aria-hidden="true">MR</div>
        <div>
          <strong>Mariana R.</strong>
          <span>Identidad verificada</span>
          <span>142 traslados documentados</span>
        </div>
      </div>
      <div className="user-road-credential__foot mono">RR-CD-0142 · NIVEL 3</div>
    </div>
  );
}

function EvidenciaVisual() {
  const vistas = ["Frontal", "Lateral", "Tablero", "Entrega"];
  return (
    <div className="user-road-evidence" aria-label="Expediente fotográfico de ejemplo">
      {vistas.map((vista, indice) => (
        <div className="user-road-evidence__shot" key={vista}>
          <span className="user-road-evidence__index mono">0{indice + 1}</span>
          <svg viewBox="0 0 96 56" role="img" aria-label={`Vista ${vista.toLowerCase()} registrada`}>
            <path d="M18 36h60l-6-16H31L18 36Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M10 36h76v8H10z" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="26" cy="44" r="5" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="70" cy="44" r="5" fill="white" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{vista}</span>
          <small>10:42 · REGISTRADA</small>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingUsuario() {
  const [paso, setPaso] = useState(() => {
    try {
      if (typeof window === "undefined") return 0;
      const guardado = window.localStorage.getItem("ruum-onboarding-paso");
      const n = guardado === null ? 0 : Number.parseInt(guardado, 10);
      return Number.isInteger(n) && n >= 0 && n < PASOS.length ? n : 0;
    } catch {
      return 0;
    }
  });
  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  function irAPaso(siguiente: number) {
    setPaso(siguiente);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("ruum-onboarding-paso", String(siguiente));
    } catch {
      // almacenamiento no disponible: el flujo sigue funcionando en memoria
    }
  }

  function marcarVisto() {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("ruum-onboarding-visto", "1");
    } catch {
      // ignore
    }
  }

  return (
    <main className="user-road-onboarding">
      <header className="user-road-header">
        <span className="user-road-wordmark">RUUM</span>
        <Link href="/login" onClick={marcarVisto}>Omitir</Link>
      </header>

      <section className="user-road-stage" aria-live="polite">
        <div className="user-road-copy">
          <p className="user-road-kicker mono">{actual.folio}</p>
          <h1>{actual.titulo}</h1>
          <p>{actual.descripcion}</p>
        </div>

        <div className="user-road-visual">
          {actual.visual === "ruta" && <RutaVisual />}
          {actual.visual === "credencial" && <CredencialVisual />}
          {actual.visual === "evidencia" && <EvidenciaVisual />}
        </div>
      </section>

      <footer className="user-road-footer">
        <div
          className="user-road-progress"
          role="progressbar"
          aria-label="Progreso del recorrido"
          aria-valuemin={1}
          aria-valuemax={PASOS.length}
          aria-valuenow={paso + 1}
          aria-valuetext={`Paso ${paso + 1} de ${PASOS.length}: ${actual.titulo}`}
        >
          {PASOS.map((item, indice) => (
            <button
              key={item.folio}
              type="button"
              aria-current={paso === indice ? "step" : undefined}
              aria-label={`Ir al paso ${indice + 1}: ${item.titulo}`}
              onClick={() => irAPaso(indice)}
              className={paso === indice ? "is-active" : ""}
            >
              <span className="mono" aria-hidden="true">0{indice + 1}</span>
            </button>
          ))}
        </div>

        {esUltimo ? (
          <Link href="/registro" onClick={marcarVisto} className="user-road-primary">Crear cuenta y cotizar <span aria-hidden="true">→</span></Link>
        ) : (
          <button type="button" className="user-road-primary" onClick={() => irAPaso(paso + 1)}>
            Continuar <span aria-hidden="true">→</span>
          </button>
        )}
        <Link href="/login" onClick={marcarVisto} className="user-road-secondary">Ya tengo una cuenta</Link>
      </footer>
    </main>
  );
}
