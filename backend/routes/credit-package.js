const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");
const { ERROR_MESSAGE } = require("../constants");

const router = express.Router();

const packageRepository = dataSource.getRepository("Package");

const { DUPLICATED, FIELD_INVALID, ID_INVALID } = ERROR_MESSAGE;

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
		const isPackageExisted = await packageRepository.existsBy({ name });

		if (isPackageExisted) {
			return next(new AppError(409, DUPLICATED));
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
		const isPackageExisted = await packageRepository.existsBy({
			id: creditPackageId,
		});

		if (!isPackageExisted) {
			return next(new AppError(400, "組合包不存在"));
		}

		const deleteResult = await packageRepository.delete(creditPackageId);

		return res.json({
			status: "success",
			data: deleteResult,
		});
	}),
);

module.exports = router;
