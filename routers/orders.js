import express from "express";
import Order from "../models/order.js";
import Product from "../models/product.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const orderList = await Product.find();
  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});
