import { decodeProfileFromHash, type HashMode } from './hash';
import type { Profile } from './schema';

export type EmergencySourceKind = 'hash' | 'local';

export type EmergencyProfileResult = {
  profile: Profile;
  source: EmergencySourceKind;
  /** Payload mode of the hash, when the source is `hash`. */
  mode: HashMode | null;
};

/**
 * Emergency view resolution order: an explicit `#data=` hash always wins
 * (it is the thing a first responder scanned or opened), and only falls
 * back to whatever profile is already on this device. This never writes
 * to storage — opening someone else's shared link must not overwrite the
 * viewer's own local profile.
 */
export function resolveEmergencyProfile(
  hash: string | undefined | null,
  localProfile: Profile,
): EmergencyProfileResult {
  const decoded = hash ? decodeProfileFromHash(hash) : null;
  if (decoded) {
    return { profile: decoded.profile, source: 'hash', mode: decoded.mode };
  }
  return { profile: localProfile, source: 'local', mode: null };
}
