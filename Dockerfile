# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG PNPM_VERSION=10.0.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Instalar pnpm y turbo globalmente en la base para que todos lo hereden
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION} turbo

################################################################################
# Create a stage for installing production dependencies.
FROM base as deps

COPY scripts/prepare-husky.mjs ./scripts/prepare-husky.mjs
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

################################################################################
# CAMBIO CLAVE: Cambiamos "FROM deps as build" a "FROM base as build" para heredar Turbo global.
FROM base as build

# Traemos los node_modules de producción generados en la etapa 'deps'
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copiamos todo el código fuente al contenedor
COPY . .

# Forzamos una instalación limpia que incluya devDependencies locales y sincronice el monorrepo
RUN pnpm install --no-frozen-lockfile

# Ejecutamos el build usando el comando nativo de Turbo sin intermediarios
RUN turbo run build --concurrency=1

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
FROM base as final

ENV NODE_ENV production
USER node
COPY package.json .

# Copiamos dependencias y el compilado final
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next

EXPOSE 3000

CMD pnpm run start
