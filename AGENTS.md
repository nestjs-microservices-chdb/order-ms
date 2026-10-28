# AGENTS.md

Microservicio NestJS de órdenes con transporte **TCP**. No es un servidor HTTP: `src/main.ts` crea la app con `NestFactory.createMicroservice` — no hay endpoints REST ni puerto HTTP que testear con curl/supertest.

## Contexto

- Parte de una app de 3 servicios (directorios hermanos, cada uno es su propio repo git): `client-gateway` (gateway HTTP), `product-ms` (puerto 3001) y `order-ms` (este repo, puerto 3002).
- La "API" de este servicio son patrones `@MessagePattern` (ver `src/orders/orders.controller.ts`): `createOrder`, `findAllOrders`, `findOneOrder`, `changeOrderStatus`. Los errores se propagan como `RpcException`.
- `createOrder` valida productos llamando por TCP a `product-ms` (cmd `validate_products`, config en `src/orders/orders.module.ts`). Sin `product-ms` corriendo, `createOrder` falla.

## Setup

- Copiar `.env.template` → `.env`. Las variables se validan con zod en `src/config/envs.ts` al importar: si falta `PORT`, `PRODUCTS_MICROSERVICE_HOST`, `PRODUCTS_MICROSERVICE_PORT` o `DATABASE_URL`, la app muere al arrancar con "Invalid environment variables".
- Postgres: `docker compose up -d` (contenedor `orders_database`, puerto 5432, user `postgres`, password `123456`, db `ordersdb`).

## Prisma 7

- Config del CLI: `prisma7.config.ts` en la raíz — el CLI lo detecta solo, no hace falta `--config`. El `DATABASE_URL` vive ahí (vía dotenv), no en `schema.prisma`.
- Generador nuevo `prisma-client` (no `prisma-client-js`), salida en `src/generated/prisma`: es código generado dentro de `src` — no editar a mano. Importarlo como `./generated/prisma/client.js`.
- Tras cambiar `prisma/schema.prisma`: `npx prisma migrate dev --name <nombre>` y luego correr `npx prisma generate` explícito (en v7 `migrate dev` NO regenera el cliente).
- Driver adapter obligatorio en v7: `PrismaService` (`src/prisma.service.ts`) extiende `PrismaClient` con `@prisma/adapter-pg`.

## Comandos

- `npm run start:dev` — modo watch.
- `npm run lint` — **oxlint** type-aware (no ESLint); config `.oxlintrc.json`. Hoy tiene warnings, exit 0.
- `npm run build` — `nest build`, OK.
- `npm test` — vitest unitario (`**/*.spec.ts`). **Falla hoy**: "No test files found", exit 1 — no hay specs escritas aún. No es una regresión.
- `npm run test:e2e` — vitest con `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`). **Falla hoy**: `test/app.e2e-spec.ts` es el scaffold de Nest (espera HTTP GET / "Hello World!") pero esto es un microservicio TCP → 404. No es una regresión. Además usa el `AppModule` real, así que requiere el Postgres de docker arriba.
- Un solo test: `npx vitest run <archivo>` o `npx vitest run -t "<nombre del test>"`.

## Convenciones del código

- ESM: `"type": "module"` + tsconfig `module: nodenext` → todo import relativo lleva sufijo `.js` (ej. `./app.module.js`).
- Barrel `index.ts` por carpeta (`src/config`, `src/orders/dto`, `src/common`).
- DTOs con `class-validator`. El `ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted` (`src/main.ts`): propiedades extra en el payload se rechazan, agregar el decorador al DTO.
- Formato: `npm run format` (Prettier, `singleQuote` + `trailingComma: "all"`).
