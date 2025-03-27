FROM node:20.19.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /workspace
WORKDIR /workspace

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /workspace/node_modules /app/node_modules
COPY --from=build /workspace/dist /app/dist
WORKDIR /app
EXPOSE 9098
CMD [ "node", "dist/main.js" ]