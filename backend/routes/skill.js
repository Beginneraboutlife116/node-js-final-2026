const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");
const { ERROR_MESSAGE } = require("../constants");

const router = express.Router();

const skillRepository = dataSource.getRepository("Skill");

const { NAME_TAKEN, FIELD_INVALID, ID_INVALID, SKILL_NOT_FOUND } =
	ERROR_MESSAGE;

router.get(
	"/",
	catchAsync(async (_req, res) => {
		const skills = await skillRepository.find({
			select: {
				id: true,
				name: true,
			},
		});

		return res.json({
			status: "success",
			data: skills,
		});
	}),
);

router.post(
	"/",
	body("name", FIELD_INVALID).isString().bail().trim().notEmpty(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	validate,
	catchAsync(async (req, res, next) => {
		const { name } = req.body;
		const isSkillExisted = await skillRepository.existsBy({ name });

		if (isSkillExisted) {
			return next(new AppError(409, NAME_TAKEN));
		}

		const newSkill = await skillRepository.save({ name });

		return res.status(201).json({
			status: "success",
			data: {
				id: newSkill.id,
				name: newSkill.name,
				createdAt: newSkill.created_at,
			},
		});
	}),
);

router.delete(
	"/:skillId",
	param("skillId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { skillId } = req.params;
		const isSkillExisted = await skillRepository.existsBy({ id: skillId });

		if (!isSkillExisted) {
			return next(new AppError(400, SKILL_NOT_FOUND));
		}

		const deleteResult = await skillRepository.delete(skillId);

		return res.status(200).json({
			status: "success",
			data: deleteResult,
		});
	}),
);

module.exports = router;
