const express = require("express");
const { LessThanOrEqual, MoreThan } = require("typeorm");

const { dataSource } = require("../db");
const { catchAsync } = require("../utils");

const router = express.Router();

const courseRepository = dataSource.getRepository("Course");

router.get(
	"/",
	catchAsync(async (_req, res) => {
		const now = new Date();
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
				start_at: LessThanOrEqual(now),
				end_at: MoreThan(now),
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
