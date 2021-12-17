import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  street: String,
  apartment: String,
  city: String,
  zip: String,
  country: String,
  phone: String,
  isAdmin: Boolean,
});

const User = mongoose.model("User", userSchema);
export default User;
