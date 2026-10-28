import 'dotenv/config';
import * as z from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number(),
  PRODUCTS_MICROSERVICE_HOST: z.string(),
  PRODUCTS_MICROSERVICE_PORT: z.coerce.number(),
  DATABASE_URL: z.string()
});

const validSchema = envSchema.safeParse(process.env);

if (!validSchema.success) {
  console.error('Invalid environment variables: ', validSchema.error.issues);
  throw new Error('Invalid environment variables');
}

export const envs = {
  port: validSchema.data.PORT,
  databaseUrl: validSchema.data.DATABASE_URL,
  productsMicroserviceHost: validSchema.data.PRODUCTS_MICROSERVICE_HOST,
  productsMicroservicePort: validSchema.data.PRODUCTS_MICROSERVICE_PORT

}