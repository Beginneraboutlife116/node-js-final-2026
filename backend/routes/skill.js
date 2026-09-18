const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const AppError = require("../utils/app-error");

const router = express.Router();

const skillRepository = dataSource.getRepository("Skill");

router.get("/", async (_req, res, next) => {
	try {
		const skills = await skillRepository.find({
			select: {
				id: true,
				name: true,
			},
		});

		res.json({
			status: "success",
			data: skills,
		});
	} catch (error) {
		next(error);
	}
});

router.post(
	"/",
	body("name", "欄位未填寫正確").isString().trim().notEmpty(),
	validate,
	async (req, res, next) => {
		try {
			const { name } = req.body;
			const foundSkill = await skillRepository.findOneBy({
				name,
			});

			if (foundSkill) {
				return next(new AppError(409, "資料重複"));
			}

			const newSkill = await skillRepository.save({ name });

			res.status(201).json({
				status: "success",
				data: {
					id: newSkill.id,
					name: newSkill.name,
					created_at: newSkill.created_at,
				},
			});
		} catch (error) {
			next(error);
		}
	},
);

router.delete(
	"/:skillId",
	param("skillId", "格式錯誤").trim().isUUID(),
	validate,
	async (req, res, next) => {
		try {
			const { skillId } = req.params;
			const foundSkill = await skillRepository.findOneBy({
				id: skillId,
			});

			if (foundSkill === null) {
				return next(new AppError(400, "ID錯誤"));
			}

			const deleteResult = await skillRepository.delete(foundSkill.id);

			res.status(200).json({
				status: "success",
				data: deleteResult,
			});
		} catch (error) {
			next(error);
		}
	},
);

module.exports = router;
