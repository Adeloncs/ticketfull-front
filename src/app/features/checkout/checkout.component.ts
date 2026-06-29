import { CurrencyPipe, LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { switchMap, takeWhile, timer } from 'rxjs';

import { OrderService } from '../../core/services/order.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { EventService } from '../event-catalog/services/event.service';
import { Order, OrderStatus } from '../../shared/models/order.model';

/** Página de checkout de um pedido (reserva -> pagamento). */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LowerCasePipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl px-4 py-8">
      <a routerLink="/events" class="text-sm text-brand hover:underline">&larr; Continuar comprando</a>
      <h1 class="mt-3 text-2xl font-bold text-gray-900">Checkout</h1>

      @if (loading()) {
        <app-spinner label="Carregando pedido..." />
      } @else if (error()) {
        <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {{ error() }}
        </div>
      } @else if (order()) {
        @if (order(); as ord) {
        <div class="mt-6 space-y-6 rounded-2xl border border-gray-200 bg-white p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-gray-500">Pedido</p>
              <p class="font-mono text-sm text-gray-700">{{ ord.id }}</p>
              @if (eventTitle()) {
                <p class="mt-2 font-semibold text-gray-900">{{ eventTitle() }}</p>
              }
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="badgeClass(ord.status)">
              {{ statusLabel(ord.status) }}
            </span>
          </div>

          <div class="flex items-center justify-between border-t border-gray-100 pt-4">
            <span class="text-gray-600">{{ ord.tickets.length }} ingresso(s)</span>
            <span class="text-lg font-bold text-gray-900">{{ ord.totalAmount | currency: 'BRL' }}</span>
          </div>

          @if (ord.status === 'PENDING') {
            @if (remainingMs() > 0) {
              <div class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Reserva válida por <strong>{{ countdown() }}</strong>. Conclua o pagamento antes que expire.
              </div>

              <div class="flex flex-col gap-3 sm:flex-row">
                <button
                  (click)="pay()"
                  [disabled]="paying()"
                  class="flex-1 rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {{ paying() ? 'Processando...' : 'Pagar agora' }}
                </button>
                <button
                  (click)="cancel()"
                  [disabled]="cancelling()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {{ cancelling() ? 'Cancelando...' : 'Cancelar' }}
                </button>
              </div>

              @if (paymentInitiated()) {
                <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Pagamento iniciado. Aguardando confirmação do provedor...
                  <button (click)="refresh()" class="ml-1 font-medium underline">Atualizar</button>
                </div>
              }
            } @else {
              <div class="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
                A reserva expirou. <a routerLink="/events" class="font-medium text-brand">Escolher outro lote</a>.
              </div>
            }
          } @else if (ord.status === 'PAID') {
            <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Pagamento confirmado! Seus ingressos estão garantidos.
            </div>
            <ul class="space-y-2">
              @for (ticket of ord.tickets; track ticket.id) {
                <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm">
                  <span class="font-mono text-gray-500">{{ ticket.codeHash.slice(0, 12) }}…</span>
                  <span class="font-medium text-gray-700">{{ ticket.status }}</span>
                </li>
              }
            </ul>
          } @else {
            <div class="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
              Este pedido está {{ statusLabel(ord.status) | lowercase }}.
            </div>
          }
        </div>
        }
      }
    </section>
  `,
})
export class CheckoutComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parâmetro de rota :orderId (withComponentInputBinding). */
  readonly orderId = input.required<string>();

  readonly order = signal<Order | null>(null);
  readonly eventTitle = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly paying = signal(false);
  readonly cancelling = signal(false);
  readonly paymentInitiated = signal(false);

  /** Relógio para a contagem regressiva da reserva. */
  private readonly now = signal(Date.now());
  readonly remainingMs = computed(() => {
    const expiresAt = this.order()?.expiresAt;
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - this.now());
  });
  readonly countdown = computed(() => {
    const total = Math.floor(this.remainingMs() / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.load();
    // Tick de 1s para a contagem regressiva.
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.getById(this.orderId()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
        this.loadEventTitle(order.eventId);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 404
            ? 'Pedido não encontrado.'
            : 'Não foi possível carregar o pedido.',
        );
        this.loading.set(false);
      },
    });
  }

  private loadEventTitle(eventId: string): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => this.eventTitle.set(event.title),
      error: () => undefined,
    });
  }

  pay(): void {
    this.paying.set(true);
    this.orderService.checkout(this.orderId()).subscribe({
      next: () => {
        this.paying.set(false);
        this.paymentInitiated.set(true);
        this.pollStatus();
      },
      error: () => {
        this.paying.set(false);
        this.error.set('Não foi possível iniciar o pagamento. Tente novamente.');
      },
    });
  }

  cancel(): void {
    this.cancelling.set(true);
    this.orderService.cancel(this.orderId()).subscribe({
      next: (order) => {
        this.cancelling.set(false);
        this.order.set(order);
      },
      error: () => {
        this.cancelling.set(false);
        this.error.set('Não foi possível cancelar o pedido.');
      },
    });
  }

  refresh(): void {
    this.orderService.getById(this.orderId()).subscribe({
      next: (order) => this.order.set(order),
      error: () => undefined,
    });
  }

  /**
   * Após iniciar o pagamento, o pedido permanece PENDING até o webhook do gateway
   * confirmar (PAID). Aqui apenas consultamos o status periodicamente.
   */
  private pollStatus(): void {
    timer(3000, 4000)
      .pipe(
        switchMap(() => this.orderService.getById(this.orderId())),
        // Mantém o poll enquanto PENDING; emite a transição final (PAID/etc.) e para.
        takeWhile((order) => order.status === 'PENDING', true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (order) => this.order.set(order), error: () => undefined });
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Aguardando pagamento',
      PAID: 'Pago',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
      REFUNDED: 'Estornado',
    };
    return labels[status];
  }

  badgeClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      PENDING: 'bg-amber-100 text-amber-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-200 text-gray-700',
      EXPIRED: 'bg-gray-200 text-gray-700',
      REFUNDED: 'bg-purple-100 text-purple-800',
    };
    return classes[status];
  }
}
