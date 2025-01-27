import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { ControllerType, newOrderRequestBody } from "../types/types.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import { Order } from "../models/order.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../index.js";

export const myOrders: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;
    let orders = [];

    if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
    else {
        orders = await Order.find({ user });
        myCache.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        status: "success",
        orders,
    });
});

export const allOrders: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const key = `all-orders`;
    let orders = [];

    if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
    else {
        orders = await Order.find().populate("user", "name");
        myCache.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        status: "success",
        orders,
    });
});

export const getSingleOrder: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const key = `order-${id}`;

    let order;

    if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
    else {
        order = await Order.findById(id).populate("user", "name");
        if (!order) return next(new ErrorHandler(404, "Order Not Found"));
        myCache.set(key, JSON.stringify(order));
    }
    res.status(200).json({
        status: "success",
        order,
    });
});

export const newOrder: ControllerType = TryCatch(async (req: Request<{}, {}, newOrderRequestBody>, res: Response, next: NextFunction) => {
    const {
        shippingCharges,
        user,
        subtotal,
        tax,
        shippingInfo,
        discount,
        orderItems,
    } = req.body;

    if (shippingCharges === undefined || user === undefined || subtotal === undefined || tax === undefined || shippingInfo === undefined || discount === undefined || orderItems === undefined) {
        console.log("Please fill all fields in order");
        return next(new ErrorHandler(400, "Please fill all fields"));
    }
    const newOrder = await Order.create({
        shippingCharges,
        user,
        subtotal,
        tax,
        shippingInfo,
        discount,
        total: subtotal + tax + shippingCharges - discount,
        orderItems
    });

    await reduceStock(orderItems);

    invalidatesCache({
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: newOrder.orderItems.map(i => String(i.productId))
    });

    res.status(201).json({
        status: "success",
        order: newOrder,
        message: "Order created successfully",
    });
});

export const processOrder: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) return next(new ErrorHandler(404, "Order Not Found"));

    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }

    await order.save();

    invalidatesCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user as string,
        orderId: order._id as string
    });

    res.status(200).json({
        status: "success",
        message: "Order Processed Successfully",
    });
});

export const deleteOrder: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) return next(new ErrorHandler(404, "Order Not Found"));

    await order.deleteOne();

    invalidatesCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user as string,
        orderId: order._id as string
    });

    res.status(200).json({
        status: "success",
        message: "Order Deleted Successfully",
    });
});