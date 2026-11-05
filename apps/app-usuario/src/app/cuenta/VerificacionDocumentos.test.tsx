/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { VerificacionDocumentos } from "./VerificacionDocumentos";
import {
  obtenerClaveDraftFiscal,
  guardarDraftFiscal,
  leerDraftFiscal,
  limpiarDraftFiscal,
  DRAFT_FISCAL_TTL_MS,
} from "./FacturacionCuentaForm";

const mocks = vi.hoisted(() => ({
  listarDocumentos: vi.fn(),
  subirIdentidad: vi.fn(),
  subirDocumentoCuenta: vi.fn(),
}));

vi.mock("@ruum/api/services", () => ({
  listarDocumentosCuentaUsuario: mocks.listarDocumentos,
  subirDocumentoIdentidad: mocks.subirIdentidad,
  subirDocumentoCuentaUsuario: mocks.subirDocumentoCuenta,
  actualizarFacturacionUsuario: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
  tieneSupabaseConfigurado: () => true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const usuarioBase = {
  id: "usr-12345",
  auth_user_id: "auth-12345",
  nombre: "Carlos",
  apellidos: "Gómez",
  correo: "carlos@ejemplo.com",
  telefono: "+525512345678",
  tipo_cuenta: "personal",
  estado_verificacion: "en_revision",
  doc_identidad_url: "auth-12345/ine.pdf",
  doc_identidad_subido_en: "2026-11-01T12:00:00Z",
  estado_validacion_fiscal: "sin_configurar",
} as unknown as Database["public"]["Tables"]["usuarios"]["Row"];

describe("Flujo 13 - VerificacionDocumentos y Máquina de Estados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("muestra los estados canónicos de documentos (recibido, en_revision, verificado, rechazado, expirado)", async () => {
    mocks.listarDocumentos.mockResolvedValue([
      {
        tipo: "comprobante",
        ruta: "auth-12345/comprobante/1.pdf",
        estado: "recibido",
        subido_en: "2026-11-01T10:00:00Z",
      },
      {
        tipo: "constancia",
        ruta: "auth-12345/constancia/2.pdf",
        estado: "verificado",
        subido_en: "2026-11-01T10:00:00Z",
      },
    ]);

    render(<VerificacionDocumentos usuario={usuarioBase} />);

    // El INE tiene estado_verificacion: en_revision
    expect(await screen.findByLabelText(/Identificación Oficial \(INE\) En revisión/i)).toBeInTheDocument();
    // Comprobante en recibido
    expect(await screen.findByLabelText(/Comprobante de Domicilio Recibido/i)).toBeInTheDocument();
    // Constancia en verificado
    expect(await screen.findByLabelText(/Constancia de Situación Fiscal Verificado/i)).toBeInTheDocument();
  });

  it("muestra estado honesto 'Pendiente SAT' cuando la validación fiscal está encolada o pendiente", async () => {
    mocks.listarDocumentos.mockResolvedValue([]);
    const usuarioFiscalPendiente = {
      ...usuarioBase,
      rfc: "GOMC800101XYZ",
      razon_social: "Carlos Gómez",
      regimen_fiscal: "612",
      codigo_postal_fiscal: "01000",
      uso_cfdi: "G03",
      estado_validacion_fiscal: "pendiente_de_validacion_fiscal",
    } as unknown as Database["public"]["Tables"]["usuarios"]["Row"];

    render(<VerificacionDocumentos usuario={usuarioFiscalPendiente} />);

    expect(await screen.findByLabelText(/Datos de Facturación Pendiente SAT/i)).toBeInTheDocument();
  });

  it("aisla borradores fiscales por usuario.id y respeta expiración por TTL", () => {
    const usuarioA = "usr-alpha-1";
    const usuarioB = "usr-beta-2";

    guardarDraftFiscal(usuarioA, { rfc: "ALPH800101AAA", codigo_postal_fiscal: "01000" });
    guardarDraftFiscal(usuarioB, { rfc: "BETA800101BBB", codigo_postal_fiscal: "02000" });

    // Cada usuario lee exclusivamente su borrador
    const draftA = leerDraftFiscal(usuarioA);
    const draftB = leerDraftFiscal(usuarioB);

    expect(draftA?.rfc).toBe("ALPH800101AAA");
    expect(draftB?.rfc).toBe("BETA800101BBB");

    // Borrador expirado por TTL (>24h)
    const claveA = obtenerClaveDraftFiscal(usuarioA);
    const hace25Horas = Date.now() - (DRAFT_FISCAL_TTL_MS + 3600000);
    window.localStorage.setItem(
      claveA,
      JSON.stringify({
        datos: { rfc: "EXPIRADO800101" },
        timestamp: hace25Horas,
      })
    );

    const draftExpirado = leerDraftFiscal(usuarioA);
    expect(draftExpirado).toBeNull();
    expect(window.localStorage.getItem(claveA)).toBeNull();
  });

  it("limpia el borrador al llamar a limpiarDraftFiscal", () => {
    const usuarioId = "usr-clean-test";
    guardarDraftFiscal(usuarioId, { rfc: "CLEA800101XYZ" });
    expect(leerDraftFiscal(usuarioId)?.rfc).toBe("CLEA800101XYZ");

    limpiarDraftFiscal(usuarioId);
    expect(leerDraftFiscal(usuarioId)).toBeNull();
  });

  it("abre modal de documento con aviso de invalidación y motivo de rechazo si aplica", async () => {
    mocks.listarDocumentos.mockResolvedValue([
      {
        tipo: "comprobante",
        ruta: "auth-12345/comprobante/antiguo.pdf",
        estado: "rechazado",
        motivo_rechazo: "El comprobante no debe ser mayor a 3 meses de antigüedad.",
        subido_en: "2026-10-01T10:00:00Z",
      },
    ]);

    render(<VerificacionDocumentos usuario={usuarioBase} />);

    const botonComprobante = await screen.findByLabelText(/Comprobante de Domicilio Rechazado/i);
    fireEvent.click(botonComprobante);

    // Debe mostrar el motivo del rechazo en el diálogo
    expect(await screen.findByText(/El comprobante no debe ser mayor a 3 meses de antigüedad./i)).toBeInTheDocument();
    // Debe mostrar la advertencia de reemplazo
    expect(screen.getByText(/Al reemplazarlo, el documento quedará pendiente de validación/i)).toBeInTheDocument();
  });
});
