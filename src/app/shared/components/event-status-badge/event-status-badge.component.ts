import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EventStatus } from '../../../features/event-catalog/models/event.model';

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
};

const EVENT_STATUS_CLASSES: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

/** Selo de status de evento, usado nas telas de organizador. */
@Component({
  selector: 'app-event-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="badgeClass()">
      {{ label() }}
    </span>
  `,
})
export class EventStatusBadgeComponent {
  readonly status = input.required<EventStatus>();

  readonly label = computed(() => EVENT_STATUS_LABELS[this.status()]);
  readonly badgeClass = computed(() => EVENT_STATUS_CLASSES[this.status()]);
}
