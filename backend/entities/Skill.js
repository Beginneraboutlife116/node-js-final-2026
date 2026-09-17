const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Skill",
	tableName: "skills",
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
			unique: true,
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
});
