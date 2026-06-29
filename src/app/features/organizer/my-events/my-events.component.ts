import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { MyEventsFilters, OrganizerService } from '../../../core/services/organizer.service';
import { EventStatusBadgeComponent } from '../../../shared/components/event-status-badge/event-status-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Event } from '../../event-catalog/models/event.model';

const PAGE_SIZE = 10;

/** Painel do organizador: lista os próprios eventos com ações de status. */
@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [RouterLink, DatePipe, EventStatusBadgeComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Meus eventos</h1>
        <a
          routerLink="/organizer/events/new"
          class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          + Novo evento
        </a>
      </div>

      @if (actionError()) {
        <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {{ actionError() }}
        </div>
      }

      @if (loading()) {
        <app-spinner label="Carregando eventos..." />
      } @else if (error()) {
        <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{{ error() }}</p>
          <button class="mt-3 font-medium underline" (click)="reload()">Tentar novamente</button>
        </div>
      } @else if (events().length === 0) {
        <div class="mt-6 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          Você ainda não criou eventos.
          <a routerLink="/organizer/events/new" class="font-medium text-brand hover:underline">
            Criar o primeiro
          </a>.
        </div>
      } @else {
        <ul class="mt-6 space-y-4">
          @for (event of events(); track event.id) {
            <li class="rounded-2xl border border-gray-200 bg-white p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <a
                    [routerLink]="['/organizer/events', event.id]"
                    class="font-semibold text-gray-900 hover:text-brand"
                  >
                    {{ event.title }}
                  </a>
                  <p class="mt-1 text-sm text-gray-500">
                    🗓️ {{ event.eventDate | date: 'dd/MM/yyyy HH:mm' }} · 📍 {{ event.location }}
                  </p>
                </div>
                <app-event-status-badge [status]="event.status" />
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <a
                  [routerLink]="['/organizer/events', event.id]"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Gerenciar
                </a>
                @if (event.status !== 'CANCELLED') {
                  <a
                    [routerLink]="['/organizer/events', event.id, 'edit']"
                    class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Editar
                  </a>
                }
                @if (event.status === 'DRAFT') {
                  <button
                    (click)="publish(event)"
                    [disabled]="actingId() === event.id"
                    class="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    Publicar
                  </button>
                }
                @if (event.status !== 'CANCELLED') {
                  <button
                    (click)="cancel(event)"
                    [disabled]="actingId() === event.id"
                    class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                }
              </div>
            </li>
          }
        </ul>

        @if (totalPages() > 1) {
          <div class="mt-6 flex items-center justify-center gap-4">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
              [disabled]="page() === 0"
              (click)="goToPage(page() - 1)"
            >
              Anterior
            </button>
            <span class="text-sm text-gray-600">Página {{ page() + 1 }} de {{ totalPages() }}</span>
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
export class MyEventsComponent {
  private readonly organizer = inject(OrganizerService);

  readonly events = signal<Event[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly actingId = signal<string | null>(null);

  constructor() {
    this.fetch();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.fetch();
  }

  reload(): void {
    this.fetch();
  }

  publish(event: Event): void {
    this.runAction(event.id, () => this.organizer.publish(event.id));
  }

  cancel(event: Event): void {
    this.runAction(event.id, () => this.organizer.cancel(event.id));
  }

  private runAction(id: string, action: () => ReturnType<OrganizerService['publish']>): void {
    this.actingId.set(id);
    this.actionError.set(null);
    action().subscribe({
      next: (updated) => {
        this.actingId.set(null);
        this.events.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
      },
      error: (err: HttpErrorResponse) => {
        this.actingId.set(null);
        this.actionError.set(
          err.status === 409
            ? 'Ação não permitida no estado atual do evento.'
            : 'Não foi possível concluir a ação.',
        );
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: MyEventsFilters = { page: this.page(), size: PAGE_SIZE, sort: 'eventDate,desc' };
    this.organizer.listMine(filters).subscribe({
      next: (res) => {
        this.events.set(res.content);
        this.totalPages.set(res.page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar seus eventos.');
        this.loading.set(false);
      },
    });
  }
}
