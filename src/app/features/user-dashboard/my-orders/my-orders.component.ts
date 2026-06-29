import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OrderService } from '../../../core/services/order.service';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Order } from '../../../shared/models/order.model';

const PAGE_SIZE = 10;

/** "Meus pedidos": listagem paginada com cancelar/estornar e ingressos. */
@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, OrderStatusBadgeComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900">Meus pedidos</h1>

      @if (loading()) {
        <app-spinner label="Carregando pedidos..." />
      } @else if (error()) {
        <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{{ error() }}</p>
          <button class="mt-3 font-medium underline" (click)="reload()">Tentar novamente</button>
        </div>
      } @else if (orders().length === 0) {
        <div class="mt-6 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          Você ainda não fez nenhum pedido.
          <a routerLink="/events" class="font-medium text-brand hover:underline">Ver eventos</a>.
        </div>
      } @else {
        <ul class="mt-6 space-y-4">
          @for (order of orders(); track order.id) {
            <li class="rounded-2xl border border-gray-200 bg-white p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-mono text-xs text-gray-500">{{ order.id }}</p>
                  <p class="mt-1 text-sm text-gray-600">
                    {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }} ·
                    {{ order.tickets.length }} ingresso(s)
                  </p>
                </div>
                <app-order-status-badge [status]="order.status" />
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <span class="text-lg font-bold text-gray-900">
                  {{ order.totalAmount | currency: 'BRL' }}
                </span>

                <div class="flex items-center gap-2">
                  @if (order.status === 'PENDING') {
                    <a
                      [routerLink]="['/checkout', order.id]"
                      class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
                    >
                      Pagar
                    </a>
                    <button
                      (click)="cancel(order)"
                      [disabled]="actingId() === order.id"
                      class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  } @else if (order.status === 'PAID') {
                    <button
                      (click)="refund(order)"
                      [disabled]="actingId() === order.id"
                      class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Estornar
                    </button>
                  }
                </div>
              </div>

              @if (order.tickets.length > 0) {
                <ul class="mt-4 space-y-2">
                  @for (ticket of order.tickets; track ticket.id) {
                    <li class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm">
                      <span class="font-mono text-gray-500">{{ ticket.codeHash.slice(0, 16) }}…</span>
                      <span class="font-medium text-gray-700">{{ ticket.status }}</span>
                    </li>
                  }
                </ul>
              }
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
export class MyOrdersComponent {
  private readonly orderService = inject(OrderService);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  /** Pedido com ação (cancelar/estornar) em andamento. */
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

  cancel(order: Order): void {
    this.runAction(order.id, () => this.orderService.cancel(order.id));
  }

  refund(order: Order): void {
    this.runAction(order.id, () => this.orderService.refund(order.id));
  }

  private runAction(id: string, action: () => ReturnType<OrderService['cancel']>): void {
    this.actingId.set(id);
    action().subscribe({
      next: (updated) => {
        this.actingId.set(null);
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      },
      error: () => {
        this.actingId.set(null);
        this.error.set('Não foi possível concluir a ação. Atualize e tente novamente.');
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService
      .list({ page: this.page(), size: PAGE_SIZE, sort: 'createdAt,desc' })
      .subscribe({
        next: (res) => {
          this.orders.set(res.content);
          this.totalPages.set(res.page.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Não foi possível carregar seus pedidos.');
          this.loading.set(false);
        },
      });
  }
}
