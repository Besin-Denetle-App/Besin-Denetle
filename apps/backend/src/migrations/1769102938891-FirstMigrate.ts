import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigrate1769102938891 implements MigrationInterface {
    name = 'FirstMigrate1769102938891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "barcode" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "type" integer NOT NULL DEFAULT '0', "is_manual" boolean NOT NULL DEFAULT false, "is_flagged" boolean NOT NULL DEFAULT false, "flag_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a2a0e24a70480abc8e97214491f" UNIQUE ("code"), CONSTRAINT "PK_069a36ae1998109c8dece11d3c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a2a0e24a70480abc8e97214491" ON "barcode" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_3af4d739e0380530085ee3dce9" ON "barcode" ("is_flagged") `);
        await queryRunner.query(`CREATE INDEX "idx_barcode_type_flagged" ON "barcode" ("type", "is_flagged") `);
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "barcode_id" uuid NOT NULL, "brand" character varying, "name" character varying, "quantity" character varying, "image_url" character varying, "score" integer NOT NULL DEFAULT '0', "vote_count" integer NOT NULL DEFAULT '0', "is_manual" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_861d590793c3c470af89d7c131" ON "product" ("barcode_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_efb04dd50fc11f38a7291004c8" ON "product" ("score") `);
        await queryRunner.query(`CREATE TABLE "product_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "ingredients" text, "allergens" text, "nutrition_table" jsonb, "score" integer NOT NULL DEFAULT '0', "vote_count" integer NOT NULL DEFAULT '0', "is_manual" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f768662205b901ba35c9c9255a" ON "product_content" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_74e5d87f157166cd040b9e1b04" ON "product_content" ("score") `);
        await queryRunner.query(`CREATE TABLE "content_analysis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_content_id" uuid NOT NULL, "analysis_text" jsonb, "score" integer NOT NULL DEFAULT '0', "vote_count" integer NOT NULL DEFAULT '0', "is_manual" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f8482a52a1b69362d2f8396886" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0c112c5f79d6bfff0d84f3bcd3" ON "content_analysis" ("product_content_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ff7f3fa1a2c036bcefa31315b3" ON "content_analysis" ("score") `);
        await queryRunner.query(`CREATE TYPE "public"."users_auth_provider_enum" AS ENUM('google', 'apple', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "auth_provider" "public"."users_auth_provider_enum" NOT NULL DEFAULT 'google', "provider_id" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_active" TIMESTAMP, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_6425135effde2ab8322f8464932" UNIQUE ("provider_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_6425135effde2ab8322f846493" ON "users" ("provider_id") `);
        await queryRunner.query(`CREATE TYPE "public"."vote_vote_type_enum" AS ENUM('UP', 'DOWN')`);
        await queryRunner.query(`CREATE TABLE "vote" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "vote_type" "public"."vote_vote_type_enum" NOT NULL, "product_id" uuid, "product_content_id" uuid, "content_analysis_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "unique_user_analysis" UNIQUE ("user_id", "content_analysis_id"), CONSTRAINT "unique_user_content" UNIQUE ("user_id", "product_content_id"), CONSTRAINT "unique_user_product" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_2d5932d46afe39c8176f9d4be72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_af8728cf605f1988d2007d094f" ON "vote" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a3695526733414e31a90aa121" ON "vote" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd5f76962da77c04279d1b8e47" ON "vote" ("product_content_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_159e7f3fb56a41fd9ca5b01f3d" ON "vote" ("content_analysis_id") `);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_861d590793c3c470af89d7c1318" FOREIGN KEY ("barcode_id") REFERENCES "barcode"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_analysis" ADD CONSTRAINT "FK_0c112c5f79d6bfff0d84f3bcd30" FOREIGN KEY ("product_content_id") REFERENCES "product_content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_af8728cf605f1988d2007d094f5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_9a3695526733414e31a90aa121c" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_bd5f76962da77c04279d1b8e470" FOREIGN KEY ("product_content_id") REFERENCES "product_content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_159e7f3fb56a41fd9ca5b01f3df" FOREIGN KEY ("content_analysis_id") REFERENCES "content_analysis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_159e7f3fb56a41fd9ca5b01f3df"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_bd5f76962da77c04279d1b8e470"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_9a3695526733414e31a90aa121c"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_af8728cf605f1988d2007d094f5"`);
        await queryRunner.query(`ALTER TABLE "content_analysis" DROP CONSTRAINT "FK_0c112c5f79d6bfff0d84f3bcd30"`);
        await queryRunner.query(`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_861d590793c3c470af89d7c1318"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_159e7f3fb56a41fd9ca5b01f3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd5f76962da77c04279d1b8e47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a3695526733414e31a90aa121"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af8728cf605f1988d2007d094f"`);
        await queryRunner.query(`DROP TABLE "vote"`);
        await queryRunner.query(`DROP TYPE "public"."vote_vote_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6425135effde2ab8322f846493"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_auth_provider_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff7f3fa1a2c036bcefa31315b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c112c5f79d6bfff0d84f3bcd3"`);
        await queryRunner.query(`DROP TABLE "content_analysis"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74e5d87f157166cd040b9e1b04"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f768662205b901ba35c9c9255a"`);
        await queryRunner.query(`DROP TABLE "product_content"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efb04dd50fc11f38a7291004c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_861d590793c3c470af89d7c131"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP INDEX "public"."idx_barcode_type_flagged"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3af4d739e0380530085ee3dce9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2a0e24a70480abc8e97214491"`);
        await queryRunner.query(`DROP TABLE "barcode"`);
    }

}
