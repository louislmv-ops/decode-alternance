import { domainOf, isPublicHost } from '@/lib/offers/logo';
import { resolveLogo } from '@/lib/offers/logo-resolve';
import { USER_AGENT } from '@/lib/offers/connectors/http';

const MAX_BYTES = 512 * 1024;
const WEEK = 7 * 24 * 3600;

// L'icône d'un site en 128 px, par le service public de Google, qui répond 404 quand il n'en a pas.
const favicon = (domain: string) =>
  `${process.env.LOGO_FAVICON_URL || 'https://t1.gstatic.com/faviconV2'}?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${encodeURIComponent(`https://${domain}`)}`;

const notFound = () => new Response(null, { status: 404, headers: { 'Cache-Control': `public, max-age=${WEEK}` } });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let target: string | null = null;
  const u = params.get('u');
  if (u) {
    // Un logo fourni par une source : https et nom de domaine public seulement.
    try {
      const url = new URL(u);
      if (url.protocol === 'https:' && isPublicHost(url.hostname.toLowerCase())) target = url.toString();
    } catch {
      target = null;
    }
  } else if (params.get('d')) {
    const domain = domainOf(params.get('d'));
    if (domain) target = favicon(domain);
  } else if (params.get('n')) {
    // Seulement le nom de l'entreprise : on cherche son logo (Wikidata, puis son site).
    const found = await resolveLogo(params.get('n')!.slice(0, 120));
    if (found?.kind === 'image') target = found.url;
    else if (found?.kind === 'domain') target = favicon(found.domain);
  }
  if (!target) return notFound();

  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(5000), redirect: 'follow', headers: { 'User-Agent': USER_AGENT } });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) return notFound();
    const body = await res.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BYTES) return notFound();
    return new Response(body, {
      headers: {
        'Content-Type': type,
        'Cache-Control': `public, max-age=${WEEK}, s-maxage=${WEEK}, stale-while-revalidate=${WEEK}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
}
