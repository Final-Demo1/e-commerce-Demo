import { Router } from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    checkout
} from "../controllers/cartControllers.js";
import isAuthenticated from "../middlewares/auth.js";

// Create cart router
const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(isAuthenticated);

// Define routes
cartRouter.get('/cart', getCart);
cartRouter.post('/cart/items', addToCart);
cartRouter.patch('/cart/items/:itemId', updateCartItem);
cartRouter.delete('/cart/items/:itemId', removeCartItem);
cartRouter.delete('/cart', clearCart);
cartRouter.post('/cart/checkout', checkout);

// Export the router
export default cartRouter; 