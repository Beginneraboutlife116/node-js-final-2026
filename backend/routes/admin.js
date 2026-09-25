const express = require("express");
const { param, body } = require("express-validator");
const { In } = require("typeorm");

const { validate, authenticate } = require("../middleware");
const { catchAsync, AppError } = require("../utils");
const { dataSource } = require("../db");
const { ERROR_MESSAGE, ROLE, COURSE_STATUS } = require("../constants");

const router = express.Router();

const userRepository = dataSource.getRepository("User");
const coachRepository = dataSource.getRepository("Coach");
const skillRepository = dataSource.getRepository("Skill");
const courseRepository = dataSource.getRepository("Course");

const {
	FIELD_INVALID,
	ID_INVALID,
	NOT_A_COACH,
	ALREADY_A_COACH,
	SKILL_NOT_FOUND,
	COURSE_NOT_FOUND,
	USER_NOT_FOUND,
} = ERROR_MESSAGE;
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
	body("profile_image_url", FIELD_INVALID).isLength({ max: 2048 }),
	body("skill_ids", FIELD_INVALID)
		.isArray({ min: 1 })
		.bail()
		.custom((value) => new Set(value).size === value.length),
	body("skill_ids.*", FIELD_INVALID).isString().bail().trim().isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, NOT_A_COACH));
		}

		const { experience_years, description, profile_image_url, skill_ids } =
			req.body;
		const foundSkillCount = await skillRepository.countBy({
			id: In(skill_ids),
		});

		if (foundSkillCount !== skill_ids.length) {
			return next(new AppError(400, SKILL_NOT_FOUND));
		}

		const foundCoach = await coachRepository.findOneBy({ user: { id } });
		const { skills, updated_at, ...rest } = await coachRepository.save({
			id: foundCoach.id,
			experience_years,
			description,
			profile_image_url,
			skills: skill_ids.map((skillId) => ({ id: skillId })),
		});

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
	body("skill_id", ID_INVALID).isUUID(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	body("meeting_url", FIELD_INVALID).matches(/^https:\/\//),
	body("meeting_url", FIELD_INVALID).isLength({ max: 2048 }),
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
		const isSkillExisted = await skillRepository.existsBy({ id: skill_id });

		if (!isSkillExisted) {
			return next(new AppError(400, SKILL_NOT_FOUND));
		}

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
	param("userId", ID_INVALID).isUUID(),
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
	body("profile_image_url", FIELD_INVALID).isLength({ max: 2048 }),
	validate,
	catchAsync(async (req, res, next) => {
		const { userId } = req.params;
		const foundUser = await userRepository.findOneBy({
			id: userId,
		});

		if (foundUser === null) {
			return next(new AppError(400, USER_NOT_FOUND));
		}

		const isCoach = foundUser.role === COACH;

		if (isCoach) {
			return next(new AppError(409, ALREADY_A_COACH));
		}

		const {
			experience_years,
			description,
			profile_image_url = null,
		} = req.body;
		const { user, ...rest } = await dataSource.transaction(async (manager) => {
			await manager.update("User", foundUser.id, { role: COACH });

			return manager.save("Coach", {
				experience_years,
				description,
				profile_image_url,
				user: { id: foundUser.id },
			});
		});

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

router.get(
	"/courses/:courseId",
	authenticate,
	param("courseId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
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
				skill: { id: true, name: true },
			},
			where: {
				id: courseId,
				user: {
					id,
				},
			},
			relations: {
				skill: true,
			},
		});

		if (foundCourse === null) {
			return next(new AppError(400, COURSE_NOT_FOUND));
		}

		const { skill, ...rest } = foundCourse;

		return res.json({
			status: "success",
			data: {
				...rest,
				skill_name: skill.name,
				skill_id: skill.id,
			},
		});
	}),
);

router.put(
	"/courses/:courseId",
	authenticate,
	param("courseId", ID_INVALID).isUUID(),
	body(
		["skill_id", "name", "description", "start_at", "end_at", "meeting_url"],
		FIELD_INVALID,
	)
		.isString()
		.bail()
		.trim()
		.notEmpty(),
	body("skill_id", ID_INVALID).isUUID(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	body("meeting_url", FIELD_INVALID).matches(/^https:\/\//),
	body("meeting_url", FIELD_INVALID).isLength({ max: 2048 }),
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
		const { id } = req.user;
		const { courseId } = req.params;
		const isCourseExisted = await courseRepository.existsBy({
			id: courseId,
			user: {
				id,
			},
		});

		if (!isCourseExisted) {
			return next(new AppError(400, COURSE_NOT_FOUND));
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
		const isSkillExisted = await skillRepository.existsBy({ id: skill_id });

		if (!isSkillExisted) {
			return next(new AppError(400, SKILL_NOT_FOUND));
		}

		const updateResult = await courseRepository.update(
			courseId,
			{
				name,
				meeting_url,
				description,
				max_participants,
				start_at,
				end_at,
				skill: {
					id: skill_id,
				},
			},
			{ returning: "*" },
		);

		if (updateResult.affected === 0) {
			return next(new AppError(400, COURSE_NOT_FOUND));
		}

		const { raw: updateCourse } = updateResult;

		return res.json({
			status: "success",
			data: {
				course: updateCourse,
			},
		});
	}),
);

module.exports = router;
