const express = require("express");
const { body } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const { dataSource } = require("../db");
const { validate, authenticate } = require("../middleware");
const { AppError, catchAsync } = require("../utils");
const { PASSWORD, ERROR_MESSAGE } = require("../constants");

const userRepository = dataSource.getRepository("User");

const { FIELD_INVALID } = ERROR_MESSAGE;

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
	"dummy-for-timing-equalization",
	Number(process.env.SALT_ROUNDS) || 10,
);

router.post(
	"/signup",
	body(["name", "email"], FIELD_INVALID).isString().bail().trim().notEmpty(),
	body("email", FIELD_INVALID).isEmail().toLowerCase(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	body("password")
		.isString()
		.bail()
		.withMessage(FIELD_INVALID)
		.notEmpty()
		.bail()
		.withMessage(FIELD_INVALID)
		.matches(PASSWORD.REGEX)
		.withMessage(PASSWORD.MESSAGE),
	validate,
	catchAsync(async (req, res, next) => {
		const { name, email, password } = req.body;
		const isEmailExisted = await userRepository.existsBy({ email });

		if (isEmailExisted) {
			return next(new AppError(409, "Email 已被使用"));
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(process.env.SALT_ROUNDS) || 10,
		);

		const newUser = await userRepository.save({
			name,
			email,
			password: hashedPassword,
		});

		return res.status(201).json({
			status: "success",
			data: {
				user: {
					id: newUser.id,
					name: newUser.name,
				},
			},
		});
	}),
);

router.post(
	"/login",
	body("email", FIELD_INVALID)
		.isString()
		.bail()
		.trim()
		.notEmpty()
		.bail()
		.isEmail()
		.toLowerCase(),
	body("password")
		.isString()
		.bail()
		.withMessage(FIELD_INVALID)
		.notEmpty()
		.bail()
		.withMessage(FIELD_INVALID)
		.matches(PASSWORD.REGEX)
		.withMessage(PASSWORD.MESSAGE),
	validate,
	catchAsync(async (req, res, next) => {
		const { email, password } = req.body;
		const foundUser = await userRepository.findOne({
			select: { id: true, password: true, name: true, role: true },
			where: {
				email,
			},
		});
		const passwordComparedResult = await bcrypt.compare(
			password,
			foundUser?.password ?? DUMMY_PASSWORD_HASH,
		);

		if (foundUser === null || !passwordComparedResult) {
			return next(new AppError(400, "使用者不存在或密碼輸入錯誤"));
		}

		const token = jwt.sign(
			{
				id: foundUser.id,
				role: foundUser.role,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: process.env.JWT_EXPIRES_DAY,
			},
		);

		return res.status(201).json({
			status: "success",
			data: {
				token,
				user: {
					name: foundUser.name,
				},
			},
		});
	}),
);

router.get(
	"/profile",
	authenticate,
	catchAsync(async (req, res) => {
		const { name, email } = req.user;

		return res.json({
			status: "success",
			data: {
				user: {
					name,
					email,
				},
			},
		});
	}),
);

router.put(
	"/profile",
	authenticate,
	body("name", FIELD_INVALID).isString().bail().trim().notEmpty(),
	body("name", FIELD_INVALID).isLength({ max: 255 }),
	validate,
	catchAsync(async (req, res, next) => {
		const { id, name } = req.user;
		const { name: newName } = req.body;

		if (newName === name) {
			return next(new AppError(400, "使用者名稱未變更"));
		}

		const updateResult = await userRepository.update(id, { name: newName });

		if (updateResult.affected === 0) {
			return next(new AppError(400, "更新使用者資料失敗"));
		}

		return res.json({
			status: "success",
			data: {
				user: {
					name: newName,
				},
			},
		});
	}),
);

router.put(
	"/password",
	authenticate,
	body(["password", "new_password", "confirm_new_password"])
		.isString()
		.bail()
		.withMessage(FIELD_INVALID)
		.notEmpty()
		.bail()
		.withMessage(FIELD_INVALID)
		.matches(PASSWORD.REGEX)
		.withMessage(PASSWORD.MESSAGE),
	validate,
	catchAsync(async (req, res, next) => {
		const { password, new_password, confirm_new_password } = req.body;

		if (password === new_password) {
			return next(new AppError(400, "新密碼不能與舊密碼相同"));
		}

		if (new_password !== confirm_new_password) {
			return next(new AppError(400, "新密碼與驗證新密碼不一致"));
		}

		const { id } = req.user;
		const foundUser = await userRepository.findOne({
			select: { password: true },
			where: { id },
		});
		const passwordComparedResult = await bcrypt.compare(
			password,
			foundUser.password,
		);

		if (!passwordComparedResult) {
			return next(new AppError(400, "密碼輸入錯誤"));
		}

		const hashedNewPassword = await bcrypt.hash(
			new_password,
			Number(process.env.SALT_ROUNDS) || 10,
		);
		const updateResult = await userRepository.update(id, {
			password: hashedNewPassword,
		});

		if (updateResult.affected === 0) {
			return next(new AppError(400, "更新使用者資料失敗"));
		}

		return res.json({
			status: "success",
			data: null,
		});
	}),
);

module.exports = router;
