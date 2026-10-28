import { IsEnum, IsUUID } from "class-validator";
import { OrderStatus } from "../../generated/prisma/enums.js";
import { OrderStatusList } from "../enum/order.enum.js";

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`
  })
  status: OrderStatus
}