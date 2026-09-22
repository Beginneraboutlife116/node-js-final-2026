const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");
const { ERROR_MESSAGE } = require("../constants");

const router = express.Router();

const packageRepository = dataSource.getRepository("Package");

const { FIELD_INVALID, ID_INVALID } = ERROR_MESSAGE;

router.get(
	"/",
	catchAsync(async (_req, res) => {
		const creditPackages = await packageRepository.find({
			select: {
				id: true,
				name: true,
				credit_amount: true,
				price: true,
			},
		});

		return res.json({
			status: "success",
			data: creditPackages,
		});
	}),
);

router.post(
	"/",
	body("name", FIELD_INVALID).isString().bail().trim().notEmpty(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	body(["credit_amount", "price"], FIELD_INVALID).custom(
		(value) => Number.isInteger(value) && value >= 0,
	),
	validate,
	catchAsync(async (req, res, next) => {
		const { name, credit_amount, price } = req.body;
		const foundPackage = await packageRepository.findOneBy({
			name,
		});

		if (foundPackage !== null) {
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
	}),
);

router.delete(
	"/:creditPackageId",
	param("creditPackageId", ID_INVALID).trim().isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
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
	}),
);

module.exports = router;
