import mongoose from "mongoose";
import { Product } from "../models/product.js";
import { myCache } from "../index.js";
import { Review } from "../models/review.js";
export const connectDB = (uri) => {
    mongoose.connect(uri, {
        dbName: "E-Commerce-db"
    }).then((data) => console.log(`DB connected to ${data.connection.host}`))
        .catch((err) => console.log(err));
};
export const findAverageRatings = async (productId) => {
    let totalRating = 0;
    const reviews = await Review.find({ product: productId });
    reviews.forEach((review) => {
        totalRating += review.rating;
    });
    const averateRating = Math.floor(totalRating / reviews.length) || 0;
    return {
        numOfReviews: reviews.length,
        ratings: averateRating,
    };
};
export const invalidatesCache = ({ product, order, admin, userId, orderId, productId, review, reviewId }) => {
    if (product) {
        const productKeys = [
            "latestProducts",
            "categories",
            "all-Products",
            `product-${productId}`,
        ];
        if (typeof productId === "string") {
            productKeys.push(`product-${productId}`);
        }
        if (typeof productId === "object") {
            productId.forEach((i) => {
                productKeys.push(`product-${i}`);
            });
        }
        myCache.del(productKeys);
    }
    if (order) {
        const ordersKeys = ["all-orders", `my-orders-${userId}`, `order-${orderId}`];
        myCache.del(ordersKeys);
    }
    if (admin) {
        myCache.del(["admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
    if (review) {
        const reviewKeys = [
            `review-${reviewId}`,
        ];
        myCache.del(reviewKeys);
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
            throw new Error("Product not found");
        }
        product.stock -= order.quantity;
        await product.save();
    }
};
export const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0) {
        return thisMonth * 100;
    }
    const percentage = ((thisMonth) / lastMonth) * 100;
    return Number(percentage.toFixed(2));
};
export const getInventory = async ({ categories, productCount }) => {
    const categoriesCountPromise = categories.map(category => Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productCount) * 100)
        });
    });
    return categoryCount;
};
export const getChartData = ({ length, docArr, today, property }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDiff <= length) {
            data[length - monthDiff - 1] += property ? i[property] : 1;
        }
    });
    return data;
};
