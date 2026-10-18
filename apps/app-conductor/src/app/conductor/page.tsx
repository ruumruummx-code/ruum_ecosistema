'use client';

import React, { useState } from 'react';

// --- Íconos SVG inline (el proyecto no usa lucide-react; usa SVG inline como NavegacionConductor) ---
function IconBell({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconUser({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconMegaphone({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 3H2v3l5 3 0 6 5 3V3z" />
      <path d="M15.5 8.5A3.5 3.5 0 0 1 19 12a3.5 3.5 0 0 1-3.5 3.5" />
    </svg>
  );
}
function IconCar({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 18h1.5A1.5 1.5 0 0 0 5 19.5v1A1.5 1.5 0 0 0 6.5 21h11A1.5 1.5 0 0 0 19 20.5v-1A1.5 1.5 0 0 0 17.5 18H22" />
      <path d="M17 18v-1.5A1.5 1.5 0 0 0 15.5 16h-7A1.5 1.5 0 0 0 7 16.5V18" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconSearch({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconChevronRight({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconTrendingUp({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <polyline points="17 9 21 13 17 17" />
      <polyline points="7 3 7 15" />
      <line x1="7" y1="3" x2="7" y2="15" />
    </svg>
  );
}
function IconFileText({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconCheckCircle2({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconNavigation({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="3 11 22 18 3 25" />
      <path d="M9 6L3 6a4 4 0 0 0-4 4v11a4 4 0 0 0 4 4h18a4 4 0 0 0 4-4V10a4 4 0 0 0-4-4z" />
      <path d="M15 10v5M12 15l3 3L9 18" />
    </svg>
  );
}
function IconWifi({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12.55A11 11 0 0 1 19.22 12.5" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11A6 6 0 0 1 19.21 16.11" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}
function IconHome({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

export default function ConductorHome() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="w-full max-w-md h-screen mx-auto bg-ruum-bg text-ruum-text flex flex-col justify-between overflow-hidden antialiased select-none">
      {/* A. HEADER */}
      <header className="h-14 bg-ruum-card px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-ruum-blue tracking-tight leading-none">Ruum Ruum</span>
          <span className="text-[10px] text-ruum-muted font-medium mt-0.5">Conductor</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1 text-gray-600 active:scale-95 transition-transform">
            <IconBell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-1 text-gray-600 active:scale-95 transition-transform">
            <IconUser size={22} className="bg-gray-100 rounded-full p-0.5" />
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL (Distribución flexible controlada) */}
      <main className="flex-1 flex flex-col justify-between p-4 overflow-hidden gap-3">
        {/* B. BIENVENIDA Y ESTADO */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">¡Hola, Conductor!</h1>
            <p className="text-xs text-ruum-muted">Todo listo para tu jornada.</p>
          </div>
          <div className="bg-ruum-successBg text-ruum-success text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 bg-ruum-success rounded-full animate-pulse" />
            Conectado
          </div>
        </div>

        {/* C. TARJETA: DISPONIBILIDAD */}
        <section className="bg-ruum-card p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-ruum-successBg text-ruum-success rounded-xl">
              <IconMegaphone size={20} />
            </div>
            <div>
              <p className="text-[10px] text-ruum-muted font-medium uppercase tracking-wider">Estado de disponibilidad</p>
              <p className="text-base font-black tracking-tight text-gray-900">DISPONIBLE</p>
              <p className="text-[10px] text-ruum-muted">Recebiendo solicitudes de traslado.</p>
            </div>
          </div>
          {/* Toggle Switch */}
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${isAvailable ? 'bg-ruum-success' : 'bg-gray-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </section>

        {/* D. TARJETA CENTRAL: GESTIÓN DE TRASLADOS (Absorbe espacio sobrante de manera inteligente) */}
        <section className="bg-ruum-card p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col justify-center min-h-[140px]">
          <div className="flex flex-col items-center text-center flex-1 justify-center gap-1">
            <div className="p-3 bg-blue-50 text-ruum-blue rounded-xl mb-1">
              <IconCar size={24} />
            </div>
            <h2 className="text-base font-bold text-gray-900">Sin traslados por ahora</h2>
            <p className="text-xs text-ruum-muted">Última búsqueda hace 1 min.</p>
          </div>

          <div className="space-y-2 mt-2 w-full flex-shrink-0">
            <button className="w-full bg-ruum-blue hover:bg-blue-600 active:scale-[0.99] text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
              <IconSearch size={14} />
              Buscar ahora
            </button>
            <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.99] text-ruum-blue text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1 transition-all">
              Ver bandeja
              <IconChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* E. FILA DE MÉTRICAS */}
        <section className="grid grid-cols-2 gap-3 flex-shrink-0">
          <div className="bg-ruum-card p-3 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-2.5">
            <div className="p-2 bg-blue-50 text-ruum-blue rounded-lg mt-0.5">
              <IconTrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] text-ruum-muted font-medium">Ganancias del día</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">$0</p>
              <p className="text-[9px] text-ruum-muted mt-0.5">Sin cierres aún</p>
            </div>
          </div>
          <div className="bg-ruum-card p-3 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-2.5">
            <div className="p-2 bg-blue-50 text-ruum-blue rounded-lg mt-0.5">
              <IconCar size={16} />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center w-full">
                <p className="text-[10px] text-ruum-muted font-medium">Traslados hoy</p>
                <span className="text-[9px] font-bold text-gray-400">0 / 3</span>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-tight">0</p>
              <p className="text-[9px] text-ruum-muted mt-0.5">Faltan 3 para bono</p>
            </div>
          </div>
        </section>

        {/* F. SECCIÓN: SALUD OPERACIONAL */}
        <section className="bg-ruum-card p-3.5 rounded-2xl border border-gray-100 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-gray-800">Salud operacional</h3>
            <button className="text-xs font-semibold text-ruum-blue flex items-center gap-0.5 active:opacity-70">
              Ver detalle
              <IconChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { label: 'Documentos', status: 'Vigentes', icon: <IconFileText size={14} /> },
              { label: 'Perfil', status: 'Habilitado', icon: <IconUser size={14} /> },
              { label: 'GPS', status: 'Activo - hace segundos', icon: <IconNavigation size={14} /> },
              { label: 'Conexión', status: 'Conectado', icon: <IconWifi size={14} /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 text-ruum-success font-semibold text-[11px]">
                  <IconCheckCircle2 size={12} />
                  {item.status}
                  <IconChevronRight size={12} className="text-gray-300 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* G. BOTTOM NAVIGATION BAR */}
      <nav className="h-16 bg-ruum-card border-t border-gray-100 flex items-center justify-around pb-[max(8px,env(safe-area-inset-bottom))] flex-shrink-0">
        <button className="flex flex-col items-center justify-center text-ruum-blue gap-0.5 flex-1">
          <IconHome size={20} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center justify-center text-ruum-muted gap-0.5 flex-1 opacity-60 active:opacity-100">
          <IconSearch size={20} />
          <span className="text-[10px] font-medium">Traslados</span>
        </button>
        <button className="flex flex-col items-center justify-center text-ruum-muted gap-0.5 flex-1 opacity-60 active:opacity-100">
          <IconUser size={20} />
          <span className="text-[10px] font-medium">Cuenta</span>
        </button>
      </nav>
    </div>
  );
}
