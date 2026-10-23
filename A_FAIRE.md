# À faire pour que Décode marche en vrai

Ce que seul le propriétaire des comptes peut faire. Le code est prêt : dès que les clés sont dans Vercel, tout se met à jour tout seul.

## 1. Les vraies offres (France Travail)

1. Sur francetravail.io : finir la création du compte (cocher les CGU, valider l'e-mail).
2. Créer une application « Décode » et l'abonner à l'API **Offres d'emploi v2**.
3. Ouvrir l'application et copier l'**Identifiant client** et la **Clé secrète**.
4. Vercel, projet decode-alternance, Settings, Environment Variables
   (https://vercel.com/karma16/decode-alternance/settings/environment-variables), deux variables, « Sensitive » coché :
   - Key `FRANCE_TRAVAIL_CLIENT_ID`, Value : l'identifiant client
   - Key `FRANCE_TRAVAIL_CLIENT_SECRET`, Value : la clé secrète
5. Save, puis Deployments, « ⋯ » sur le dernier, Redeploy.

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
3. SMS (optionnel, payant à l'envoi) : compte sur brevo.com, acheter des crédits SMS, créer une clé API → `BREVO_API_KEY`.
4. `AUTH_SECRET` : une longue phrase aléatoire (sert à protéger les codes et les sessions).
5. `ADMIN_EMAILS` : ton adresse e-mail (séparées par des virgules s'il y en a plusieurs) pour accéder à la modération de la commu (`/communaute/moderation`).
   La même page liste les entreprises inscrites sur `/recruteur` : vérifie le SIRET (lien vers l'annuaire officiel) et le site avant de cliquer « Vérifier ». Sans cette étape, une entreprise ne voit aucun alternant.
   Elle liste aussi les avis d'entreprise à relire (« Publier » ou « Refuser ») : refuse ceux qui nomment une personne ou accusent sans fait précis.
   `LEGAL_CONTACT` sert aussi d'adresse de signalement dans les e-mails que les entreprises envoient aux alternants.
6. Redeploy. Pour les alertes du matin : mêmes valeurs dans GitHub, Settings, Secrets and variables, Actions.

## 4. Décode Pro (Stripe)

Sans ces réglages, la page `/pro` affiche « Bientôt » et rien n'est vendu.

1. Crée un compte sur stripe.com (statut micro-entreprise ou société nécessaire pour recevoir l'argent).
2. **Catalogue de produits → Ajouter un produit** : « Décode Pro », prix **récurrent mensuel**. Suggestion : 2,99 €. Copie l'identifiant du prix (`price_...`) dans Vercel : `STRIPE_PRICE_ID`. Le site affiche toujours le prix de Stripe, jamais un prix écrit en dur.
3. **Développeurs → Clés API** : la clé secrète (`sk_live_...`) dans Vercel : `STRIPE_SECRET_KEY`. Ne la colle jamais dans un chat.
4. **Développeurs → Webhooks → Ajouter un endpoint** : `https://TON-SITE/api/pro/webhook`, événements `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copie le secret de signature (`whsec_...`) dans Vercel : `STRIPE_WEBHOOK_SECRET`.
5. **Paramètres → Facturation → Portail client** : active « Mettre à jour le moyen de paiement » et « Historique des factures ».
6. Choisis un **médiateur de la consommation** (obligatoire pour vendre à des particuliers, une centaine d'euros par an) et mets son nom et son site dans `LEGAL_MEDIATOR`.
7. Micro-entrepreneur sans TVA : ajoute la mention « TVA non applicable, art. 293 B du CGI » dans Stripe (Paramètres → Factures → Pied de page).
8. Fais relire `/cgv` par quelqu'un de compétent avant d'encaisser le premier euro.
9. Les alertes horaires de Pro tournent avec GitHub Actions (16 fois par jour). Sur un dépôt privé, ça consomme environ la moitié des 2 000 minutes gratuites par mois.

## 5. Ménage Vercel

Supprimer les projets en double `decode-alternance-m3u6` et `decode-alternance-m3u699` (Settings, tout en bas, Delete Project).

## 6. Avant de faire connaître le site

- Mentions légales (obligatoires) : dans Vercel, ajouter `LEGAL_EDITOR` (nom ou micro-entreprise), `LEGAL_ADDRESS`, `LEGAL_SIREN`, `LEGAL_CONTACT` (e-mail dédié), puis Redeploy. L'hébergeur est déjà rempli.
- Un domaine (.fr) : l'acheter, le brancher dans Vercel (Settings, Domains), puis mettre `NEXT_PUBLIC_SITE_URL` à la nouvelle adresse.
- La bonne alternance : envoyer la demande d'accès à leur API (le mail est prêt dans la conversation).

## Sécurité

Changer le mot de passe francetravail.io : il a été visible sur une capture d'écran.
