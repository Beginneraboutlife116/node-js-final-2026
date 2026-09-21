const express = require("express");
const { param, body } = require("express-validator");

const { validate, authenticate } = require("../middleware");
const { catchAsync, AppError } = require("../utils");
const { dataSource } = require("../db");
const { ERROR_MESSAGE, ROLE, COURSE_STATUS } = require("../constants");

const router = express.Router();

const userRepository = dataSource.getRepository("User");
const coachRepository = dataSource.getRepository("Coach");
const courseRepository = dataSource.getRepository("Course");

const { FIELD_INVALID, ID_INVALID, NOT_A_COACH, ALREADY_A_COACH } =
	ERROR_MESSAGE;
const { COACH } = ROLE;
const { NOT_STARTED, IN_PROGRESS, ENDED } = COURSE_STATUS;

router.get(
	"/",
	authenticate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, NOT_A_COACH));
		}

		const foundCoach = await coachRepository.findOne({
			where: {
				user: { id },
			},
			relations: {
				skills: true,
			},
		});

		return res.json({
			status: "success",
			data: {
				id: foundCoach.id,
				experience_years: foundCoach.experience_years,
				description: foundCoach.description,
				profile_image_url: foundCoach.profile_image_url,
				skill_ids: foundCoach.skills.map((skill) => skill.id),
			},
		});
	}),
);

router.put(
	"/",
	authenticate,
	body("experience_years", FIELD_INVALID).custom(
		(value) => Number.isInteger(value) && value >= 0,
	),
	body(["description", "profile_image_url"], FIELD_INVALID)
		.isString()
		.bail()
		.trim()
		.notEmpty(),
	body("profile_image_url", FIELD_INVALID).matches(/^https:\/\//),
	body("skill_ids", FIELD_INVALID)
		.isArray({ min: 1 })
		.bail()
		.custom((value) => new Set(value).size === value.length),
	body("skill_ids.*", FIELD_INVALID).isString().bail().isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, NOT_A_COACH));
		}

		const foundCoach = await coachRepository.findOneBy({ user: { id } });
		const { experience_years, description, profile_image_url, skill_ids } =
			req.body;
		let updatedCoach;

		try {
			updatedCoach = await coachRepository.save({
				id: foundCoach.id,
				experience_years,
				description,
				profile_image_url,
				skills: skill_ids.map((skillId) => ({ id: skillId })),
			});
		} catch (error) {
			if (error.code === "23503") {
				return next(new AppError(400, FIELD_INVALID));
			}

			throw error;
		}

		const { skills, updated_at, ...rest } = updatedCoach;

		return res.json({
			status: "success",
			data: {
				...rest,
				skill_ids: skills.map((skill) => skill.id),
			},
		});
	}),
);

router.get(
	"/courses",
	authenticate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, NOT_A_COACH));
		}

		const rows = await dataSource.query(
			`
			SELECT
				c.id,
				c.name,
				c.max_participants,
				c.meeting_url,
				c.start_at,
				c.end_at,
				CAST(COUNT(b.id) AS INTEGER) AS participants
			FROM courses c
			LEFT JOIN bookings b ON b.course_id = c.id AND b.cancelled_at IS NULL
			WHERE c.user_id = $1
			GROUP BY c.id
			ORDER BY c.start_at ASC
			`,
			[id],
		);

		const now = new Date();
		const refinedFoundCourses = rows.map((course) => ({
			...course,
			status:
				now < course.start_at
					? NOT_STARTED
					: now > course.end_at
						? ENDED
						: IN_PROGRESS,
		}));

		return res.json({
			status: "success",
			data: refinedFoundCourses,
		});
	}),
);

router.post(
	"/courses",
	authenticate,
	body(
		["skill_id", "name", "description", "start_at", "end_at", "meeting_url"],
		FIELD_INVALID,
	)
		.isString()
		.bail()
		.trim()
		.notEmpty(),
	body("skill_id", FIELD_INVALID).isUUID(),
	body("meeting_url", FIELD_INVALID).matches(/^https:\/\//),
	body(["start_at", "end_at"], FIELD_INVALID)
		.isISO8601({
			strict: true,
			strictSeparator: true,
		})
		.bail()
		.matches(/Z$/),
	body("max_participants", FIELD_INVALID).custom(
		(value) => Number.isInteger(value) && value >= 0,
	),
	body("end_at", FIELD_INVALID).custom(
		(value, { req }) => new Date(value) > new Date(req.body.start_at),
	),
	validate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, NOT_A_COACH));
		}

		const {
			skill_id,
			name,
			description,
			start_at,
			end_at,
			max_participants,
			meeting_url,
		} = req.body;
		const { skill, user, ...rest } = await courseRepository.save({
			name,
			description,
			start_at,
			end_at,
			max_participants,
			meeting_url,
			skill: skill_id,
			user: id,
		});

		return res.status(201).json({
			status: "success",
			data: {
				course: {
					...rest,
					skill_id: skill,
					user_id: user,
				},
			},
		});
	}),
);

router.post(
	"/:userId",
	param("userId", ID_INVALID).trim().isUUID(),
	body("experience_years", FIELD_INVALID).custom(
		(value) => Number.isInteger(value) && value >= 0,
	),
	body("description", FIELD_INVALID).isString().bail().trim().notEmpty(),
	body("profile_image_url", FIELD_INVALID)
		.optional({ values: "falsy" })
		.isString()
		.bail()
		.trim()
		.matches(/^https:\/\//),
	validate,
	catchAsync(async (req, res, next) => {
		const { userId } = req.params;
		const foundUser = await userRepository.findOneBy({
			id: userId,
		});

		if (foundUser === null) {
			return next(new AppError(400, "使用者不存在"));
		}

		if (foundUser.role === COACH) {
			return next(new AppError(409, ALREADY_A_COACH));
		}

		const {
			experience_years,
			description,
			profile_image_url = null,
		} = req.body;
		let newCoach;

		try {
			newCoach = await dataSource.transaction(async (manager) => {
				await manager.update("User", foundUser.id, { role: COACH });

				return manager.save("Coach", {
					experience_years,
					description,
					profile_image_url,
					user: { id: foundUser.id },
				});
			});
		} catch (error) {
			if (error.code === "23505") {
				return next(new AppError(409, ALREADY_A_COACH));
			}

			throw error;
		}

		const { user, ...rest } = newCoach;

		return res.status(201).json({
			status: "success",
			data: {
				user: { name: foundUser.name, role: COACH },
				coach: {
					...rest,
					user_id: user.id,
				},
			},
		});
	}),
);

router.get("/courses/:courseId", authenticate, param('courseId', ID_INVALID).isUUID(), validate, catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const { id } = req.user;
	const foundCourse = await courseRepository.findOne({
		select: {
			id: true,
			name: true,
			description: true,
			start_at: true,
			end_at: true,
			max_participants: true,
			meeting_url: true,
			skill: { id: true, name: true }
		},
		where: {
			id: courseId,
			user: {
				id
			}
		},
		relations: {
			skill: true
		}
	})

	if (foundCourse === null) {
		return next(new AppError(400, '課程不存在'));
	}

	const { skill, ...rest } = foundCourse;

	return res.json({
		status: 'success',
		data: {
			...rest,
			skill_name: skill.name,
			skill_id: skill.id
		},
	})
}));

router.put("/courses/:courseId");

module.exports = router;
