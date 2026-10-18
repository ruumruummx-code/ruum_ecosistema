"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverBankDetailsView } from "./DriverBankDetailsView";
import { CATALOGO_BANCOS_SPEI } from "./bank-catalog";
import { guardarDatosBancariosConductor, obtenerGananciasConductor } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { cargarConductorCuenta } from "../cuenta-utils";

type DatosBancarios = Database["public"]["Tables"]["datos_bancarios_conductor"]["Row"];

const ETIQUETA_DATOS_BANCARIOS: Record<Database["public"]["Enums"]["estado_datos_bancarios_conductor"], string> = {
  en_revision: "Datos en revisión",
  verificada: "Datos verificados",
  rechazada: "Datos rechazados"
};

function obtenerBancoPorClabe(clabe: string): string | null {
  const digitos = clabe.replace(/\D/g, "");
  if (digitos.length >= 3) {
    const codigo = digitos.slice(0, 3);
    return CATALOGO_BANCOS_SPEI[codigo] ?? null;
  }
  return null;
}

export default function PaginaDatosBancarios() {
  const router = useRouter();
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [datosBancarios, setDatosBancarios] = useState<DatosBancarios | null>(null);
  const [formulario, setFormulario] = useState({ titularCuenta: "", banco: "", clabe: "", numeroTarjeta: "" });
  const [edicionAutorizada, setEdicionAutorizada] = useState(false);
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmandoSesion, setConfirmandoSesion] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const conductor = await cargarConductorCuenta();
        if (!conductor) {
          throw new Error("No se encontró el conductor.");
        }
        const cliente = crearClienteNavegador();
        const ganancias = await obtenerGananciasConductor(cliente, conductor.id);
        if (!activo) return;
        const datos = ganancias.datosBancarios;
        setDatosBancarios(datos);
        setFormulario(datos ? {
          titularCuenta: datos.titular_cuenta,
          banco: datos.banco,
          clabe: datos.clabe,
          numeroTarjeta: datos.numero_tarjeta ?? ""
        } : { titularCuenta: conductor.nombre, banco: "", clabe: "", numeroTarjeta: "" });
        setErrorCarga(null);
      } catch {
        if (activo) setErrorCarga("No se pudieron cargar los datos bancarios. Inténtalo de nuevo.");
      } finally {
        if (activo) setCargando(false);
      }
    }
    void cargar();
    return () => { activo = false; };
  }, []);

  function actualizarCampo(campo: keyof typeof formulario, valorRaw: string) {
    if (campo === "clabe") {
      const digitos = valorRaw.replace(/\D/g, "").slice(0, 18);
      const bancoDetectado = obtenerBancoPorClabe(digitos);
      setFormulario((actual) => ({
        ...actual,
        clabe: digitos,
        banco: bancoDetectado ?? actual.banco
      }));
    } else if (campo === "numeroTarjeta") {
      const digitos = valorRaw.replace(/\D/g, "").slice(0, 16);
      setFormulario((actual) => ({ ...actual, numeroTarjeta: digitos }));
    } else {
      setFormulario((actual) => ({ ...actual, [campo]: valorRaw }));
    }
  }

  async function confirmarSesion() {
    setConfirmandoSesion(true);
    setMensaje(null);
    try {
      const cliente = crearClienteNavegador();
      const { data: sesion } = await cliente.auth.getUser();
      const email = sesion.user?.email;
      if (!email) throw new Error("Inicia sesión de nuevo para editar tus datos bancarios.");
      const { error } = await cliente.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setEdicionAutorizada(true);
      setPassword("");
      setMensaje("Sesión confirmada correctamente. Puedes editar tus datos bancarios para depósito.");
    } catch (error) {
      setMensaje(traducirErrorOperativo(error, "No pudimos confirmar tu sesión. Verifica tu contraseña."));
    } finally {
      setConfirmandoSesion(false);
    }
  }

  async function guardar() {
    if (!edicionAutorizada || formulario.titularCuenta.trim().length < 3 || !formulario.banco.trim() || !/^\d{18}$/.test(formulario.clabe) || !/^\d{16}$/.test(formulario.numeroTarjeta) || guardando) {
      setMensaje("Confirma tu sesión antes de editar datos bancarios.");
      return;
    }
    if (!confirmacionAbierta) {
      setConfirmacionAbierta(true);
      return;
    }
    setConfirmacionAbierta(false);
    setGuardando(true);
    setMensaje(null);
    try {
      const cliente = crearClienteNavegador();
      const guardado = await guardarDatosBancariosConductor(cliente, formulario);
      setDatosBancarios(guardado);
      setEdicionAutorizada(false);
      router.push("/cuenta/certificacion");
    } catch (error) {
      setMensaje(traducirErrorOperativo(error, "No pudimos guardar tus datos bancarios."));
    } finally {
      setGuardando(false);
    }
  }

  return <>
    <DriverBankDetailsView formulario={formulario} onChange={actualizarCampo} authorized={edicionAutorizada}
      loading={cargando} error={errorCarga} message={mensaje} status={datosBancarios ? ETIQUETA_DATOS_BANCARIOS[datosBancarios.estado] : null}
      password={password} onPassword={setPassword} showPassword={mostrarPassword} onShowPassword={() => setMostrarPassword(actual => !actual)}
      authorizing={confirmandoSesion} onAuthorize={confirmarSesion} saving={guardando} onSave={guardar} />
    <ConfirmDialog open={confirmacionAbierta} title="Actualizar cuenta para depósitos"
      consequence="La cuenta quedará pendiente de revisión operativa y se utilizará para transferencias una vez aprobada."
      maskedData={[
        `CLABE terminación ${formulario.clabe.slice(-4)}`,
        `Tarjeta terminación ${formulario.numeroTarjeta.slice(-4)}`
      ]} confirmLabel="Guardar y enviar a revisión" busy={guardando}
      onCancel={() => setConfirmacionAbierta(false)} onConfirm={() => void guardar()} />
  </>;
}
