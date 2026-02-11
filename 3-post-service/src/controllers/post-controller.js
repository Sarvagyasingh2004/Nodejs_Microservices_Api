const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validatePost } = require("../utils/validation");
const { publishEvent } = require("../utils/rabbitmq");
const mongoose = require("mongoose");

async function invalidatePostCache(req, input) {
  //delete single post
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  //delete all posts
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.warn("Create post endpoint hit...");
  try {
    //validate the schema
    const { error } = validatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newPost.save();

    await publishEvent("post.created", {
      postId: newPost.id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePostCache(req, newPost._id.toString()); //invalidate cache

    logger.info("Post created successfully", newPost);
    return res.status(201).json({
      succes: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    return res.status(500).json({
      succes: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  logger.warn("Get all posts endpoint hit...");
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    //save posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    return res.json(result);
  } catch (error) {
    logger.error("Error fetching posts", error);
    return res.status(500).json({
      succes: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
  logger.warn("Get post endpoint hit...");
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const singlePostDetailsById = await Post.findById(postId);
    if (!singlePostDetailsById) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    await req.redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(singlePostDetailsById)
    );
    res.json(singlePostDetailsById);
  } catch (error) {
    logger.error("Error fetching post", error);
    return res.status(500).json({
      succes: false,
      message: "Error fetching post",
    });
  }
};

const deletePost = async (req, res) => {
  logger.warn("Delete post endpoint hit...");
  try {
    const post = await Post.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(req.params.id),
      user: new mongoose.Types.ObjectId(req.user.userId),
    });
    console.log(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    //publish post delete methods
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, req.params.id);
    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    return res.status(500).json({
      succes: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
