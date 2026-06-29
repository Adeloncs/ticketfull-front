import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Event, EventFilters } from '../models/event.model';
import { EventService } from '../services/event.service';

const PAGE_SIZE = 12;

/** Catálogo de eventos: listagem paginada com filtro por local. */
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [FormsModule, EventCardComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900">Descubra eventos</h1>
      <p class="mt-1 text-gray-500">Encontre os melhores eventos e garanta seu ingresso.</p>

      <form class="mt-6 flex gap-2" (ngSubmit)="applyLocationFilter()">
        <input
          type="text"
          name="location"
          [(ngModel)]="locationInput"
          placeholder="Filtrar por local (ex.: São Paulo)"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          class="rounded-lg bg-brand px-5 py-2 font-medium text-white transition hover:bg-brand-dark"
        >
          Buscar
        </button>
      </form>

      @if (loading()) {
        <app-spinner label="Carregando eventos..." />
      } @else if (error()) {
        <div class="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{{ error() }}</p>
          <button class="mt-3 font-medium underline" (click)="reload()">Tentar novamente</button>
        </div>
      } @else if (events().length === 0) {
        <div class="mt-8 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          Nenhum evento encontrado.
        </div>
      } @else {
        <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (event of events(); track event.id) {
            <app-event-card [event]="event" />
          }
        </div>

        @if (totalPages() > 1) {
          <div class="mt-8 flex items-center justify-center gap-4">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
              [disabled]="page() === 0"
              (click)="goToPage(page() - 1)"
            >
              Anterior
            </button>
            <span class="text-sm text-gray-600">
              Página {{ page() + 1 }} de {{ totalPages() }}
            </span>
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
              [disabled]="page() + 1 >= totalPages()"
              (click)="goToPage(page() + 1)"
            >
              Próxima
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class EventListComponent {
  private readonly eventService = inject(EventService);

  // Estado local com Signals
  readonly events = signal<Event[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(0);

  /** Termo digitado no campo (two-way) — só vira filtro ao submeter. */
  locationInput = '';
  private readonly location = signal('');

  readonly hasResults = computed(() => this.events().length > 0);

  constructor() {
    this.fetch();
  }

  applyLocationFilter(): void {
    this.location.set(this.locationInput.trim());
    this.page.set(0);
    this.fetch();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.fetch();
  }

  reload(): void {
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: EventFilters = {
      page: this.page(),
      size: PAGE_SIZE,
      sort: 'eventDate,asc',
    };
    const loc = this.location();
    if (loc) filters.location = loc;

    this.eventService.getEvents(filters).subscribe({
      next: (res) => {
        this.events.set(res.content);
        this.totalPages.set(res.page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os eventos. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
