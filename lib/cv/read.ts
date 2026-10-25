import 'server-only';
import { strFromU8, unzipSync } from 'fflate';
import { extractText, getDocumentProxy } from 'unpdf';

// Un CV peut arriver dans plein de formats : PDF, Word, OpenDocument, RTF, texte, ou photo.
// On en tire le texte ; une photo n'a pas de texte, elle est renvoyée telle quelle pour être lue par l'IA.

export { CV_ACCEPT } from './accept';

export type CvContent =
  | { kind: 'text'; text: string }
  | { kind: 'image'; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: Uint8Array }
  | { kind: 'error'; message: string };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function xmlToText(xml: string, paragraphEnd: RegExp): string {
  return xml
    .replace(paragraphEnd, '\n')
    .replace(/<(w:tab|text:tab)\/>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) =>
      e.startsWith('#x') ? String.fromCodePoint(parseInt(e.slice(2), 16)) : e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1))) : (ENTITIES[e] ?? m),
    )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function fromZip(bytes: Uint8Array, path: string, paragraphEnd: RegExp): string {
  const files = unzipSync(bytes, { filter: (f) => f.name === path });
  const xml = files[path];
  if (!xml) throw new Error('fichier interne absent');
  return xmlToText(strFromU8(xml), paragraphEnd);
}

/** Texte d'un RTF : on retire les commandes et les groupes de mise en forme. */
export function rtfToText(rtf: string): string {
  return rtf
    .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => Buffer.from([parseInt(h, 16)]).toString('latin1'))
    .replace(/\\u(-?\d+)\??/g, (_, n: string) => String.fromCharCode(Number(n) < 0 ? Number(n) + 65536 : Number(n)))
    .replace(/\{\\(fonttbl|colortbl|stylesheet|info)[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')
    .replace(/\{\\\*[^{}]*\}/g, '')
    .replace(/\\(par|line)\b ?/g, '\n')
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function extension(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

export async function readCv(file: File): Promise<CvContent> {
  const ext = extension(file.name);
  const type = file.type;
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    if (type === 'application/pdf' || ext === 'pdf') {
      const pdf = await getDocumentProxy(bytes);
      return { kind: 'text', text: (await extractText(pdf, { mergePages: true })).text };
    }
    if (ext === 'docx' || type.includes('wordprocessingml')) return { kind: 'text', text: fromZip(bytes, 'word/document.xml', /<\/w:p>/g) };
    if (ext === 'odt' || type.includes('opendocument.text')) return { kind: 'text', text: fromZip(bytes, 'content.xml', /<\/text:(p|h)>/g) };
    if (ext === 'rtf' || type.includes('rtf')) return { kind: 'text', text: rtfToText(new TextDecoder('latin1').decode(bytes)) };
    if (ext === 'txt' || ext === 'md' || type.startsWith('text/')) return { kind: 'text', text: new TextDecoder().decode(bytes) };
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || /^image\/(jpeg|png|webp)$/.test(type)) {
      const mediaType = ext === 'png' || type === 'image/png' ? 'image/png' : ext === 'webp' || type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      return { kind: 'image', mediaType, data: bytes };
    }
    if (ext === 'doc') return { kind: 'error', message: 'Ancien format Word (.doc) : enregistre ton CV en .docx ou en PDF.' };
    if (ext === 'heic' || type === 'image/heic') return { kind: 'error', message: 'Photo HEIC : exporte-la en JPEG, ou envoie ton CV en PDF.' };
  } catch {
    return { kind: 'error', message: 'Impossible de lire ce fichier. Essaie en PDF.' };
  }
  return { kind: 'error', message: 'Format non pris en charge. Envoie un PDF, un Word (.docx), un OpenDocument (.odt), un RTF, un texte ou une photo.' };
}
