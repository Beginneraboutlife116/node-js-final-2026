const express = require("express");
const { body, param } = require("express-validator");

const { dataSource } = require("../db");
const { validate, authenticate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");
const { ERROR_MESSAGE } = require("../constants");

const router = express.Router();

const packageRepository = dataSource.getRepository("Package");

const {
	NAME_TAKEN,
	FIELD_INVALID,
	ID_INVALID,
	CREDIT_PACKAGE_NOT_FOUND,
	CREDIT_PACKAGE_IN_USE,
} = ERROR_MESSAGE;

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
			return next(new AppError(409, NAME_TAKEN));
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
	param("creditPackageId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res) => {
		const { creditPackageId } = req.params;

		const deleteResult = await dataSource.transaction(async (manager) => {
			const lockedPackage = await manager.getRepository("Package").findOne({
				select: { id: true },
				where: { id: creditPackageId },
				lock: { mode: "pessimistic_write" },
			});

			if (lockedPackage === null) {
				throw new AppError(400, CREDIT_PACKAGE_NOT_FOUND);
			}

			const isBoughtCreditPackage = await manager
				.getRepository("Purchase")
				.existsBy({
					package: { id: creditPackageId },
				});

			if (isBoughtCreditPackage) {
				throw new AppError(409, CREDIT_PACKAGE_IN_USE);
			}

			return await manager.getRepository("Package").delete(creditPackageId);
		});

		return res.json({
			status: "success",
			data: deleteResult,
		});
	}),
);

router.post(
	"/:creditPackageId",
	authenticate,
	param("creditPackageId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res) => {
		const { id } = req.user;
		const { creditPackageId } = req.params;

		await dataSource.transaction(async (manager) => {
			const lockedPackage = await manager.getRepository("Package").findOne({
				where: { id: creditPackageId },
				lock: { mode: "for_key_share" },
			});

			if (lockedPackage === null) {
				throw new AppError(400, CREDIT_PACKAGE_NOT_FOUND);
			}

			await manager.getRepository("Purchase").save({
				purchased_credits: lockedPackage.credit_amount,
				price_paid: lockedPackage.price,
				user: {
					id,
				},
				package: { id: creditPackageId },
			});
		});

		return res.json({
			status: "success",
			data: null,
		});
	}),
);

module.exports = router;
