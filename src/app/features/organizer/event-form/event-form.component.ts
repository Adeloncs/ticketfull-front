import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { OrganizerService } from '../../../core/services/organizer.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { EventRequest } from '../../event-catalog/models/event.model';
import { EventService } from '../../event-catalog/services/event.service';

/** Formulário de criação/edição de evento (organizador). */
@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-xl px-4 py-8">
      <a routerLink="/organizer/events" class="text-sm text-brand hover:underline">&larr; Meus eventos</a>
      <h1 class="mt-3 text-2xl font-bold text-gray-900">{{ isEdit() ? 'Editar evento' : 'Novo evento' }}</h1>

      @if (loading()) {
        <app-spinner label="Carregando..." />
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
          <div>
            <label for="title" class="mb-1 block text-sm font-medium text-gray-700">Título</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            @if (invalid('title')) {
              <p class="mt-1 text-xs text-red-600">O título é obrigatório.</p>
            }
          </div>

          <div>
            <label for="description" class="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="description"
              rows="4"
              formControlName="description"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            ></textarea>
          </div>

          <div>
            <label for="eventDate" class="mb-1 block text-sm font-medium text-gray-700">Data e hora</label>
            <input
              id="eventDate"
              type="datetime-local"
              formControlName="eventDate"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            @if (invalid('eventDate')) {
              <p class="mt-1 text-xs text-red-600">Informe uma data futura.</p>
            }
          </div>

          <div>
            <label for="location" class="mb-1 block text-sm font-medium text-gray-700">Local</label>
            <input
              id="location"
              type="text"
              formControlName="location"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            @if (invalid('location')) {
              <p class="mt-1 text-xs text-red-600">O local é obrigatório.</p>
            }
          </div>

          @if (error()) {
            <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-brand px-5 py-2 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {{ saving() ? 'Salvando...' : isEdit() ? 'Salvar alterações' : 'Criar evento' }}
            </button>
            <a
              routerLink="/organizer/events"
              class="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </a>
          </div>
        </form>
      }
    </section>
  `,
})
export class EventFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizer = inject(OrganizerService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  /** :id da rota (ausente no modo criação). */
  readonly id = input<string>();
  readonly isEdit = computed(() => !!this.id());

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: [''],
    eventDate: ['', [Validators.required]],
    location: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) this.loadEvent(id);
  }

  invalid(control: 'title' | 'eventDate' | 'location'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.dirty || c.touched);
  }

  private loadEvent(id: string): void {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.form.patchValue({
          title: event.title,
          description: event.description,
          eventDate: this.toLocalInput(event.eventDate),
          location: event.location,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o evento.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: EventRequest = {
      title: raw.title,
      description: raw.description,
      eventDate: new Date(raw.eventDate).toISOString(),
      location: raw.location,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.id();
    const request$ = id ? this.organizer.update(id, payload) : this.organizer.create(payload);

    request$.subscribe({
      next: (event) => {
        this.saving.set(false);
        this.router.navigate(['/organizer/events', event.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(
          err.status === 400
            ? 'Verifique os campos (a data deve estar no futuro).'
            : err.status === 409
              ? 'Evento cancelado não pode ser alterado.'
              : 'Não foi possível salvar o evento.',
        );
      },
    });
  }

  /** ISO-8601 (UTC) -> valor do input datetime-local (hora local, sem timezone). */
  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
