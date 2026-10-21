// Les recherches à lancer soi-même pour trouver l'équipe. Décode ne lit rien sur LinkedIn :
// il fabrique des liens de recherche que la personne ouvre avec son propre compte.

export interface TeamSearchInput {
  company: string;
  service: string;
  city: string;
  school: string;
}

export interface SearchLink {
  label: string;
  why: string;
  url: string;
  query: string;
}

const quote = (s: string) => (s.trim() ? `"${s.trim().replace(/"/g, '')}"` : '');

export function linkedinPeopleUrl(keywords: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function googleUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Du plus utile au moins utile : un alternant du service répond plus souvent qu'un recruteur. */
export function teamSearches(input: TeamSearchInput): SearchLink[] {
  const company = input.company.trim();
  if (!company) return [];
  const service = input.service.trim();
  const links: SearchLink[] = [];

  const alternants = [company, service, 'alternant'].filter(Boolean).join(' ');
  links.push({
    label: 'Les alternants du service',
    why: 'Ils ont vécu ce que tu vas vivre et répondent le plus souvent.',
    query: alternants,
    url: linkedinPeopleUrl(alternants),
  });

  if (service) {
    const team = `${company} ${service}`;
    links.push({
      label: 'Les membres de l’équipe',
      why: 'Les personnes avec qui tu travaillerais, et parfois ton futur tuteur.',
      query: team,
      url: linkedinPeopleUrl(team),
    });
  }

  if (input.school.trim()) {
    const alumni = `${company} ${input.school.trim()}`;
    links.push({
      label: 'Les anciens de ton école',
      why: 'Un point commun, c’est une bonne raison d’écrire.',
      query: alumni,
      url: linkedinPeopleUrl(alumni),
    });
  }

  const recruiter = `${company} chargé de recrutement alternance`;
  links.push({
    label: 'La personne qui recrute les alternants',
    why: 'À contacter en dernier, quand tu sais déjà à quel service tu t’adresses.',
    query: recruiter,
    url: linkedinPeopleUrl(recruiter),
  });

  const xray = ['site:linkedin.com/in', quote(company), service ? quote(service) : '', '(alternant OR apprenti)', input.city.trim() ? quote(input.city) : '']
    .filter(Boolean)
    .join(' ');
  links.push({
    label: 'La même recherche par Google',
    why: 'Utile si LinkedIn limite tes recherches sans abonnement.',
    query: xray,
    url: googleUrl(xray),
  });

  return links;
}

export const MESSAGE_MAX = 300;

/** Message d'invitation LinkedIn court, prêt à adapter. */
export function connectionMessage(input: TeamSearchInput & { firstName: string; formation: string }): string {
  const me = input.firstName.trim() || '[TON PRÉNOM]';
  const formation = input.formation.trim() || '[TA FORMATION]';
  const service = input.service.trim() ? `l’équipe ${input.service.trim()}` : 'votre équipe';
  return `Bonjour, je suis ${me}, en ${formation}. Je m’intéresse à l’alternance dans ${service} chez ${input.company.trim() || '[ENTREPRISE]'}. Qu’est-ce qui fait qu’un alternant y réussit sa première année ? Merci pour votre retour.`;
}

export function followUpMessage(input: { firstName: string; company: string }): string {
  const me = input.firstName.trim() || '[TON PRÉNOM]';
  return `Bonjour, je me permets de revenir vers vous au sujet de ma candidature en alternance chez ${input.company.trim() || '[ENTREPRISE]'}. Je reste très motivé(e) et disponible pour en parler quand cela vous arrange. Bonne journée, ${me}`;
}
