import Joi from "joi";

export const addProductValidator = Joi.object({
    name: Joi.string().trim().required().min(3).max(100),
    price: Joi.number().required().min(0),
    description: Joi.string().required().min(10),
    quantity: Joi.number().integer().required().min(0),
    pictures: Joi.array().items(Joi.string().required()).min(1)
        .required()
        .messages({
            'array.min': 'At least one product image is required',
            'array.base': 'Product images are required'
        }),
    category: Joi.string().required().valid(
        "Cereals", 
        "Fresh milk", 
        "Tuber foods", 
        "Tea leaves", 
        "Fruits", 
        "Spices", 
        "Vegetables"
    )
});

export const replaceProductValidator = Joi.object({
    name: Joi.string().trim().required().min(3).max(100),
    price: Joi.number().required().min(0),
    description: Joi.string().required().min(10),
    quantity: Joi.number().integer().required().min(0),
    pictures: Joi.array().items(Joi.string().required()).min(1)
        .required()
        .messages({
            'array.min': 'At least one product image is required',
            'array.base': 'Product images are required'
        }),
    category: Joi.string().required().valid(
        "Cereals", 
        "Fresh milk", 
        "Tuber foods", 
        "Tea leaves", 
        "Fruits", 
        "Spices", 
        "Vegetables"
    )
});

export const updateProductValidator = Joi.object({
    name: Joi.string().trim().min(3).max(100),
    price: Joi.number().min(0),
    description: Joi.string().min(10),
    quantity: Joi.number().integer().min(0),
    pictures: Joi.array().items(Joi.string()),
    category: Joi.string().valid(
        "Cereals", 
        "Fresh milk", 
        "Tuber foods", 
        "Tea leaves", 
        "Fruits", 
        "Spices", 
        "Vegetables"
    )
}).min(1); // At least one field must be provided for update