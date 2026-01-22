import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Migration - Tüm tabloları oluşturur
 * 
 * Bu migration mevcut entity'lerden otomatik oluşturuldu.
 * Tablolar: user, product, barcode, content_analysis, product_content, vote
 */
export class InitialSchema1737509400000 implements MigrationInterface {
    name = 'InitialSchema1737509400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // User tablosu
        await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(50) NOT NULL,
        "email" character varying(255) NOT NULL,
        "auth_provider" character varying(20) NOT NULL DEFAULT 'EMAIL',
        "provider_id" character varying(255),
        "role" character varying(20) NOT NULL DEFAULT 'USER',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_active" TIMESTAMP,
        CONSTRAINT "UQ_user_username" UNIQUE ("username"),
        CONSTRAINT "UQ_user_email_provider" UNIQUE ("email", "auth_provider"),
        CONSTRAINT "PK_user" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_user_email" ON "user" ("email")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_user_provider" ON "user" ("auth_provider", "provider_id")
    `);

        // Product tablosu
        await queryRunner.query(`
      CREATE TABLE "product" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "brand" character varying(255),
        "category" character varying(100),
        "image_url" text,
        "serving_size" integer,
        "calories_per_100g" integer,
        "protein_per_100g" numeric(5,2),
        "carbs_per_100g" numeric(5,2),
        "fat_per_100g" numeric(5,2),
        "fiber_per_100g" numeric(5,2),
        "sugar_per_100g" numeric(5,2),
        "salt_per_100g" numeric(5,2),
        "nutri_score" character varying(1),
        "nova_group" integer,
        "health_score" integer,
        "allergens" text,
        "additives" text,
        "product_type" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_product_name" ON "product" ("name")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_product_brand" ON "product" ("brand")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_product_type" ON "product" ("product_type")
    `);

        // Barcode tablosu
        await queryRunner.query(`
      CREATE TABLE "barcode" (
        "barcode" character varying(13) NOT NULL,
        "product_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_barcode" PRIMARY KEY ("barcode")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_barcode_product" ON "barcode" ("product_id")
    `);

        // Content Analysis tablosu
        await queryRunner.query(`
      CREATE TABLE "content_analysis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "risk_level" integer NOT NULL,
        "risk_scores" jsonb NOT NULL,
        "risk_reasons" text array NOT NULL,
        "health_benefits" text array NOT NULL,
        "allergen_warnings" text array NOT NULL,
        "special_warnings" text array NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_analysis" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_content_analysis_product" ON "content_analysis" ("product_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_content_analysis_risk" ON "content_analysis" ("risk_level")
    `);

        // Product Content tablosu
        await queryRunner.query(`
      CREATE TABLE "product_content" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "ingredients" text,
        "nutritional_info" text,
        "allergen_info" text,
        "warnings" text,
        "storage_instructions" text,
        "usage_instructions" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_content_product" UNIQUE ("product_id"),
        CONSTRAINT "PK_product_content" PRIMARY KEY ("id")
      )
    `);

        // Vote tablosu
        await queryRunner.query(`
      CREATE TABLE "vote" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "vote_type" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vote_user_product" UNIQUE ("user_id", "product_id"),
        CONSTRAINT "PK_vote" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_vote_product" ON "vote" ("product_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_vote_user" ON "vote" ("user_id")
    `);

        // Foreign Keys
        await queryRunner.query(`
      ALTER TABLE "barcode" 
      ADD CONSTRAINT "FK_barcode_product" 
      FOREIGN KEY ("product_id") 
      REFERENCES "product"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "content_analysis" 
      ADD CONSTRAINT "FK_content_analysis_product" 
      FOREIGN KEY ("product_id") 
      REFERENCES "product"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "product_content" 
      ADD CONSTRAINT "FK_product_content_product" 
      FOREIGN KEY ("product_id") 
      REFERENCES "product"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "vote" 
      ADD CONSTRAINT "FK_vote_product" 
      FOREIGN KEY ("product_id") 
      REFERENCES "product"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "vote" 
      ADD CONSTRAINT "FK_vote_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Foreign Keys'leri kaldır
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_vote_user"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_vote_product"`);
        await queryRunner.query(`ALTER TABLE "product_content" DROP CONSTRAINT "FK_product_content_product"`);
        await queryRunner.query(`ALTER TABLE "content_analysis" DROP CONSTRAINT "FK_content_analysis_product"`);
        await queryRunner.query(`ALTER TABLE "barcode" DROP CONSTRAINT "FK_barcode_product"`);

        // Tabloları kaldır
        await queryRunner.query(`DROP TABLE "vote"`);
        await queryRunner.query(`DROP TABLE "product_content"`);
        await queryRunner.query(`DROP TABLE "content_analysis"`);
        await queryRunner.query(`DROP TABLE "barcode"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
