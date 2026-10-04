const express = require("express");
const { query, param } = require("express-validator");
const { MoreThan } = require("typeorm");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const { catchAsync, AppError } = require("../utils");
const {
	ERROR_MESSAGE: { FIELD_INVALID, ID_INVALID, COACH_NOT_FOUND },
	ROLE: { COACH },
} = require("../constants");

const router = express.Router();

const coachRepository = dataSource.getRepository("Coach");
const courseRepository = dataSource.getRepository("Course");

router.get(
	"/",
	query("per", FIELD_INVALID).isInt({ min: 0 }).toInt(),
	query("page", FIELD_INVALID).isInt({ min: 1 }).toInt(),
	validate,
	catchAsync(async (req, res) => {
		const { per, page } = req.query;

		if (per === 0) {
			return res.json({
				status: "success",
				data: [],
			});
		}

		const skip = (page - 1) * per;

		const foundCoaches = await coachRepository.find({
			select: { id: true, created_at: true, user: { id: true, name: true } },
			skip,
			take: per,
			relations: {
				user: true,
			},
			order: {
				created_at: "asc",
				id: "asc",
			},
		});

		return res.json({
			status: "success",
			data: foundCoaches.map(({ id, user: { id: userId, name } }) => ({
				id,
				user_id: userId,
				name,
			})),
		});
	}),
);

router.get(
	"/:coachId",
	param("coachId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { coachId } = req.params;
		const foundCoach = await coachRepository.findOne({
			select: {
				user: {
					id: true,
					name: true,
				},
				skills: {
					name: true,
				},
			},
			where: {
				id: coachId,
			},
			relations: {
				user: true,
				skills: true,
			},
			order: {
				skills: { name: "asc" },
			},
		});

		if (foundCoach === null) {
			return next(new AppError(400, COACH_NOT_FOUND));
		}

		const { user, skills, ...rest } = foundCoach;

		return res.json({
			status: "success",
			data: {
				user: {
					name: user.name,
					role: COACH,
				},
				coach: {
					...rest,
					user_id: user.id,
					skills: skills.map(({ name }) => name),
				},
			},
		});
	}),
);

router.get(
	"/:coachId/courses",
	param("coachId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { coachId } = req.params;
		const foundCoach = await coachRepository.findOne({
			select: {
				user: {
					id: true,
				},
			},
			where: {
				id: coachId,
			},
			relations: {
				user: true,
			},
		});

		if (foundCoach === null) {
			return next(new AppError(400, COACH_NOT_FOUND));
		}

		const foundCourses = await courseRepository.find({
			select: {
				id: true,
				name: true,
				description: true,
				start_at: true,
				end_at: true,
				max_participants: true,
				user: { name: true },
				skill: { name: true },
			},
			where: {
				end_at: MoreThan(new Date()),
				user: {
					id: foundCoach.user.id,
				},
			},
			relations: {
				user: true,
				skill: true,
			},
			order: {
				start_at: "asc",
				end_at: "asc",
			},
		});

		return res.json({
			status: "success",
			data: foundCourses.map(({ user, skill, ...rest }) => ({
				...rest,
				coach_name: user.name,
				skill_name: skill.name,
			})),
		});
	}),
);

module.exports = router;
