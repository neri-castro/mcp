import { AxiosResponse } from 'axios';
import { PaginationMetaDTO } from '../dto/common/CommonDTOs.js';

export function extractPagination(response: AxiosResponse): PaginationMetaDTO {
  return {
    count: parseInt(response.headers['x-pagination-count'] ?? '0', 10),
    current: parseInt(response.headers['x-pagination-current'] ?? '1', 10),
    next: response.headers['x-pagination-next'] ?? null,
    prev: response.headers['x-pagination-prev'] ?? null,
  };
}

export function buildPageParams(page: number, pageSize: number): Record<string, unknown> {
  return { page, page_size: pageSize };
}
