import Joi from "joi";

export const registerUserValidator = Joi.object({
    userName: Joi.string().required(),  // Changed from username to userName to match your code
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.ref('password')
})
.with('password', 'confirmPassword');

export const loginUserValidator = Joi.object({
    // Allow either username or email for login, not both required
    userName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().required()
})
.xor('userName', 'email') // Require either userName OR email, but not both or neither
.required();

export const updateUserValidator = Joi.object({
    role: Joi.string().valid('buyer', 'admin', 'superadmin').required(),
});