const PASSWORD = Object.freeze({
	REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/,
	MESSAGE: "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字",
});

module.exports = PASSWORD;
