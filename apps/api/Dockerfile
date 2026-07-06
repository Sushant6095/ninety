FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile=false && pnpm --filter @omnipitch/api build
CMD ["node", "apps/api/dist/main.js"]
