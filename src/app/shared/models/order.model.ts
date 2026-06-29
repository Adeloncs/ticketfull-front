/**
 * Modelos de Pedido/Ingresso, alinhados aos DTOs do backend
 * (OrderResponseDTO, TicketResponseDTO, CheckoutResponseDTO).
 */

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';

export type TicketStatus = 'VALID' | 'USED';

export interface Ticket {
  id: string;
  ticketBatchId: string;
  codeHash: string;
  status: TicketStatus;
  holderId: string | null;
}

export interface Order {
  id: string;
  customerId: string;
  eventId: string;
  status: OrderStatus;
  totalAmount: number;
  /** ISO-8601 — prazo da reserva (PENDING). */
  expiresAt: string | null;
  tickets: Ticket[];
  createdAt: string;
}

/** Corpo de POST /orders. */
export interface CreateOrderRequest {
  ticketBatchId: string;
  quantity: number;
}

/** Resposta de POST /orders/{id}/checkout. */
export interface CheckoutResponse {
  orderId: string;
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}
