const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .message(
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  );

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
  email: Joi.string().email().required(),
  password: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const projectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().min(Joi.ref('startDate')).optional().allow(null),
  status: Joi.string().valid('Active', 'On Hold', 'Completed', 'Archived').optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const taskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow('').optional(),
  assignedTo: Joi.string().hex().length(24).optional().allow(null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  status: Joi.string().valid('To Do', 'In Progress', 'In Review', 'Done').optional(),
  dueDate: Joi.date().optional().allow(null),
  project: Joi.string().hex().length(24).optional(),
  labels: Joi.array().items(Joi.string().max(30)).optional(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  next();
};

module.exports = { validate, signupSchema, loginSchema, projectSchema, taskSchema };
