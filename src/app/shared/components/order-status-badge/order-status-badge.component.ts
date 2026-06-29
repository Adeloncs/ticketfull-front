import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { OrderStatus } from '../../models/order.model';

/** Rótulo legível para cada status de pedido. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Estornado',
};

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
  EXPIRED: 'bg-gray-200 text-gray-700',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

/** Selo de status de um pedido, reutilizado no checkout e no dashboard. */
@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="badgeClass()">
      {{ label() }}
    </span>
  `,
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
  readonly badgeClass = computed(() => ORDER_STATUS_CLASSES[this.status()]);
}
