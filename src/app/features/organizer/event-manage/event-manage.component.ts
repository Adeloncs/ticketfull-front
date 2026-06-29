import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { OrganizerService } from '../../../core/services/organizer.service';
import { EventStatusBadgeComponent } from '../../../shared/components/event-status-badge/event-status-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Event, TicketBatch, TicketBatchRequest } from '../../event-catalog/models/event.model';
import { EventService } from '../../event-catalog/services/event.service';

/** Gerenciamento de um evento do organizador: status, ações e lotes. */
@Component({
  selector: 'app-event-manage',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    EventStatusBadgeComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl px-4 py-8">
      <a routerLink="/organizer/events" class="text-sm text-brand hover:underline">&larr; Meus eventos</a>

      @if (loading()) {
        <app-spinner label="Carregando evento..." />
      } @else if (error()) {
        <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {{ error() }}
        </div>
      } @else if (event()) {
        @if (event(); as ev) {
        <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ ev.title }}</h1>
              <p class="mt-1 text-sm text-gray-500">
                🗓️ {{ ev.eventDate | date: 'dd/MM/yyyy HH:mm' }} · 📍 {{ ev.location }}
              </p>
            </div>
            <app-event-status-badge [status]="ev.status" />
          </div>

          <div class="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            @if (ev.status !== 'CANCELLED') {
              <a
                [routerLink]="['/organizer/events', ev.id, 'edit']"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Editar
              </a>
            }
            @if (ev.status === 'DRAFT') {
              <button
                (click)="publish()"
                [disabled]="acting()"
                class="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                Publicar
              </button>
            }
            @if (ev.status !== 'CANCELLED') {
              <button
                (click)="cancel()"
                [disabled]="acting()"
                class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                Cancelar evento
              </button>
            }
          </div>
          @if (actionError()) {
            <p class="mt-3 text-sm text-red-600">{{ actionError() }}</p>
          }
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900">Lotes de ingressos</h2>
        @if (batches().length === 0) {
          <p class="mt-2 text-gray-500">Nenhum lote cadastrado.</p>
        } @else {
          <ul class="mt-3 space-y-2">
            @for (batch of batches(); track batch.id) {
              <li class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p class="font-medium text-gray-900">{{ batch.name }}</p>
                  <p class="text-sm text-gray-500">
                    {{ batch.availableSeats }} / {{ batch.totalCapacity }} disponíveis
                  </p>
                </div>
                <span class="font-semibold text-gray-900">{{ batch.price | currency: 'BRL' }}</span>
              </li>
            }
          </ul>
        }

        @if (ev.status !== 'CANCELLED') {
          <form
            [formGroup]="batchForm"
            (ngSubmit)="addBatch()"
            class="mt-4 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <p class="font-medium text-gray-900">Novo lote</p>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="sm:col-span-3">
                <label class="mb-1 block text-sm text-gray-700" for="name">Nome</label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-gray-700" for="price">Preço (R$)</label>
                <input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  formControlName="price"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-gray-700" for="capacity">Capacidade</label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  formControlName="totalCapacity"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div class="flex items-end">
                <button
                  type="submit"
                  [disabled]="savingBatch() || batchForm.invalid"
                  class="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {{ savingBatch() ? 'Adicionando...' : 'Adicionar' }}
                </button>
              </div>
            </div>
            @if (batchError()) {
              <p class="mt-2 text-sm text-red-600">{{ batchError() }}</p>
            }
          </form>
        }
        }
      }
    </section>
  `,
})
export class EventManageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizer = inject(OrganizerService);
  private readonly eventService = inject(EventService);

  /** :id da rota. */
  readonly id = input.required<string>();

  readonly event = signal<Event | null>(null);
  readonly batches = signal<TicketBatch[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly acting = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly savingBatch = signal(false);
  readonly batchError = signal<string | null>(null);

  readonly batchForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    totalCapacity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      event: this.eventService.getEventById(this.id()),
      batches: this.eventService.getTicketBatches(this.id()),
    }).subscribe({
      next: ({ event, batches }) => {
        this.event.set(event);
        this.batches.set(batches);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o evento.');
        this.loading.set(false);
      },
    });
  }

  publish(): void {
    this.runAction(() => this.organizer.publish(this.id()));
  }

  cancel(): void {
    this.runAction(() => this.organizer.cancel(this.id()));
  }

  private runAction(action: () => ReturnType<OrganizerService['publish']>): void {
    this.acting.set(true);
    this.actionError.set(null);
    action().subscribe({
      next: (event) => {
        this.acting.set(false);
        this.event.set(event);
      },
      error: (err: HttpErrorResponse) => {
        this.acting.set(false);
        this.actionError.set(
          err.status === 409
            ? 'Ação não permitida no estado atual do evento.'
            : 'Não foi possível concluir a ação.',
        );
      },
    });
  }

  addBatch(): void {
    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      return;
    }

    const payload = this.batchForm.getRawValue() as TicketBatchRequest;
    this.savingBatch.set(true);
    this.batchError.set(null);

    this.organizer.createBatch(this.id(), payload).subscribe({
      next: (batch) => {
        this.savingBatch.set(false);
        this.batches.update((list) => [...list, batch]);
        this.batchForm.reset({ name: '', price: 0, totalCapacity: 1 });
      },
      error: (err: HttpErrorResponse) => {
        this.savingBatch.set(false);
        this.batchError.set(
          err.status === 400
            ? 'Verifique os valores (preço e capacidade devem ser positivos).'
            : 'Não foi possível criar o lote.',
        );
      },
    });
  }
}
