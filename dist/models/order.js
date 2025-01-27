import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: [true, "Please Enter Shipping Address"],
        },
        city: {
            type: String,
            required: [true, "Please Enter City"],
        },
        state: {
            type: String,
            required: [true, "Please Enter State"],
        },
        country: {
            type: String,
            required: [true, "Please Enter Country"],
        },
        pinCode: {
            type: Number,
            required: [true, "Please Enter Pin Code"],
        },
    },
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    subtotal: {
        type: Number,
        required: [true, "Please Enter Subtotal"],
    },
    tax: {
        type: Number,
        required: true,
    },
    shippingCharges: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing",
    },
    total: {
        type: Number,
        required: [true, "Please Enter Total Price"],
    },
    orderItems: [
        {
            name: String,
            photo: String,
            price: Number,
            quantity: Number,
            productId: {
                type: mongoose.Types.ObjectId,
                ref: "Product"
            },
        },
    ],
}, {
    timestamps: true,
});
export const Order = mongoose.model("Order", orderSchema);
