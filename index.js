import express from 'express';
import 'dotenv/config';
import productsRouter from './routes/products.js';
import mongoose from 'mongoose';
// import cors from "cors";
import userRouter from './routes/user.js';



//Make database connection
const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console, log(err);
  });

//create an express app
const app = express();

//use global middlewares
app.use(express.json());


// use routes
app.use("/api/v1", productsRouter);
app.use( "/api/v1", userRouter)

//listen for incoming request
const port= process.env.PORT || 3020;
app.listen(3020, () => {
    console.log (`server is listening on port ${port}`);
});