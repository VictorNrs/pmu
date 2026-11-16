# Lignées — statistiques des étalons

Application web locale pour saisir des résultats de courses hippiques et comparer automatiquement
les performances des étalons (pères des chevaux) selon l'état du terrain et la distance.

- **Backend** : Node.js, TypeScript, Fastify, Prisma 7, PostgreSQL 17
- **Frontend** : Vue 3, Vite, Naive UI (thème sombre), Pinia, Vue Router, Apache ECharts
- **Tests** : Jest (API, unitaires + intégration PostgreSQL), Vitest (web), Playwright (end-to-end)

La conception (modèle de données, règles statistiques, API) est décrite dans
[docs/conception.md](docs/conception.md).

## Lancer l'application

Seul prérequis : **Docker Desktop démarré**. Rien d'autre à installer (ni Node.js, ni PostgreSQL).

```bash
docker compose up -d --build
```

Puis ouvrez **http://localhost:8088**. C'est tout.

Cette commande démarre deux conteneurs :

| Conteneur | Rôle |
|---|---|
| `pmu-postgres` | Base de données PostgreSQL 17 (données conservées dans un volume Docker) |
| `pmu-app` | Application : applique les migrations au démarrage, puis sert l'API et l'interface |

Les conteneurs redémarrent automatiquement avec Docker Desktop : au quotidien, il suffit d'ouvrir
Docker Desktop puis http://localhost:8088.

| Action | Commande |
|---|---|
| Démarrer, ou mettre à jour après un `git pull` | `docker compose up -d --build` |
| Arrêter (les données sont conservées) | `docker compose down` |
| Voir les journaux | `docker compose logs -f app` |
| Sauvegarder la base | `docker exec pmu-postgres pg_dump -U pmu pmu_dev > sauvegarde.sql` |

> Attention : `docker compose down -v` supprime le volume, donc **toutes les données**.

La migration initiale insère la liste des états de terrain usuels (Bon, Bon souple, Souple,
Très souple, Lourd, Très lourd, PSF), modifiable dans **Paramètres**. Aucune autre donnée n'est
insérée. Le tableau de bord guide la première saisie : étalons → chevaux → courses.

## Développement (modifier le code)

Uniquement pour faire évoluer l'application. Prérequis supplémentaire : Node.js 22 ou plus.

```bash
npm install          # dépendances (génère aussi le client Prisma)
cp .env.example .env # configuration locale
npm run db:up        # démarre uniquement le conteneur PostgreSQL (port 55432 sur la machine)
npm run db:deploy    # applique les migrations
npm run dev:api      # terminal 1 : API sur http://127.0.0.1:3000
npm run dev:web      # terminal 2 : interface avec rechargement à chaud, http://localhost:5173
```

Le conteneur PostgreSQL contient deux bases : `pmu_dev` (vos données, partagée avec la version
Docker de l'application) et `pmu_test` (tests automatisés, vidée à chaque exécution).

| Commande | Effet |
|---|---|
| `npm run db:deploy` | Applique les migrations en attente |
| `npm run db:migrate` | Crée une migration après modification de `database/prisma/schema.prisma` |
| `npm run build` | Build de production du frontend |

## Vérifications

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict (shared, api, web)
npm test            # Jest unitaires + intégration (PostgreSQL requis) + Vitest
npm run test:e2e    # Playwright : démarre l'API et l'interface sur la base pmu_test
npm run verify      # lint + typecheck + test
```

Première exécution des tests end-to-end : `npx playwright install chromium`.

## Structure

```text
apps/api/        API Fastify (features: pedigrees, horses, races, statistics)
apps/web/        Interface Vue 3
packages/shared/ Schémas Zod et types partagés (validation identique API / formulaires)
database/        Schéma Prisma, migrations SQL, script d'initialisation Docker
docker/          Script de démarrage du conteneur applicatif
tests/e2e/       Scénarios Playwright
docs/            Conception
```
