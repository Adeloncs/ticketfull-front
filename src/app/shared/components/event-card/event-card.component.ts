import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Event } from '../../../features/event-catalog/models/event.model';

/** Card de evento reutilizável usado no catálogo. */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="['/events', event().id]"
      class="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        class="flex h-32 items-center justify-center bg-gradient-to-br from-brand to-brand-dark text-2xl font-bold text-white"
      >
        {{ event().title.charAt(0) }}
      </div>
      <div class="flex flex-1 flex-col gap-2 p-4">
        <h3 class="line-clamp-2 font-semibold text-gray-900 group-hover:text-brand">
          {{ event().title }}
        </h3>
        <p class="line-clamp-2 text-sm text-gray-500">{{ event().description }}</p>
        <div class="mt-auto flex flex-col gap-1 pt-2 text-sm text-gray-600">
          <span class="inline-flex items-center gap-1">
            🗓️ {{ event().eventDate | date: 'dd/MM/yyyy HH:mm' }}
          </span>
          <span class="inline-flex items-center gap-1">📍 {{ event().location }}</span>
        </div>
      </div>
    </a>
  `,
})
export class EventCardComponent {
  readonly event = input.required<Event>();
}
