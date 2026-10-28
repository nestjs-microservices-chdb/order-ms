import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, from, map, switchMap, throwError } from 'rxjs';

import { PRODUCT_SERVICE } from '../config/services.js';
import { PrismaService } from '../prisma.service.js';

import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  OrderItemDto,
  OrderPaginationDto,
} from './dto/index.js';

interface ValidatedProduct {
  id: number;
  name: string;
  price: number;
}

@Injectable()
export class OrdersService {

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCT_SERVICE) private readonly client: ClientProxy
  ) { }

  create(createOrderDto: CreateOrderDto) {
    const productsId = createOrderDto.items.map((item) => item.productId);

    return this.client.send({ cmd: 'validate_products' }, productsId).pipe(
      catchError((error) => {
        console.log(error);
        return throwError(() => new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'check logs'
        }));
      }),
      switchMap(async (products: ValidatedProduct[]) => {
        const namesByProductId = new Map(
          products.map((product) => [product.id, product.name]),
        );

        const order = await this.prisma.order.create({
          data: this.buildOrderData(createOrderDto.items, products),
          include: {
            orderItem: {
              select: {
                price: true,
                quantity: true,
                productId: true
              }
            }
          }
        });

        return {
          ...order,
          orderItem: order.orderItem.map((item) => ({
            ...item,
            name: namesByProductId.get(item.productId)!,
          })),
        };
      }),
    );
  }

  private buildOrderData(items: OrderItemDto[], products: ValidatedProduct[]) {
    const pricesByProductId = new Map(
      products.map((product) => [product.id, product.price]),
    );

    return {
      totalAmount: items.reduce(
        (total, item) => total + pricesByProductId.get(item.productId)! * item.quantity,
        0,
      ),
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      orderItem: {
        createMany: {
          data: items.map((item) => ({
            price: pricesByProductId.get(item.productId)!,
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    };
  }

  async findAll(orderpaginationDto: OrderPaginationDto) {
    const totalPages = await this.prisma.order.count({
      where: {
        status: orderpaginationDto.status
      }
    })

    const currentPage = orderpaginationDto.page!;
    const perPage = orderpaginationDto.limit!;

    return {
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)
      },
      data: await this.prisma.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderpaginationDto.status
        }
      })
    }
  }

  findOne(id: string) {
    return from(this.getOrderWithItems(id)).pipe(
      switchMap((order) => {
        const productsId = order.orderItem.map((item) => item.productId);

        return this.client.send<ValidatedProduct[]>({ cmd: 'validate_products' }, productsId).pipe(
          catchError((error) => {
            console.log(error);
            return throwError(() => new RpcException({
              status: HttpStatus.BAD_REQUEST,
              message: 'check logs'
            }));
          }),
          map((products) => {
            const namesByProductId = new Map(
              products.map((product) => [product.id, product.name]),
            );

            return {
              ...order,
              orderItem: order.orderItem.map((item) => ({
                ...item,
                name: namesByProductId.get(item.productId)!,
              })),
            };
          }),
        );
      }),
    );
  }

  private async getOrderWithItems(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `order with id ${id} not found`
      });
    }

    return order;
  }

  async changeOrderStatus({ id, status }: ChangeOrderStatusDto) {
    const order = await this.getOrderWithItems(id);

    if (order.status === status) {
      return order;
    }

    return this.prisma.order.update({
      where: { id },
      data: { status }
    })
  }
}
