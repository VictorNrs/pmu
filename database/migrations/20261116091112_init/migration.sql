-- CreateTable
CREATE TABLE "stallions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "name_key" VARCHAR(120) NOT NULL,
    "birth_year" SMALLINT,
    "country" VARCHAR(60),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stallions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "name_key" VARCHAR(120) NOT NULL,
    "stallion_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "horses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terrain_conditions" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "label_key" VARCHAR(60) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "terrain_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racecourses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "name_key" VARCHAR(120) NOT NULL,

    CONSTRAINT "racecourses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" SERIAL NOT NULL,
    "race_date" DATE NOT NULL,
    "racecourse_id" INTEGER NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "terrain_condition_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" SERIAL NOT NULL,
    "race_id" INTEGER NOT NULL,
    "race_date" DATE NOT NULL,
    "horse_id" INTEGER NOT NULL,
    "finish_position" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stallions_name_key_key" ON "stallions"("name_key");

-- CreateIndex
CREATE UNIQUE INDEX "horses_name_key_key" ON "horses"("name_key");

-- CreateIndex
CREATE INDEX "horses_stallion_id_idx" ON "horses"("stallion_id");

-- CreateIndex
CREATE UNIQUE INDEX "terrain_conditions_label_key_key" ON "terrain_conditions"("label_key");

-- CreateIndex
CREATE UNIQUE INDEX "racecourses_name_key_key" ON "racecourses"("name_key");

-- CreateIndex
CREATE INDEX "races_race_date_idx" ON "races"("race_date");

-- CreateIndex
CREATE INDEX "races_racecourse_id_idx" ON "races"("racecourse_id");

-- CreateIndex
CREATE INDEX "races_terrain_condition_id_idx" ON "races"("terrain_condition_id");

-- CreateIndex
CREATE INDEX "races_distance_meters_idx" ON "races"("distance_meters");

-- CreateIndex
CREATE UNIQUE INDEX "races_id_race_date_key" ON "races"("id", "race_date");

-- CreateIndex
CREATE UNIQUE INDEX "participations_race_id_horse_id_key" ON "participations"("race_id", "horse_id");

-- CreateIndex
CREATE UNIQUE INDEX "participations_horse_id_race_date_key" ON "participations"("horse_id", "race_date");

-- AddForeignKey
ALTER TABLE "horses" ADD CONSTRAINT "horses_stallion_id_fkey" FOREIGN KEY ("stallion_id") REFERENCES "stallions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_racecourse_id_fkey" FOREIGN KEY ("racecourse_id") REFERENCES "racecourses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_terrain_condition_id_fkey" FOREIGN KEY ("terrain_condition_id") REFERENCES "terrain_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_race_id_race_date_fkey" FOREIGN KEY ("race_id", "race_date") REFERENCES "races"("id", "race_date") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_horse_id_fkey" FOREIGN KEY ("horse_id") REFERENCES "horses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integrity rules not expressible in the Prisma schema
ALTER TABLE "stallions" ADD CONSTRAINT "stallions_birth_year_check" CHECK ("birth_year" IS NULL OR "birth_year" BETWEEN 1900 AND 2100);
ALTER TABLE "stallions" ADD CONSTRAINT "stallions_name_check" CHECK (length(btrim("name")) > 0);
ALTER TABLE "horses" ADD CONSTRAINT "horses_name_check" CHECK (length(btrim("name")) > 0);
ALTER TABLE "racecourses" ADD CONSTRAINT "racecourses_name_check" CHECK (length(btrim("name")) > 0);
ALTER TABLE "terrain_conditions" ADD CONSTRAINT "terrain_conditions_label_check" CHECK (length(btrim("label")) > 0);
ALTER TABLE "races" ADD CONSTRAINT "races_distance_meters_check" CHECK ("distance_meters" BETWEEN 400 AND 8000);
ALTER TABLE "participations" ADD CONSTRAINT "participations_finish_position_check" CHECK ("finish_position" BETWEEN 1 AND 40);

-- Reference data: usual French terrain conditions, editable from the settings page.
INSERT INTO "terrain_conditions" ("label", "label_key", "sort_order") VALUES
  ('Bon', 'bon', 10),
  ('Bon souple', 'bon souple', 20),
  ('Souple', 'souple', 30),
  ('Très souple', 'tres souple', 40),
  ('Lourd', 'lourd', 50),
  ('Très lourd', 'tres lourd', 60),
  ('PSF', 'psf', 70);
