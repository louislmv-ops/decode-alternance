// Les emojis des puces du décodage : celui donné par l'IA s'il y en a un, sinon un emoji par défaut.
// Ce sont des caractères, pas des images : sur iPhone et Mac, ils s'affichent en emojis Apple.

const LEADING = /^(\p{Extended_Pictographic}(?:\u{FE0F}|\u{200D}\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*/u;

/** Sépare l'emoji de tête du texte : « 💸 Bien payé » donne ['💸', 'Bien payé']. */
export function splitEmoji(text: string, fallback: string): [string, string] {
  const m = text.match(LEADING);
  return m ? [m[1]!, text.slice(m[0].length)] : [guessEmoji(text, fallback), text];
}

export function isEmoji(value: string | undefined): value is string {
  return Boolean(value && LEADING.test(value));
}

const GUESSES: [RegExp, string][] = [
  [/relis|relecture|retour/i, '👀'],
  [/github|projet perso|portfolio/i, '🛠️'],
  [/salaire|pay|€|prime|rémun/i, '💸'],
  [/télétravail|remote|maison/i, '🏠'],
  [/trajet|transport|déplace|train|voiture|route/i, '🚆'],
  [/horaire|week-end|soir|matin|astreinte/i, '⏰'],
  [/évolution|embauche|cdi|carrière|progress/i, '📈'],
  [/apprend|formation|école|cours|diplôme/i, '🎓'],
  [/code|développ|logiciel|site|appli|informatique|typescript|react/i, '💻'],
  [/test|bug|qualité/i, '🧪'],
  [/donnée|data|chiffre|tableau|excel|analyse|reporting/i, '📊'],
  [/client|vente|vend|commerc|boutique|magasin/i, '🛍️'],
  [/réseaux sociaux|instagram|tiktok|post|contenu|communication/i, '📱'],
  [/marketing|campagne|pub/i, '📣'],
  [/compta|factur|paie|budget|financ/i, '🧾'],
  [/recrut|rh|candidat|onboard/i, '🧑‍💼'],
  [/stock|logistique|livraison|colis|commande/i, '📦'],
  [/design|graphi|maquette|visuel/i, '🎨'],
  [/rédig|écri|article|texte/i, '✍️'],
  [/téléphone|appel|accueil/i, '📞'],
  [/équipe|collègue|relis|ensemble|binôme/i, '🤝'],
  [/projet|organis|planning|gestion/i, '🗂️'],
];

/** Un emoji qui colle au sens de la phrase, pour les décodages faits avant l'arrivée des emojis. */
export function guessEmoji(text: string, fallback: string): string {
  return GUESSES.find(([re]) => re.test(text))?.[1] ?? fallback;
}
