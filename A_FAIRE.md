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

## 2. Le bouton « Décoder » (Anthropic)

1. console.anthropic.com, Settings, API Keys, Create Key ; ajouter quelques euros de crédit dans Billing.
2. Vercel : Key `ANTHROPIC_API_KEY`, Value : la clé. Puis Redeploy.

## 3. Les comptes, les alertes et la commu

Le code est prêt ; il s'allume quand ces clés sont dans Vercel (et dans les secrets GitHub pour les alertes du matin).

1. Base de données gratuite : créer un projet sur neon.tech, copier la « connection string » → `DATABASE_URL`. Les tables se créent toutes seules.
2. E-mails : compte sur resend.com, vérifier le domaine (ou tester avec l'adresse de test), créer une clé → `RESEND_API_KEY`, et `EMAIL_FROM` (ex. `Décode <bonjour@ton-domaine.fr>`).
3. SMS (optionnel, payant à l'envoi) : compte sur brevo.com, acheter des crédits SMS, créer une clé API → `BREVO_API_KEY`.
4. `AUTH_SECRET` : une longue phrase aléatoire (sert à protéger les codes et les sessions).
5. `ADMIN_EMAILS` : ton adresse e-mail (séparées par des virgules s'il y en a plusieurs) pour accéder à la modération de la commu (`/communaute/moderation`).
   La même page liste les entreprises inscrites sur `/recruteur` : vérifie le SIRET (lien vers l'annuaire officiel) et le site avant de cliquer « Vérifier ». Sans cette étape, une entreprise ne voit aucun alternant.
   `LEGAL_CONTACT` sert aussi d'adresse de signalement dans les e-mails que les entreprises envoient aux alternants.
6. Redeploy. Pour les alertes du matin : mêmes valeurs dans GitHub, Settings, Secrets and variables, Actions.

## 4. Ménage Vercel

Supprimer les projets en double `decode-alternance-m3u6` et `decode-alternance-m3u699` (Settings, tout en bas, Delete Project).

## 5. Avant de faire connaître le site

- Mentions légales (obligatoires) : dans Vercel, ajouter `LEGAL_EDITOR` (nom ou micro-entreprise), `LEGAL_ADDRESS`, `LEGAL_SIREN`, `LEGAL_CONTACT` (e-mail dédié), puis Redeploy. L'hébergeur est déjà rempli.
- Un domaine (.fr) : l'acheter, le brancher dans Vercel (Settings, Domains), puis mettre `NEXT_PUBLIC_SITE_URL` à la nouvelle adresse.
- La bonne alternance : envoyer la demande d'accès à leur API (le mail est prêt dans la conversation).

## Sécurité

Changer le mot de passe francetravail.io : il a été visible sur une capture d'écran.
