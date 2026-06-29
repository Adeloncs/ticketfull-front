import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OrganizerService } from '../../../core/services/organizer.service';

type CheckinOutcome = 'ok' | 'used' | 'not_found' | 'forbidden' | 'error';

interface CheckinEntry {
  codeHash: string;
  outcome: CheckinOutcome;
  message: string;
  at: number;
}

/** Check-in na portaria: valida ingressos pelo código (codeHash). */
@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-xl px-4 py-8">
      <a routerLink="/organizer/events" class="text-sm text-brand hover:underline">&larr; Meus eventos</a>
      <h1 class="mt-3 text-2xl font-bold text-gray-900">Check-in de ingressos</h1>
      <p class="mt-1 text-sm text-gray-500">
        Informe o código do ingresso para validar a entrada. Cada ingresso só pode ser validado uma vez.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 flex gap-2">
        <input
          type="text"
          formControlName="codeHash"
          placeholder="Código do ingresso (codeHash)"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          [disabled]="validating() || form.invalid"
          class="rounded-lg bg-brand px-5 py-2 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {{ validating() ? 'Validando...' : 'Validar' }}
        </button>
      </form>

      @if (last(); as result) {
        <div class="mt-6 rounded-xl border p-4" [class]="cardClass(result.outcome)">
          <p class="font-semibold">{{ result.message }}</p>
          <p class="mt-1 break-all font-mono text-xs opacity-80">{{ result.codeHash }}</p>
        </div>
      }

      @if (history().length > 0) {
        <h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Validações recentes
        </h2>
        <ul class="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          @for (entry of history(); track entry.at) {
            <li class="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <span class="truncate font-mono text-gray-500">{{ entry.codeHash.slice(0, 18) }}…</span>
              <span class="shrink-0 font-medium" [class]="textClass(entry.outcome)">
                {{ entry.message }}
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class CheckinComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organizer = inject(OrganizerService);

  readonly validating = signal(false);
  readonly last = signal<CheckinEntry | null>(null);
  readonly history = signal<CheckinEntry[]>([]);

  readonly form = this.fb.nonNullable.group({
    codeHash: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const codeHash = this.form.controls.codeHash.value.trim();
    if (!codeHash) return;

    this.validating.set(true);
    this.organizer.validateTicket(codeHash).subscribe({
      next: () => {
        this.validating.set(false);
        this.record(codeHash, 'ok', '✓ Entrada liberada');
        this.form.reset({ codeHash: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.validating.set(false);
        const { outcome, message } = this.mapError(err);
        this.record(codeHash, outcome, message);
      },
    });
  }

  private mapError(err: HttpErrorResponse): { outcome: CheckinOutcome; message: string } {
    switch (err.status) {
      case 409:
        return { outcome: 'used', message: '✗ Ingresso já utilizado' };
      case 404:
        return { outcome: 'not_found', message: '✗ Ingresso não encontrado' };
      case 403:
        return { outcome: 'forbidden', message: '✗ Você não é o organizador deste evento' };
      default:
        return { outcome: 'error', message: '✗ Não foi possível validar. Tente novamente.' };
    }
  }

  private record(codeHash: string, outcome: CheckinOutcome, message: string): void {
    const entry: CheckinEntry = { codeHash, outcome, message, at: Date.now() };
    this.last.set(entry);
    this.history.update((list) => [entry, ...list].slice(0, 20));
  }

  cardClass(outcome: CheckinOutcome): string {
    return outcome === 'ok'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-700';
  }

  textClass(outcome: CheckinOutcome): string {
    return outcome === 'ok' ? 'text-green-700' : 'text-red-600';
  }
}
