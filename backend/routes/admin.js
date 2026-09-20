const express = require("express");
const { param, body } = require("express-validator");

const { validate, authenticate } = require("../middleware");
const { catchAsync, AppError } = require("../utils");
const { dataSource } = require("../db");
const { ERROR_MESSAGE, ROLE } = require("../constants");

const router = express.Router();

const userRepository = dataSource.getRepository("User");
const coachRepository = dataSource.getRepository("Coach");

const { FIELD_INVALID, ID_INVALID } = ERROR_MESSAGE;
const { COACH } = ROLE;

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
			return next(new AppError(409, "使用者已經是教練"));
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
				return next(new AppError(409, "使用者已經是教練"));
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

router.get(
	"/",
	authenticate,
	catchAsync(async (req, res, next) => {
		const { id, role } = req.user;
		const isCoach = role === COACH;

		if (!isCoach) {
			return next(new AppError(401, "使用者尚未成為教練"));
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
			return next(new AppError(401, "使用者尚未成為教練"));
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

module.exports = router;
