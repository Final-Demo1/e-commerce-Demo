import { Schema, model, Types } from "mongoose";
import normalize from "normalize-mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { 
      type: String, 
      enum: ["Cereals", "Fresh milk", "Tuber foods", "Tea leaves", "Fruits", "Spices", "Vegetables"], 
      required: true 
    },
    pictures: [{ type: String, required: true }],
    userId: { type: Types.ObjectId, required: true, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ userId: 1 });

productSchema.plugin(normalize);

export const productModel = model("Product", productSchema);