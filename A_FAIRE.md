# À faire pour que Décode marche en vrai

Ce que seul le propriétaire des comptes peut faire. Le code est prêt : dès que les clés sont dans Vercel, tout se met à jour tout seul.

## Le domaine

Tu possèdes **décode-alternance.fr** (avec accent, chez Gandi). C'est l'adresse officielle du site. **decode-alternance.fr** (sans accent) n'est pas acheté : n'importe qui peut le prendre.

Pour passer au domaine sans accent :
1. Achète `decode-alternance.fr` (Gandi ou Vercel, autour d'une dizaine d'euros par an).
2. Chez le registrar, fais pointer `decode-alternance.fr` et `www.decode-alternance.fr` vers Vercel (les valeurs exactes sont dans Vercel, Settings, Domains). Les deux sont déjà ajoutés au projet.
3. Une fois que `https://www.decode-alternance.fr` s'ouvre, change `NEXT_PUBLIC_SITE_URL` dans Vercel en `https://www.decode-alternance.fr`, puis Redeploy. Le domaine avec accent y redirigera tout seul (next.config.ts).

Ne change jamais `NEXT_PUBLIC_SITE_URL` vers un domaine qui ne s'ouvre pas encore : le site deviendrait inaccessible.

## 1. Les vraies offres (France Travail)

1. Sur francetravail.io : finir la création du compte (cocher les CGU, valider l'e-mail).
2. Créer une application « Décode » et l'abonner à l'API **Offres d'emploi v2**.
3. Ouvrir l'application et copier l'**Identifiant client** et la **Clé secrète**.
4. Vercel, projet decode-alternance, Settings, Environment Variables
   (https://vercel.com/karma16/decode-alternance/settings/environment-variables), deux variables, « Sensitive » coché :
   - Key `FRANCE_TRAVAIL_CLIENT_ID`, Value : l'identifiant client
   - Key `FRANCE_TRAVAIL_CLIENT_SECRET`, Value : la clé secrète
5. Save, puis Deployments, « ⋯ » sur le dernier, Redeploy.

## 0. Toutes les offres d'alternance, chaque matin (Neon + GitHub, gratuit)

1. neon.tech → Sign up (avec GitHub ou Google) → Create project : nom `decode`, région **Europe (Frankfurt)**, Postgres par défaut.
2. Sur le tableau de bord du projet : **Connect** → copier la « connection string » (elle commence par `postgresql://`, case « Pooled connection » cochée).
3. Vercel → Settings → Environment Variables : `DATABASE_URL` = la connection string (Sensitive). Puis Redeploy.
4. GitHub → dépôt decode-alternance → Settings → Secrets and variables → Actions → New repository secret :
   - `DATABASE_URL` = la même connection string
   - `LBA_API_TOKEN` = ton jeton La bonne alternance
5. GitHub → onglet **Actions** → « Collecte des offres » → **Run workflow**. 15 à 30 minutes. Les tables se créent toutes seules.
6. Ensuite, la collecte repasse chaque nuit vers 4 h (heure UTC). Le site lit la base : toutes les offres, plus de 404.

## 1 ter. La bonne alternance (gratuit, la meilleure source)

Jeton personnel obtenu sur api.apprentissage.beta.gouv.fr → `LBA_API_TOKEN` dans Vercel, puis Redeploy. Le jeton est valable un an : penser à le renouveler.

## 1 bis. Plus d'offres, tout de suite : Adzuna et Jooble (gratuit)

Deux agrégateurs qui regroupent les annonces de centaines de sites. Leurs offres s'ajoutent à celles de France Travail ou de la base, sans doublons ni offres d'écoles. Il n'y a pas d'API qui donne 100 % des offres : personne ne les a toutes.

1. Adzuna : compte sur **developer.adzuna.com** (clé immédiate) → `ADZUNA_APP_ID` et `ADZUNA_APP_KEY` dans Vercel.
2. Jooble : demande de clé sur **jooble.org/api/about** (réponse par e-mail) → `JOOBLE_API_KEY`.
3. Redeploy. Une seule des deux suffit pour que la page Offres affiche de vraies annonces.

Leurs conditions demandent de les citer (c'est fait sous la liste des offres) et de passer par leurs liens pour postuler (c'est le cas).

## 2. Le bouton « Décoder » (gratuit avec Google Gemini)

1. aistudio.google.com, connexion avec un compte Google, « Get API key », « Create API key ». Pas de carte bancaire.
2. Vercel : `AI_PROVIDER` = `gemini`, `AI_API_KEY` = la clé (Sensitive coché). Puis Redeploy.
3. Le palier gratuit limite le nombre d'appels par jour : `AI_DAILY_LIMIT` (200 par défaut) arrête les traductions avant. Une offre déjà traduite ne coûte plus rien.
4. Autres choix gratuits : `mistral` (console.mistral.ai, offre Experiment) ou `groq` (console.groq.com).
5. Plus tard, pour une meilleure qualité : `ANTHROPIC_API_KEY` (payant), prioritaire si présente.

## 3. Les comptes, les alertes et la commu

Le code est prêt ; il s'allume quand ces clés sont dans Vercel (et dans les secrets GitHub pour les alertes du matin).

1. Base de données gratuite : créer un projet sur neon.tech, copier la « connection string » → `DATABASE_URL`. Les tables se créent toutes seules.
2. E-mails : compte sur resend.com, vérifier le domaine (ou tester avec l'adresse de test), créer une clé → `RESEND_API_KEY`, et `EMAIL_FROM` (ex. `Décode <bonjour@ton-domaine.fr>`).
3. SMS (optionnel, payant à l'envoi) : compte sur brevo.com, acheter des crédits SMS, créer une clé API → `BREVO_API_KEY`. Gratuits pour les alternants, ils sont limités à un par semaine et par personne pour garder la facture sous contrôle.
4. `AUTH_SECRET` : une longue phrase aléatoire (sert à protéger les codes et les sessions).
5. `ADMIN_EMAILS` : ton adresse e-mail (séparées par des virgules s'il y en a plusieurs) pour accéder à la modération de la commu (`/communaute/moderation`).
   La même page liste les entreprises inscrites sur `/recruteur` : vérifie le SIRET (lien vers l'annuaire officiel) et le site avant de cliquer « Vérifier ». Sans cette étape, une entreprise ne voit aucun alternant.
   Elle liste aussi les avis d'entreprise à relire (« Publier » ou « Refuser ») : refuse ceux qui nomment une personne ou accusent sans fait précis.
   `LEGAL_CONTACT` sert aussi d'adresse de signalement dans les e-mails que les entreprises envoient aux alternants.
6. Redeploy. Pour les alertes du matin : mêmes valeurs dans GitHub, Settings, Secrets and variables, Actions.

## 4. La mise en avant des entreprises (Stripe)

Décode est gratuit pour les alternants. Ce qui se vend : la mise en avant, un abonnement mensuel réservé aux entreprises vérifiées (au plus deux offres en tête des recherches qui leur correspondent, toujours marquées « Sponsorisé », plus les vues, les clics et les alternants intéressés). Sans ces réglages, la page `/pro` affiche « Bientôt » et rien n'est vendu.

1. Crée un compte sur stripe.com (statut micro-entreprise ou société nécessaire pour recevoir l'argent).
2. **Catalogue de produits → Ajouter un produit** : « Mise en avant Décode », prix **récurrent mensuel**, en hors taxes. Le montant est ton choix : tant que l'audience est petite, un prix d'entrée modeste (quelques dizaines d'euros HT par mois) rend la première vente plus facile ; tu le monteras avec les chiffres de vues du tableau de bord. Copie l'identifiant du prix (`price_...`) dans Vercel : `STRIPE_PRICE_ID`. Le site affiche toujours le prix de Stripe, jamais un prix écrit en dur.
3. **Développeurs → Clés API** : la clé secrète (`sk_live_...`) dans Vercel : `STRIPE_SECRET_KEY`. Ne la colle jamais dans un chat.
4. **Développeurs → Webhooks → Ajouter un endpoint** : `https://xn--dcode-alternance-bqb.fr/api/pro/webhook` (l'adresse officielle du moment, voir « Le domaine »), événements `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copie le secret de signature (`whsec_...`) dans Vercel : `STRIPE_WEBHOOK_SECRET`.
5. **Paramètres → Facturation → Portail client** : active « Mettre à jour le moyen de paiement », « Historique des factures » et « Annuler l'abonnement » (à la fin de la période).
6. Micro-entrepreneur sans TVA : ajoute la mention « TVA non applicable, art. 293 B du CGI » dans Stripe (Paramètres → Factures → Pied de page).
7. Vérifie chaque entreprise dans `/communaute/moderation` (SIRET et site) : seules les entreprises vérifiées peuvent s'abonner et être mises en avant.
8. Fais relire `/cgv` par quelqu'un de compétent avant d'encaisser le premier euro. Comme on ne vend qu'à des professionnels, pas besoin de médiateur de la consommation.

## 4 bis. Encore plus d'offres : les partenariats

La collecte lit déjà France Travail, La bonne alternance, les logiciels de recrutement des entreprises (Greenhouse, Lever, SmartRecruiters, Ashby, Recruitee, Personio) et les sites carrière. Pour aller plus loin, il faut l'accord des plateformes, jamais leur aspiration :

1. **Welcome to the Jungle** : leur logiciel Welcome Kit a une API pour les entreprises clientes. Proposer un partenariat de diffusion (Décode leur envoie des candidats).
2. **JobTeaser** : partenariat écoles et entreprises ; demander un flux d'offres d'alternance.
3. **Indeed** et **HelloWork** : programmes de partenaires éditeurs (flux XML d'offres contre trafic).
4. **LinkedIn** : pas d'API d'offres ouverte ; seulement des partenariats pour les éditeurs de logiciels de recrutement.
5. **Le plus efficace à terme** : que les entreprises publient leurs offres d'alternance directement sur Décode (espace entreprise `/recruteur`, gratuit au lancement). C'est ainsi que Welcome to the Jungle a construit sa base.

## 5. Ménage Vercel

Les projets en double `decode-alternance-m3u6` et `decode-alternance-m3u699` ne construisent plus rien (étape de build ignorée). Pour les supprimer : Settings, tout en bas, Delete Project.

## 6. Avant de faire connaître le site

- Mentions légales (obligatoires) : dans Vercel, ajouter `LEGAL_EDITOR` (nom ou micro-entreprise), `LEGAL_ADDRESS`, `LEGAL_SIREN`, `LEGAL_CONTACT` (e-mail dédié), puis Redeploy. L'hébergeur est déjà rempli.
- Un domaine (.fr) : l'acheter, le brancher dans Vercel (Settings, Domains), puis mettre `NEXT_PUBLIC_SITE_URL` à la nouvelle adresse.
- La bonne alternance : envoyer la demande d'accès à leur API (le mail est prêt dans la conversation).

## Sécurité

Changer le mot de passe francetravail.io : il a été visible sur une capture d'écran.
