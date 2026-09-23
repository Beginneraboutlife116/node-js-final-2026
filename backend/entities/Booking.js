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
				foreignKeyConstraintName: "FK_bookings_user_id",
			},
		},
		course: {
			target: "Course",
			type: "many-to-one",
			nullable: false,
			joinColumn: {
				name: "course_id",
				foreignKeyConstraintName: "FK_bookings_course_id",
			},
		},
	},
	uniques: [
		{ name: "UQ_bookings_user_id_course_id", columns: ["user", "course"] },
	],
});
