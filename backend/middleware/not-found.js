const AppError = require("../utils/app-error");

function notFound(_req, _res, next) {
	next(new AppError(404, "找不到這一個路由"));
}

module.exports = notFound;
