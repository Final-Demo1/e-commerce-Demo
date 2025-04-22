import Joi from "joi";

// Validate adding an item to cart
export const addToCartValidator = Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).default(1)
});

// Validate updating cart item quantity
export const updateCartItemValidator = Joi.object({
    quantity: Joi.number().integer().min(1).required()
});

// Validate cart checkout
export const checkoutCartValidator = Joi.object({
    paymentMethodId: Joi.string().required(),
    shippingAddress: Joi.object({
        fullName: Joi.string().required(),
        addressLine1: Joi.string().required(),
        addressLine2: Joi.string().allow('', null),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
        phone: Joi.string().required()
    }).required()
}); 