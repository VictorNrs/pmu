# Principes de développement

## Avant toute modification

1. **Comprendre le besoin** : lire les spécifications et demander des précisions en cas d'ambiguïté.
2. **Identifier le domaine métier concerné** : trouver la feature et les responsabilités concernées.
3. **Lire les fichiers existants** : comprendre l'implémentation actuelle avant de modifier le code.
4. **Comprendre les dépendances** : identifier les impacts sur l'API, la base de données et le frontend.
5. **Évaluer les impacts potentiels** : règles statistiques, performances, cohérence des données et breaking changes.

## Qualités à privilégier

Toujours privilégier :

- **Lisibilité** : code facile à comprendre, noms explicites.
- **Maintenabilité** : structure claire et documentation pertinente.
- **Simplicité** : solution la plus simple répondant au besoin.
- **Robustesse** : gestion des erreurs et validation des entrées.
- **POO et SOLID** : privilégier ces principes lorsqu'ils améliorent réellement la conception.
- **Cohérence métier** : les règles statistiques doivent être centralisées et identiques dans toutes les vues.
- **Fiabilité** : les résultats doivent pouvoir être vérifiés et reproduits.

## À éviter

- Les optimisations prématurées.
- La duplication de logique métier.
- Les dépendances inutiles.
- Les abstractions inutiles (over-engineering).
- Les quick fixes sans comprendre la cause racine.
- Les fonctions ou interfaces avec des booléens génériques qui changent leur comportement.
- Les calculs statistiques dispersés dans les composants frontend.
- Les requêtes SQL dupliquées entre plusieurs fonctionnalités.

Lorsqu'une décision métier doit être prise, elle doit l'être en amont, dans la couche domaine ou application.

---

# Conventions de code

## Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Variables, fonctions | camelCase | `getHorseById` |
| Classes, interfaces, types | PascalCase | `HorseRepository` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_RACE_COUNT` |
| Fichiers | kebab-case | `horse-service.ts` |
| Dossiers | kebab-case | `statistics/` |

Règles complémentaires :

- Pas d'abréviations inutiles.
- Les noms doivent exprimer le sens métier, pas le détail technique.
- Les nouveaux identifiants sont écrits en anglais par défaut.
- Les textes visibles par l'utilisateur sont séparés du code métier.
- Ne pas renommer inutilement le code existant sans raison.

## Structure des fichiers

- Un fichier = une responsabilité principale.
- Viser 150 à 200 lignes maximum par fichier, hors imports et tests.
- Préférer des fonctions courtes (idéalement moins de 25 lignes).
- Privilégier la composition.
- Éviter les classes ayant trop de responsabilités.
- Ne pas utiliser de `#region`.
- Découper lorsqu'un fichier devient difficile à comprendre.

Ces limites sont des objectifs de lisibilité, pas des contraintes artificielles.

## Documentation

- Pas de commentaires expliquant simplement ce que fait le code.
- Commentaires autorisés pour les règles métier non évidentes.
- JSDoc pour les fonctions publiques avec paramètres complexes.
- Documenter les formules statistiques et leurs conventions de calcul.

---

# Règles métier et statistiques

Les calculs statistiques constituent une partie critique de l'application.

Toute modification d'un calcul doit être examinée avec attention.

Règles :

- Centraliser les calculs dans le domaine Statistics.
- Ne pas dupliquer les formules entre backend et frontend.
- Tester les cas limites.
- Vérifier les dénominateurs utilisés dans les moyennes.
- Distinguer les résultats absents des résultats égaux à zéro.
- Conserver le nombre de courses ayant contribué à chaque statistique.
- Permettre de retrouver les données individuelles à l'origine d'une agrégation lorsque nécessaire.

Les deux vues principales doivent utiliser des règles de calcul cohérentes :

- Vue par terrain.
- Vue par distance.

Les analyses croisées doivent réutiliser les mêmes règles statistiques.

Toute évolution de formule doit être accompagnée de tests de non-régression.

---

# Refactoring

## Principes

- Privilégier les changements incrémentaux.
- Conserver le comportement existant lorsqu'aucun changement fonctionnel n'est demandé.
- Ajouter des tests avant les modifications importantes lorsque cela est possible.
- Garder les modifications concentrées sur le besoin initial.

## Boy Scout Rule

Laisser le code dans un meilleur état que celui dans lequel il a été trouvé.

Lorsqu'un fichier est modifié, améliorer localement lorsque cela est pertinent :

- Extraire une fonction mal placée.
- Renommer une variable peu claire.
- Simplifier une logique complexe.
- Ajouter un test manquant.

## Limites

- Ne pas refactorer pour le plaisir.
- Ne pas réécrire un module entier sans justification.
- Les refactorings importants doivent être justifiés.
- Ne pas mélanger refactoring et changement fonctionnel sans raison.

---

# Workflow Git

## Branches

Conventions proposées :

- `main` : branche principale stable.
- `develop` : intégration des fonctionnalités, si un workflow GitFlow est adopté.
- `feat/*` : nouvelles fonctionnalités.
- `fix/*` : corrections de bugs.
- `refactor/*` : refactoring.
- `test/*` : modifications liées aux tests.

Le workflow doit rester proportionné à la taille du projet.

## Messages de commit

Format :

`type(scope): description`

Types :

- `feat` : nouvelle fonctionnalité.
- `fix` : correction de bug.
- `refactor` : refactoring sans changement fonctionnel.
- `test` : ajout ou modification de tests.
- `docs` : documentation.
- `chore` : maintenance et configuration.

Exemples :

```text
feat(statistics): add terrain performance comparison
fix(statistics): correct average ranking calculation
refactor(races): extract race condition mapping
test(statistics): cover missing race results
docs(architecture): document statistics domain
```

Règles :

- Un commit = une modification logique cohérente.
- Message au présent de l'indicatif.
- Description concise, idéalement moins de 72 caractères.
- Body facultatif pour expliquer le pourquoi.

---

# Tests et Code Review

## Avant toute livraison

Vérifier :

- Les tests unitaires.
- Les tests d'intégration lorsqu'ils existent.
- Le lint.
- Le typage TypeScript.
- Les migrations de base de données.
- Les éventuelles régressions frontend.

## Tests statistiques

Les tests doivent notamment couvrir :

- Les calculs de classement.
- Les moyennes.
- Les regroupements par terrain.
- Les regroupements par distance.
- Les étalons sans courses correspondantes.
- Les résultats manquants.
- Les échantillons de petite taille.
- Les cas limites et les données incohérentes.

Les tests doivent utiliser des données contrôlées et des résultats attendus connus.

## Code Review

Avant de demander une review :

- Vérifier que les tests passent.
- Vérifier que le lint passe.
- Vérifier le typage.
- Relire les changements.
- Vérifier les impacts sur les calculs statistiques et les données.

Pendant la review :

- Accepter la critique constructive.
- Répondre aux commentaires.
- Expliquer les choix techniques non évidents.
- Ne pas introduire de complexité sans justification.

---

# Variables d'environnement

## Fichiers

- `.env` : variables locales, jamais commité.
- `.env.example` : documentation des variables nécessaires.
- `.env.test` : configuration des tests, sans secrets de production.

## Règles

- Ne jamais committer de secrets.
- Valider les variables indispensables au démarrage.
- Ne jamais logger les mots de passe, tokens ou informations sensibles.
- Séparer les configurations de développement, test et production.
- Utiliser des connexions PostgreSQL adaptées à chaque environnement.