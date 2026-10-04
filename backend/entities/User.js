const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "User",
	tableName: "users",
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
		email: {
			type: "varchar",
			length: 255,
			nullable: false,
		},
		password: {
			type: "varchar",
			length: 255,
			nullable: false,
			select: false,
		},
		role: {
			type: "varchar",
			length: 20,
			nullable: false,
			default: "USER",
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
	uniques: [{ name: "UQ_users_email", columns: ["email"] }],
});
