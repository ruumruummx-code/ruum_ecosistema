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

// auditorias/RUUM-UX-001-SD/remediacion-SD-REM-004/formulario.tsx
var formulario_exports = {};
__export(formulario_exports, {
  Formulario: () => Formulario
});
module.exports = __toCommonJS(formulario_exports);
var import_react2 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\index.js");

// packages/ui/src/components/Controls.tsx
var import_react = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\index.js");
var import_jsx_runtime = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
var INPUT = "min-h-[var(--ruum-input-height)] w-full rounded-[12px] border border-[var(--ruum-border-input)] bg-[var(--ruum-surface)] px-3.5 py-2.5 font-body text-base text-[var(--ruum-text)] transition-[border-color,box-shadow] duration-[var(--ruum-motion-micro)] placeholder:text-[var(--ruum-text-disabled)] hover:border-[var(--ruum-text)] focus:border-[var(--ruum-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--ruum-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ruum-border)] disabled:bg-[var(--ruum-neutral-bg)] disabled:text-[var(--ruum-text-disabled)]";
function ErrorLine({ id, texto }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { id, role: "alert", className: "flex items-center gap-1.5 font-body text-sm font-medium text-[var(--ruum-error-text)]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, className: "shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8v5M12 16.5h.01M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
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
  const generatedId = (0, import_react.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: inputId, className: `${INPUT} ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
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
  const generatedId = (0, import_react.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { id: inputId, className: `${INPUT} ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props, children }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
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
  const generatedId = (0, import_react.useId)();
  const inputId = id || generatedId;
  const description = [describedBy, ayuda ? `${inputId}-help` : void 0, error ? `${inputId}-error` : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, className: "font-body text-[13px] font-semibold text-[var(--ruum-text)]", children: etiqueta }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { id: inputId, rows: 4, className: `${INPUT} min-h-[112px] ${error ? "border-[var(--ruum-error)]" : ""} ${className}`, "aria-invalid": Boolean(error), "aria-describedby": description, ...props }),
    ayuda ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${inputId}-help`, className: "font-body text-sm text-[var(--ruum-text-secondary)]", children: ayuda }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorLine, { id: `${inputId}-error`, texto: error }) : null
  ] });
}

// auditorias/RUUM-UX-001-SD/remediacion-SD-REM-004/formulario.tsx
var import_jsx_runtime2 = require("C:\\ruum_ecosistema-main\\node_modules\\.pnpm\\react@19.3.1\\node_modules\\react\\jsx-runtime.js");
function Formulario() {
  const [state, setState] = (0, import_react2.useState)(0);
  const [conditional, setConditional] = (0, import_react2.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("main", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: "SD-REM-004 \xB7 Controles accesibles" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setState((state + 1) % 4), children: "Cambiar estado" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setConditional(!conditional), children: "Campo condicional" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "external", children: "Descripci\xF3n externa" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { "aria-label": "Verificaci\xF3n de controles", children: [
      [Input, Select, Textarea].map((Control, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { children: [true, false, false].map((explicit, n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Control, { etiqueta: `${["Input", "Select", "Textarea"][index]} ${n + 1}`, id: explicit ? `explicit-${index}` : void 0, name: n === 2 ? void 0 : "repetido", ayuda: state & 1 ? "Ayuda del campo" : void 0, error: state & 2 ? "Error del campo" : void 0, "aria-describedby": "external", children: index === 1 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { children: "Opci\xF3n" }) : void 0 }, n)) }, index)),
      conditional && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Input, { etiqueta: "Condicional" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Formulario
});
