const jwt = require("jsonwebtoken");

const { AppError } = require("../utils");
const { dataSource } = require("../db");

const userRepository = dataSource.getRepository("User");

async function authenticate(req, _res, next) {
	const { authorization } = req.headers;

	if (!authorization?.startsWith("Bearer ")) {
		return next(new AppError(401, "請先登入"));
	}

	const token = authorization.split(" ")[1];
	let payload;

	try {
		payload = jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		const { name } = error;

		if (name === "TokenExpiredError") {
			return next(new AppError(401, "Token 已過期"));
		} else {
			return next(new AppError(401, "無效的 token"));
		}
	}

	const { id } = payload;
	const foundUser = await userRepository.findOneBy({
		id,
	});

	if (foundUser === null) {
		return next(new AppError(401, "無效的 token"));
	}

	req.user = foundUser;
	return next();
}

module.exports = authenticate;
