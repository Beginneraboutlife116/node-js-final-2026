/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Init1789634177949 {
    name = 'Init1789634177949'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "cancelled_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "UQ_859a0f2a91605e0eaaccfa4e4a9" UNIQUE ("user_id", "course_id"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "coaches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "experience_years" integer NOT NULL, "description" text NOT NULL, "profile_image_url" character varying(2048), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "REL_bd9923ac72efde2d5895e118fa" UNIQUE ("user_id"), CONSTRAINT "PK_eddaece1a1f1b197fa39e6864a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "meeting_url" character varying(2048) NOT NULL, "description" text NOT NULL, "max_participants" integer NOT NULL, "start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "credit_amount" integer NOT NULL, "price" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4b511952e9d60aac9aa42e653f0" UNIQUE ("name"), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "purchased_credits" integer NOT NULL, "price_paid" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "package_id" uuid NOT NULL, CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" character varying(20) NOT NULL DEFAULT 'USER', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "skills_link_coaches" ("coach_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_066e4e1bb58eef9f8905a597d0a" PRIMARY KEY ("coach_id", "skill_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_53cacb0bdc1811335c0fa30613" ON "skills_link_coaches"  ("coach_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_90d712ace9cd4e5f7d39b6ac4d" ON "skills_link_coaches"  ("skill_id") `);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_04cf09343b3011a17331daedc23" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coaches" ADD CONSTRAINT "FK_bd9923ac72efde2d5895e118fa8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_a4396a5235f159ab156a6f8b603" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_35e285c3f9c377580f69b01e917" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_91737fbaa18c83f629536cd23c1" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skills_link_coaches" ADD CONSTRAINT "FK_53cacb0bdc1811335c0fa306130" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "skills_link_coaches" ADD CONSTRAINT "FK_90d712ace9cd4e5f7d39b6ac4d0" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "skills_link_coaches" DROP CONSTRAINT "FK_90d712ace9cd4e5f7d39b6ac4d0"`);
        await queryRunner.query(`ALTER TABLE "skills_link_coaches" DROP CONSTRAINT "FK_53cacb0bdc1811335c0fa306130"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_91737fbaa18c83f629536cd23c1"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_35e285c3f9c377580f69b01e917"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_a4396a5235f159ab156a6f8b603"`);
        await queryRunner.query(`ALTER TABLE "coaches" DROP CONSTRAINT "FK_bd9923ac72efde2d5895e118fa8"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_04cf09343b3011a17331daedc23"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90d712ace9cd4e5f7d39b6ac4d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53cacb0bdc1811335c0fa30613"`);
        await queryRunner.query(`DROP TABLE "skills_link_coaches"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "skills"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP TABLE "packages"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TABLE "coaches"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
    }
}
