import express from 'express';
import productsRouter from './routes/products.js';
import mongoose from 'mongoose';
import userRouter from './routes/users.js';
import isAuthenticated from './middlewares/auth.js';


//Make database connection
await mongoose.connect(process.env.MONGO_URL);


//create an express app
const app = express();

//use global middlewares
app.use(express.json());


// use routes
app.use( productsRouter);
app.use(userRouter)

//listen for incoming request
const port= process.env.PORT || 3008;
app.listen(3008, () => {
    console.log (`server is listening on port ${port}`);
});