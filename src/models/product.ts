import mongoose from "mongoose";

export interface IProduct extends mongoose.Document {
  name: string;
  photo: {
    public_id: string;
    url: string;
  }[];
  price: number;
  stock: number;
  category: string;
  description: string;
  ratings: number;
  numOfReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Product Name"],
  },
  photo: [
    {
      public_id: {
        type: String,
        required: [true, "Please Add Photo"],
      },
      url: {
        type: String,
        required: [true, "Please Add Photo"],
      },
    },
  ],
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
  },
  description:{
    type: String,
    required: [true, "Please Type Description" ]
  },
  ratings:{
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0,
  }

},
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);