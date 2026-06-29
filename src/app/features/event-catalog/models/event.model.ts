/**
 * Modelos do domínio de Eventos.
 * Alinhados ao contrato público da API (GET /events, GET /events/{id}).
 */

/** Status de um evento no backend. Apenas PUBLISHED aparece na busca pública. */
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface Event {
  id: string;
  title: string;
  description: string;
  /** ISO-8601 (ex.: "2026-09-10T19:30:00Z") */
  eventDate: string;
  location: string;
  status: EventStatus;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketBatch {
  id: string;
  eventId: string;
  name: string;
  price: number;
  totalCapacity: number;
  availableSeats: number;
  /** Janela de vendas opcional (ISO-8601). Nula = sem restrição. */
  salesStartAt?: string | null;
  salesEndAt?: string | null;
}

/** Payload de criação/atualização de evento (POST /events, PUT /events/{id}). */
export interface EventRequest {
  title: string;
  description: string;
  /** ISO-8601, deve estar no futuro. */
  eventDate: string;
  location: string;
}

/** Payload de criação de lote (POST /events/{eventId}/ticket-batches). */
export interface TicketBatchRequest {
  name: string;
  price: number;
  totalCapacity: number;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
}

/** Filtros aceitos por GET /events. */
export interface EventFilters {
  location?: string;
  /** ISO-8601 */
  from?: string;
  /** ISO-8601 */
  to?: string;
  page?: number;
  size?: number;
  /** ex.: "eventDate,asc" */
  sort?: string;
}
