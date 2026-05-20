import ApiError from '../utils/ApiError.js';

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema object with optional body, query, params keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    ['params', 'query', 'body'].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false,
        });

        if (error) {
          const messages = error.details.map((detail) => detail.message);
          validationErrors.push(...messages);
        } else {
          req[key] = value;
        }
      }
    });

    if (validationErrors.length > 0) {
      return next(ApiError.badRequest(validationErrors.join(', ')));
    }

    next();
  };
};

export default validate;
