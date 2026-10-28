import { IsEnum, IsOptional } from "class-validator";

import { OrderStatus } from "../../generated/prisma/enums.js";

import { PaginationDto } from "../../common/index.js";
import { OrderStatusList } from "../enum/order.enum.js";

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`
  })
  status: OrderStatus
}