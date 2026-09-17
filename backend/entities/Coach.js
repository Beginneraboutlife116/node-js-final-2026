const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Coach",
	tableName: "coaches",
	columns: {
		id: {
			primary: true,
			type: "uuid",
			generated: "uuid",
		},
		experience_years: {
			type: "integer",
			nullable: false,
		},
		description: {
			type: "text",
			nullable: false,
		},
		profile_image_url: {
			type: "varchar",
			length: 2048,
			nullable: true,
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
			type: "one-to-one",
			nullable: false,
			joinColumn: {
				name: "user_id",
			},
		},
		skills: {
			target: "Skill",
			type: "many-to-many",
			joinTable: {
				name: "skills_link_coaches",
				joinColumn: {
					name: "coach_id",
				},
				inverseJoinColumn: {
					name: "skill_id",
				},
			},
		},
	},
});
