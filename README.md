# Lignées — statistiques des étalons

Application web locale pour saisir des résultats de courses hippiques et comparer automatiquement
les performances des étalons (pères des chevaux) selon l'état du terrain et la distance.

- **Backend** : Node.js, TypeScript, Fastify, Prisma 7, PostgreSQL 17 (Docker)
- **Frontend** : Vue 3, Vite, Naive UI (thème sombre), Pinia, Vue Router, Apache ECharts
- **Tests** : Jest (API, unitaires + intégration PostgreSQL), Vitest (web), Playwright (end-to-end)

La conception (modèle de données, règles statistiques, API) est décrite dans
[docs/conception.md](docs/conception.md).

## Prérequis

- Node.js 22 ou plus (testé avec Node 24)
- Docker Desktop **démarré**

## Installation (première fois)

```bash
# 1. Dépendances (génère aussi le client Prisma)
npm install

# 2. Configuration locale : copier le modèle (déjà fait si .env existe)
cp .env.example .env

# 3. Démarrer PostgreSQL (port 55432 pour ne pas gêner un PostgreSQL local)
npm run db:up

# 4. Créer les tables dans la base de développement
npm run db:deploy
```

Le conteneur crée deux bases : `pmu_dev` (vos données) et `pmu_test` (tests automatisés, vidée
à chaque exécution). La migration initiale insère la liste des états de terrain usuels
(Bon, Bon souple, Souple, Très souple, Lourd, Très lourd, PSF), modifiable dans **Paramètres**.
Aucune autre donnée n'est insérée.

## Lancer l'application

Dans deux terminaux :

```bash
npm run dev:api   # API sur http://127.0.0.1:3000
npm run dev:web   # Interface sur http://localhost:5173
```

Ouvrez http://localhost:5173. Le tableau de bord guide la première saisie :
étalons → chevaux → courses.

## Vérifications

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict (shared, api, web)
npm test            # Jest unitaires + intégration (PostgreSQL requis) + Vitest
npm run test:e2e    # Playwright : démarre l'API et l'interface sur la base pmu_test
npm run verify      # lint + typecheck + test
```

Première exécution des tests end-to-end : `npx playwright install chromium`.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run db:up` / `npm run db:down` | Démarre / arrête PostgreSQL (les données sont conservées dans un volume Docker) |
| `npm run db:deploy` | Applique les migrations en attente |
| `npm run db:migrate` | Crée une nouvelle migration après modification de `database/prisma/schema.prisma` (développement) |
| `npm run build` | Build de production du frontend |

Sauvegarde de la base de développement :

```bash
docker exec pmu-postgres pg_dump -U pmu pmu_dev > sauvegarde.sql
```

> `docker compose down -v` supprime le volume, donc **toutes les données**.

## Structure

```text
apps/api/        API Fastify (features: pedigrees, horses, races, statistics)
apps/web/        Interface Vue 3
packages/shared/ Schémas Zod et types partagés (validation identique API / formulaires)
database/        Schéma Prisma, migrations SQL, script d'initialisation Docker
tests/e2e/       Scénarios Playwright
docs/            Conception
```
