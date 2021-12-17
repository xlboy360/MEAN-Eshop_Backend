import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  color: { type: String },
  image: { type: String },
});

// It is a more friendly way to get a copy of the original _id
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

categorySchema.set("toJSON", {
  virtuals: true,
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
