/**
 * Vitest setup — allow importing server-only modules in Node tests.
 */
import { vi } from "vitest";

process.env.STORAGE_PROVIDER ??= "memory";

vi.mock("server-only", () => ({}));
