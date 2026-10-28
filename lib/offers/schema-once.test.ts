import { describe, expect, it } from 'vitest';
import { fingerprint } from './schema-once';

describe('fingerprint', () => {
  it('est stable pour un même code et change dès que le code change', () => {
    const a = async () => {};
    expect(fingerprint(a.toString())).toBe(fingerprint(a.toString()));
    expect(fingerprint('create table a (id int)')).not.toBe(fingerprint('create table a (id bigint)'));
  });
});
