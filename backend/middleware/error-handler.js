const { ERROR_MESSAGE } = require("../constants");

const { ALREADY_A_COACH, DUPLICATED, EMAIL_TAKEN, SKILL_NOT_FOUND } =
	ERROR_MESSAGE;

// 正常路徑已經被各路由的 existsBy / countBy / findOne 擋掉了，
// 會走到這裡代表是競態：先查通過之後、真正寫入之前資料被別的請求改掉。
// 只列想清楚的約束 —— 沒列到的一律落到 500，才不會把程式的 bug 藏起來。
const CONSTRAINT_ERROR = Object.freeze({
	UQ_users_email: { statusCode: 409, message: EMAIL_TAKEN },
	UQ_coaches_user_id: { statusCode: 409, message: ALREADY_A_COACH },
	UQ_skills_name: { statusCode: 409, message: DUPLICATED },
	UQ_packages_name: { statusCode: 409, message: DUPLICATED },
	FK_courses_skill_id: { statusCode: 400, message: SKILL_NOT_FOUND },
	FK_skills_link_coaches_skill_id: {
		statusCode: 400,
		message: SKILL_NOT_FOUND,
	},
});

function errorHandler(err, _req, res, _next) {
	const constraintError = CONSTRAINT_ERROR[err.constraint];

	// 競態雖然回 4xx，但它發生過這件事值得留下紀錄
	if (constraintError) {
		console.error("[db]", err.code, err.constraint, err.detail);

		return res.status(constraintError.statusCode).json({
			status: "failed",
			message: constraintError.message,
		});
	}

	const { statusCode = 500, message } = err;

	if (statusCode === 500) {
		console.error(message);
	}

	return res.status(statusCode).json({
		status: "failed",
		message: statusCode === 500 ? "伺服器錯誤，請聯絡開發人員" : message,
	});
}

module.exports = errorHandler;
