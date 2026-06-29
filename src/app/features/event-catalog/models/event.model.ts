/**
 * Modelos do domínio de Eventos.
 * Alinhados ao contrato público da API (GET /events, GET /events/{id}).
 */

export interface Event {
  id: string;
  title: string;
  description: string;
  /** ISO-8601 (ex.: "2026-09-10T19:30:00Z") */
  eventDate: string;
  location: string;
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
