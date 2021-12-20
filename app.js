import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

import "dotenv/config";
const api = process.env.API_URL;
const __dirname = process.cwd();

// Importing routes
import productsRouter from "./routers/products.js";
import categoriesRouter from "./routers/categories.js";
import usersRouter from "./routers/users.js";
import orderRouter from "./routers/orders.js";

// Helpers
import authJWT from "./helpers/jwt.js";
import errorHandler from "./helpers/error-handler.js";

app.use(cors());
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(morgan("tiny"));
// With this method, the API is secured with the token
app.use(authJWT());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

// Products router
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, orderRouter);

// Configuration for DB connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshop-database",
  })
  .then(() => {
    console.log("Database connection ready!");
  })
  .catch((err) => console.log(err));

// Creation of the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
