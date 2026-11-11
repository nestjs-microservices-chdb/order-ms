import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { forkJoin, of, switchMap } from 'rxjs';

import { OrdersService } from './orders.service.js';
import { ChangeOrderStatusDto, CreateOrderDto, OrderPaginationDto, PaidOrderDto } from './dto/index.js';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto).pipe(
      switchMap(order => {
        return forkJoin({
          order: of(order),
          paymentSession: this.ordersService.createPaymentSession(order),
        })
      })
    );
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderpaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderpaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(changeOrderStatusDto)
  }

  @EventPattern('payment.succeeded')
  handlePaymentSucceeded(@Payload() paidOrderDto: PaidOrderDto) {
    return this.ordersService.handlePaymentSucceeded(paidOrderDto);
  }
}
