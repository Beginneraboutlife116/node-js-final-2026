const errorHandler = require("./error-handler");
const notFound = require("./not-found");
const validate = require("./validate");
const authenticate = require("./authenticate");

module.exports = {
	validate,
	errorHandler,
	notFound,
	authenticate,
};
