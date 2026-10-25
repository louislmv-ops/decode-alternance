import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { readCv, rtfToText } = await import('./read');

const fixture = (name: string, type: string) => new File([readFileSync(join(__dirname, '__fixtures__', name))], name, { type });

describe('lecture des CV', () => {
  it('lit un Word (.docx)', async () => {
    const r = await readCv(fixture('cv.docx', ''));
    expect(r).toEqual({ kind: 'text', text: 'Léa Martin\nMaster marketing & data Lyon 69003' });
  });

  it('lit un OpenDocument (.odt)', async () => {
    const r = await readCv(fixture('cv.odt', ''));
    expect(r).toEqual({ kind: 'text', text: 'Léa Martin\nDéveloppeuse web' });
  });

  it('lit un RTF', () => {
    expect(rtfToText("{\\rtf1\\ansi{\\fonttbl\\f0 Arial;}\\f0 L\\'e9a Martin\\par Bac+3}")).toBe('Léa Martin\nBac+3');
  });

  it('garde une photo pour l’IA et refuse le vieux .doc', async () => {
    expect((await readCv(new File([new Uint8Array([1, 2])], 'cv.jpg', { type: 'image/jpeg' }))).kind).toBe('image');
    expect((await readCv(new File([new Uint8Array([1])], 'cv.doc'))).kind).toBe('error');
  });
});
