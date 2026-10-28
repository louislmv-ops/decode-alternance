import { describe, expect, it } from 'vitest';
import { regionOf, REGIONS } from './departments';
import { decodeNearCookie, encodePlace, parseNear } from './place';
import { distanceKm } from './geo';

describe('lieu', () => {
  it('lit un rayon autour d’une ville', () => {
    expect(parseNear('48.857,2.352,75', '20', 'Paris')).toEqual({ lat: 48.857, lon: 2.352, department: '75', km: 20, label: 'Paris' });
    expect(parseNear('48.857,2.352,75', '7', 'Paris')).toBeNull();
    expect(parseNear('abc', '20', 'Paris')).toBeNull();
  });

  it('retient le rayon dans le cookie', () => {
    const near = { lat: 45.764, lon: 4.836, department: '69', km: 30, label: 'Lyon 3e' };
    expect(decodeNearCookie(encodePlace(near))).toEqual(near);
    expect(encodePlace(['75', '92'])).toBe('75.92');
  });

  it('reconnaît une région entière', () => {
    expect(regionOf(['92', '75', '77', '78', '91', '93', '94', '95'])?.name).toBe('Île-de-France');
    expect(regionOf(['75'])).toBeNull();
    expect(REGIONS.every((r) => r.departments.length <= 13)).toBe(true);
  });

  it('mesure les distances à vol d’oiseau', () => {
    expect(Math.round(distanceKm({ lat: 48.857, lon: 2.352 }, { lat: 48.892, lon: 2.207 }))).toBe(11);
  });
});
