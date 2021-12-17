import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
  orderItems: String,
  shippingAddress1: String,
  shippingAddress2: String,
  city: String,
  zip: String,
  country: String,
  phone: Number,
  status: String,
  totalPrice: Number,
  user: String,
  dateOrdered: Date,
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
