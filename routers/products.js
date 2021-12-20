import express from "express";
import Category from "../models/category.js";
import Product from "../models/product.js";
import mongoose from "mongoose";

import multer from "multer";

const router = express.Router();

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/gif": "gif",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValidFile = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");
    if (isValidFile) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}_${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }
  const productList = await Product.find(filter)
    .select("name") // With select we can optimize the time of the query
    .populate("category");
  if (!productList) {
    res.status(500).json({ success: false, message: "No products to show" });
  }
  res.send(productList);
});

router.get("/:id", async (req, res) => {
  // With populate, we can obtain the data of contained collections in the doc
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) {
    res
      .status(500)
      .send({ success: false, message: `Product ${req.params.id} not found` });
  }
  res.status(200).send(product);
});

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Category not valid");

  const file = req.file;
  if (!file) return res.status(400).send("No image in the request");

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) {
    return res.status(500).send("Product cannot be created");
  }
  res.status(201).send(product);
});

router.put("/:id", uploadOptions.array("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Product id not valid");
  }

  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).send({
      success: false,
      message: `Category ${req.body.category} does not exist`,
    });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(400).send("Product ID not valid");
  }

  const file = req.file;
  let imagepath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;
    imagepath = `${basePath}${fileName}`;
  } else {
    imagepath = product.image;
  }

  let updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct) {
    res.status(500).send({
      success: false,
      message: `Cannot update product: ${req.params.id}`,
    });
  }

  res.status(200).send(updatedProduct);
});

router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid product ID");
    }

    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.fileName}`);
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate({
      images: imagesPaths,
    });

    if (!updatedProduct) {
      res.status(500).send({
        success: false,
        message: `Cannot update product: ${req.params.id}`,
      });
    }

    res.status(200).send(updatedProduct);
  }
);

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Product id not valid");
  }

  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    res.status(404).send({
      success: false,
      message: `Cannot delete ${req.params.id} product`,
    });
  }

  res.status(200).send(product);
});

router.get(`/get/count`, async (req, res) => {
  let productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false, message: "No products to show" });
  }
  res.status(200).send({
    productCount: productCount,
  });
});

router.get("/get/featured", async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });

  if (!featuredProducts) return res.status(400).send("No featured products");

  res.status(200).send(featuredProducts);
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredProducts = await Product.find({ isFeatured: true }).limit(
    +count
  );

  if (!featuredProducts) return res.status(400).send("No featured products");

  res.status(200).send(featuredProducts);
});

export default router;
