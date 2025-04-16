import { Router } from "express";
import { addProducts, countProducts, deleteProducts, getProducts, replaceProduct, updateProducts } from "../controllers/products.js";
import { localUpload, productImageUpload, productPicturesUpload, remoteUpload } from "../middlewares/upload.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";


//create products router
const productsRouter = Router();

//define routes
productsRouter.post(
    '/products',
    isAuthenticated,
    isAuthorized(['superadmin','admin']),
    productPicturesUpload.array('pictures', 3),
    addProducts
);


productsRouter.get('/products', getProducts);

productsRouter.get('/products/count', countProducts)

productsRouter.patch('/products/:id', isAuthenticated, updateProducts),
    productsRouter.put(
        '/products/:id',
        isAuthenticated,
        productPicturesUpload.array('pictures', 3),
        replaceProduct
    );
productsRouter.delete('/products/:id', isAuthenticated, deleteProducts);

//export the router
export default productsRouter;