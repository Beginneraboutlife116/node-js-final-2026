const express = require("express");
const router = express.Router();

const skillRouter = require("./skill");
const creditPackageRouter = require("./credit-package");
const userRouter = require("./user");
const adminRouter = require("./admin");
const coachesRouter = require("./coaches");
const coursesRouter = require("./courses");

router.get("/healthcheck", (_req, res) => {
	res.status(200).send("OK");
});

router.use("/api/coaches/skill", skillRouter);
router.use("/api/credit-package", creditPackageRouter);
router.use("/api/users", userRouter);
router.use("/api/admin/coaches", adminRouter);
router.use("/api/coaches", coachesRouter);
router.use("/api/courses", coursesRouter);

module.exports = router;
