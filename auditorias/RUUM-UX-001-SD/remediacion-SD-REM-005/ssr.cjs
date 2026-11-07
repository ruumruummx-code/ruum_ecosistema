"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/formulario.tsx
var formulario_exports = {};
__export(formulario_exports, {
  Formulario: () => Formulario
});
module.exports = __toCommonJS(formulario_exports);
var import_react3 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\index.js");

// packages/ui/src/components/Tabs.tsx
var import_react = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\index.js");
var import_jsx_runtime = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
function Tabs({ tabs, value, idPrefix, onSeleccion, etiqueta = "Pesta\xF1as", orientation = "horizontal", className = "", panelClassName = "", renderPanel, mantenerMontados = false }) {
  const generatedId = (0, import_react.useId)();
  const instanceId = idPrefix || generatedId;
  const [internalValue, setInternalValue] = (0, import_react.useState)();
  const [focusedId, setFocusedId] = (0, import_react.useState)(null);
  const buttons = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const enabled = tabs.filter((t) => !t.disabled);
  const requested = value ?? (tabs.some((t) => t.activo !== void 0) ? tabs.find((t) => t.activo)?.id : internalValue);
  const selected = enabled.find((t) => t.id === requested)?.id ?? enabled[0]?.id;
  const roving = enabled.some((t) => t.id === focusedId) ? focusedId : selected;
  const tabId = (id) => `${instanceId}-tab-${encodeURIComponent(id)}`;
  const panelId = (id) => `${instanceId}-panel-${encodeURIComponent(id)}`;
  if (new Set(tabs.map((t) => t.id)).size !== tabs.length) throw new Error("Tabs: cada item requiere un id \xFAnico dentro de la instancia");
  function select(id) {
    if (!enabled.some((t) => t.id === id)) return;
    setInternalValue(id);
    onSeleccion?.(id);
  }
  function navigate(event, id) {
    const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const backward = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const index = enabled.findIndex((t) => t.id === id);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : event.key === forward ? (index + 1) % enabled.length : event.key === backward ? (index - 1 + enabled.length) % enabled.length : -1;
    if (next < 0 || !enabled[next]) return;
    event.preventDefault();
    buttons.current.get(enabled[next].id)?.focus();
  }
  if (tabs.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "contents", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        role: "tablist",
        "aria-label": etiqueta,
        "aria-orientation": orientation,
        className: `flex gap-2 overflow-x-auto p-2 ${orientation === "vertical" ? "flex-col" : ""} ${className}`,
        onBlur: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null);
        },
        children: tabs.map((t) => {
          const active = selected === t.id;
          const classes = `flex min-h-[var(--ruum-touch)] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 font-body text-sm font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ruum-focus)] ${t.disabled ? "cursor-not-allowed border-[var(--ruum-border)] bg-[var(--ruum-neutral-bg)] text-[var(--ruum-text-disabled)]" : active ? "border-transparent bg-[var(--ruum-action)] text-[var(--ruum-on-primary)]" : "border-[var(--ruum-border-input)] bg-[var(--ruum-surface)] text-[var(--ruum-text)]"}`;
          const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            t.etiqueta,
            typeof t.conteo === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rounded-full px-1.5 py-0.5 text-xs tabular-nums", children: t.conteo }),
            t.disabled && t.motivoDeshabilitado && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-xs", children: t.motivoDeshabilitado })
          ] });
          return t.disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { id: tabId(t.id), role: "tab", "aria-selected": false, "aria-disabled": "true", "aria-controls": panelId(t.id), className: classes, children: content }, t.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: (element) => {
            if (element) buttons.current.set(t.id, element);
            else buttons.current.delete(t.id);
          }, id: tabId(t.id), type: "button", role: "tab", "aria-selected": active, "aria-controls": panelId(t.id), tabIndex: roving === t.id ? 0 : -1, onFocus: () => setFocusedId(t.id), onKeyDown: (event) => navigate(event, t.id), onClick: () => select(t.id), className: classes, children: content }, t.id);
        })
      }
    ),
    tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: panelId(t.id), role: "tabpanel", "aria-labelledby": tabId(t.id), hidden: selected !== t.id, style: selected !== t.id ? { display: "none" } : void 0, tabIndex: selected === t.id ? 0 : -1, className: panelClassName, children: mantenerMontados || selected === t.id ? renderPanel ? renderPanel(t.id) : t.contenido : null }, t.id))
  ] });
}

// packages/ui/src/components/Controls.tsx
var import_react2 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\index.js");
var import_jsx_runtime2 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
var INPUT = "min-h-[var(--ruum-input-height)] w-full rounded-[12px] border border-[var(--ruum-border-input)] bg-[var(--ruum-surface)] px-3.5 py-2.5 font-body text-base text-[var(--ruum-text)] transition-[border-color,box-shadow] duration-[var(--ruum-motion-micro)] placeholder:text-[var(--ruum-text-disabled)] hover:border-[var(--ruum-text)] focus:border-[var(--ruum-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--ruum-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ruum-border)] disabled:bg-[var(--ruum-neutral-bg)] disabled:text-[var(--ruum-text-disabled)]";
function ErrorLine({ id, texto }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { id, role: "alert", className: "flex items-center gap-1.5 font-body text-sm font-medium text-[var(--ruum-error-text)]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, className: "shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 8v5M12 16.5h.01M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
    texto
  ] });
}
function Input({
  etiqueta,
  error,
  ayuda,
  id,
  "aria-describedby": describedBy,
  className = "",
  ...props
}) {
  const generatedId = (0, import_react2.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: inputId, className: `${INPUT} ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
  ] });
}
function Select({
  etiqueta,
  error,
  ayuda,
  children,
  id,
  "aria-describedby": describedBy,
  className = "",
  ...props
}) {
  const generatedId = (0, import_react2.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { id: inputId, className: `${INPUT} ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props, children }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
  ] });
}
function Textarea({
  etiqueta,
  error,
  ayuda,
  id,
  "aria-describedby": describedBy,
  className = "",
  ...props
}) {
  const generatedId = (0, import_react2.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: inputId, rows: 4, className: `${INPUT} min-h-[112px] ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
  ] });
}

// packages/ui/src/components/MobileRow.tsx
var import_jsx_runtime3 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
var TONO_ICONO_CLASES = {
  base: "bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]",
  verde: "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]",
  azul: "bg-[#e6f0ff] text-[#0066ff] dark:bg-[#0f2d52] dark:text-[#4d94ff]",
  ambar: "bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]",
  rojo: "bg-[#fdeaea] text-[#9a2637] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]",
  morado: "bg-[#f3eefb] text-[#5e3b8c] dark:bg-[#2b1945] dark:text-[#bf9ff0]",
  neutro: "bg-[#eff3f8] text-[#3b4c68] dark:bg-[#1a2e4a] dark:text-[#a8b5cc]"
};
function ChevronDerecha() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "svg",
    {
      className: "size-4 shrink-0 text-[#8b9bb0] dark:text-[#6b7a99]",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function MobileRow({
  titulo,
  subtitulo,
  icono,
  tonoIcono = "base",
  href,
  enlaceComponente,
  linkComponent,
  onClick,
  disabled = false,
  badge,
  derecha,
  mostrarChevron,
  destructivo = false,
  conDivisor = true,
  className = ""
}) {
  const esInteractivo = Boolean(href || onClick) && !disabled;
  const debeMostrarChevron = mostrarChevron ?? esInteractivo;
  const contenido = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    conDivisor && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "span",
      {
        "aria-hidden": "true",
        className: "absolute left-[64px] right-4 top-0 h-px bg-[#eef2f7] dark:bg-[#1a3a5c]"
      }
    ),
    icono && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "span",
      {
        "aria-hidden": "true",
        className: [
          "flex size-10 shrink-0 items-center justify-center rounded-[13px] transition-transform",
          TONO_ICONO_CLASES[tonoIcono]
        ].join(" "),
        children: icono
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "min-w-0 flex-1 py-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "span",
        {
          className: [
            "block text-[14.5px] font-bold tracking-tight leading-snug",
            destructivo ? "text-[#9a2637] dark:text-[#ff6b7a]" : "text-[#0a2342] dark:text-[#f6f8fb]"
          ].join(" "),
          children: titulo
        }
      ),
      subtitulo && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mt-0.5 block text-[12.5px] font-medium leading-normal text-[#4e5f80] dark:text-[#a8b5cc]", children: subtitulo })
    ] }),
    badge && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "shrink-0", children: badge }),
    derecha && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "shrink-0", children: derecha }),
    debeMostrarChevron && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronDerecha, {})
  ] });
  const clasesFila = [
    "relative flex min-h-[54px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
    esInteractivo ? "cursor-pointer hover:bg-[#f8fafd] active:bg-[#f0f5fe] dark:hover:bg-[#0f2d52]/60 dark:active:bg-[#0f2d52]" : "",
    disabled ? "opacity-60 pointer-events-none" : "",
    className
  ].join(" ");
  if (href && disabled) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { role: "link", "aria-disabled": "true", className: clasesFila, children: contenido });
  }
  if (href) {
    const Componente = enlaceComponente || linkComponent || "a";
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      Componente,
      {
        href,
        className: clasesFila,
        children: contenido
      }
    );
  }
  if (onClick) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick, disabled, "aria-disabled": disabled || void 0, className: clasesFila, children: contenido });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: clasesFila, children: contenido });
}

// packages/ui/src/components/Aviso.tsx
var import_jsx_runtime4 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
var ESTILOS = {
  info: "border-[var(--ruum-action)]/30 bg-[var(--ruum-action-bg)] text-[var(--ruum-action-text)]",
  success: "border-[var(--ruum-success)]/30 bg-[var(--ruum-success-bg)] text-[var(--ruum-success-text)]",
  atencion: "border-[var(--ruum-warning)]/40 bg-[var(--ruum-warning-bg)] text-[var(--ruum-warning-text)]",
  warning: "border-[var(--ruum-warning)]/40 bg-[var(--ruum-warning-bg)] text-[var(--ruum-warning-text)]",
  danger: "border-[var(--ruum-error)]/30 bg-[var(--ruum-error-bg)] text-[var(--ruum-error-text)]",
  error: "border-[var(--ruum-error)]/30 bg-[var(--ruum-error-bg)] text-[var(--ruum-error-text)]"
};
function IconoAviso({ tono }) {
  const d = tono === "success" ? "M20 6 9 17l-5-5" : tono === "info" ? "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v5M12 7.5h.01" : "M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, className: "size-[18px] shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d, stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) });
}
function Aviso({ tono = "info", titulo, children, className = "" }) {
  const danger = tono === "danger" || tono === "error";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      role: danger ? "alert" : "status",
      className: `flex gap-2.5 rounded-xl border px-4 py-3 font-body text-sm leading-5 shadow-1 ${ESTILOS[tono]} ${className}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconoAviso, { tono }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "min-w-0", children: [
          titulo ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "font-semibold", children: titulo }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { children })
        ] })
      ]
    }
  );
}

// packages/ui/src/components/Button.tsx
var import_jsx_runtime5 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
var ESTILOS2 = {
  primary: "ruum-button-primary shadow-xs hover:brightness-105 active:scale-[0.98] focus-visible:outline-route-action",
  secondary: "border border-border-strong bg-surface text-primary shadow-xs hover:border-brand hover:bg-surface-elevated hover:text-primary active:scale-[0.98] focus-visible:outline-route-action",
  quiet: "border border-transparent bg-transparent text-text-muted hover:text-text-secondary active:text-text-primary focus-visible:outline-route-action",
  danger: "border border-danger-action bg-danger-action text-white shadow-xs hover:brightness-105 active:scale-[0.98] focus-visible:outline-danger-action",
  emergency: "border-2 border-danger-action bg-danger-action text-white shadow-sm hover:brightness-105 hover:shadow-md active:scale-[0.98] focus-visible:outline-danger-action"
};
var ICONO_DEFAULT = {
  primary: "arrow",
  secondary: "none",
  quiet: "none",
  danger: "warning",
  emergency: "phone"
};
function Button({ variant = "primary", icon, loading = false, disabled, className = "", children, ...props }) {
  const icono = icon ?? ICONO_DEFAULT[variant];
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "button",
    {
      className: [
        "inline-flex min-h-[var(--ruum-button-height)] min-w-[var(--ruum-touch)] items-center justify-center gap-2 rounded-[14px] px-5 py-3",
        "font-display text-base font-semibold leading-6 transition-[background-color,border-color,box-shadow,transform] duration-[var(--ruum-motion-micro)]",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:transform-none disabled:border-[var(--ruum-border)] disabled:bg-[var(--ruum-neutral-bg)] disabled:text-[var(--ruum-muted)] disabled:shadow-none",
        ESTILOS2[variant],
        className
      ].join(" "),
      ...props,
      "aria-busy": loading || void 0,
      disabled: disabled || loading,
      children: [
        loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "size-4 animate-spin rounded-full border-2 border-current border-t-transparent", "aria-hidden": true }),
        !loading && icono !== "none" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ButtonIcono, { name: icono }),
        children
      ]
    }
  );
}
function ButtonIcono({ name }) {
  const common = {
    className: "size-4 shrink-0",
    width: 16,
    height: 16,
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  if (name === "warning") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { ...common, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M12 9v4" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M12 17h.01" })
    ] });
  }
  if (name === "phone") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { ...common, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" }) });
  }
  if (name === "check") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { ...common, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "m20 6-11 11-5-5" }) });
  }
  if (name === "send") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { ...common, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "m22 2-7 20-4-9-9-4Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M22 2 11 13" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { ...common, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M5 12h14" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "m13 6 6 6-6 6" })
  ] });
}

// packages/ui/src/components/NextOperationalAction.tsx
var import_jsx_runtime6 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
function CtaLink({ cta, primary = false }) {
  const variant = cta.variant ?? (primary ? "primary" : "secondary");
  const classes = [
    "inline-flex min-h-12 min-w-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3",
    "font-body text-sm font-semibold leading-5 transition-all duration-200",
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2",
    cta.disabled ? "cursor-not-allowed border border-border bg-surface-elevated text-disabled" : variant === "primary" ? "border-transparent bg-[image:var(--ruum-gradient-action)] text-[var(--ruum-on-primary)] shadow-xs hover:brightness-105 active:scale-[0.98] focus-visible:outline-route-action" : variant === "danger" || variant === "emergency" ? "border border-danger-action bg-danger-action text-white shadow-xs hover:brightness-105 active:scale-[0.98] focus-visible:outline-danger-action" : "border border-border-strong bg-surface text-primary shadow-xs hover:border-brand hover:bg-surface-elevated hover:text-primary active:scale-[0.98] focus-visible:outline-route-action"
  ].join(" ");
  if (cta.disabled) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { role: "link", "aria-disabled": "true", className: classes, children: cta.label });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "a",
    {
      href: cta.href,
      target: cta.external ? "_blank" : void 0,
      rel: cta.external ? "noreferrer" : void 0,
      className: classes,
      children: cta.label
    }
  );
}
function ActionButton({
  cta,
  loading = false,
  primary = false
}) {
  if (cta.href) return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CtaLink, { cta, primary });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    Button,
    {
      className: "w-full",
      variant: cta.variant ?? (primary ? "primary" : "secondary"),
      onClick: cta.onClick,
      disabled: cta.disabled,
      "aria-disabled": cta.disabled || void 0,
      loading,
      children: cta.label
    }
  );
}
function NextOperationalAction({
  title,
  instruction,
  context,
  eta,
  primaryCta,
  secondaryCta,
  loading = false,
  error,
  nextStep,
  stageLabel,
  className = ""
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "section",
    {
      className: [
        "rounded-2xl border border-border-strong bg-surface-elevated p-4 text-text-primary shadow-2 sm:p-5",
        "mx-auto w-full max-w-full overflow-hidden",
        className
      ].join(" "),
      "aria-labelledby": "next-operational-action-title",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "min-w-0", children: [
          stageLabel && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "font-body text-sm font-semibold text-route-action", children: stageLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { id: "next-operational-action-title", className: "mt-1 break-words font-display text-2xl font-semibold leading-7 text-text-primary", children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "mt-2 break-words font-body text-base leading-7 text-text-secondary", children: instruction })
        ] }),
        (context || eta) && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mt-4 min-w-0 rounded-xl border border-border bg-surface px-3 py-3 font-body text-base text-text-secondary", children: [
          context && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "break-words font-medium text-text-primary", children: context }),
          eta && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "mt-1 break-words text-sm text-text-secondary", children: eta })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-4", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Aviso, { tono: "danger", children: error }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mt-4 grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto]", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ActionButton, { cta: primaryCta, loading, primary: true }),
          secondaryCta && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ActionButton, { cta: secondaryCta })
        ] }),
        nextStep && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "mt-3 break-words rounded-xl border border-warning bg-warn-soft px-3 py-2 font-body text-sm text-text-primary", children: [
          "Despu\xE9s: ",
          nextStep
        ] })
      ]
    }
  );
}

// auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/formulario.tsx
var import_jsx_runtime7 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
function Formulario() {
  const [selected, setSelected] = (0, import_react3.useState)("a");
  const [updates, setUpdates] = (0, import_react3.useState)(0);
  const [disabled, setDisabled] = (0, import_react3.useState)(false);
  const [state, setState] = (0, import_react3.useState)(0);
  const tabs = [{ id: "a", etiqueta: "Resumen", contenido: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "Panel resumen" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { "aria-label": "Nota del resumen", defaultValue: "Conservar" })
  ] }) }, { id: "b", etiqueta: "Actividad", contenido: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "Panel actividad" }) }, { id: "x", etiqueta: "No disponible", disabled: true, motivoDeshabilitado: "Requiere validaci\xF3n", contenido: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "Contenido bloqueado" }) }, { id: "c", etiqueta: "Documentos", disabled, contenido: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "Panel documentos" }) }];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("main", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h1", { children: "SD-REM-005 \xB7 Pesta\xF1as manuales" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { id: "before", children: "Antes de las pesta\xF1as" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tabs, { etiqueta: "Principal", tabs, value: selected, onSeleccion: (id) => {
      setSelected(id);
      setUpdates((n) => n + 1);
    }, mantenerMontados: true }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { id: "after", children: "Despu\xE9s de las pesta\xF1as" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("output", { id: "updates", children: updates }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { onClick: () => setState((state + 1) % 4), children: "Actualizar descripciones" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { onClick: () => setDisabled(!disabled), children: "Alternar Documentos" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tabs, { etiqueta: "Secundaria vertical", orientation: "vertical", tabs }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { "aria-label": "Regresi\xF3n SD-REM-004", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "Formulario de regresi\xF3n" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("form", { "aria-label": "Campos", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Input, { etiqueta: "Expl\xEDcito", id: "campo-explicito", name: "explicito", ayuda: state & 1 ? "Ayuda" : void 0, error: state & 2 ? "Error" : void 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Input, { etiqueta: "Generado", ayuda: state & 1 ? "Ayuda" : void 0, error: state & 2 ? "Error" : void 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Select, { etiqueta: "Selecci\xF3n", ayuda: state & 1 ? "Ayuda" : void 0, error: state & 2 ? "Error" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { children: "Opci\xF3n" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Textarea, { etiqueta: "Descripci\xF3n", ayuda: state & 1 ? "Ayuda" : void 0, error: state & 2 ? "Error" : void 0 })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { "aria-label": "Regresi\xF3n SD-REM-007", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "Destinos bloqueados" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(MobileRow, { titulo: "Cancelar traslado", href: "#prohibido", disabled: true }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(NextOperationalAction, { title: "Acci\xF3n bloqueada", instruction: "Completa la validaci\xF3n antes de pagar.", primaryCta: { label: "Pagar", href: "#prohibido", disabled: true } })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Formulario
});
