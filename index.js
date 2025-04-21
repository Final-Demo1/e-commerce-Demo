import express from 'express';
import 'dotenv/config';
import productsRouter from './routes/products.js';
import mongoose from 'mongoose';
import cors from "cors";
import userRouter from './routes/user.js';
import cartRouter from './routes/cartRoutes.js';



//Make database connection
const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log(err);
  });

//create an express app
const app = express();

//use global middlewares
app.use(express.json());
app.use(cors());

// Add a test route at the root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the E-commerce API' });
});

// use routes
app.use("/api/v1", productsRouter);
app.use("/api/v1", userRouter);
app.use("/api/v1", cartRouter);

//listen for incoming request
const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});