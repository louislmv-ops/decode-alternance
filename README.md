# Décode

Les offres d’alternance traduites en clair, pour les 18-25 ans qui cherchent un contrat.

Tu colles une offre (ou tu en ouvres une dans la liste) et Décode te dit :

- ce que tu feras vraiment, mission par mission, avec la source de chaque info : écrite dans l’annonce, déduite ou inconnue ;
- une semaine probable et ce que tu vas apprendre ;
- ton salaire minimum légal, calculé au centime pour ton âge et ton année, comparé au salaire annoncé ;
- si le rythme colle avec ton école ;
- les pièges : fausses offres d’écoles, frais demandés, salaire sous le minimum ;
- le service à viser, les recherches LinkedIn à lancer toi-même et un message de 300 caractères.

Les offres « pépites » (grande entreprise, ou salaire au moins 20 % au-dessus de ton minimum) sont surlignées en menthe. Les alertes sont en rouge.

Autour de ça : un calculateur de salaire et de coût employeur (aides 2026 comprises), un suivi des candidatures avec relances, la méthode « Trouver l’équipe » et un profil qui reste dans le navigateur.

Décode ne garantit ni contrat, ni entretien, ni réponse.

## Démarrer

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # tests unitaires (règles, normalisation, connecteurs, suivi)
pnpm lint
pnpm typecheck
pnpm build
```

Node 22 ou plus. Sans aucune variable d’environnement, le site fonctionne avec 8 offres d’exemple fictives, signalées comme telles partout, et leur traduction rédigée à la main.

## Variables d’environnement

Voir `.env.example`. Les trois qui changent tout :

| Variable | Sans elle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Le bouton « Décoder » est désactivé ; seuls les exemples sont traduits. |
| `DATABASE_URL` | La page Offres montre les exemples fictifs. |
| `FRANCE_TRAVAIL_CLIENT_ID` et `_SECRET` | La collecte saute France Travail. |

## Brancher les vraies offres

1. Créer une base Postgres et lancer `psql "$DATABASE_URL" -f db/schema.sql`.
2. Créer un compte sur francetravail.io et une application abonnée à l’API Offres d’emploi v2. Mettre les identifiants dans `.env.local`.
3. Tester sur deux départements : `pnpm ingest --dep 35,56`. Le script affiche le nombre d’offres lues.
4. Collecte quotidienne : le workflow GitHub Actions `.github/workflows/ingest.yml` lance `pnpm ingest` chaque jour à 4 h 17 (UTC), et on peut le lancer à la main depuis l’onglet Actions. Créer les secrets `DATABASE_URL`, `FRANCE_TRAVAIL_CLIENT_ID`, `FRANCE_TRAVAIL_CLIENT_SECRET` et `BOT_CONTACT` dans les réglages du dépôt. Une offre qui n’est plus revue pendant 36 h est retirée. Le plan Hobby de Vercel n’autorise qu’un cron par jour et des fonctions courtes, d’où ce choix ; la route `/api/cron/ingest` (une tranche de départements par appel, protégée par `CRON_SECRET`) reste disponible pour un plan Pro.

Points à vérifier au premier lancement, que je n’ai pas pu tester depuis l’environnement de développement (aucun accès réseau sortant) : l’adresse du jeton OAuth, le nom du scope et le format des réponses de l’API France Travail. Le connecteur lit les codes de contrat d’alternance dans le référentiel de l’API plutôt que de les coder en dur.

### Les sites carrière du CAC 40

`lib/offers/companies.ts` liste les entreprises. Le connecteur générique (`lib/offers/connectors/job-posting.ts`) lit le balisage public `JobPosting` que les sites carrière publient pour Google, en respectant `robots.txt`, une requête à la fois avec une pause, et garde le lien vers l’offre d’origine.

Pour chaque entreprise : trouver l’adresse du site carrière, lancer `pnpm ingest --site <adresse>`, et si des offres d’alternance remontent, renseigner `careersUrl`. Un site non renseigné est ignoré. La composition du CAC 40 change chaque trimestre : vérifier la liste sur euronext.com.

## Ce qu’il faut savoir côté légal

- **API La bonne alternance : non utilisée.** Ses conditions réservent l’API aux usages non lucratifs et interdisent de faire payer l’accès aux candidats. Un Pass payant serait incompatible. Si tu veux ces offres, écris d’abord à l’équipe La bonne alternance.
- **France Travail** : la licence autorise la rediffusion des offres, pas des coordonnées de contact. Le connecteur ne les lit pas.
- **Autres sites d’emploi** (Indeed, HelloWork, Welcome to the Jungle, LinkedIn) : pas d’aspiration. Une base d’annonces est protégée par le droit des producteurs de bases de données. Il faut passer par un partenariat ou un flux officiel. En attendant, la fonction « colle une offre » couvre tous les sites sans risque.
- **LinkedIn** : Décode ne lit rien et n’écrit à personne. Il génère des liens de recherche que la personne ouvre avec son propre compte. La CNIL a sanctionné l’aspiration de coordonnées LinkedIn (Kaspr, 240 000 €, 2024).
- **Données** : le profil et le suivi restent dans le navigateur. Le texte collé part chez Anthropic pour la traduction et n’est pas conservé par Décode. `app/mentions-legales` contient des champs `[ENTRE CROCHETS]` à remplir avant la mise en ligne.

## Coût de l’IA

Chaque traduction appelle `claude-opus-5-5` (4 $ par million de jetons en entrée, 20 $ en sortie), avec un format de réponse strict validé par Zod et un repli automatique si le modèle décline. Ordre de grandeur, à mesurer en vrai : quelques centimes par offre. Les traductions des offres de la base sont gardées dans `offer_decodes`, donc payées une seule fois par offre. `DECODE_MODEL` permet de changer de modèle ; c’est un arbitrage coût et qualité à faire en connaissance de cause.

## Règles légales et valeurs à tenir à jour

`lib/rules/reference.ts` regroupe toutes les valeurs, chacune avec sa date et sa source :

- SMIC : 12,31 € brut de l’heure depuis le 1er juin 2026.
- Grilles de rémunération : apprentissage (D6222-26) et contrat pro (L6325-8, D6325-15).
- Aides à l’employeur 2026 : décret n° 2026-168, contrats conclus du 8 mars au 31 décembre 2026.
- Participation de 750 € pour un bac+3 et plus.
- Délai de 3 mois sans employeur : L6222-12-1.

À revoir à chaque revalorisation du SMIC et chaque nouveau décret ; les tests de `lib/rules/rules.test.ts` cassent alors volontairement.

## Design

Direction tirée avec le skill tasteskill (« One motif », graine 1214231901) : le motif est le trait de surligneur, un parallélogramme à bout biseauté, qui porte la menthe `#a1ffcb`. Police Bricolage Grotesque, auto-hébergée (la police tirée au départ, General Sans, n’était pas disponible hors ligne). L’appli suit le style « Achromatic ledger » : pas de couleur dans l’habillage, la menthe seulement sur ce qui compte.

Pas encore de vraies photos : l’environnement de développement n’avait pas accès aux banques d’images libres. Les images de l’accueil sont des morceaux de la vraie interface.

## Structure

```
app/                     pages (accueil, appli, mentions) et routes API
  (app)/                 offres, fiche, décodeur, salaire, suivi, équipe, profil
  api/decode             traduction d’une offre par l’IA
  api/cron/ingest        collecte planifiée
components/              interface (site/, app/, offer/, tools/)
lib/rules                règles légales : salaire, aides, valeurs de référence
lib/offers               modèle d’offre, normalisation, dédoublonnage, connecteurs, base
lib/decode               schéma, consigne et appel à l’IA
db/schema.sql            base Postgres
scripts/ingest.ts        collecte en ligne de commande
```
