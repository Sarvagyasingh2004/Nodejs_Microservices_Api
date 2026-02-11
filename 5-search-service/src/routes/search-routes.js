const express = require("express");
const { searchPostController } = require("../controllers/search-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const { sensitiveEndpointsLimiter } = require("../middleware/basicRateLimiter");

const router = express.Router();

router.use(authenticateRequest);

router.get(
  "/posts",
  sensitiveEndpointsLimiter(100, 10 * 60 * 1000),
  searchPostController
);

module.exports = router;
