import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Event,
  EventRequest,
  TicketBatch,
  TicketBatchRequest,
} from '../../features/event-catalog/models/event.model';
import { Ticket } from '../../shared/models/order.model';
import { PagedModel } from '../../shared/models/paged-model';

/** Filtros de paginação para GET /events/mine. */
export interface MyEventsFilters {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Operações de organizador (criar/gerir eventos e lotes). Endpoints
 * `ORGANIZER`/`ADMIN`; o Bearer é anexado pelo authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class OrganizerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  /** GET /events/mine — eventos do organizador, em qualquer status. */
  listMine(filters: MyEventsFilters = {}): Observable<PagedModel<Event>> {
    let params = new HttpParams();
    if (filters.page != null) params = params.set('page', filters.page);
    if (filters.size != null) params = params.set('size', filters.size);
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<PagedModel<Event>>(`${this.baseUrl}/mine`, { params });
  }

  /** POST /events — cria um evento (DRAFT). */
  create(request: EventRequest): Observable<Event> {
    return this.http.post<Event>(this.baseUrl, request);
  }

  /** PUT /events/{id} — atualiza um evento (não permitido se CANCELLED). */
  update(id: string, request: EventRequest): Observable<Event> {
    return this.http.put<Event>(`${this.baseUrl}/${id}`, request);
  }

  /** POST /events/{id}/publish — DRAFT -> PUBLISHED. */
  publish(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/publish`, {});
  }

  /** POST /events/{id}/cancel — encerra novas vendas. */
  cancel(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/cancel`, {});
  }

  /** POST /events/{eventId}/ticket-batches — cria um lote de ingressos. */
  createBatch(eventId: string, request: TicketBatchRequest): Observable<TicketBatch> {
    return this.http.post<TicketBatch>(`${this.baseUrl}/${eventId}/ticket-batches`, request);
  }

  /** POST /tickets/{codeHash}/validate — check-in na portaria (marca como USED). */
  validateTicket(codeHash: string): Observable<Ticket> {
    return this.http.post<Ticket>(
      `${environment.apiBaseUrl}/tickets/${encodeURIComponent(codeHash)}/validate`,
      {},
    );
  }
}
