"use client";

import { useEffect, useState } from "react";
import { DriverDetailsShell } from "../DriverDetailsShell";
import { DetailsDialog } from "../DetailsDialog";
import { DetailsNotice } from "../DetailsNotice";
import { ServiceIcon } from "../ServiceIcon";
import { enmascararUltimos } from "../datos-sensibles";
import { CATALOGO_BANCOS_SPEI } from "./bank-catalog";
import styles from "../details.module.css";
import bank from "./bank.module.css";

type BankForm = { titularCuenta: string; banco: string; clabe: string; numeroTarjeta: string };
type Props = {
  formulario: BankForm; onChange: (field: keyof BankForm, value: string) => void;
  authorized: boolean; loading: boolean; error: string | null; message: string | null; status: string | null;
  password: string; onPassword: (value: string) => void; showPassword: boolean; onShowPassword: () => void;
  authorizing: boolean; onAuthorize: () => Promise<void>; saving: boolean; onSave: () => Promise<void>;
};

export function DriverBankDetailsView(props: Props) {
  const { formulario, authorized, loading, saving, error, status } = props;
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => { if (authorized) setAuthOpen(false); }, [authorized]);
  const banks = [...new Set([...Object.values(CATALOGO_BANCOS_SPEI), ...(formulario.banco ? [formulario.banco] : [])])];
  const valid = authorized && !loading && !error && formulario.titularCuenta.trim().length >= 3 && !!formulario.banco.trim() && /^\d{18}$/.test(formulario.clabe) && /^\d{16}$/.test(formulario.numeroTarjeta);
  return <DriverDetailsShell kind="bank">
    <section className={styles.heading}><h1>Datos bancarios</h1><p>Registra tu cuenta para recibir el depósito de tus ganancias.</p></section>
    <form id="bank-details" className={bank.form} data-authorized={authorized} aria-label="Datos para depósito" aria-busy={loading} onSubmit={event => { event.preventDefault(); if (valid && !saving) void props.onSave(); }}>
      <div className={styles.fields}>
        {([{ key: "titularCuenta", label: "Titular de la cuenta", placeholder: "Nombre del titular", icon: "bank" },
          { key: "banco", label: "Banco emisor", placeholder: "Selecciona tu banco", icon: "bank" },
          { key: "clabe", label: "CLABE interbancaria", placeholder: "18 dígitos", icon: "card", length: 18 },
          { key: "numeroTarjeta", label: "Número de tarjeta", placeholder: "16 dígitos", icon: "card", length: 16 }] as const).map(field => <div className={styles.field} key={field.key}>
          <ServiceIcon name={field.icon}/><div className={styles.fieldText}>
            <label htmlFor={`bank-${field.key}`}>{field.label}</label>
            {field.key === "banco" ? <select id={`bank-${field.key}`} data-empty={!formulario.banco} disabled={!authorized || saving} required value={formulario.banco} onChange={event => props.onChange(field.key, event.target.value)}><option value="">Selecciona tu banco</option>{banks.map(name => <option key={name} value={name}>{name}</option>)}</select>
              : <input id={`bank-${field.key}`} required readOnly={!authorized} disabled={loading || saving || !!error} autoComplete="off"
                value={!authorized && formulario[field.key] && "length" in field ? enmascararUltimos(formulario[field.key]) : formulario[field.key]}
                placeholder={field.placeholder} inputMode={"length" in field ? "numeric" : "text"} maxLength={"length" in field ? field.length : 150}
                pattern={"length" in field ? `[0-9]{${field.length}}` : undefined} onChange={event => props.onChange(field.key, event.target.value)} />}
          </div>
        </div>)}
      </div>
    </form>
    {loading ? <p className={styles.loading} role="status">Cargando datos bancarios…</p> : error ? <DetailsNotice message={error} error/> : <div className={bank.warning}>
      <ServiceIcon name="warning"/><p>{authorized ? "Confirma que la cuenta pertenezca al titular registrado antes de guardar." : <>{status ? `${status}. ` : "Aún no has registrado tus datos bancarios para depósito. "}<button type="button" aria-label="Confirma tu sesión" onClick={() => setAuthOpen(true)}>Confirma tu sesión</button>{status ? " para consultar o actualizar tu cuenta de depósito." : " a continuación para capturarlos."}</>}</p>
    </div>}
    {props.message && !authOpen && <DetailsNotice message={props.message}/>}
    <button className={styles.primary} type="submit" form="bank-details" disabled={!valid || saving}>{saving ? "Guardando…" : "Guardar y continuar"}<span aria-hidden="true">→</span></button>
    <p className={bank.seal}><ServiceIcon name="shield"/>Tu información está protegida</p>
    <DetailsDialog open={authOpen} title="Confirma tu sesión" onClose={() => { if (!props.authorizing) { setAuthOpen(false); props.onPassword(""); } }}>
      <p>Ingresa tu contraseña para consultar y editar los datos de tu cuenta de depósito.</p>
      <form onSubmit={event => { event.preventDefault(); if (props.password.length >= 8 && !props.authorizing) void props.onAuthorize(); }}>
        <label className={bank.passwordLabel} htmlFor="bank-password">Contraseña actual</label>
        <div className={bank.password}><input id="bank-password" type={props.showPassword ? "text" : "password"} autoComplete="current-password" value={props.password} onChange={event => props.onPassword(event.target.value)} required minLength={8}/><button type="button" onClick={props.onShowPassword}>{props.showPassword ? "Ocultar" : "Ver"}</button></div>
        {props.message && <p role="alert">{props.message}</p>}
        <button className={styles.primary} disabled={props.authorizing || props.password.length < 8}>{props.authorizing ? "Verificando…" : "Confirmar sesión y editar datos"}</button>
      </form>
    </DetailsDialog>
  </DriverDetailsShell>;
}
