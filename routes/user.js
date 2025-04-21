import { Router } from "express";
import {
    addPaymentMethod,
    deletePaymentMethod,
    forgotPassword,
    getAuthenticatedUser,
    getPaymentMethods,
    loginUser,
    registerUser,
    resetPassword,
    updateDefaultPaymentMethod,
    updateUser
} from "../controllers/user.js";
import isAuthenticated from "../middlewares/auth.js";

//Create user router
const userRouter = Router();

//Define routes
userRouter.post('/users/register', registerUser);

userRouter.post('/users/login', loginUser);

userRouter.patch('/users/:id', updateUser);

userRouter.get('/users/me', isAuthenticated, getAuthenticatedUser);

// Password reset routes
userRouter.post('/users/forgot-password', forgotPassword);
userRouter.post('/users/reset-password', resetPassword);

// Payment method routes
userRouter.post('/users/payment-methods', isAuthenticated, addPaymentMethod);
userRouter.get('/users/payment-methods', isAuthenticated, getPaymentMethods);
userRouter.delete('/users/payment-methods/:methodId', isAuthenticated, deletePaymentMethod);
userRouter.patch('/users/payment-methods/:methodId/default', isAuthenticated, updateDefaultPaymentMethod);

//Export router
export default userRouter;