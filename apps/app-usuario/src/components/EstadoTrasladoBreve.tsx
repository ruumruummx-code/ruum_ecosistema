"use client";

import { useId, useState } from "react";
import { estadoVisibleTraslado } from "../lib/traslado-presentacion";
import styles from "./EstadoTrasladoBreve.module.css";

type Props = {
  className: string;
  estado: ReturnType<typeof estadoVisibleTraslado>;
};

export function EstadoTrasladoBreve({ estado, className }: Props) {
  const id = useId();
  const [suprimido, setSuprimido] = useState(false);
  const [abierto, setAbierto] = useState(false);

  return (
    <span className={styles.contenedor} data-suprimido={suprimido} data-abierto={abierto}
      onMouseEnter={() => setSuprimido(false)}
      onBlur={() => { setAbierto(false); setSuprimido(false); }}>
      <button type="button" className={className} data-tone={estado.tono}
        aria-describedby={id}
        onFocus={() => setSuprimido(false)}
        onClick={(event) => {
          event.stopPropagation();
          setAbierto(!abierto);
          setSuprimido(abierto);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setAbierto(false);
            setSuprimido(true);
          }
        }}>
        {estado.etiqueta}
      </button>
      <span id={id} className={styles.tooltip} role="tooltip">{estado.detalle}</span>
    </span>
  );
}
