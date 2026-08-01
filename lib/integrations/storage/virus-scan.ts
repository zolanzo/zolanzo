/**
 * Virus scan hook interface — providers plug in without domain coupling.
 * Default: noop (pass-through) until a scanner is configured.
 */

export type VirusScanInput = {
  body: Uint8Array;
  contentType: string;
  objectKey: string;
  bucket: string;
};

export type VirusScanResult = {
  clean: boolean;
  engine: string;
  details?: string;
};

export type VirusScanHook = {
  scan(input: VirusScanInput): Promise<VirusScanResult>;
};

export const noopVirusScanHook: VirusScanHook = {
  async scan(): Promise<VirusScanResult> {
    return { clean: true, engine: "noop" };
  },
};

let activeHook: VirusScanHook = noopVirusScanHook;

export function setVirusScanHook(hook: VirusScanHook): void {
  activeHook = hook;
}

export function getVirusScanHook(): VirusScanHook {
  return activeHook;
}

export async function runVirusScan(
  input: VirusScanInput,
): Promise<VirusScanResult> {
  return getVirusScanHook().scan(input);
}
