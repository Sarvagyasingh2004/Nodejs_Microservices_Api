const joi = require("joi");

const validateImage = (data) => {
  const schema = joi.object({
    publicId: joi.string().trim().required(),

    originalName: joi.string().trim().required(),

    mimeType: joi.string().trim().required(),

    url: joi.string().uri().required(),

    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  });

  return schema.validate(data);
};
module.exports = { validateImage };
