/**
 * Estrutura de paginação retornada pelo Spring Data (PagedModel).
 * Usada por GET /events e GET /orders.
 */
export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedModel<T> {
  content: T[];
  page: PageMeta;
}
