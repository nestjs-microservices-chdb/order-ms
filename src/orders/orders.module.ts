import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';
import { OrdersService } from './orders.service.js';

import { OrdersController } from './orders.controller.js';

import { NastModule } from '../transports/nast.module.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [NastModule]
})
export class OrdersModule { }
