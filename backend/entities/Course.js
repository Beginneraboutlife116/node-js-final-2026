const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Course",
	tableName: "courses",
	columns: {
		id: {
			primary: true,
			type: "uuid",
			generated: "uuid",
		},
		name: {
			type: "varchar",
			length: 255,
			nullable: false,
		},
		meeting_url: {
			type: "varchar",
			length: 2048,
			nullable: false,
		},
		description: {
			type: "text",
			nullable: false,
		},
		max_participants: {
			type: "integer",
			nullable: false,
		},
		start_at: {
			type: "timestamptz",
			nullable: false,
		},
		end_at: {
			type: "timestamptz",
			nullable: false,
		},
		created_at: {
			type: "timestamptz",
			nullable: false,
			createDate: true,
		},
		updated_at: {
			type: "timestamptz",
			nullable: false,
			updateDate: true,
		},
	},
	relations: {
		user: {
			target: "User",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "user_id",
				foreignKeyConstraintName: "FK_courses_user_id",
			},
		},
		skill: {
			target: "Skill",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "skill_id",
				foreignKeyConstraintName: "FK_courses_skill_id",
			},
		},
	},
});
