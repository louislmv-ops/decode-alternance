import { z } from 'zod/v4';

/** D'où vient une information : écrite dans l'annonce, déduite de l'annonce, ou introuvable. */
export const Certitude = z.enum(['dit', 'deduit', 'inconnu']);
export type Certitude = z.infer<typeof Certitude>;

export const DecodedOfferSchema = z.object({
  intitule: z.string().describe('Intitulé du poste réécrit simplement, sans H/F ni jargon'),
  enClair: z.string().describe('Deux phrases maximum : ce que la personne fera vraiment, en tutoyant'),
  entreprise: z.object({
    nom: z.string().nullable(),
    taille: z.enum(['tpe', 'pme', 'eti', 'grande', 'inconnue']),
    ceQuElleFait: z.string().nullable().describe('Une phrase, seulement si l’annonce le dit'),
  }),
  lieu: z.object({
    ville: z.string().nullable(),
    precision: z.string().nullable().describe('Quartier, site, adresse si donnés'),
    teletravail: z.string().nullable(),
  }),
  missions: z
    .array(
      z.object({
        jargon: z.string().nullable().describe('La formule exacte de l’annonce, recopiée, ou null'),
        enClair: z.string().describe('Ce que ça veut dire concrètement, en une phrase courte'),
        emoji: z.string().max(16).optional().describe('Un seul emoji qui illustre la mission (ex. 📊, 🤝, 💻)'),
        certitude: Certitude,
      }),
    )
    .describe('Trois à six missions'),
  semaineType: z
    .array(z.object({ moment: z.string(), activite: z.string() }))
    .describe('Quatre à six moments d’une semaine probable, déduits des missions'),
  apprentissages: z.array(z.string()).describe('Ce que la personne va apprendre, trois à cinq éléments'),
  profil: z
    .object({
      enClair: z.string().describe('Une phrase, en tutoyant : le profil qu’ils cherchent en vrai (« quelqu’un en BTS qui aime Excel et le téléphone »)'),
      exige: z.array(z.string()).describe('Ce qui est vraiment exigé par l’annonce, quatre éléments au plus, chacun en six mots au plus'),
      bonus: z.array(z.string()).describe('Ce qui est seulement « apprécié » ou « un plus », trois éléments au plus'),
    })
    .optional()
    .describe('Le profil recherché, d’après l’annonce seulement'),
  contrat: z.object({
    type: z.enum(['apprentissage', 'professionnalisation', 'inconnu']),
    diplome: z.string().nullable(),
    niveau: z.number().nullable().describe('3 = CAP, 4 = bac, 5 = bac+2, 6 = bac+3, 7 = bac+5'),
    duree: z.string().nullable(),
    debut: z.string().nullable(),
    rythme: z.string().nullable().describe('Rythme école/entreprise s’il est écrit, sinon null'),
  }),
  salaire: z.object({
    annonce: z.string().nullable().describe('Le salaire tel qu’écrit, ou null'),
    mensuelBrutEuros: z
      .number()
      .nullable()
      .describe('Montant mensuel brut garanti : la borne basse d’une fourchette ; null pour « jusqu’à », « selon profil » ou la grille légale'),
    maxBrutEuros: z.number().nullable().optional().describe('Borne haute mensuelle brute d’une fourchette ou d’un « jusqu’à », sinon null'),
    avantages: z.array(z.string()),
  }),
  pointsForts: z.array(z.string()).describe('Chaque point commence par un emoji, puis huit mots au plus'),
  limites: z.array(z.string()).describe('Chaque point commence par un emoji, puis huit mots au plus'),
  nonPrecise: z.array(z.string()).describe('Informations importantes absentes de l’annonce'),
  questionsAPoser: z.array(z.string()).describe('Trois à cinq questions précises à poser au recruteur'),
  alertes: z
    .array(z.object({ niveau: z.enum(['alerte', 'attention']), texte: z.string() }))
    .describe('Points de vigilance tirés du seul texte de l’annonce : annonce publiée par une école, argent demandé au candidat, salaire écrit sous le minimum, informations floues ou absentes. Jamais un jugement sur l’entreprise.'),
  equipe: z.object({
    service: z.string().describe('Le service ou l’équipe qui accueillera l’alternant'),
    aContacter: z.array(z.string()).describe('Intitulés de postes à chercher, du plus utile au moins utile'),
    motsCles: z.array(z.string()).describe('Mots-clés de recherche LinkedIn pour trouver ce service'),
  }),
  aMettreEnAvant: z.array(z.string()).describe('Ce que le candidat doit mettre en avant dans son CV et son message'),
  message: z.string().describe('Message LinkedIn de 300 caractères maximum à un membre du service, avec [TON PRÉNOM] et [TA FORMATION]'),
  jargon: z
    .array(z.object({ expression: z.string(), traduction: z.string() }))
    .describe('Expressions toutes faites de l’annonce et ce qu’elles veulent dire'),
});

export type DecodedOffer = z.infer<typeof DecodedOfferSchema>;
