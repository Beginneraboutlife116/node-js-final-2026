const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "Booking",
	tableName: "bookings",
	columns: {
		id: {
			primary: true,
			type: "uuid",
			generated: "uuid",
		},
		created_at: {
			type: "timestamptz",
			nullable: false,
			createDate: true,
		},
		cancelled_at: {
			type: "timestamptz",
			nullable: true,
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
		course: {
			target: "Course",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "course_id",
			},
		},
	},
	uniques: [{ columns: ["user", "course"] }],
});
