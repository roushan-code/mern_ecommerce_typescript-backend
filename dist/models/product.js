import mongoose from "mongoose";
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
    description: {
        type: String,
        required: [true, "Please Type Description"]
    },
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });
export const Product = mongoose.model("Product", productSchema);
