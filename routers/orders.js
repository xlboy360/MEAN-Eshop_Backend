import express from "express";
import OrderItem from "../models/order-item.js";
import Order from "../models/order.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(orderList);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", select: "name", populate: "category" },
    });
  if (!order) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(order);
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    return res
      .status(400)
      .send({ success: false, message: "The order sales cannot be generates" });
  }

  res.status(200).send({ totalSales: totalSales.pop().totalsales });
});

router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    return res
      .status(400)
      .send({ success: false, message: "No items to count" });
  }

  res.status(200).send({ orderCount: orderCount });
});

router.get("/get/userorders/:id", async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.is })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    return res.status(400).send("Cannot find user orders");
  }

  res.status(200).send(userOrderList);
});

router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;
  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  const order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  });

  // order = await order.save();

  if (!order) {
    res.status(400).send({ success: false, message: "Cannot create order" });
  }

  res.status(200).send(order);
});

router.put("/:id", async (req, res) => {
  let order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) {
    return res.status(400).send("Cannot update order");
  }

  res.status(200).send(order);
});

router.delete("/:id", async (req, res) => {
  const deletedOrder = await Order.findByIdAndDelete(req.params.id);
  if (deletedOrder) {
    deletedOrder.orderItems.map(async (orderItemId) => {
      let orderItem = await OrderItem.findByIdAndDelete(orderItemId);
      if (!orderItem) {
        return res
          .status(400)
          .send({ success: false, message: "OrderItem cannot be deleted" });
      }
    });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "Cannot remove order" });
  }
  res.status(200).send(deletedOrder);
});

export default router;
