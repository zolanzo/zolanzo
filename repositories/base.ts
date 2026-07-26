/**
 * Repository layer placeholder.
 * Encapsulates Prisma / Supabase data access behind typed interfaces.
 */

export type RepositoryOptions = {
  includeDeleted?: boolean;
};

export abstract class BaseRepository {
  protected readonly options: RepositoryOptions;

  constructor(options: RepositoryOptions = {}) {
    this.options = options;
  }
}
