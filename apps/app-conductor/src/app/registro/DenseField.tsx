import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import styles from "./registration.module.css";

export function DenseField({ etiqueta, error, ref, leading, trailing, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string; error?: string; ref?: Ref<HTMLInputElement>; leading?: ReactNode; trailing?: ReactNode;
}) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div className={[styles.field, leading || trailing ? styles.iconField : ""].join(" ")} data-invalid={Boolean(error)}>
      {leading}
      <div className={styles.fieldContent}>
      <label htmlFor={id}>{etiqueta}</label>
      <input {...props} id={id} ref={ref} aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : props["aria-describedby"]} />
      {error && <span id={`${id}-error`} className="sr-only">{error}</span>}
      </div>
      {trailing}
    </div>
  );
}
