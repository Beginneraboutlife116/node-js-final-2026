const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Purchase",
	tableName: "purchases",
	columns: {
		id: {
			primary: true,
			type: "uuid",
			generated: "uuid",
		},
		purchased_credits: {
			type: "integer",
			nullable: false,
		},
		price_paid: {
			type: "integer",
			nullable: false,
		},
		created_at: {
			type: "timestamptz",
			nullable: false,
			createDate: true,
		},
	},
	relations: {
		user: {
			target: "User",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "user_id",
			},
		},
		package: {
			target: "Package",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "package_id",
			},
		},
	},
});
