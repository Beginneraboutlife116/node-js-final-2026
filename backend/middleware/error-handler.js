function errorHandler(err, _req, res, _next) {
	const { statusCode = 500, message } = err;

	if (statusCode === 500) {
		console.error(message);
	}

	res.status(statusCode).json({
		status: "failed",
		message: statusCode === 500 ? "伺服器錯誤，請聯絡開發人員" : message,
	});
}

module.exports = errorHandler;
