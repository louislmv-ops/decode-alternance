// Offres d'exemple, entièrement fictives : entreprises, annonces et montants sont inventés pour montrer
// le fonctionnement du site tant que la collecte n'est pas branchée. Elles sont signalées « Exemple fictif »
// partout où elles apparaissent et disparaissent dès que DATABASE_URL est configuré.

import type { DecodedOffer } from '@/lib/decode/schema';
import { departmentFromPostalCode, fingerprint, parseSalaryRange, schoolBaitFlags } from './normalize';
import type { Offer } from './types';

type DemoInput = Omit<Offer, 'fingerprint' | 'schoolFlags' | 'alsoOn' | 'department' | 'salaryMonthlyCents'>;

function demo(input: DemoInput): Offer {
  return {
    ...input,
    department: departmentFromPostalCode(input.postalCode),
    salaryMonthlyCents: parseSalaryRange(input.salaryText)?.minCents ?? null,
    salaryMaxCents: parseSalaryRange(input.salaryText)?.maxCents ?? null,
    fingerprint: fingerprint(input.company, input.title, input.city),
    schoolFlags: schoolBaitFlags({ company: input.company, title: input.title, description: input.description }),
    alsoOn: [],
  };
}

const ORVANE_DESCRIPTION = `Rejoignez le Groupe Orvane, acteur international de la beauté présent dans 40 pays !

Au sein de la Direction Marketing Insights, vous serez rattaché(e) à la Responsable Études et interviendrez sur des sujets transverses à forte visibilité.

Vos missions :
• Participer au pilotage des études quantitatives et qualitatives en lien avec les instituts
• Contribuer à l'analyse des données consommateurs et à la formalisation des recommandations
• Être force de proposition dans la veille concurrentielle et la détection des tendances
• Assurer le reporting mensuel des KPIs marque auprès des équipes Business

Profil : Bac+4/5 en école de commerce ou université (marketing, statistiques). Vous êtes rigoureux(se), doté(e) d'un excellent relationnel et à l'aise avec Excel. Une première expérience serait un plus.

Contrat : alternance de 24 mois, rythme 3 jours entreprise / 2 jours école. Démarrage janvier 2027.
Rémunération : 1 480 € brut mensuel + 13e mois, tickets restaurant, prise en charge transport 75 %.
Lieu : Paris 9e.`;

const offersRaw: Offer[] = [
  demo({
    id: 'exemple:orvane-etudes',
    source: 'exemple',
    sourceId: 'orvane-etudes',
    sourceUrl: '#exemple',
    title: 'Alternance - Chargé(e) d’études marketing H/F',
    company: 'Groupe Orvane',
    companySize: 'grande',
    city: 'Paris 9e',
    postalCode: '75009',
    contract: 'apprentissage',
    diplomaLevel: 7,
    salaryText: '1 480 € brut mensuel + 13e mois',
    startDate: '2027-01-04',
    publishedAt: '2026-10-20T08:00:00.000Z',
    description: ORVANE_DESCRIPTION,
    direct: true,
  }),
  // La même offre, reprise par un agrégateur : le dédoublonnage n'en garde qu'une.
  demo({
    id: 'exemple:orvane-etudes-relais',
    source: 'exemple',
    sourceId: 'orvane-etudes-relais',
    sourceUrl: '#exemple',
    title: 'Chargé d’études marketing (H/F) en alternance',
    company: 'Groupe Orvane',
    companySize: 'grande',
    city: 'Paris',
    postalCode: '75009',
    contract: 'apprentissage',
    diplomaLevel: 7,
    salaryText: '1 480 € brut mensuel',
    startDate: '2027-01-04',
    publishedAt: '2026-10-19T08:00:00.000Z',
    description: ORVANE_DESCRIPTION,
    direct: false,
  }),
  demo({
    id: 'exemple:fournil-boulanger',
    source: 'exemple',
    sourceId: 'fournil-boulanger',
    sourceUrl: '#exemple',
    title: 'Apprenti(e) boulanger H/F',
    company: 'Fournil des Halles',
    companySize: 'tpe',
    city: 'Nantes',
    postalCode: '44000',
    contract: 'apprentissage',
    diplomaLevel: 3,
    salaryText: 'Selon grille légale',
    startDate: '2026-11-16',
    publishedAt: '2026-10-18T07:30:00.000Z',
    description: `Boulangerie artisanale de quartier recherche apprenti(e) motivé(e) pour préparer un CAP boulanger.

Vous participerez à la fabrication des pains, viennoiseries et à la mise en place du magasin. Travail en équipe avec le chef boulanger. Horaires : 5h-12h, repos dimanche après-midi et lundi.

Polyvalence et ponctualité indispensables. Débutant accepté. Contrat de 24 mois, rythme 2 semaines en entreprise / 1 semaine au CFA. Rémunération selon grille légale.`,
    direct: false,
  }),
  demo({
    id: 'exemple:atlas-rh',
    source: 'exemple',
    sourceId: 'atlas-rh',
    sourceUrl: '#exemple',
    title: 'Assistant(e) ressources humaines en alternance H/F',
    company: 'Atlas Campus Formation',
    companySize: null,
    city: 'Lyon 3e',
    postalCode: '69003',
    contract: 'alternance',
    diplomaLevel: 6,
    salaryText: null,
    startDate: null,
    publishedAt: '2026-10-21T06:00:00.000Z',
    description: `Atlas Campus recrute pour le compte de ses entreprises partenaires des assistant(e)s RH en alternance !

Dynamique, organisé(e) et doté(e) d'un bon sens du relationnel, vous participerez à la gestion administrative du personnel et au recrutement dans un environnement stimulant.

Vous intégrerez notre Bachelor Ressources Humaines en alternance (rentrée en novembre). Inscris-toi à notre formation dès maintenant : entretien d'admission sous 48h, frais de dossier de 90 € offerts jusqu'au 31 octobre.`,
    direct: false,
  }),
  demo({
    id: 'exemple:kerlog-dev',
    source: 'exemple',
    sourceId: 'kerlog-dev',
    sourceUrl: '#exemple',
    title: 'Développeur(se) web full-stack en alternance (F/H)',
    company: 'Kerlog Solutions',
    companySize: 'eti',
    city: 'Rennes',
    postalCode: '35000',
    contract: 'apprentissage',
    diplomaLevel: 6,
    salaryText: '1 300 € brut par mois',
    startDate: '2026-12-01',
    publishedAt: '2026-10-17T09:00:00.000Z',
    description: `Éditeur de logiciels de gestion pour les transporteurs (350 collaborateurs), Kerlog Solutions renforce son équipe Produit.

Intégré(e) à une squad agile de 6 personnes, vous contribuerez au développement de nouvelles fonctionnalités de notre plateforme SaaS (TypeScript, React, Node.js, PostgreSQL), participerez aux code reviews et à l'amélioration continue de la qualité.

Formation bac+3 à bac+5 en informatique. Rythme 1 semaine école / 3 semaines entreprise. Télétravail 1 jour par semaine après la période d'intégration. 1 300 € brut par mois, mutuelle, RTT.`,
    direct: false,
  }),
  demo({
    id: 'exemple:ventis-maintenance',
    source: 'exemple',
    sourceId: 'ventis-maintenance',
    sourceUrl: '#exemple',
    title: 'Alternance - Technicien(ne) de maintenance industrielle',
    company: 'Ventis Industrie',
    companySize: 'grande',
    city: 'Toulouse',
    postalCode: '31000',
    contract: 'apprentissage',
    diplomaLevel: 5,
    salaryText: '1 250 € brut mensuel + prime d’équipe',
    startDate: '2027-01-11',
    publishedAt: '2026-10-16T10:00:00.000Z',
    description: `Ventis Industrie, groupe industriel de 12 000 collaborateurs, fabrique des équipements pour l'aéronautique.

Au sein du service Maintenance de notre site de Toulouse, vous assurerez la maintenance préventive et curative des lignes de production, participerez au diagnostic des pannes mécaniques et électriques et à la mise en œuvre des plans d'amélioration (TPM).

Vous préparez un BTS Maintenance des systèmes. Travail en équipe 2x8 en alternance avec les périodes école (rythme 2 semaines / 2 semaines). 1 250 € brut mensuel + prime d'équipe, restaurant d'entreprise.`,
    direct: true,
  }),
  demo({
    id: 'exemple:sorel-vente',
    source: 'exemple',
    sourceId: 'sorel-vente',
    sourceUrl: '#exemple',
    title: 'Conseiller(ère) de vente en contrat de professionnalisation',
    company: 'Maison Sorel',
    companySize: 'pme',
    city: 'Bordeaux',
    postalCode: '33000',
    contract: 'professionnalisation',
    diplomaLevel: 4,
    salaryText: 'Selon profil',
    startDate: null,
    publishedAt: '2026-10-14T13:00:00.000Z',
    description: `Maison Sorel, enseigne de prêt-à-porter (4 boutiques), recherche un(e) conseiller(ère) de vente en contrat de professionnalisation pour sa boutique de Bordeaux centre.

Accueil et conseil client, encaissement, réassort et mise en rayon, participation aux inventaires. Vous avez le sens du service et le goût de la mode.

Contrat de professionnalisation de 12 mois. Poste à pourvoir dès que possible. Rémunération selon profil.`,
    direct: false,
  }),
  demo({
    id: 'exemple:delorme-cdg',
    source: 'exemple',
    sourceId: 'delorme-cdg',
    sourceUrl: '#exemple',
    title: 'Assistant(e) contrôleur de gestion en alternance',
    company: 'Delorme Distribution',
    companySize: 'pme',
    city: 'Lille',
    postalCode: '59000',
    contract: 'apprentissage',
    diplomaLevel: 7,
    salaryText: '1 100 € brut mensuel',
    startDate: '2027-01-04',
    publishedAt: '2026-10-12T08:00:00.000Z',
    description: `Distributeur de matériel électrique (80 salariés), Delorme Distribution recherche un(e) assistant(e) contrôleur de gestion en alternance.

Rattaché(e) au Directeur administratif et financier, vous participerez à l'élaboration du budget, au suivi des écarts, à la clôture mensuelle et à l'automatisation des tableaux de bord sous Excel et Power BI.

Master CCA, contrôle de gestion ou finance. Rythme 3 jours / 2 jours. 1 100 € brut mensuel.`,
    direct: false,
  }),
  demo({
    id: 'exemple:mistral-com',
    source: 'exemple',
    sourceId: 'mistral-com',
    sourceUrl: '#exemple',
    title: 'Chargé(e) de communication digitale et réseaux sociaux - Alternance',
    company: 'Studio Mistral',
    companySize: 'tpe',
    city: 'Marseille 2e',
    postalCode: '13002',
    contract: 'apprentissage',
    diplomaLevel: 6,
    salaryText: null,
    startDate: '2026-11-02',
    publishedAt: '2026-10-21T05:00:00.000Z',
    description: `Agence de communication de 8 personnes, nous accompagnons des marques locales (restaurants, hôtels, artisans).

Tu animeras les réseaux sociaux de nos clients (Instagram, TikTok, LinkedIn), créeras des contenus (photo, vidéo courte, visuels Canva/Figma) et suivras les statistiques. Tu travailleras en direct avec la fondatrice.

Bac+3 en communication. Esprit créatif, autonomie et polyvalence. Tickets resto. Démarrage novembre.`,
    direct: false,
  }),
];

export const DEMO_OFFERS: Offer[] = offersRaw;

export const DEMO_DECODES: Record<string, DecodedOffer> = {
  'exemple:orvane-etudes': {
    intitule: 'Chargé d’études marketing',
    enClair:
      'Tu aides la responsable études à comprendre ce que les clients pensent des marques du groupe : tu suis les enquêtes, tu analyses les chiffres et tu prépares le bilan de chaque mois.',
    entreprise: { nom: 'Groupe Orvane', taille: 'grande', ceQuElleFait: 'Un groupe international de cosmétiques, présent dans 40 pays.' },
    lieu: { ville: 'Paris 9e', precision: null, teletravail: null },
    missions: [
      { jargon: 'Participer au pilotage des études quantitatives et qualitatives en lien avec les instituts', enClair: 'Tu suis des sondages et des interviews de consommateurs commandés à des sociétés spécialisées, et tu vérifies qu’ils sont livrés à temps.', certitude: 'dit' },
      { jargon: 'Contribuer à l’analyse des données consommateurs et à la formalisation des recommandations', enClair: 'Tu lis les résultats dans Excel et tu en tires deux ou trois conclusions claires pour les équipes.', certitude: 'dit' },
      { jargon: 'Être force de proposition dans la veille concurrentielle', enClair: 'Tu surveilles ce que font les marques concurrentes et tu proposes des idées quand tu repères quelque chose.', certitude: 'dit' },
      { jargon: 'Assurer le reporting mensuel des KPIs marque', enClair: 'Chaque mois, tu mets à jour un tableau des chiffres clés des marques (ventes, notoriété) et tu l’envoies aux équipes.', certitude: 'dit' },
      { jargon: null, enClair: 'Tu fais probablement beaucoup de présentations PowerPoint pour résumer les résultats.', certitude: 'deduit' },
    ],
    semaineType: [
      { moment: 'Lundi matin', activite: 'Point d’équipe et mise à jour du tableau des chiffres de la semaine' },
      { moment: 'Lundi après-midi', activite: 'Lecture des premiers résultats d’une enquête et tri des données dans Excel' },
      { moment: 'Mardi', activite: 'Réunion avec un institut d’études pour caler un questionnaire' },
      { moment: 'Mercredi', activite: 'Veille concurrentielle et préparation de slides de synthèse' },
      { moment: 'Jeudi et vendredi', activite: 'École' },
    ],
    apprentissages: ['Lire et faire parler des données de consommation', 'Piloter un prestataire (institut d’études)', 'Présenter des conclusions à des équipes business', 'Excel avancé et outils de restitution'],
    contrat: { type: 'apprentissage', diplome: 'Bac+4/5 en école de commerce ou université', niveau: 7, duree: '24 mois', debut: 'Janvier 2027', rythme: '3 jours entreprise, 2 jours école' },
    salaire: { annonce: '1 480 € brut mensuel + 13e mois', mensuelBrutEuros: 1480, avantages: ['13e mois', 'Tickets restaurant', 'Transport remboursé à 75 %'] },
    pointsForts: ['Salaire bien au-dessus du minimum légal', 'Grand groupe, bonne ligne sur un CV', 'Missions variées et visibles par la direction'],
    limites: ['Beaucoup de reporting répétitif probable', 'Une « première expérience » est souhaitée : la concurrence sera forte'],
    nonPrecise: ['Le nombre de personnes dans l’équipe', 'Le télétravail possible ou non', 'Les outils utilisés en dehors d’Excel'],
    questionsAPoser: [
      'Combien de personnes compte l’équipe Insights, et qui serait mon ou ma tutrice ?',
      'Quelle part de mon temps irait au reporting mensuel par rapport aux études ?',
      'Quels outils d’analyse utilisez-vous en plus d’Excel ?',
      'Le télétravail est-il possible pour les alternants ?',
    ],
    alertes: [],
    equipe: { service: 'Marketing Insights (études consommateurs)', aContacter: ['Alternant ou alternante en marketing insights', 'Chargé d’études marketing', 'Responsable études / insights manager'], motsCles: ['insights', 'études marketing', 'consumer insights'] },
    aMettreEnAvant: ['Un projet d’analyse de données ou d’enquête mené en cours', 'Ton niveau Excel avec un exemple concret (tableau croisé, graphiques)', 'Une marque de beauté que tu suis et pourquoi'],
    message:
      'Bonjour, je suis [TON PRÉNOM], en [TA FORMATION]. Je candidate à l’alternance en études marketing chez Orvane. Vous qui êtes dans l’équipe Insights : qu’est-ce qui fait qu’un alternant y réussit sa première année ? Merci de votre retour.',
    jargon: [
      { expression: 'Sujets transverses à forte visibilité', traduction: 'Tu travailles avec plusieurs équipes et tes résultats sont vus par des chefs.' },
      { expression: 'Force de proposition', traduction: 'On attend que tu donnes ton avis et que tu proposes des idées, pas seulement que tu exécutes.' },
      { expression: 'Excellent relationnel', traduction: 'Tu vas parler à beaucoup de monde, il faut être à l’aise à l’oral.' },
    ],
  },
  'exemple:fournil-boulanger': {
    intitule: 'Apprenti boulanger',
    enClair: 'Tu apprends le métier de boulanger dans une petite boulangerie de quartier : pains, viennoiseries et mise en place du magasin, très tôt le matin.',
    entreprise: { nom: 'Fournil des Halles', taille: 'tpe', ceQuElleFait: 'Une boulangerie artisanale de quartier.' },
    lieu: { ville: 'Nantes', precision: null, teletravail: null },
    missions: [
      { jargon: 'Fabrication des pains, viennoiseries', enClair: 'Tu pétris, façonnes et cuis le pain et les croissants avec le chef boulanger.', certitude: 'dit' },
      { jargon: 'Mise en place du magasin', enClair: 'Avant l’ouverture, tu ranges les produits en vitrine et en rayon.', certitude: 'dit' },
      { jargon: null, enClair: 'Tu nettoies probablement le fournil et le matériel en fin de service.', certitude: 'deduit' },
    ],
    semaineType: [
      { moment: '5 h', activite: 'Arrivée au fournil, lancement des premières fournées' },
      { moment: '7 h', activite: 'Viennoiseries et mise en place du magasin avant l’ouverture' },
      { moment: '9 h - 11 h', activite: 'Fournées de la journée, préparation des pâtes pour le lendemain' },
      { moment: '12 h', activite: 'Nettoyage et fin de journée' },
    ],
    apprentissages: ['Les gestes de base du boulanger', 'Les pâtes à pain et la viennoiserie', 'L’organisation d’une production quotidienne', 'Les règles d’hygiène'],
    contrat: { type: 'apprentissage', diplome: 'CAP boulanger', niveau: 3, duree: '24 mois', debut: 'Novembre 2026', rythme: '2 semaines en entreprise, 1 semaine au CFA' },
    salaire: { annonce: 'Selon grille légale', mensuelBrutEuros: null, avantages: [] },
    pointsForts: ['Débutant accepté', 'Tu apprends directement avec le chef', 'Horaires fixes et connus d’avance'],
    limites: ['Réveil très tôt toute l’année', 'Salaire au minimum légal', 'Travail le dimanche matin'],
    nonPrecise: ['Le nombre de personnes dans l’équipe', 'Les avantages éventuels (repas, pain offert)'],
    questionsAPoser: ['Qui sera mon maître d’apprentissage au quotidien ?', 'Combien de dimanches par mois travaillerai-je ?', 'Est-ce que je participerai aussi à la pâtisserie ?'],
    alertes: [],
    equipe: { service: 'Fournil', aContacter: ['Gérant ou gérante de la boulangerie', 'Chef boulanger'], motsCles: ['boulangerie', 'boulanger', 'Nantes'] },
    aMettreEnAvant: ['Ta ponctualité, avec un exemple', 'Ce qui te donne envie de faire ce métier', 'Un stage ou un job où tu te levais tôt'],
    message: 'Bonjour, je suis [TON PRÉNOM], je prépare [TA FORMATION]. J’ai vu que vous cherchez un apprenti boulanger. Est-ce que je peux passer au fournil un matin pour voir le travail et vous laisser mon CV ?',
    jargon: [
      { expression: 'Polyvalence', traduction: 'Tu feras un peu de tout : fabrication, magasin, ménage.' },
      { expression: 'Selon grille légale', traduction: 'Tu seras payé au minimum prévu par la loi pour ton âge.' },
    ],
  },
  'exemple:atlas-rh': {
    intitule: 'Assistant ressources humaines (offre d’école)',
    enClair: 'Ce n’est pas une offre d’emploi : c’est une école qui cherche des élèves pour son bachelor RH. L’entreprise n’est pas nommée et on te parle d’inscription et de frais.',
    entreprise: { nom: null, taille: 'inconnue', ceQuElleFait: null },
    lieu: { ville: 'Lyon 3e', precision: null, teletravail: null },
    missions: [
      { jargon: 'Gestion administrative du personnel', enClair: 'Classement de documents, suivi des absences, contrats : des tâches administratives RH classiques.', certitude: 'dit' },
      { jargon: 'Participer au recrutement', enClair: 'Trier des CV et organiser des entretiens, si une entreprise te recrute vraiment.', certitude: 'dit' },
    ],
    semaineType: [{ moment: 'Inconnu', activite: 'Impossible à dire : aucune entreprise n’est nommée.' }],
    apprentissages: ['Rien de vérifiable tant que l’entreprise n’est pas connue'],
    contrat: { type: 'inconnu', diplome: 'Bachelor Ressources Humaines de l’école', niveau: 6, duree: null, debut: 'Rentrée en novembre', rythme: null },
    salaire: { annonce: null, mensuelBrutEuros: null, avantages: [] },
    pointsForts: [],
    limites: ['Aucune entreprise réelle derrière l’annonce', 'Des frais de dossier sont mentionnés'],
    nonPrecise: ['Le nom de l’entreprise', 'Le salaire', 'Le contrat et sa durée', 'Le rythme'],
    questionsAPoser: ['Quel est le nom de l’entreprise qui recrute ?', 'Est-ce que je dois payer quelque chose si aucune entreprise ne me prend ?', 'Combien d’élèves de l’an dernier ont trouvé un contrat, et chez qui ?'],
    alertes: [
      { niveau: 'alerte', texte: 'Annonce publiée par une école qui recrute des élèves « pour ses entreprises partenaires ».' },
      { niveau: 'alerte', texte: 'L’annonce parle de frais de dossier : une vraie entreprise ne te fait jamais payer pour postuler.' },
      { niveau: 'attention', texte: 'On te parle d’entretien d’admission et de rentrée, pas d’embauche.' },
    ],
    equipe: { service: 'Inconnu', aContacter: [], motsCles: [] },
    aMettreEnAvant: [],
    message: 'Bonjour, avant toute inscription, pouvez-vous me donner le nom de l’entreprise qui recrute pour ce poste et confirmer qu’aucun frais n’est demandé ?',
    jargon: [
      { expression: 'Pour le compte de ses entreprises partenaires', traduction: 'L’école n’a pas d’entreprise précise : elle espère t’en trouver une après ton inscription.' },
      { expression: 'Environnement stimulant', traduction: 'Une formule vide, qui ne dit rien du poste.' },
    ],
  },
  'exemple:kerlog-dev': {
    intitule: 'Développeur web full-stack',
    enClair: 'Tu codes de nouvelles fonctionnalités d’un logiciel en ligne utilisé par des transporteurs, au sein d’une équipe de 6 développeurs qui relisent ton code.',
    entreprise: { nom: 'Kerlog Solutions', taille: 'eti', ceQuElleFait: 'Elle édite des logiciels de gestion pour les entreprises de transport.' },
    lieu: { ville: 'Rennes', precision: null, teletravail: '1 jour par semaine après la période d’intégration' },
    missions: [
      { jargon: 'Développement de nouvelles fonctionnalités de notre plateforme SaaS', enClair: 'Tu écris du code TypeScript (React côté écran, Node.js côté serveur) pour ajouter des fonctions au logiciel.', certitude: 'dit' },
      { jargon: 'Participer aux code reviews', enClair: 'Tes collègues relisent ton code avant qu’il parte en production, et tu relis le leur.', certitude: 'dit' },
      { jargon: 'Amélioration continue de la qualité', enClair: 'Tu écris des tests et tu corriges des bugs.', certitude: 'deduit' },
      { jargon: 'Squad agile', enClair: 'L’équipe travaille par cycles courts de deux semaines avec un point rapide chaque matin.', certitude: 'deduit' },
    ],
    semaineType: [
      { moment: 'Chaque matin', activite: 'Point d’équipe de 15 minutes' },
      { moment: 'Lundi', activite: 'Choix des tâches du cycle avec l’équipe' },
      { moment: 'Mardi à jeudi', activite: 'Développement, relectures de code, tests' },
      { moment: 'Vendredi', activite: 'Démo de ce qui a été fait, corrections' },
    ],
    apprentissages: ['Travailler sur un vrai produit utilisé par des clients', 'TypeScript, React, Node.js, PostgreSQL', 'La relecture de code et le travail en équipe', 'Les méthodes agiles'],
    contrat: { type: 'apprentissage', diplome: 'Bac+3 à bac+5 en informatique', niveau: 6, duree: null, debut: 'Décembre 2026', rythme: '1 semaine école, 3 semaines entreprise' },
    salaire: { annonce: '1 300 € brut par mois', mensuelBrutEuros: 1300, avantages: ['Mutuelle', 'RTT', 'Télétravail 1 jour par semaine'] },
    pointsForts: ['Équipe à taille humaine qui relit ton code', 'Technologies très demandées', 'Rythme 1/3 apprécié des entreprises'],
    limites: ['Le secteur du transport est peu connu des étudiants', 'Le télétravail n’arrive qu’après l’intégration'],
    nonPrecise: ['La durée du contrat', 'Qui sera ton tuteur'],
    questionsAPoser: ['Combien de temps dure la période d’intégration avant le télétravail ?', 'Qui sera mon tuteur, et combien de temps par semaine aura-t-il pour moi ?', 'Sur quelle partie du produit travaillerait l’alternant en premier ?'],
    alertes: [],
    equipe: { service: 'Équipe Produit (développement)', aContacter: ['Alternant développeur chez Kerlog', 'Développeur full-stack', 'Lead developer ou CTO'], motsCles: ['développeur', 'full-stack', 'TypeScript'] },
    aMettreEnAvant: ['Un projet perso en React ou Node.js avec le lien GitHub', 'Ta façon de travailler en équipe sur un projet d’école', 'Ton intérêt pour un produit utile au quotidien'],
    message: 'Bonjour, je suis [TON PRÉNOM], en [TA FORMATION]. Je candidate à l’alternance dev full-stack chez Kerlog. Sur quelle partie du produit un alternant commence-t-il en général ? J’ai fait un projet React que je peux vous montrer.',
    jargon: [
      { expression: 'Plateforme SaaS', traduction: 'Un logiciel qu’on utilise dans le navigateur, sans l’installer.' },
      { expression: 'Squad', traduction: 'Une petite équipe qui s’occupe d’une partie du produit.' },
    ],
  },
  'exemple:ventis-maintenance': {
    intitule: 'Technicien de maintenance industrielle',
    enClair: 'Tu entretiens et répares les machines d’une usine qui fabrique des pièces pour l’aéronautique, en équipe du matin ou de l’après-midi.',
    entreprise: { nom: 'Ventis Industrie', taille: 'grande', ceQuElleFait: 'Un groupe industriel de 12 000 personnes qui fabrique des équipements pour l’aéronautique.' },
    lieu: { ville: 'Toulouse', precision: 'Site de production de Toulouse', teletravail: null },
    missions: [
      { jargon: 'Maintenance préventive et curative des lignes de production', enClair: 'Tu entretiens les machines avant qu’elles tombent en panne, et tu les répares quand elles s’arrêtent.', certitude: 'dit' },
      { jargon: 'Diagnostic des pannes mécaniques et électriques', enClair: 'Quand une machine s’arrête, tu cherches pourquoi : une pièce usée, un câble, un capteur.', certitude: 'dit' },
      { jargon: 'Mise en œuvre des plans d’amélioration (TPM)', enClair: 'Tu participes à des actions pour que les machines tombent moins souvent en panne.', certitude: 'dit' },
    ],
    semaineType: [
      { moment: 'Début de poste', activite: 'Point avec l’équipe sortante sur l’état des machines' },
      { moment: 'Matinée', activite: 'Tournée de maintenance préventive sur une ligne' },
      { moment: 'Dans la journée', activite: 'Interventions sur les pannes signalées' },
      { moment: 'Fin de poste', activite: 'Compte rendu des interventions dans le logiciel de maintenance' },
    ],
    apprentissages: ['Le diagnostic de pannes mécaniques et électriques', 'La maintenance dans une grande usine', 'Les méthodes d’amélioration continue', 'La sécurité industrielle'],
    contrat: { type: 'apprentissage', diplome: 'BTS Maintenance des systèmes', niveau: 5, duree: null, debut: 'Janvier 2027', rythme: '2 semaines école, 2 semaines entreprise' },
    salaire: { annonce: '1 250 € brut mensuel + prime d’équipe', mensuelBrutEuros: 1250, avantages: ['Prime d’équipe', 'Restaurant d’entreprise'] },
    pointsForts: ['Salaire bien au-dessus du minimum légal', 'Grand groupe industriel', 'Métier très recherché après le diplôme'],
    limites: ['Horaires en 2x8 (matin ou après-midi selon les semaines)', 'Travail physique, en usine'],
    nonPrecise: ['La durée du contrat', 'Le montant de la prime d’équipe'],
    questionsAPoser: ['Comment s’organisent les équipes 2x8 pendant mes semaines en entreprise ?', 'Quel est le montant de la prime d’équipe ?', 'Est-ce que d’anciens alternants ont été embauchés au service maintenance ?'],
    alertes: [],
    equipe: { service: 'Service Maintenance du site de Toulouse', aContacter: ['Alternant en maintenance chez Ventis', 'Technicien de maintenance', 'Responsable maintenance du site'], motsCles: ['maintenance', 'technicien maintenance', 'Toulouse'] },
    aMettreEnAvant: ['Un projet de bac pro ou de BTS sur une machine', 'Ton habilitation électrique si tu l’as', 'Ta capacité à travailler en horaires décalés'],
    message: 'Bonjour, je suis [TON PRÉNOM], en [TA FORMATION]. Je postule à l’alternance en maintenance chez Ventis à Toulouse. Qu’est-ce qui aide le plus un alternant à s’intégrer dans votre équipe ? Merci d’avance.',
    jargon: [
      { expression: 'Préventive et curative', traduction: 'Préventive : avant la panne. Curative : après la panne.' },
      { expression: 'TPM', traduction: 'Une méthode d’entretien où tout le monde aide à garder les machines en bon état.' },
      { expression: '2x8', traduction: 'Deux équipes : une le matin, une l’après-midi, en alternance.' },
    ],
  },
  'exemple:sorel-vente': {
    intitule: 'Conseiller de vente en boutique',
    enClair: 'Tu accueilles et conseilles les clients d’une boutique de vêtements à Bordeaux, tu encaisses et tu remets les rayons en ordre.',
    entreprise: { nom: 'Maison Sorel', taille: 'pme', ceQuElleFait: 'Une enseigne de vêtements avec 4 boutiques.' },
    lieu: { ville: 'Bordeaux', precision: 'Boutique de Bordeaux centre', teletravail: null },
    missions: [
      { jargon: 'Accueil et conseil client', enClair: 'Tu dis bonjour, tu aides les clients à trouver une taille ou un style.', certitude: 'dit' },
      { jargon: 'Réassort et mise en rayon', enClair: 'Tu remets en rayon les articles depuis la réserve.', certitude: 'dit' },
      { jargon: 'Participation aux inventaires', enClair: 'Une ou deux fois par an, tu comptes tout le stock de la boutique.', certitude: 'dit' },
    ],
    semaineType: [
      { moment: 'Ouverture', activite: 'Mise en place de la boutique et des nouveautés' },
      { moment: 'Journée', activite: 'Conseil client et encaissement' },
      { moment: 'Creux de l’après-midi', activite: 'Réassort depuis la réserve' },
      { moment: 'Samedi', activite: 'Journée la plus chargée, probablement travaillée' },
    ],
    apprentissages: ['La vente et le conseil client', 'L’encaissement et la gestion de caisse', 'Le fonctionnement d’une boutique'],
    contrat: { type: 'professionnalisation', diplome: null, niveau: 4, duree: '12 mois', debut: 'Dès que possible', rythme: null },
    salaire: { annonce: 'Selon profil', mensuelBrutEuros: null, avantages: [] },
    pointsForts: ['Démarrage rapide', 'Petite enseigne, ambiance probablement familiale'],
    limites: ['Le salaire n’est pas chiffré', 'Le diplôme préparé n’est pas indiqué', 'Le samedi est probablement travaillé'],
    nonPrecise: ['Le diplôme ou le titre préparé', 'Le rythme école / entreprise', 'Le salaire', 'Les horaires'],
    questionsAPoser: ['Quel diplôme ou titre prépare-t-on avec ce contrat, et dans quel organisme ?', 'Quel est le rythme entre la boutique et la formation ?', 'Quel salaire est prévu pour mon âge ?', 'Combien de samedis par mois travaillerai-je ?'],
    alertes: [{ niveau: 'attention', texte: 'Ni le diplôme préparé ni le rythme ne sont indiqués : demande-les avant de signer.' }],
    equipe: { service: 'Boutique de Bordeaux centre', aContacter: ['Responsable de la boutique de Bordeaux', 'Conseiller de vente chez Maison Sorel'], motsCles: ['Maison Sorel', 'vente', 'Bordeaux'] },
    aMettreEnAvant: ['Un job où tu étais en contact avec des clients', 'Ton style et ce que tu aimes dans la mode', 'Tes disponibilités le samedi'],
    message: 'Bonjour, je suis [TON PRÉNOM]. J’ai vu l’offre de conseiller de vente en contrat pro à Bordeaux. Quel diplôme prépare-t-on avec ce contrat ? Je peux passer en boutique déposer mon CV.',
    jargon: [{ expression: 'Selon profil', traduction: 'Le salaire n’est pas fixé : il dépend de ton âge et de ta négociation. Au minimum, c’est la grille légale.' }],
  },
  'exemple:delorme-cdg': {
    intitule: 'Assistant contrôleur de gestion',
    enClair: 'Tu aides le directeur financier à suivre l’argent de l’entreprise : préparer le budget, vérifier chaque mois ce qui a été dépensé et automatiser les tableaux de chiffres.',
    entreprise: { nom: 'Delorme Distribution', taille: 'pme', ceQuElleFait: 'Elle distribue du matériel électrique (80 salariés).' },
    lieu: { ville: 'Lille', precision: null, teletravail: null },
    missions: [
      { jargon: 'Élaboration du budget', enClair: 'Tu aides à prévoir combien l’entreprise va gagner et dépenser l’an prochain.', certitude: 'dit' },
      { jargon: 'Suivi des écarts', enClair: 'Chaque mois, tu compares ce qui était prévu avec ce qui s’est passé et tu cherches pourquoi ça diffère.', certitude: 'dit' },
      { jargon: 'Clôture mensuelle', enClair: 'En fin de mois, tu aides à arrêter les comptes du mois.', certitude: 'dit' },
      { jargon: 'Automatisation des tableaux de bord', enClair: 'Tu rends automatiques des tableaux Excel et Power BI qui sont aujourd’hui faits à la main.', certitude: 'dit' },
    ],
    semaineType: [
      { moment: 'Début de mois', activite: 'Clôture : récupérer les chiffres, vérifier, corriger' },
      { moment: 'Milieu de mois', activite: 'Analyse des écarts et point avec le directeur financier' },
      { moment: 'Le reste du temps', activite: 'Construction de tableaux automatiques sous Power BI' },
      { moment: 'Jeudi et vendredi', activite: 'École' },
    ],
    apprentissages: ['Le contrôle de gestion dans une PME', 'Excel et Power BI', 'Le budget et la clôture mensuelle', 'Travailler en direct avec un directeur financier'],
    contrat: { type: 'apprentissage', diplome: 'Master CCA, contrôle de gestion ou finance', niveau: 7, duree: null, debut: 'Janvier 2027', rythme: '3 jours entreprise, 2 jours école' },
    salaire: { annonce: '1 100 € brut mensuel', mensuelBrutEuros: 1100, avantages: [] },
    pointsForts: ['Tu travailles en direct avec le directeur financier', 'Missions complètes, du budget à la clôture', 'Power BI, très recherché'],
    limites: ['Salaire proche du minimum légal pour ton âge', 'Peu d’avantages annoncés'],
    nonPrecise: ['La durée du contrat', 'Les avantages (tickets resto, transport)'],
    questionsAPoser: ['Quelle part de mon temps serait sur Power BI ?', 'Combien de personnes compte le service financier ?', 'Le contrat dure-t-il un ou deux ans ?'],
    alertes: [],
    equipe: { service: 'Direction administrative et financière', aContacter: ['Directeur administratif et financier', 'Contrôleur de gestion', 'Comptable'], motsCles: ['contrôle de gestion', 'DAF', 'finance'] },
    aMettreEnAvant: ['Un tableau de bord que tu as construit (même en cours)', 'Ton niveau sur Excel et Power BI', 'Un cas d’analyse d’écarts vu en cours'],
    message: 'Bonjour, je suis [TON PRÉNOM], en [TA FORMATION]. Je postule à l’alternance en contrôle de gestion chez Delorme. Quels tableaux de bord aimeriez-vous automatiser en premier ? J’ai déjà travaillé sur Power BI.',
    jargon: [{ expression: 'Clôture mensuelle', traduction: 'Le moment, chaque début de mois, où l’on arrête les comptes du mois passé.' }],
  },
  'exemple:mistral-com': {
    intitule: 'Chargé de communication digitale',
    enClair: 'Tu gères les réseaux sociaux de restaurants, hôtels et artisans marseillais : tu crées les posts et vidéos, tu les publies et tu regardes ce qui marche.',
    entreprise: { nom: 'Studio Mistral', taille: 'tpe', ceQuElleFait: 'Une agence de communication de 8 personnes pour des marques locales.' },
    lieu: { ville: 'Marseille 2e', precision: null, teletravail: null },
    missions: [
      { jargon: 'Animer les réseaux sociaux de nos clients', enClair: 'Tu publies et réponds aux commentaires sur Instagram, TikTok et LinkedIn pour plusieurs clients.', certitude: 'dit' },
      { jargon: 'Créer des contenus', enClair: 'Tu prends des photos, tournes des vidéos courtes et fais des visuels sur Canva ou Figma.', certitude: 'dit' },
      { jargon: 'Suivre les statistiques', enClair: 'Tu regardes chaque semaine quels posts ont marché et tu l’expliques au client.', certitude: 'dit' },
    ],
    semaineType: [
      { moment: 'Lundi', activite: 'Planning des posts de la semaine avec la fondatrice' },
      { moment: 'Mardi et mercredi', activite: 'Tournages et photos chez les clients' },
      { moment: 'Jeudi', activite: 'Montage et visuels' },
      { moment: 'Vendredi', activite: 'Statistiques et compte rendu aux clients' },
    ],
    apprentissages: ['Créer du contenu pour plusieurs marques', 'Les statistiques des réseaux sociaux', 'Travailler avec de vrais clients', 'Canva, Figma et le montage vidéo court'],
    contrat: { type: 'apprentissage', diplome: 'Bac+3 en communication', niveau: 6, duree: null, debut: 'Novembre 2026', rythme: null },
    salaire: { annonce: null, mensuelBrutEuros: null, avantages: ['Tickets restaurant'] },
    pointsForts: ['Tu travailles en direct avec la fondatrice', 'Missions très concrètes, sur le terrain', 'Un portfolio à montrer à la fin'],
    limites: ['Petite structure : beaucoup d’autonomie dès le début', 'Salaire non indiqué'],
    nonPrecise: ['Le salaire', 'Le rythme école / entreprise', 'La durée du contrat'],
    questionsAPoser: ['Combien de clients gérerais-je en même temps ?', 'Quel salaire proposez-vous pour mon âge et mon année ?', 'Quel rythme d’alternance vous convient ?'],
    alertes: [{ niveau: 'attention', texte: 'Le salaire n’est pas indiqué : vérifie qu’il respecte au moins le minimum légal.' }],
    equipe: { service: 'L’agence entière (8 personnes)', aContacter: ['Fondatrice de Studio Mistral', 'Community manager chez Studio Mistral'], motsCles: ['Studio Mistral', 'community manager', 'Marseille'] },
    aMettreEnAvant: ['Un compte ou un projet que tu as fait grandir', 'Deux ou trois contenus que tu as créés', 'Ta connaissance des restaurants et commerces de Marseille'],
    message: 'Bonjour, je suis [TON PRÉNOM], en [TA FORMATION]. J’ai vu votre offre d’alternance en communication digitale. Je crée des vidéos courtes depuis deux ans, est-ce que je peux vous envoyer trois exemples ?',
    jargon: [
      { expression: 'Polyvalence', traduction: 'Dans une petite agence, tu feras un peu de tout.' },
      { expression: 'Autonomie', traduction: 'On ne sera pas toujours derrière toi : il faudra t’organiser seul.' },
    ],
  },
};
