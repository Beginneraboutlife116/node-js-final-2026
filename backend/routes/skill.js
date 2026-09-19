const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");

const router = express.Router();

const skillRepository = dataSource.getRepository("Skill");

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
	body("name", "欄位未填寫正確").isString().bail().trim().notEmpty(),
	validate,
	catchAsync(async (req, res, next) => {
		const { name } = req.body;
		const foundSkill = await skillRepository.findOneBy({
			name,
		});

		if (foundSkill !== null) {
			return next(new AppError(409, "資料重複"));
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
	param("skillId", "格式錯誤").trim().isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { skillId } = req.params;
		const foundSkill = await skillRepository.findOneBy({
			id: skillId,
		});

		if (foundSkill === null) {
			return next(new AppError(400, "ID錯誤"));
		}

		const deleteResult = await skillRepository.delete(foundSkill.id);

		return res.status(200).json({
			status: "success",
			data: deleteResult,
		});
	}),
);

module.exports = router;
