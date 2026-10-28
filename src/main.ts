import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { envs } from './config/index.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Orders-Main')

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: envs.port ?? 3000
      }
    }
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableShutdownHooks();

  await app.listen();
  logger.log(`Microservice running on port ${envs.port ?? 3000}`)
}
await bootstrap();
