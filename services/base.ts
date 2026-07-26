/**
 * Service layer placeholder.
 * Business logic lives here; repositories handle data access.
 */

export type ServiceContext = {
  /** @deprecated Prefer correlationId from RequestContext ALS */
  requestId?: string;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
};

export abstract class BaseService {
  protected readonly context: ServiceContext;

  constructor(context: ServiceContext = {}) {
    this.context = context;
  }
}
