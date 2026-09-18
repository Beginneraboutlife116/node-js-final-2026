const express = require("express");
const path = require("node:path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes");

const { notFound, errorHandler } = require("./middleware");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
