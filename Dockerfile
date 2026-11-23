# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG PNPM_VERSION=10.0.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Instalar pnpm y turbo globalmente en la base para que todos lo hereden
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION} turbo

################################################################################
# Stage de compilación con todas las dependencias del monorepo
FROM base AS build

# Copiar manifiestos y estructura del workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY scripts/ ./scripts/

# Instalación limpia y congelada
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Compilación de la aplicación
RUN turbo run build --filter=app-usuario...

################################################################################
# Stage final de ejecución con dependencias mínimas de producción
FROM base AS final

ENV NODE_ENV=production
WORKDIR /usr/src/app

USER node

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/apps/app-usuario/.next ./apps/app-usuario/.next
COPY --chown=node:node --from=build /usr/src/app/apps/app-usuario/package.json ./apps/app-usuario/package.json
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json

EXPOSE 3000

CMD ["pnpm", "--filter", "app-usuario", "run", "start"]
