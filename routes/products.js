import { Router } from "express";
import { addProducts, countProducts, deleteProducts, getProducts, replaceProduct, updateProducts } from "../controllers/products.js";
import { productPicturesUpload } from "../middlewares/upload.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";

// Create products router
const productsRouter = Router();

// Define routes
productsRouter.post(
    '/products',
    isAuthenticated,
    isAuthorized(['superadmin', 'admin']),
    productPicturesUpload.array('pictures', 3),
    addProducts
);

productsRouter.get('/products', getProducts);

productsRouter.get('/products/count', countProducts);

// Fix the syntax error - removed the comma and fixed the structure
productsRouter.patch(
    '/products/:id', 
    isAuthenticated,
    productPicturesUpload.array('pictures', 3),
    updateProducts
);

productsRouter.put(
    '/products/:id',
    isAuthenticated,
    isAuthorized(['superadmin', 'admin']), // Added authorization check for consistency
    productPicturesUpload.array('pictures', 3),
    replaceProduct
);

productsRouter.delete(
    '/products/:id', 
    isAuthenticated,
    isAuthorized(['superadmin', 'admin']), // Added authorization check for consistency
    deleteProducts
);

// Export the router
export default productsRouter;