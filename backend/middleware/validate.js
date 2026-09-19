const { validationResult } = require("express-validator");
const AppError = require("../utils/app-error");

function validate(req, _res, next) {
	const result = validationResult(req);

	if (result.isEmpty()) {
		return next();
	}

	const { msg } = result.array()[0];

	return next(new AppError(400, msg));
}

module.exports = validate;
