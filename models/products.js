import { Schema, model, Types } from "mongoose";
import normalize from "normalize-mongoose";

const productShema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    // image: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, enum: ["cereals", "fresh milk"], required: true },
    pictures: [{ type: String, required: true }],
    userId: { type: Types.ObjectId, required: true, ref: "User" },
  },
  {
    timestamps: true,
  }
);

productShema.plugin(normalize);

export const productModel = model("Product", productShema);
