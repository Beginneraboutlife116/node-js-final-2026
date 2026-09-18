const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const AppError = require("../utils/app-error");

const router = express.Router();

const packageRepository = dataSource.getRepository("Package");

router.get("/", async (_req, res, next) => {
	try {
		const creditPackages = await packageRepository.find({
			select: {
				id: true,
				name: true,
				credit_amount: true,
				price: true,
			},
		});

		res.json({
			status: "success",
			data: creditPackages,
		});
	} catch (error) {
		next(error);
	}
});

router.post(
	"/",
	body("name", "欄位未填寫正確").isString().bail().trim().notEmpty(),
	body(["credit_amount", "price"], "欄位未填寫正確").custom(
		(value) => Number.isInteger(value) && value >= 0,
	),
	validate,
	async (req, res, next) => {
		try {
			const { name, credit_amount, price } = req.body;
			const foundPackage = await packageRepository.findOneBy({
				name,
			});

			if (foundPackage) {
				return next(new AppError(409, "資料重複"));
			}

			const newPackage = await packageRepository.save({
				name,
				credit_amount,
				price,
			});

			res.json({
				status: "success",
				data: {
					id: newPackage.id,
					name: newPackage.name,
					credit_amount: newPackage.credit_amount,
					price: newPackage.price,
					createdAt: newPackage.created_at,
				},
			});
		} catch (error) {
			next(error);
		}
	},
);

router.delete(
	"/:creditPackageId",
	param("creditPackageId", "格式錯誤").trim().isUUID(),
	validate,
	async (req, res, next) => {
		try {
			const { creditPackageId } = req.params;
			const foundPackage = await packageRepository.findOneBy({
				id: creditPackageId,
			});

			if (foundPackage === null) {
				return next(new AppError(400, "ID錯誤"));
			}

			const deleteResult = await packageRepository.delete(foundPackage.id);

			return res.json({
				status: "success",
				data: deleteResult,
			});
		} catch (error) {
			next(error);
		}
	},
);

module.exports = router;
