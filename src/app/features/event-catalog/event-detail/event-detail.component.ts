import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Event, TicketBatch } from '../models/event.model';
import { EventService } from '../services/event.service';

/** Detalhe de um evento e seus lotes de ingressos disponíveis. */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-8">
      <a routerLink="/events" class="text-sm text-brand hover:underline">&larr; Voltar ao catálogo</a>

      @if (loading()) {
        <app-spinner label="Carregando evento..." />
      } @else if (error()) {
        <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {{ error() }}
        </div>
      } @else if (event()) {
        @if (event(); as ev) {
        <div class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div
            class="flex h-44 items-center justify-center bg-gradient-to-br from-brand to-brand-dark text-5xl font-bold text-white"
          >
            {{ ev.title.charAt(0) }}
          </div>
          <div class="space-y-4 p-6">
            <h1 class="text-2xl font-bold text-gray-900">{{ ev.title }}</h1>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>🗓️ {{ ev.eventDate | date: 'EEEE, dd/MM/yyyy HH:mm' }}</span>
              <span>📍 {{ ev.location }}</span>
            </div>
            <p class="whitespace-pre-line text-gray-700">{{ ev.description }}</p>
          </div>
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900">Ingressos</h2>
        @if (batches().length === 0) {
          <p class="mt-2 text-gray-500">Nenhum lote disponível no momento.</p>
        } @else {
          <ul class="mt-3 space-y-3">
            @for (batch of batches(); track batch.id) {
              <li
                class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p class="font-medium text-gray-900">{{ batch.name }}</p>
                  <p class="text-sm text-gray-500">
                    @if (batch.availableSeats > 0) {
                      {{ batch.availableSeats }} disponíveis
                    } @else {
                      Esgotado
                    }
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <span class="font-semibold text-gray-900">
                    {{ batch.price | currency: 'BRL' }}
                  </span>
                  <button
                    class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                    [disabled]="batch.availableSeats === 0"
                  >
                    Comprar
                  </button>
                </div>
              </li>
            }
          </ul>
        }
        }
      }
    </section>
  `,
})
export class EventDetailComponent implements OnInit {
  private readonly eventService = inject(EventService);

  /** Vinculado ao parâmetro de rota :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly event = signal<Event | null>(null);
  readonly batches = signal<TicketBatch[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Os inputs vinculados pelo roteador já estão disponíveis aqui.
    this.fetch(this.id());
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      event: this.eventService.getEventById(id),
      batches: this.eventService.getTicketBatches(id),
    }).subscribe({
      next: ({ event, batches }) => {
        this.event.set(event);
        this.batches.set(batches);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar este evento.');
        this.loading.set(false);
      },
    });
  }
}
