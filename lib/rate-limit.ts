// Limite simple par adresse IP, en mémoire. Elle ne tient que dans une instance du serveur :
// c'est un garde-fou contre l'abus le plus grossier, pas une protection complète. Pour une vraie
// limite partagée, la brancher sur la base ou sur un service comme Upstash.

const hits = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return true;
}

/**
 * Plusieurs plafonds d'un coup (par heure et par jour) : la demande n'est comptée que si elle passe tous,
 * pour qu'un refus à l'heure n'entame pas le quota du jour. Renvoie l'index du premier plafond atteint, ou -1.
 */
export function allowAll(rules: { key: string; limit: number; windowMs: number }[], now = Date.now()): number {
  const blocked = rules.findIndex((r) => (hits.get(r.key) ?? []).filter((t) => now - t < r.windowMs).length >= r.limit);
  if (blocked >= 0) return blocked;
  for (const r of rules) allow(r.key, r.limit, r.windowMs, now);
  return -1;
}

export function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'inconnu';
}
