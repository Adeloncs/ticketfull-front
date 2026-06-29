import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedModel } from '../../../shared/models/paged-model';
import { Event, EventFilters, TicketBatch } from '../models/event.model';

/**
 * Acesso aos endpoints públicos de eventos.
 * RxJS fica restrito a este service (camada HTTP); o estado é gerenciado
 * com Signals nos componentes que o consomem.
 */
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  /** GET /events — paginado, com filtros opcionais. */
  getEvents(filters: EventFilters = {}): Observable<PagedModel<Event>> {
    let params = new HttpParams();
    if (filters.location) params = params.set('location', filters.location);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.page != null) params = params.set('page', filters.page);
    if (filters.size != null) params = params.set('size', filters.size);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<PagedModel<Event>>(this.baseUrl, { params });
  }

  /** GET /events/{id} */
  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.baseUrl}/${id}`);
  }

  /** GET /events/{eventId}/ticket-batches */
  getTicketBatches(eventId: string): Observable<TicketBatch[]> {
    return this.http.get<TicketBatch[]>(`${this.baseUrl}/${eventId}/ticket-batches`);
  }
}
