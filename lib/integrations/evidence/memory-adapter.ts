/**
 * In-memory evidence storage adapter — default for tests / local until cloud wiring.
 */

import type {
  EvidenceReference,
  EvidenceStorageAdapter,
  EvidenceStoreInput,
} from "@/lib/integrations/types";

const store = new Map<string, Uint8Array>();

function keyOf(ref: EvidenceReference): string {
  return `${ref.adapter}:${ref.container}:${ref.objectKey}`;
}

export const memoryEvidenceStorageAdapter: EvidenceStorageAdapter = {
  providerKey: "memory",

  async store(input: EvidenceStoreInput): Promise<EvidenceReference> {
    const ref: EvidenceReference = {
      adapter: "memory",
      container: input.container,
      objectKey: input.objectKey,
      contentType: input.contentType,
    };
    store.set(keyOf(ref), input.body);
    return ref;
  },

  async resolveUrl(ref: EvidenceReference): Promise<string> {
    if (ref.adapter !== "memory") {
      throw new Error(`Memory adapter cannot resolve ${ref.adapter}`);
    }
    return `memory://${ref.container}/${ref.objectKey}`;
  },

  async remove(ref: EvidenceReference): Promise<void> {
    store.delete(keyOf(ref));
  },
};

/** Test helper — clear memory store between suites if needed */
export function clearMemoryEvidenceStore(): void {
  store.clear();
}
