import styles from "./registration.module.css";

export function ReviewSummary({ titulo, valores, icono, onEditar }: { titulo: string; valores: Array<string | undefined>; icono: "person" | "identity" | "license"; onEditar: () => void }) {
  return <section className={styles.reviewRow} aria-label={titulo}>
    <span className={styles.reviewIcon} aria-hidden="true">{icono === "person" ? "♙" : icono === "identity" ? "▣" : "▱"}</span>
    <div className={styles.reviewRowMain}>
      <strong>{titulo}</strong>
      {valores.filter(Boolean).map((valor) => <span key={valor}>{valor}</span>)}
    </div>
    <button type="button" className={styles.reviewEdit} onClick={onEditar} aria-label={`Editar ${titulo.toLowerCase()}`}>Editar</button>
  </section>;
}
