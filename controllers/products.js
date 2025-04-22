import { productModel } from "../models/products.js";
import { addProductValidator, replaceProductValidator } from "../validators/products.js";
import mongoose from "mongoose";

export const addProducts = async (req, res, next) => {
    try {
        //Validate product information
        const { error, value } = addProductValidator.validate({
            ...req.body,
            pictures: req.files && req.files.length > 0 
                ? req.files.map((file) => file.filename) 
                : [],
        });
        
        if (error) {
            return res.status(422).json({ message: error.details[0].message });
        }
        
        //Check if product does not exist
        const count = await productModel.countDocuments({
            name: value.name
        });
        
        if (count) {
            return res.status(409).json({ message: 'Product with name already exists!' });
        }
        
        //Save product information in database
        const result = await productModel.create({
            ...value,
            userId: req.auth.id
        });
        
        //Return response
        res.status(201).json(result);
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error code
            return res.status(409).json({ message: 'Product with this name already exists!' });
        }
        next(error);
    }
}

export const getProducts = async (req, res, next) => {
    try {
        const { filter = "{}", sort = "{}", page = 1, limit = 10 } = req.query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Fetch products from database with pagination
        const products = await productModel
            .find(parsedFilter)
            .sort(parsedSort)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination info
        const total = await productModel.countDocuments(parsedFilter);
        
        res.json({
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        if (error instanceof SyntaxError) {
            return res.status(400).json({ message: "Invalid filter or sort parameter" });
        }
        next(error);
    }
}

export const countProducts = async (req, res, next) => {
    try {
        const { filter = "{}" } = req.query;
        const parsedFilter = JSON.parse(filter);
        
        const count = await productModel.countDocuments(parsedFilter);
        res.json({ count });
    } catch (error) {
        if (error instanceof SyntaxError) {
            return res.status(400).json({ message: "Invalid filter parameter" });
        }
        next(error);
    }
}

export const updateProducts = async (req, res, next) => {
    try {
        // Validate product information
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        
        // Only update fields that are provided
        const updates = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }
        
        // Add uploaded files if any
        if (req.files && req.files.length > 0) {
            updates.pictures = req.files.map(file => file.filename);
        }
        
        const result = await productModel.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        
        if (!result) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export const replaceProduct = async (req, res, next) => {
    try {
        // Validate incoming request body
        const { error, value } = replaceProductValidator.validate({
            ...req.body,
            pictures: req.files && req.files.length > 0 
                ? req.files.map((file) => file.filename) 
                : req.body.pictures || [],
        });
        
        if (error) {
            return res.status(422).json({ message: error.details[0].message });
        }
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        
        // Check if user has permission to modify this product
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        if (product.userId.toString() !== req.auth.id) {
            return res.status(403).json({ message: "You don't have permission to modify this product" });
        }
        
        // Perform model replace operation
        const result = await productModel.findOneAndReplace(
            { _id: req.params.id },
            { ...value, userId: req.auth.id },
            { new: true }
        );
        
        // Return response
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export const deleteProducts = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        
        // Check if user has permission to delete this product
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        if (product.userId.toString() !== req.auth.id) {
            return res.status(403).json({ message: "You don't have permission to delete this product" });
        }
        
        await productModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `Product with id ${req.params.id} deleted successfully` });
    } catch (error) {
        next(error);
    }
}