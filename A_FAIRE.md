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

## 3. Ménage Vercel

Supprimer les projets en double `decode-alternance-m3u6` et `decode-alternance-m3u699` (Settings, tout en bas, Delete Project).

## 4. Avant de faire connaître le site

Remplir les mentions légales (`app/mentions-legales/page.tsx`) : nom ou raison sociale, adresse, SIREN, hébergeur, e-mail de contact.

## Sécurité

Changer le mot de passe francetravail.io : il a été visible sur une capture d'écran.
