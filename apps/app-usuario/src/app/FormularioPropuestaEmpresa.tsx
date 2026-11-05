"use client";

export function FormularioPropuestaEmpresa() {
  return (
    <form
      className="mx-auto mt-8 grid max-w-xl gap-3 rounded-[20px] border border-white/10 bg-white/5 p-5 text-left"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="font-body text-[13px] font-semibold text-white" htmlFor="b2b-nombre">Nombre y empresa</label>
      <input id="b2b-nombre" name="nombre" required autoComplete="name" className="min-h-[48px] rounded-[12px] border border-white/20 bg-white px-3.5 py-2.5 font-body text-base text-[var(--ruum-navy)]" />
      <label className="font-body text-[13px] font-semibold text-white" htmlFor="b2b-correo">Correo de trabajo</label>
      <input id="b2b-correo" name="correo" type="email" required autoComplete="email" className="min-h-[48px] rounded-[12px] border border-white/20 bg-white px-3.5 py-2.5 font-body text-base text-[var(--ruum-navy)]" />
      <label className="font-body text-[13px] font-semibold text-white" htmlFor="b2b-mensaje">¿Qué necesita mover?</label>
      <textarea id="b2b-mensaje" name="mensaje" rows={3} className="min-h-[112px] rounded-[12px] border border-white/20 bg-white px-3.5 py-2.5 font-body text-base text-[var(--ruum-navy)]" />
      <button type="submit" className="ruum-button-primary mt-2 inline-flex min-h-[52px] items-center justify-center rounded-[14px] px-6 font-body text-base font-semibold text-white">
        Solicitar propuesta
      </button>
    </form>
  );
}
