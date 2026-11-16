# Architecture

Les développements suivent une approche inspirée de :

- Domain Driven Design (DDD)
- Architecture hexagonale
- Séparation des responsabilités

L'objectif est de construire une application maintenable, évolutive et suffisamment structurée pour accueillir de nouvelles fonctionnalités sans introduire de complexité inutile.

Lorsqu'une fonctionnalité est développée ou refactorée :

- privilégier le découpage par domaine métier
- isoler les règles métier des détails techniques
- maintenir une séparation claire entre domaine, application et infrastructure
- éviter les dépendances inutiles entre les couches
- privilégier une architecture simple adaptée à la taille du projet

Ne pas appliquer le DDD de manière dogmatique : la structure doit servir la lisibilité et la maintenabilité du projet.

---

# Organisation du projet

L'application repose sur une architecture séparant le backend, le frontend et les éventuels packages partagés.

Structure cible proposée :

```text
projet/
├── apps/
│   ├── api/                  # Backend Node.js
│   └── web/                  # Frontend Vue.js
│
├── packages/
│   └── shared/               # Types et contrats partagés
│
├── database/
│   ├── migrations/           # Migrations PostgreSQL
│   └── seeds/                # Données initiales et tests
│
├── scripts/                 # Scripts utilitaires
├── docs/                    # Documentation
├── tests/                   # Tests transversaux
├── package.json
└── README.md
```

## apps/api/

Contient le backend Node.js.

Structure proposée :

```text
apps/api/src/
├── features/
│   ├── horses/
│   ├── races/
│   ├── jockeys/
│   ├── trainers/
│   ├── pedigrees/
│   └── statistics/
│
├── shared/
│   ├── database/
│   ├── errors/
│   ├── validation/
│   └── utils/
│
├── config/
└── main.ts
```

Chaque feature métier peut être organisée selon ses besoins :

```text
statistics/
├── domain/
├── application/
│   └── use-cases/
├── infrastructure/
│   └── repositories/
└── presentation/
    └── controllers/
```

Ne créer ces sous-dossiers que lorsqu'ils apportent une réelle séparation des responsabilités.

## apps/web/

Contient le frontend Vue.js.

Structure proposée :

```text
apps/web/src/
├── features/
│   ├── dashboard/
│   ├── statistics/
│   ├── horses/
│   ├── races/
│   └── pedigrees/
│
├── components/
├── composables/
├── layouts/
├── router/
├── services/
├── stores/
├── types/
└── main.ts
```

Les composants spécifiques à un domaine doivent rester dans leur feature.

Les composants véritablement réutilisables sont placés dans `components/`.

## database/

Contient les éléments liés à PostgreSQL :

- migrations
- seeds
- configuration de la base
- éventuels scripts de maintenance

La structure des données doit refléter les relations métier entre les chevaux, leurs étalons, les courses et les résultats.

---

# Domaines métier principaux

Les principaux domaines fonctionnels sont :

- **Horses** : chevaux et informations associées.
- **Races** : courses hippiques, conditions, distances et terrains.
- **Pedigrees** : étalons et lignées des chevaux.
- **Statistics** : calculs, agrégations, moyennes et comparaisons.
- **Dashboard** : présentation des indicateurs et visualisations.

Le domaine Statistics est particulièrement important : il centralise les règles de calcul afin d'éviter que les statistiques soient calculées différemment selon les écrans.

---

# Responsabilités métier

L'application est un outil d'analyse statistique hippique.

Les données historiques des courses constituent la matière première des analyses.

Les entités métier doivent rester distinctes :

- Un cheval participe à plusieurs courses.
- Un cheval possède un père (étalon).
- Une course possède une distance et un état de terrain.
- Une participation à une course possède un résultat et un classement.

Les statistiques sont calculées à partir des participations et des classements des chevaux.

Les deux axes principaux d'analyse sont :

1. Les performances des étalons selon l'état du terrain.
2. Les performances des étalons selon la distance.

Chaque tableau doit permettre de comparer simultanément tous les étalons.

Les statistiques doivent être calculées à partir d'une source de données cohérente et centralisée.

---

# Évolution de l'architecture

L'application est conçue pour pouvoir accueillir ultérieurement :

- Des analyses croisées terrain / distance.
- De nouveaux indicateurs statistiques.
- Des filtres supplémentaires.
- Des comparaisons entre lignées.
- De nouvelles visualisations graphiques.
- Des imports de données hippiques provenant de différentes sources.

Ces évolutions ne doivent pas conduire à anticiper inutilement des fonctionnalités qui ne sont pas encore nécessaires.