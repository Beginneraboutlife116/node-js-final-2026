const { AppError } = require("../utils");

function notFound(_req, _res, next) {
	return next(new AppError(404, "找不到這一個路由"));
}

module.exports = notFound;
