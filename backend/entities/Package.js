const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Package",
	tableName: "packages",
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
		credit_amount: {
			type: "integer",
			nullable: false,
		},
		price: {
			type: "integer",
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
	uniques: [{ name: "UQ_packages_name", columns: ["name"] }],
});
