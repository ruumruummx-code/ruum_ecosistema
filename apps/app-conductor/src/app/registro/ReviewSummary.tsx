import styles from "./registration.module.css";

export function ReviewSummary({ titulo, valores, onEditar }: { titulo: string; valores: Array<string | undefined>; onEditar?: () => void }) {
  return <div className={styles.reviewRow}>
    <div className={styles.reviewRowMain}>
      <strong>{titulo}</strong>
      <span title={valores.filter(Boolean).join(" · ")}>{valores.filter(Boolean).join(" · ")}</span>
    </div>
    {onEditar && <button type="button" className={styles.reviewEdit} onClick={onEditar} aria-label={`Editar ${titulo.toLowerCase()}`}>✎</button>}
  </div>;
}
