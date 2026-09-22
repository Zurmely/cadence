import { describe, expect, it } from 'vitest';
import { resolveEmergencyProfile } from './emergencySource';
import { createEmptyProfile, encodeProfileToHash } from './index';

describe('resolveEmergencyProfile', () => {
  it('prefers the #data= hash when present', () => {
    const hashProfile = createEmptyProfile();
    hashProfile.person.fullName = 'Shared Patient';

    const localProfile = createEmptyProfile();
    localProfile.person.fullName = 'Local Owner';

    const hash = encodeProfileToHash(hashProfile);
    const result = resolveEmergencyProfile(hash, localProfile);

    expect(result.source).toBe('hash');
    expect(result.mode).toBe('full');
    expect(result.profile.person.fullName).toBe('Shared Patient');
  });

  it('resolves the emergency-only mode from the hash envelope', () => {
    const hashProfile = createEmptyProfile();
    hashProfile.person.fullName = 'Shared Patient';
    hashProfile.notes = 'private note';

    const hash = encodeProfileToHash(hashProfile, { emergencyOnly: true });
    const result = resolveEmergencyProfile(hash, createEmptyProfile());

    expect(result.source).toBe('hash');
    expect(result.mode).toBe('emergency');
    expect(result.profile.notes).toBe('');
  });

  it('falls back to the local profile when there is no hash', () => {
    const localProfile = createEmptyProfile();
    localProfile.person.fullName = 'Local Owner';

    expect(resolveEmergencyProfile(undefined, localProfile)).toEqual({
      profile: localProfile,
      source: 'local',
      mode: null,
    });
    expect(resolveEmergencyProfile(null, localProfile).source).toBe('local');
    expect(resolveEmergencyProfile('', localProfile).source).toBe('local');
  });

  it('falls back to the local profile when the hash is garbage', () => {
    const localProfile = createEmptyProfile();
    localProfile.person.fullName = 'Local Owner';

    const result = resolveEmergencyProfile('#data=%%%not-valid%%%', localProfile);
    expect(result.source).toBe('local');
    expect(result.profile).toBe(localProfile);
  });
});
