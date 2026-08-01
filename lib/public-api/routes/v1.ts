/**
 * Public API v1 route registry — source of truth for handlers + OpenAPI.
 */

import { issueClientCredentialsToken } from "@/lib/public-api/auth/oauth";
import { PublicCatalogService } from "@/lib/public-api/services/catalog";
import { requireScopes } from "@/lib/public-api/scopes";
import { PublicApiError } from "@/lib/public-api/errors";
import type { PublicApiScope, PublicPrincipal } from "@/lib/public-api/types";
import { isPublicApiV1Enabled } from "@/lib/public-api/config";

export type RouteContext = {
  principal: PublicPrincipal;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  requestId: string;
};

export type RouteDefinition = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  operationId: string;
  tags: string[];
  summary: string;
  scopes: PublicApiScope[];
  mutating?: boolean;
  /** Skip auth for token endpoint / openapi */
  public?: boolean;
  handler: (ctx: RouteContext) => Promise<unknown> | unknown;
};

function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean);
  const ap = path.split("/").filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const p = pp[i]!;
    const a = ap[i]!;
    if (p.startsWith("{") && p.endsWith("}")) {
      params[p.slice(1, -1)] = decodeURIComponent(a);
    } else if (p !== a) {
      return null;
    }
  }
  return params;
}

export const V1_ROUTES: RouteDefinition[] = [
  {
    method: "GET",
    path: "/me",
    operationId: "getMe",
    tags: ["Identity"],
    summary: "Current principal profile",
    scopes: ["profile.read"],
    handler: (ctx) => PublicCatalogService.profile(ctx.principal),
  },
  {
    method: "POST",
    path: "/oauth/token",
    operationId: "createOAuthToken",
    tags: ["Identity"],
    summary: "OAuth 2.1 client credentials token",
    scopes: [],
    public: true,
    mutating: true,
    handler: (ctx) => {
      const body = (ctx.body ?? {}) as {
        grant_type?: string;
        client_id?: string;
        client_secret?: string;
        scope?: string;
      };
      if (body.grant_type !== "client_credentials") {
        throw new PublicApiError(
          "VALIDATION_ERROR",
          "grant_type must be client_credentials",
          400,
        );
      }
      const token = issueClientCredentialsToken({
        clientId: body.client_id ?? "",
        clientSecret: body.client_secret ?? "",
        scope: body.scope,
      });
      if (!token) {
        throw new PublicApiError("UNAUTHORIZED", "Invalid client credentials", 401);
      }
      return {
        access_token: token.accessToken,
        token_type: token.tokenType,
        expires_in: token.expiresIn,
      };
    },
  },
  {
    method: "GET",
    path: "/organizations",
    operationId: "listOrganizations",
    tags: ["Organizations"],
    summary: "List organizations",
    scopes: ["organizations.read"],
    handler: (ctx) =>
      PublicCatalogService.listOrganizations(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
      ),
  },
  {
    method: "GET",
    path: "/organizations/{id}",
    operationId: "getOrganization",
    tags: ["Organizations"],
    summary: "Get organization by public id",
    scopes: ["organizations.read"],
    handler: (ctx) => PublicCatalogService.getOrganization(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/workers",
    operationId: "listWorkers",
    tags: ["Workers"],
    summary: "List / search workers",
    scopes: ["workers.read"],
    handler: (ctx) =>
      PublicCatalogService.listWorkers(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
        ctx.query.get("q") ?? undefined,
      ),
  },
  {
    method: "GET",
    path: "/workers/{id}",
    operationId: "getWorker",
    tags: ["Workers"],
    summary: "Get worker by public id",
    scopes: ["workers.read"],
    handler: (ctx) => PublicCatalogService.getWorker(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/campaigns",
    operationId: "listCampaigns",
    tags: ["Campaigns"],
    summary: "List / search campaigns",
    scopes: ["campaigns.read"],
    handler: (ctx) =>
      PublicCatalogService.listCampaigns(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
        ctx.query.get("q") ?? undefined,
      ),
  },
  {
    method: "GET",
    path: "/campaigns/{id}",
    operationId: "getCampaign",
    tags: ["Campaigns"],
    summary: "Get campaign by public id",
    scopes: ["campaigns.read"],
    handler: (ctx) => PublicCatalogService.getCampaign(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/assignments",
    operationId: "listAssignments",
    tags: ["Assignments"],
    summary: "List assignments",
    scopes: ["assignments.read"],
    handler: (ctx) =>
      PublicCatalogService.listAssignments(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
      ),
  },
  {
    method: "GET",
    path: "/assignments/{id}",
    operationId: "getAssignment",
    tags: ["Assignments"],
    summary: "Get assignment status",
    scopes: ["assignments.read"],
    handler: (ctx) => PublicCatalogService.getAssignment(ctx.params.id!),
  },
  {
    method: "POST",
    path: "/assignments/{id}/claim",
    operationId: "claimAssignment",
    tags: ["Assignments"],
    summary: "Claim an available assignment",
    scopes: ["assignments.claim"],
    mutating: true,
    handler: (ctx) => {
      const workerId =
        ((ctx.body as { workerId?: string } | null)?.workerId) ??
        ctx.principal.userId ??
        "WRK-2026-000001";
      return PublicCatalogService.claimAssignment(ctx.params.id!, workerId);
    },
  },
  {
    method: "GET",
    path: "/reviews/{id}",
    operationId: "getReviewStatus",
    tags: ["Reviews"],
    summary: "Read review status only",
    scopes: ["reviews.read"],
    handler: (ctx) => PublicCatalogService.getReview(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/payments/{id}",
    operationId: "getPaymentStatus",
    tags: ["Payments"],
    summary: "Read payment / settlement status",
    scopes: ["payments.read"],
    handler: (ctx) => PublicCatalogService.getPayment(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/trust/profiles/{subjectId}",
    operationId: "getTrustProfile",
    tags: ["Trust"],
    summary: "Read-only trust profile",
    scopes: ["trust.read"],
    handler: (ctx) =>
      PublicCatalogService.getTrustProfile(ctx.params.subjectId!),
  },
  {
    method: "GET",
    path: "/trust/passports/{subjectId}",
    operationId: "getTrustPassport",
    tags: ["Trust"],
    summary: "Read-only trust passport",
    scopes: ["trust.read"],
    handler: (ctx) =>
      PublicCatalogService.getTrustPassport(ctx.params.subjectId!),
  },
  {
    method: "GET",
    path: "/analytics/snapshots",
    operationId: "listAnalyticsSnapshots",
    tags: ["Analytics"],
    summary: "List analytics snapshots (no raw events)",
    scopes: ["analytics.read"],
    handler: (ctx) =>
      PublicCatalogService.listAnalyticsSnapshots(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
      ),
  },
  {
    method: "GET",
    path: "/forecasts",
    operationId: "listForecasts",
    tags: ["Forecasts"],
    summary: "List advisory forecasts",
    scopes: ["forecast.read"],
    handler: () => ({ data: PublicCatalogService.listForecasts() }),
  },
  {
    method: "GET",
    path: "/forecasts/{type}",
    operationId: "getForecast",
    tags: ["Forecasts"],
    summary: "Get advisory forecast by type",
    scopes: ["forecast.read"],
    handler: (ctx) => PublicCatalogService.getForecast(ctx.params.type!),
  },
  {
    method: "GET",
    path: "/reports",
    operationId: "listReports",
    tags: ["Reports"],
    summary: "List reports",
    scopes: ["reports.read"],
    handler: (ctx) =>
      PublicCatalogService.listReports(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
      ),
  },
  {
    method: "POST",
    path: "/reports/generate",
    operationId: "generateReport",
    tags: ["Reports"],
    summary: "Generate a report",
    scopes: ["reports.generate"],
    mutating: true,
    handler: (ctx) => {
      const body = (ctx.body ?? {}) as { type?: string; format?: string };
      if (!body.type) {
        throw new PublicApiError("VALIDATION_ERROR", "type is required", 400);
      }
      return PublicCatalogService.generateReport({
        type: body.type,
        format: body.format,
      });
    },
  },
  {
    method: "GET",
    path: "/reports/{id}/download",
    operationId: "downloadReport",
    tags: ["Reports"],
    summary: "Download report metadata / link",
    scopes: ["reports.read"],
    handler: (ctx) => PublicCatalogService.getReportDownload(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/automation/rules",
    operationId: "listAutomationRules",
    tags: ["Automation"],
    summary: "List governed automation rules",
    scopes: ["automation.read"],
    handler: (ctx) =>
      PublicCatalogService.listAutomationRules(
        ctx.query.get("cursor"),
        Number(ctx.query.get("limit") ?? 20),
      ),
  },
  {
    method: "POST",
    path: "/automation/rules",
    operationId: "createAutomationDraft",
    tags: ["Automation"],
    summary: "Create automation draft (governance)",
    scopes: ["automation.write"],
    mutating: true,
    handler: (ctx) => {
      const body = (ctx.body ?? {}) as { name?: string; trigger?: string };
      if (!body.name || !body.trigger) {
        throw new PublicApiError(
          "VALIDATION_ERROR",
          "name and trigger are required",
          400,
        );
      }
      return PublicCatalogService.createAutomationDraft({
        name: body.name,
        trigger: body.trigger,
        actorId: ctx.principal.userId ?? ctx.principal.id,
      });
    },
  },
  {
    method: "POST",
    path: "/automation/rules/{id}/submit",
    operationId: "submitAutomationRule",
    tags: ["Automation"],
    summary: "Submit automation rule for approval",
    scopes: ["automation.write"],
    mutating: true,
    handler: (ctx) =>
      PublicCatalogService.submitAutomation(
        ctx.params.id!,
        ctx.principal.userId ?? ctx.principal.id,
      ),
  },
  {
    method: "POST",
    path: "/automation/rules/{id}/publish",
    operationId: "publishAutomationRule",
    tags: ["Automation"],
    summary: "Publish approved automation rule",
    scopes: ["automation.publish"],
    mutating: true,
    handler: (ctx) =>
      PublicCatalogService.publishAutomation(
        ctx.params.id!,
        ctx.principal.userId ?? ctx.principal.id,
      ),
  },
  {
    method: "POST",
    path: "/automation/rules/{id}/simulate",
    operationId: "simulateAutomationRule",
    tags: ["Automation"],
    summary: "Dry-run simulate automation rule",
    scopes: ["automation.write"],
    mutating: true,
    handler: (ctx) => PublicCatalogService.simulateAutomation(ctx.params.id!),
  },
  {
    method: "GET",
    path: "/webhooks",
    operationId: "listWebhookSubscriptions",
    tags: ["Webhooks"],
    summary: "List webhook subscriptions",
    scopes: ["webhooks.read"],
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const { paginateArray } = await import("@/lib/public-api/pagination");
      const rows = WebhookService.listSubscriptions(
        ctx.principal.organizationId ?? undefined,
      );
      return paginateArray(rows, {
        cursor: ctx.query.get("cursor"),
        limit: Number(ctx.query.get("limit") ?? 20),
      });
    },
  },
  {
    method: "POST",
    path: "/webhooks",
    operationId: "createWebhookSubscription",
    tags: ["Webhooks"],
    summary: "Create webhook subscription",
    scopes: ["webhooks.write"],
    mutating: true,
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const body = (ctx.body ?? {}) as {
        endpointUrl?: string;
        eventTypes?: string[];
        filters?: Record<string, string>;
        enabled?: boolean;
        organizationId?: string;
      };
      const orgId =
        body.organizationId ?? ctx.principal.organizationId ?? null;
      if (!orgId || !body.endpointUrl || !body.eventTypes?.length) {
        throw new PublicApiError(
          "VALIDATION_ERROR",
          "organizationId, endpointUrl, and eventTypes are required",
          400,
        );
      }
      const result = WebhookService.createSubscription({
        organizationId: orgId,
        endpointUrl: body.endpointUrl,
        eventTypes: body.eventTypes as import("@/lib/webhooks").WebhookEventType[],
        filters: body.filters,
        enabled: body.enabled,
      });
      if (!result.ok) {
        throw new PublicApiError("VALIDATION_ERROR", result.error, 400);
      }
      return result.subscription;
    },
  },
  {
    method: "PATCH",
    path: "/webhooks/{id}",
    operationId: "updateWebhookSubscription",
    tags: ["Webhooks"],
    summary: "Update webhook subscription",
    scopes: ["webhooks.write"],
    mutating: true,
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const result = WebhookService.updateSubscription(ctx.params.id!, {
        endpointUrl: body.endpointUrl as string | undefined,
        eventTypes: body.eventTypes as
          | import("@/lib/webhooks").WebhookEventType[]
          | undefined,
        filters: body.filters as
          | import("@/lib/webhooks").WebhookSubscription["filters"]
          | undefined,
        enabled: body.enabled as boolean | undefined,
      });
      if (!result.ok) {
        throw new PublicApiError("NOT_FOUND", result.error, 404);
      }
      return result.subscription;
    },
  },
  {
    method: "DELETE",
    path: "/webhooks/{id}",
    operationId: "deleteWebhookSubscription",
    tags: ["Webhooks"],
    summary: "Delete webhook subscription",
    scopes: ["webhooks.write"],
    mutating: true,
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const ok = WebhookService.deleteSubscription(ctx.params.id!);
      if (!ok) {
        throw new PublicApiError("NOT_FOUND", "Subscription not found", 404);
      }
      return { deleted: true, id: ctx.params.id };
    },
  },
  {
    method: "POST",
    path: "/webhooks/{id}/rotate-secret",
    operationId: "rotateWebhookSecret",
    tags: ["Webhooks"],
    summary: "Rotate webhook signing secret",
    scopes: ["webhooks.write"],
    mutating: true,
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const result = WebhookService.rotateSecret(ctx.params.id!);
      if (!result.ok) {
        throw new PublicApiError("NOT_FOUND", result.error, 404);
      }
      return result.subscription;
    },
  },
  {
    method: "GET",
    path: "/webhooks/deliveries",
    operationId: "listWebhookDeliveries",
    tags: ["Webhooks"],
    summary: "List webhook delivery history",
    scopes: ["webhooks.read"],
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const { paginateArray } = await import("@/lib/public-api/pagination");
      const rows = WebhookService.listHistory({
        organizationId: ctx.principal.organizationId ?? undefined,
        subscriptionId: ctx.query.get("subscriptionId") ?? undefined,
        status: ctx.query.get("status") ?? undefined,
        limit: 200,
      });
      return paginateArray(rows, {
        cursor: ctx.query.get("cursor"),
        limit: Number(ctx.query.get("limit") ?? 20),
      });
    },
  },
  {
    method: "POST",
    path: "/webhooks/deliveries/{id}/replay",
    operationId: "replayWebhookDelivery",
    tags: ["Webhooks"],
    summary: "Replay a webhook delivery",
    scopes: ["webhooks.replay"],
    mutating: true,
    handler: async (ctx) => {
      const { WebhookService } = await import("@/lib/webhooks");
      const result = await WebhookService.replay(ctx.params.id!);
      if (!result.ok) {
        throw new PublicApiError("CONFLICT", result.error, 409);
      }
      return result.delivery;
    },
  },
  {
    method: "GET",
    path: "/integrations",
    operationId: "listIntegrations",
    tags: ["Integrations"],
    summary: "List available marketplace connectors",
    scopes: ["integrations.read"],
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const { paginateArray } = await import("@/lib/public-api/pagination");
      const category = ctx.query.get("category") as
        | import("@/lib/marketplace").ConnectorCategory
        | null;
      const rows = IntegrationMarketplaceService.listAvailable(
        category ? { category } : undefined,
      );
      return paginateArray(rows, {
        cursor: ctx.query.get("cursor"),
        limit: Number(ctx.query.get("limit") ?? 20),
      });
    },
  },
  {
    method: "GET",
    path: "/integrations/installed",
    operationId: "listInstalledIntegrations",
    tags: ["Integrations"],
    summary: "List installed connectors for the organization",
    scopes: ["integrations.read"],
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const { paginateArray } = await import("@/lib/public-api/pagination");
      const rows = IntegrationMarketplaceService.listInstalled(
        ctx.principal.organizationId ?? undefined,
      );
      return paginateArray(rows, {
        cursor: ctx.query.get("cursor"),
        limit: Number(ctx.query.get("limit") ?? 20),
      });
    },
  },
  {
    method: "POST",
    path: "/integrations/install",
    operationId: "installIntegration",
    tags: ["Integrations"],
    summary: "Install a connector",
    scopes: ["integrations.write"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const body = (ctx.body ?? {}) as {
        connectorId?: string;
        organizationId?: string;
        config?: Record<string, string | boolean>;
      };
      const orgId =
        body.organizationId ?? ctx.principal.organizationId ?? null;
      if (!orgId || !body.connectorId) {
        throw new PublicApiError(
          "VALIDATION_ERROR",
          "connectorId and organizationId are required",
          400,
        );
      }
      const result = IntegrationMarketplaceService.install({
        connectorId: body.connectorId,
        organizationId: orgId,
        config: body.config,
      });
      if (!result.ok) {
        throw new PublicApiError("CONFLICT", result.error, 409);
      }
      return result.installation;
    },
  },
  {
    method: "POST",
    path: "/integrations/{id}/configure",
    operationId: "configureIntegration",
    tags: ["Integrations"],
    summary: "Configure an installed connector",
    scopes: ["integrations.write"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const body = (ctx.body ?? {}) as {
        config?: Record<string, string | boolean>;
      };
      if (!body.config) {
        throw new PublicApiError("VALIDATION_ERROR", "config is required", 400);
      }
      const result = IntegrationMarketplaceService.configure(
        ctx.params.id!,
        body.config,
      );
      if (!result.ok) {
        throw new PublicApiError("VALIDATION_ERROR", result.error, 400);
      }
      return result.installation;
    },
  },
  {
    method: "POST",
    path: "/integrations/{id}/authenticate",
    operationId: "authenticateIntegration",
    tags: ["Integrations"],
    summary: "Authenticate connector credentials",
    scopes: ["integrations.manage"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const body = (ctx.body ?? {}) as {
        kind?: "oauth" | "api_key" | "webhook_secret";
        secret?: string;
      };
      const result = IntegrationMarketplaceService.authenticate(
        ctx.params.id!,
        body,
      );
      if (!result.ok) {
        throw new PublicApiError("VALIDATION_ERROR", result.error, 400);
      }
      return {
        installation: result.installation,
        secret: result.secret,
      };
    },
  },
  {
    method: "POST",
    path: "/integrations/{id}/enable",
    operationId: "enableIntegration",
    tags: ["Integrations"],
    summary: "Enable an installed connector",
    scopes: ["integrations.manage"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const result = IntegrationMarketplaceService.enable(ctx.params.id!);
      if (!result.ok) {
        throw new PublicApiError("CONFLICT", result.error, 409);
      }
      return result.installation;
    },
  },
  {
    method: "POST",
    path: "/integrations/{id}/disable",
    operationId: "disableIntegration",
    tags: ["Integrations"],
    summary: "Disable an installed connector",
    scopes: ["integrations.manage"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const result = IntegrationMarketplaceService.disable(ctx.params.id!);
      if (!result.ok) {
        throw new PublicApiError("NOT_FOUND", result.error, 404);
      }
      return result.installation;
    },
  },
  {
    method: "GET",
    path: "/integrations/{id}/health",
    operationId: "getIntegrationHealth",
    tags: ["Integrations"],
    summary: "Connector health snapshot",
    scopes: ["integrations.read"],
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const health = IntegrationMarketplaceService.health(ctx.params.id!);
      if (!health) {
        throw new PublicApiError("NOT_FOUND", "Health unavailable", 404);
      }
      return health;
    },
  },
  {
    method: "POST",
    path: "/integrations/{id}/rotate-credentials",
    operationId: "rotateIntegrationCredentials",
    tags: ["Integrations"],
    summary: "Rotate connector credentials",
    scopes: ["integrations.manage"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const body = (ctx.body ?? {}) as { credentialId?: string };
      const result = IntegrationMarketplaceService.rotateCredentials(
        ctx.params.id!,
        body.credentialId,
      );
      if (!result.ok) {
        throw new PublicApiError("NOT_FOUND", result.error, 404);
      }
      return result;
    },
  },
  {
    method: "DELETE",
    path: "/integrations/{id}",
    operationId: "uninstallIntegration",
    tags: ["Integrations"],
    summary: "Uninstall a connector",
    scopes: ["integrations.manage"],
    mutating: true,
    handler: async (ctx) => {
      const { IntegrationMarketplaceService } = await import(
        "@/lib/marketplace"
      );
      const ok = IntegrationMarketplaceService.uninstall(ctx.params.id!);
      if (!ok) {
        throw new PublicApiError("NOT_FOUND", "Installation not found", 404);
      }
      return { deleted: true, id: ctx.params.id };
    },
  },
  {
    method: "GET",
    path: "/developer",
    operationId: "getDeveloperPortalHome",
    tags: ["Developer"],
    summary: "Developer portal home",
    scopes: ["developer.read"],
    handler: async () => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      const home = DeveloperPortalService.home();
      if (!home.ok) {
        throw new PublicApiError("FEATURE_DISABLED", home.error, 503);
      }
      return home;
    },
  },
  {
    method: "GET",
    path: "/developer/sections",
    operationId: "listDeveloperPortalSections",
    tags: ["Developer"],
    summary: "List developer portal sections",
    scopes: ["developer.read"],
    handler: async () => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      return DeveloperPortalService.sections();
    },
  },
  {
    method: "GET",
    path: "/developer/sections/{id}",
    operationId: "getDeveloperPortalSection",
    tags: ["Developer"],
    summary: "Get a developer portal section",
    scopes: ["developer.read"],
    handler: async (ctx) => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      const section = DeveloperPortalService.getSection(ctx.params.id!);
      if (!section) {
        throw new PublicApiError("NOT_FOUND", "Section not found", 404);
      }
      return section;
    },
  },
  {
    method: "GET",
    path: "/developer/examples",
    operationId: "listDeveloperExamples",
    tags: ["Developer"],
    summary: "Curated Public API examples",
    scopes: ["developer.read"],
    handler: async () => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      return DeveloperPortalService.examples();
    },
  },
  {
    method: "GET",
    path: "/developer/examples/{id}",
    operationId: "getDeveloperExample",
    tags: ["Developer"],
    summary: "Get a curated example by id",
    scopes: ["developer.read"],
    handler: async (ctx) => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      const example = DeveloperPortalService.getExample(ctx.params.id!);
      if (!example) {
        throw new PublicApiError("NOT_FOUND", "Example not found", 404);
      }
      return example;
    },
  },
  {
    method: "GET",
    path: "/developer/quickstart",
    operationId: "getDeveloperQuickStart",
    tags: ["Developer"],
    summary: "Quick start guide for Public API v1",
    scopes: ["developer.read"],
    handler: async () => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      return DeveloperPortalService.quickStart();
    },
  },
  {
    method: "GET",
    path: "/developer/changelog",
    operationId: "listDeveloperChangelog",
    tags: ["Developer"],
    summary: "Public API release notes",
    scopes: ["developer.read"],
    handler: async () => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      return DeveloperPortalService.changelog();
    },
  },
  {
    method: "GET",
    path: "/developer/migration",
    operationId: "getDeveloperMigrationGuide",
    tags: ["Developer"],
    summary: "Migration guide between API versions",
    scopes: ["developer.read"],
    handler: async (ctx) => {
      const { DeveloperPortalService, isDeveloperPortalEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isDeveloperPortalEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "Developer portal disabled",
          503,
        );
      }
      const from = ctx.query.get("from") ?? "v1.0.0";
      const to = ctx.query.get("to") ?? "v1.3.0";
      return DeveloperPortalService.migrationGuide(from, to);
    },
  },
  {
    method: "POST",
    path: "/developer/sdk/generate",
    operationId: "generateDeveloperSdk",
    tags: ["Developer"],
    summary: "Generate TypeScript/Node SDK from OpenAPI",
    scopes: ["developer.sdk"],
    mutating: true,
    handler: async () => {
      const { DeveloperPortalService, isSdkGenerationEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isSdkGenerationEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "SDK generation disabled",
          503,
        );
      }
      const result = DeveloperPortalService.generateSdk();
      if (!result.ok) {
        throw new PublicApiError("FEATURE_DISABLED", result.error, 503);
      }
      return result.bundle;
    },
  },
  {
    method: "GET",
    path: "/developer/explorer/operations",
    operationId: "listExplorerOperations",
    tags: ["Developer"],
    summary: "List operations available in the API Explorer",
    scopes: ["developer.explorer"],
    handler: async () => {
      const { DeveloperPortalService, isApiExplorerEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isApiExplorerEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "API explorer disabled",
          503,
        );
      }
      return DeveloperPortalService.listOperations();
    },
  },
  {
    method: "POST",
    path: "/developer/explorer/preview",
    operationId: "previewExplorerCall",
    tags: ["Developer"],
    summary: "Dry-run API Explorer preview (curl + TypeScript)",
    scopes: ["developer.explorer"],
    mutating: true,
    handler: async (ctx) => {
      const { DeveloperPortalService, isApiExplorerEnabled } = await import(
        "@/lib/developer-portal"
      );
      if (!isApiExplorerEnabled()) {
        throw new PublicApiError(
          "FEATURE_DISABLED",
          "API explorer disabled",
          503,
        );
      }
      const body = (ctx.body ?? {}) as {
        operationId?: string;
        pathParams?: Record<string, string>;
        query?: Record<string, string>;
        body?: unknown;
        apiKey?: string;
        bearerToken?: string;
        baseUrl?: string;
      };
      if (!body.operationId) {
        throw new PublicApiError(
          "VALIDATION_ERROR",
          "operationId is required",
          400,
        );
      }
      const result = DeveloperPortalService.preview({
        operationId: body.operationId,
        pathParams: body.pathParams,
        query: body.query,
        body: body.body,
        apiKey: body.apiKey,
        bearerToken: body.bearerToken,
        baseUrl: body.baseUrl,
      });
      if (!result.ok) {
        throw new PublicApiError("VALIDATION_ERROR", result.error, 400);
      }
      return result.preview;
    },
  },
  {
    method: "GET",
    path: "/openapi.json",
    operationId: "getOpenApiJson",
    tags: ["Meta"],
    summary: "OpenAPI 3.1 JSON",
    scopes: [],
    public: true,
    handler: async () => {
      if (!isPublicApiV1Enabled()) {
        throw new PublicApiError("FEATURE_DISABLED", "Public API v1 disabled", 503);
      }
      const { generateOpenApiDocument } = await import(
        "@/lib/public-api/openapi/generator"
      );
      const { isPublicOpenApiEnabled } = await import("@/lib/public-api/config");
      if (!isPublicOpenApiEnabled()) {
        throw new PublicApiError("FEATURE_DISABLED", "OpenAPI disabled", 503);
      }
      return generateOpenApiDocument();
    },
  },
];

export function findRoute(
  method: string,
  path: string,
): { route: RouteDefinition; params: Record<string, string> } | null {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  for (const route of V1_ROUTES) {
    if (route.method !== method.toUpperCase()) continue;
    const params = matchPath(route.path, normalized);
    if (params) return { route, params };
  }
  return null;
}

export function assertRouteScopes(
  route: RouteDefinition,
  principal: PublicPrincipal,
): void {
  if (route.scopes.length) requireScopes(principal, route.scopes);
}
