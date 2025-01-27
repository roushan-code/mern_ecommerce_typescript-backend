import mongoose from "mongoose";
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
import { InvalidateCacheProps, orderItemType } from "../types/types.js";
import { Order } from "../models/order.js";
import { Document } from "mongoose";

export const connectDB = (uri: string)=>{
    mongoose.connect(uri, {
        dbName: "E-Commerce-db"
    }).then((data)=> console.log(`DB connected to ${data.connection.host}`))
    .catch((err)=> console.log(err))
}

export const invalidatesCache =  ({
    product,
    order,
    admin,
    userId,
    orderId,
    productId,
}: InvalidateCacheProps) => {
    if(product){
        const productKeys: string[] = [
            "latestProducts",
            "categories",
            "all-Products",
            `product-${productId}`
        ];
        if(typeof productId === "string"){
            productKeys.push(`product-${productId}`);
        }
        if(typeof productId === "object"){
            productId.forEach((i)=> {
                productKeys.push(`product-${i}`);
            })
        }

        myCache.del(productKeys)
    }
    if(order){
        const ordersKeys: string[] = ["all-orders", `my-orders-${userId}`, `order-${orderId}`];

        myCache.del(ordersKeys)
    }
    if(admin){
        myCache.del(["admin-stats", 
            "admin-pie-charts", 
            "admin-bar-charts", 
            "admin-line-charts",
        ]);
    }

}

export const reduceStock = async (orderItems: orderItemType[]) => {
    for(let i = 0; i< orderItems.length; i++){
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if(!product){
            throw new Error("Product not found");
        }
        product.stock -= order.quantity;
        await product.save();
}
}

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
    if(lastMonth === 0){
        return thisMonth*100;
    }
    const percentage = ((thisMonth) / lastMonth) * 100;
    return Number(percentage.toFixed(2));
}

export const getInventory = async ({categories, productCount}: {categories: string[]; productCount: number;})=>{
    const categoriesCountPromise = categories.map(category => Product.countDocuments({ category }))

        const categoriesCount = await Promise.all(categoriesCountPromise)

        const categoryCount: Record<string, number>[] = [];

        categories.forEach((category, i) => {
            categoryCount.push({
                [category]: Math.round((categoriesCount[i] / productCount) * 100)
            })
        })

        return categoryCount;
}

interface MyDocument extends Document {
    createdAt: Date;
    discount?: number;
    total?: number;
} 
type FuncProps = {
    length: number;
    docArr: MyDocument[];
    today: Date;
    property?: "discount" | "total";
}


export const getChartData = ({length, docArr, today, property}: FuncProps) => {
    const data = new Array(length).fill(0);

        docArr.forEach((i) => {
            const creationDate = i.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff <= length) {
                data[length - monthDiff - 1] += property ? i[property]! : 1;
            }
        });

        return data;
};