import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CheckoutResponse,
  CreateOrderRequest,
  Order,
} from '../../shared/models/order.model';

/**
 * Pedidos e checkout. Endpoints autenticados — o Bearer é anexado pelo
 * authInterceptor. RxJS restrito à camada HTTP.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;

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
}
