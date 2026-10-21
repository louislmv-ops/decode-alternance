// Accès réseau commun aux connecteurs : un user-agent honnête, un délai maximal,
// une pause entre deux requêtes vers le même site et le respect de robots.txt.

// Uniquement de l'ASCII : un en-tête HTTP n'accepte pas les caractères accentués.
export const USER_AGENT = `DecodeBot/0.1 (work-study job offers; contact: ${process.env.BOT_CONTACT ?? 'see README'})`;

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: string;
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<{ status: number; text: string; headers: Headers }> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    body: options.body,
    headers: { 'User-Agent': USER_AGENT, ...options.headers },
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
    redirect: 'follow',
  });
  return { status: response.status, text: await response.text(), headers: response.headers };
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RobotsRules {
  disallow: string[];
  allow: string[];
  sitemaps: string[];
  crawlDelayMs: number;
}

/** Lit les règles de robots.txt qui s'appliquent à notre robot (ou à tous les robots). */
export function parseRobots(text: string, agent = 'decodebot'): RobotsRules {
  const groups: { agents: string[]; allow: string[]; disallow: string[]; delay: number | null }[] = [];
  const sitemaps: string[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match?.[1]) continue;
    const key = match[1].toLowerCase();
    const value = (match[2] ?? '').trim();
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [], delay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'disallow' && value) current.disallow.push(value);
    if (key === 'allow' && value) current.allow.push(value);
    if (key === 'crawl-delay' && Number.isFinite(Number(value))) current.delay = Number(value);
  }

  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && agent.includes(a)));
  const any = groups.find((g) => g.agents.includes('*'));
  const group = mine ?? any;
  return {
    disallow: group?.disallow ?? [],
    allow: group?.allow ?? [],
    sitemaps,
    crawlDelayMs: Math.max(1000, (group?.delay ?? 0) * 1000),
  };
}

function ruleMatches(rule: string, path: string): boolean {
  const pattern = '^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
  return new RegExp(pattern).test(path);
}

/** La règle la plus précise l'emporte, comme le prévoit la norme robots.txt (RFC 9309). */
export function isAllowed(rules: RobotsRules, url: string): boolean {
  const path = new URL(url).pathname + new URL(url).search;
  const longest = (list: string[]) => list.filter((r) => ruleMatches(r, path)).reduce((n, r) => Math.max(n, r.length), -1);
  const allow = longest(rules.allow);
  const disallow = longest(rules.disallow);
  return disallow === -1 || allow >= disallow;
}
