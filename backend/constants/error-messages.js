const ERROR_MESSAGE = Object.freeze({
	NAME_TAKEN: "資料重複",
	EMAIL_TAKEN: "Email 已被使用",
	FIELD_INVALID: "欄位未填寫正確",
	ID_INVALID: "格式錯誤",
	NOT_A_COACH: "使用者尚未成為教練",
	ALREADY_A_COACH: "使用者已經是教練",
	SKILL_NOT_FOUND: "技能不存在",
	COURSE_NOT_FOUND: "課程不存在",
	USER_NOT_FOUND: "使用者不存在",
	COACH_NOT_FOUND: "找不到該教練",
	CREDIT_PACKAGE_NOT_FOUND: "組合包不存在",
	ALREADY_BOOKED: "已經報名過此課程",
	CREDIT_PACKAGE_IN_USE: "方案已有購買紀錄，無法刪除",
	SKILL_IN_USE: "技能已有課程使用，無法刪除",
});

module.exports = ERROR_MESSAGE;
