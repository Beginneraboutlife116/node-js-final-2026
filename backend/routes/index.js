const express = require("express");
const router = express.Router();

router.get("/healthcheck", (_req, res) => {
	res.status(200).send("OK");
});

router.use((_req, res) => {
	res.status(404).json({ error: "找不到這一個路由" });
});

router.use((err, _req, res, _next) => {
	res.status(500).json({ error: err });
});

module.exports = router;
