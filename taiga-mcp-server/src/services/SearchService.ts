import { SearchRepository } from '../repositories/SearchRepository.js';

export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async search(projectId: number, query: string): Promise<unknown> {
    return this.repo.search(projectId, query);
  }
}
