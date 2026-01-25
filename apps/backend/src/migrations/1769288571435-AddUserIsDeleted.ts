import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIsDeleted1769288571435 implements MigrationInterface {
  name = 'AddUserIsDeleted1769288571435';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_deleted"`);
  }
}
