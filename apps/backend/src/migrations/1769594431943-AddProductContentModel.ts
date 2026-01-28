import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductContentModel1769594431943 implements MigrationInterface {
    name = 'AddProductContentModel1769594431943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_content" ADD "model" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "content_analysis" ADD "model" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_analysis" DROP COLUMN "model"`);
        await queryRunner.query(`ALTER TABLE "product_content" DROP COLUMN "model"`);
    }

}
