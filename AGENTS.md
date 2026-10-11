# AGENTS

Este repositorio usa Turborepo para construir los paquetes y apps. Mantener la configuración actual y evitar cambios que rompan la coherencia de dependencias y build.

## Reglas para el workspace
- Usar Node 24 (ver .nvmrc).
- Ejecutar `pnpm install` cuando cambien dependencias.
- Validar build por paquetes si Turbo falla por un problema de entorno del runner.
