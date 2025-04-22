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

export const forgotPasswordValidator = Joi.object({
    email: Joi.string().email().required()
});

export const resetPasswordValidator = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.ref('newPassword')
})
    .with('newPassword', 'confirmPassword');

export const addPaymentMethodValidator = Joi.object({
    type: Joi.string().valid('credit_card', 'paypal', 'momo').required(),
    details: Joi.object().required(),
    isDefault: Joi.boolean().default(false)
});