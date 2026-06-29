import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedModel } from '../../shared/models/paged-model';
import {
  CheckoutResponse,
  CreateOrderRequest,
  Order,
} from '../../shared/models/order.model';

/** Filtros de paginação para GET /orders. */
export interface OrderListFilters {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Pedidos e checkout. Endpoints autenticados — o Bearer é anexado pelo
 * authInterceptor. RxJS restrito à camada HTTP.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;

  /** GET /orders — lista paginada dos pedidos do cliente autenticado. */
  list(filters: OrderListFilters = {}): Observable<PagedModel<Order>> {
    let params = new HttpParams();
    if (filters.page != null) params = params.set('page', filters.page);
    if (filters.size != null) params = params.set('size', filters.size);
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<PagedModel<Order>>(this.baseUrl, { params });
  }

  /** POST /orders — cria a reserva (assentos retidos até expiresAt). */
  create(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request);
  }

  /** GET /orders/{id} — busca um pedido do cliente autenticado. */
  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  /** POST /orders/{id}/checkout — inicia o pagamento (cria PaymentIntent). */
  checkout(id: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/${id}/checkout`, {});
  }

  /** POST /orders/{id}/cancel — cancela a reserva (PENDING -> CANCELLED). */
  cancel(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/cancel`, {});
  }

  /** POST /orders/{id}/refund — estorna um pedido pago (PAID -> REFUNDED). */
  refund(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/refund`, {});
  }
}
