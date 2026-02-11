const joi = require("joi");

const validatePost = (data) => {
  const schema = joi.object({
    content: joi.string().min(3).max(500).required(),
    mediaIds: joi.array(),
  });
  return schema.validate(data);
};

module.exports = { validatePost };
