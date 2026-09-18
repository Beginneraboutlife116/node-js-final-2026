const express = require("express");
const router = express.Router();

const skillRouter = require("./skill");

router.get("/healthcheck", (_req, res) => {
	res.status(200).send("OK");
});

router.use("/api/coaches/skill", skillRouter);

module.exports = router;
