# Conception

## Décisions métier validées

| Sujet | Décision |
|---|---|
| Victoire | 1re place |
| Place | 2e ou 3e place (le gagnant n'est **pas** compté comme placé) |
| Moyenne | **Rang moyen d'arrivée** = somme des rangs ÷ nombre de courses (plus bas = meilleur) |
| Statuts hors classement | Non saisis : seules les participations avec un rang numérique (≥ 1) sont enregistrées |
| Ex-aequo | Autorisés (deux chevaux 1ers comptent chacun une victoire) |
| Distances | Une colonne par distance exacte ; filtre pour choisir les colonnes affichées |
| Terrains | Liste administrable ; filtre pour choisir les colonnes affichées |
| Course | Date + hippodrome + distance + terrain (distance et terrain obligatoires) |
| Doublons | Un cheval ne court qu'une course par jour ; un cheval au plus une fois par course |
| Cheval | Unique par nom |
| Étalon avec descendants | Suppression refusée |
| Utilisateurs | Un seul utilisateur local, sans authentification |

## Règles statistiques

Centralisées dans `apps/api/src/features/statistics/domain/performance-metrics.ts`.

Pour un groupe de participations (étalon × terrain, étalon × distance, etc.) :

- `raceCount` = nombre de participations
- `winCount` = participations au rang 1
- `placeCount` = participations aux rangs 2 ou 3
- `winRate` = `winCount / raceCount`
- `placeRate` = `placeCount / raceCount`
- `averageFinishPosition` = somme des rangs / `raceCount`

Tous les indicateurs partagent le même dénominateur. Si `raceCount = 0`, les taux et la moyenne
valent `null` (affiché « — »), jamais 0 %.

PostgreSQL agrège des **compteurs additifs** (nombre, victoires, places, somme des rangs). Les
ratios sont calculés par la fonction de domaine. Un total n'est donc jamais une moyenne de
moyennes. Les constantes de classement (`WIN_POSITION`, `PLACE_POSITIONS`) sont injectées dans
la requête SQL : le SQL et le domaine ne peuvent pas diverger.

Comme une course porte un seul terrain et une seule distance, chaque participation tombe dans
exactement une colonne : la somme des colonnes est égale au total de l'étalon. Cet invariant est
vérifié par les tests d'intégration.

**Traçabilité** : les statistiques et la liste des participations
(`GET /api/participations`) utilisent le même traducteur de filtres
(`apps/api/src/shared/database/participation-criteria.ts`). Un clic sur une cellule liste
exactement les courses qui la composent.

**Petits échantillons** : rien n'est corrigé. Le nombre de courses reste visible. Un seuil
« minimum de courses », réglable, grise les cellules sous le seuil et les exclut de la mise en
évidence, des classements et de la heatmap.

## Modèle de données

```text
stallions 1──N horses 1──N participations N──1 races N──1 terrain_conditions
                                                    N──1 racecourses
```

- `participations.race_date` est une copie de `races.race_date`, maintenue par une clé étrangère
  composite `(race_id, race_date)` avec `ON UPDATE CASCADE`. Elle permet la contrainte unique
  `(horse_id, race_date)` : un cheval ne court qu'une course par jour, garanti par PostgreSQL.
- Contraintes uniques : noms normalisés (`name_key` : minuscules, sans accents ni ponctuation)
  des étalons, chevaux, hippodromes et terrains ; `(race_id, horse_id)`.
- Contraintes `CHECK` : distance de 400 à 8000 m, rang de 1 à 40, noms non vides.
- Suppressions : course → participations en cascade. Étalon, cheval, terrain et hippodrome
  utilisés → refusés.
- Index : clés étrangères, `races(race_date)`, `races(distance_meters)`,
  `races(terrain_condition_id)`.

## API

| Méthode | Route | Rôle |
|---|---|---|
| CRUD | `/api/stallions`, `/api/horses` | Étalons, chevaux (`?search=`, `?stallionId=`) |
| CRUD | `/api/races` | Course + participations en une seule requête (`PUT` remplace la liste) |
| GET | `/api/races/distances` | Distances utilisées |
| GET / DELETE | `/api/participations` | Résultats individuels (mêmes filtres que les statistiques) |
| CRUD | `/api/terrain-conditions`, `/api/racecourses` | Données de référence |
| GET | `/api/statistics/performance?dimension=terrain\|distance` | Matrice étalons × colonnes |
| GET | `/api/statistics/rankings?metric=&minRaces=` | Classement |
| GET | `/api/statistics/trends` | Évolution mensuelle |
| GET | `/api/statistics/overview` | Tableau de bord |

Filtres communs : `stallionIds`, `terrainConditionIds`, `distances` (listes séparées par des
virgules), `from`, `to` (AAAA-MM-JJ). Combiner `dimension=terrain&distances=1600` donne
l'analyse croisée « terrain × 1600 m » avec les mêmes règles de calcul.

## Pages

Tableau de bord · Stats par terrain · Stats par distance · Graphiques (classement,
comparaison, heatmap, évolution) · Courses & résultats · Étalons (et fiche détaillée) · Chevaux ·
Paramètres (terrains, hippodromes).
