import { useId, type InputHTMLAttributes, type Ref } from "react";
import styles from "./registration.module.css";

export function DenseField({ etiqueta, error, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string; error?: string; ref?: Ref<HTMLInputElement>;
}) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div className={styles.field} data-invalid={Boolean(error)}>
      <label htmlFor={id}>{etiqueta}</label>
      <input {...props} id={id} ref={ref} aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : props["aria-describedby"]} />
      {error && <span id={`${id}-error`} className="sr-only">{error}</span>}
    </div>
  );
}
