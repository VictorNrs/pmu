# Technologie

## Stack technique

L'application repose sur une stack TypeScript moderne.

### Backend

- Node.js : environnement d'exécution.
- TypeScript : langage principal.
- Fastify : framework HTTP et API.
- Prisma : ORM et gestion des migrations.
- PostgreSQL : base de données relationnelle.

### Frontend

- Vue.js 3 : framework frontend.
- TypeScript : typage du code.
- Composition API : organisation de la logique des composants.
- Vite : environnement de développement et build.
- Pinia : gestion des états partagés.
- Vue Router : navigation.
- Apache ECharts : visualisation des statistiques.

### Tests

- Jest : tests unitaires et tests backend.
- Vitest : tests frontend.
- Playwright : tests end-to-end.

### Qualité du code

- ESLint : analyse statique.
- Prettier : formatage.
- TypeScript strict : limitation des erreurs de typage.

---

# Principes techniques

- Privilégier TypeScript sur l'ensemble du projet.
- Activer le mode strict de TypeScript.
- Éviter les types `any`.
- Valider les données entrantes dans l'API.
- Centraliser la gestion des erreurs.
- Séparer les accès à PostgreSQL de la logique métier.
- Utiliser les migrations pour faire évoluer la base de données.
- Ne pas disperser les calculs statistiques dans les composants Vue.

Les calculs métier doivent être réalisés côté backend, dans le domaine Statistics.

Le frontend est responsable de la présentation, des interactions, des filtres et de la visualisation.

Les requêtes SQL complexes sont autorisées lorsqu'elles permettent d'effectuer les agrégations de manière plus fiable et performante.

Éviter les traitements inutiles en mémoire lorsque PostgreSQL peut effectuer efficacement le travail.

---

# Données et statistiques

Les données doivent permettre de retrouver les participations individuelles ayant contribué à chaque statistique.

Les agrégations doivent être cohérentes entre les différentes vues.

Les deux tableaux principaux sont :

- Statistiques des étalons par état du terrain.
- Statistiques des étalons par distance.

Chaque tableau compare simultanément l'ensemble des étalons.

Les calculs doivent distinguer les indicateurs de classement prévus par les règles métier.

Les résultats statistiques ne doivent pas être calculés directement dans les composants graphiques.