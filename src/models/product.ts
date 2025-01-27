import mongoose from "mongoose";

export interface IProduct extends mongoose.Document {
  name: string;
  photo: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Product Name"],
  },
  photo: {
    type: String,
    required: [true, "Please Add Photo"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
  },
  stock: {
    type: Number,
    required: [true, "Please Enter Product Stock"],
  },
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
    trim: true,
  }

},
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);