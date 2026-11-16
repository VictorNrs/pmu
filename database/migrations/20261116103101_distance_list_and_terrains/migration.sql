-- Business decision (2026-11-16): distances limited to 1200, 1400, 1600, 2000 and 2400 m;
-- terrains limited to Bon, Souple, Très souple, Collant, Lourd and PSF.
-- Races outside these lists are deleted with their participations (ON DELETE CASCADE).

-- 1. Reference list of distances
CREATE TABLE "race_distances" (
    "distance_meters" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "race_distances_pkey" PRIMARY KEY ("distance_meters"),
    CONSTRAINT "race_distances_distance_meters_check" CHECK ("distance_meters" BETWEEN 400 AND 8000)
);

INSERT INTO "race_distances" ("distance_meters") VALUES (1200), (1400), (1600), (2000), (2400);

-- 2. Remove races outside the new lists
DELETE FROM "races"
WHERE "distance_meters" NOT IN (SELECT "distance_meters" FROM "race_distances")
   OR "terrain_condition_id" IN (
     SELECT "id" FROM "terrain_conditions" WHERE "label_key" IN ('bon souple', 'tres lourd')
   );

-- 3. Every race distance must belong to the reference list
ALTER TABLE "races" ADD CONSTRAINT "races_distance_meters_fkey" FOREIGN KEY ("distance_meters") REFERENCES "race_distances"("distance_meters") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- 4. New terrain list
DELETE FROM "terrain_conditions" WHERE "label_key" IN ('bon souple', 'tres lourd');

INSERT INTO "terrain_conditions" ("label", "label_key", "sort_order")
VALUES ('Collant', 'collant', 40)
ON CONFLICT ("label_key") DO NOTHING;

UPDATE "terrain_conditions" SET "sort_order" = CASE "label_key"
    WHEN 'bon' THEN 10
    WHEN 'souple' THEN 20
    WHEN 'tres souple' THEN 30
    WHEN 'collant' THEN 40
    WHEN 'lourd' THEN 50
    WHEN 'psf' THEN 60
    ELSE "sort_order"
  END;
