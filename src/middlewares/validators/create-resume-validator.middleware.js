import Joi from "joi";
import { MESSAGES } from "../../constants/message.constant.js";
import { MIN_RESUME_LENGTH } from "../../constants/resume.constant.js";

const schema = Joi.object({
  title: Joi.string().required().messages({
    "any.required": MESSAGES.RESUMES.COMMON.TITLE.REQUIRED,
  }),
  content: Joi.string().min(MIN_RESUME_LENGTH).required().messages({
    "any.required": MESSAGES.RESUMES.COMMON.CONTENT.REQUIRED,
    "string.min": MESSAGES.RESUMES.COMMON.CONTENT.MIN_LENGTH,
  }),
});

export const createResumeValidator = async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
