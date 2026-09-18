const express = require("express");
const router = express.Router();

const skillRouter = require("./skill");
const creditPackageRouter = require("./credit-package");

router.get("/healthcheck", (_req, res) => {
	res.status(200).send("OK");
});

router.use("/api/coaches/skill", skillRouter);
router.use("/api/credit-package", creditPackageRouter);

module.exports = router;
