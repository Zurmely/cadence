import { describe, expect, it } from 'vitest';
import {
  createEmptyMedication,
  createEmptyProfile,
  encodeProfileToHash,
  decodeProfileFromHash,
  toEmergencyProfile,
} from './index';

function sampleProfile() {
  const profile = createEmptyProfile();
  profile.person.fullName = 'Ana Beatriz Souza';
  profile.person.preferredName = 'Ana';
  profile.person.dateOfBirth = '1988-03-12';
  profile.person.sex = 'female';
  profile.person.bloodType = 'O+';
  profile.person.documentId = '123.456.789-00';
  profile.person.weightKg = '64';
  profile.notes = 'Prefers Portuguese. Private note.';
  profile.doctor = {
    name: 'Dr. Paulo Lima',
    specialty: 'Cardiology',
    phone: '+55 11 99999-0000',
    clinic: 'Hospital das Clínicas',
    notes: 'Internal referral only',
  };
  profile.allergies.push({
    id: 'alg-1',
    name: 'Penicillin',
    severity: 'severe',
    reaction: 'Anaphylaxis',
  });
  profile.conditions.push({
    id: 'cnd-1',
    name: 'Hypertension',
    icd10: 'I10',
    notes: 'Diagnosed 2019',
  });
  const med = createEmptyMedication();
  med.id = 'med-1';
  med.name = 'Losartan';
  med.dose = '50 mg';
  med.instructions = 'Take with food';
  med.slots.morning = true;
  med.slots.evening = true;
  med.glyph = {
    form: 'tablet-scored',
    primaryColor: '#b3261e',
    secondaryColor: '#ffffff',
    scoring: 1,
  };
  profile.medications.push(med);
  profile.emergencyContacts.push({
    id: 'ec-1',
    name: 'Marcos Souza',
    relation: 'Spouse',
    phone: '+55 11 98888-1111',
    isPrimary: true,
  });
  return profile;
}

describe('profile hash codec', () => {
  it('round-trips a full profile through #data=', () => {
    const profile = sampleProfile();
    const hash = encodeProfileToHash(profile);
    expect(hash.startsWith('#data=')).toBe(true);
    expect(hash.length).toBeGreaterThan('#data='.length);

    const decoded = decodeProfileFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.mode).toBe('full');
    expect(decoded?.profile).toEqual(profile);
  });

  it('round-trips when the leading # is omitted', () => {
    const profile = sampleProfile();
    const hash = encodeProfileToHash(profile).slice(1);
    const decoded = decodeProfileFromHash(hash);
    expect(decoded?.profile.person.fullName).toBe('Ana Beatriz Souza');
  });

  it('encodes an emergency-only payload that strips private fields', () => {
    const profile = sampleProfile();
    const hash = encodeProfileToHash(profile, { emergencyOnly: true });
    const decoded = decodeProfileFromHash(hash);

    expect(decoded?.mode).toBe('emergency');
    expect(decoded?.profile.person.fullName).toBe('Ana Beatriz Souza');
    expect(decoded?.profile.person.bloodType).toBe('O+');
    expect(decoded?.profile.person.documentId).toBe('');
    expect(decoded?.profile.person.preferredName).toBe('');
    expect(decoded?.profile.person.weightKg).toBe('');
    expect(decoded?.profile.notes).toBe('');
    expect(decoded?.profile.doctor.name).toBe('Dr. Paulo Lima');
    expect(decoded?.profile.doctor.phone).toBe('+55 11 99999-0000');
    expect(decoded?.profile.doctor.clinic).toBe('');
    expect(decoded?.profile.doctor.notes).toBe('');
    expect(decoded?.profile.conditions[0]?.notes).toBe('');
    expect(decoded?.profile.medications[0]?.instructions).toBe('');
    expect(decoded?.profile.medications[0]?.glyph.form).toBe('tablet-round');
    expect(decoded?.profile.allergies[0]?.name).toBe('Penicillin');
    expect(decoded?.profile.emergencyContacts[0]?.phone).toBe('+55 11 98888-1111');
  });

  it('matches toEmergencyProfile() for the emergency variant', () => {
    const profile = sampleProfile();
    const decoded = decodeProfileFromHash(encodeProfileToHash(profile, { emergencyOnly: true }));
    expect(decoded?.profile).toEqual(toEmergencyProfile(profile));
  });

  it('returns null for empty or garbage hashes', () => {
    expect(decodeProfileFromHash('')).toBeNull();
    expect(decodeProfileFromHash('#other=abc')).toBeNull();
    expect(decodeProfileFromHash('#data=%%%not-valid%%%')).toBeNull();
  });

  it('preserves Portuguese characters through compression', () => {
    const profile = createEmptyProfile();
    profile.person.fullName = 'José da Conceição';
    profile.notes = 'Alergia a dipirona — não administrar.';
    const decoded = decodeProfileFromHash(encodeProfileToHash(profile));
    expect(decoded?.profile.person.fullName).toBe('José da Conceição');
    expect(decoded?.profile.notes).toBe('Alergia a dipirona — não administrar.');
  });
});
