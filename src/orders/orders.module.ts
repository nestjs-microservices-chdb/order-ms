import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';
import { OrdersService } from './orders.service.js';

import { OrdersController } from './orders.controller.js';

import { envs, PRODUCT_SERVICE } from '../config/index.js'

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productsMicroserviceHost,
          port: envs.productsMicroservicePort
        }
      },
    ]),
  ]
})
export class OrdersModule { }
