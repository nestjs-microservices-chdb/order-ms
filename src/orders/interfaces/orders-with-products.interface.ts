import { OrderStatus } from "../../generated/prisma/client.js";

export interface OrdersWithProducts {
  orderItem: {
    name: string;
    productId: number;
    quantity: number;
    price: number;
  }[];
  status: OrderStatus;
  id: string;
  totalAmount: number;
  totalItems: number;
  paid: boolean;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}