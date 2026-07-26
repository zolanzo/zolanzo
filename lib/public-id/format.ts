/**
 * Pure public-ID formatting helpers (no DB) — unit-testable.
 */

import {
  PUBLIC_ID_ALPHABET,
  PUBLIC_ID_DEFINITIONS,
  PUBLIC_ID_REGEX,
  type PublicIdEntity,
} from "@/constants/public-ids";

export function padSequence(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function formatUtcYear(date: Date = new Date()): string {
  return String(date.getUTCFullYear());
}

export function formatUtcDateCompact(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function randomPublicSegment(
  length: number,
  randomBytes: (size: number) => Uint8Array = defaultRandomBytes,
): string {
  const alphabet = PUBLIC_ID_ALPHABET;
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const byte = bytes[i] ?? 0;
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

function defaultRandomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function formatRandomPublicId(
  entity: PublicIdEntity,
  segment: string,
): string {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  return `${def.prefix}-${segment}`;
}

export function formatSequentialPublicId(
  entity: PublicIdEntity,
  sequence: number,
): string {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  const width = def.sequenceWidth ?? 6;
  return `${def.prefix}-${padSequence(sequence, width)}`;
}

export function formatYearSequentialPublicId(
  entity: PublicIdEntity,
  year: string,
  sequence: number,
): string {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  const width = def.sequenceWidth ?? 6;
  return `${def.prefix}-${year}-${padSequence(sequence, width)}`;
}

export function formatDateSequentialPublicId(
  entity: PublicIdEntity,
  dateKey: string,
  sequence: number,
): string {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  const width = def.sequenceWidth ?? 6;
  return `${def.prefix}-${dateKey}-${padSequence(sequence, width)}`;
}

export function isValidPublicId(
  entity: PublicIdEntity,
  value: string,
): boolean {
  return PUBLIC_ID_REGEX[entity].test(value);
}

export function counterKeyFor(
  entity: PublicIdEntity,
  date: Date = new Date(),
): string {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  switch (def.strategy) {
    case "sequential":
      return entity;
    case "year_sequential":
      return `${entity}:${formatUtcYear(date)}`;
    case "date_sequential":
      return `${entity}:${formatUtcDateCompact(date)}`;
    case "random":
      return entity;
    default: {
      const _exhaustive: never = def.strategy;
      return _exhaustive;
    }
  }
}
