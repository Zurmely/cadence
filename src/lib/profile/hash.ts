import LZString from 'lz-string';
import { parseProfile, toEmergencyProfile, type Profile } from './schema';

export const HASH_PREFIX = '#data=';
export const HASH_ENVELOPE_VERSION = 1;

export type HashMode = 'full' | 'emergency';

export type HashEnvelope = {
  v: typeof HASH_ENVELOPE_VERSION;
  mode: HashMode;
  profile: unknown;
};

export type DecodedHash = {
  profile: Profile;
  mode: HashMode;
};

function extractPayload(hash: string): string | null {
  const trimmed = hash.trim();
  if (!trimmed) return null;

  const hashPart = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const params = new URLSearchParams(hashPart);
  const data = params.get('data');
  if (data) return data;

  if (hashPart.startsWith('data=')) return hashPart.slice('data='.length);
  return null;
}

export function encodeProfileToHash(
  profile: Profile,
  options: { emergencyOnly?: boolean } = {},
): string {
  const emergencyOnly = Boolean(options.emergencyOnly);
  const envelope: HashEnvelope = {
    v: HASH_ENVELOPE_VERSION,
    mode: emergencyOnly ? 'emergency' : 'full',
    profile: emergencyOnly ? toEmergencyProfile(profile) : profile,
  };
  return `${HASH_PREFIX}${LZString.compressToEncodedURIComponent(JSON.stringify(envelope))}`;
}

export function decodeProfileFromHash(hash: string): DecodedHash | null {
  const payload = extractPayload(hash);
  if (!payload) return null;

  const json = LZString.decompressFromEncodedURIComponent(payload);
  if (!json) return null;

  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const envelope = parsed as Partial<HashEnvelope> & Record<string, unknown>;

    if ('profile' in envelope) {
      const mode: HashMode = envelope.mode === 'emergency' ? 'emergency' : 'full';
      const profile = parseProfile(envelope.profile);
      return {
        profile: mode === 'emergency' ? toEmergencyProfile(profile) : profile,
        mode,
      };
    }

    return { profile: parseProfile(parsed), mode: 'full' };
  } catch {
    return null;
  }
}

export function readHashFromLocation(locationLike: { hash: string } | undefined): DecodedHash | null {
  if (!locationLike?.hash) return null;
  return decodeProfileFromHash(locationLike.hash);
}
