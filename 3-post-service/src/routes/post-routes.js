 const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post-controller");
const authenticateRequest = require("../middleware/authMiddleware");
const { sensitiveEndpointsLimiter } = require("../middleware/basicRateLimiter");

//middleware -> this will tell if user is auth user or not i.e.logged in or not
router.use(authenticateRequest);
router.use(sensitiveEndpointsLimiter(100, 1000 * 60 * 10));

// Ip based rate limiter
router.post("/create-post", createPost);

router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
