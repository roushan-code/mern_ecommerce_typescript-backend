import { myCache } from "../index.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventory } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};
    if (myCache.has('admin-stats')) {
        stats = JSON.parse(myCache.get('admin-stats'));
    }
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0)
        };
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const lastSixMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today
            }
        });
        const latestTransactionsPromise = Order.find().select(["orderItems", "discount", "total", "status"]).limit(4);
        const [thisMonthProducts, lastMonthProducts, thisMonthUsers, lastMonthUsers, thisMonthOrders, lastMonthOrders, productCount, userCount, allOrders, lastSixMonthsOrders, categories, femaleUsersCount, latestTransactions] = await Promise.all([
            thisMonthProductsPromise,
            lastMonthProductsPromise,
            thisMonthUsersPromise,
            lastMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find().select("total"),
            lastSixMonthsOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: 'female' }),
            latestTransactionsPromise
        ]);
        console.log(thisMonthOrders, lastMonthOrders);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const percentChange = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            user: userCount,
            product: productCount,
            order: allOrders.length,
        };
        const orderMonthCounts = new Array(6).fill(0);
        const orderMonthRevenue = new Array(6).fill(0);
        lastSixMonthsOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff <= 6) {
                orderMonthCounts[6 - monthDiff - 1] += 1;
                orderMonthRevenue[6 - monthDiff - 1] += order.total;
            }
        });
        const categoryCount = await getInventory({ categories, productCount });
        const userRatio = {
            male: userCount - femaleUsersCount,
            female: femaleUsersCount,
        };
        const modifyTransactions = latestTransactions.map((order) => {
            return {
                _id: order._id,
                quantity: order.orderItems.length,
                discount: order.discount,
                status: order.status,
                amount: order.total
            };
        });
        stats = {
            categoryCount,
            count,
            percentChange,
            chart: {
                order: orderMonthCounts,
                revenue: orderMonthRevenue
            },
            userRatio,
            latestTransaction: modifyTransactions
        };
        myCache.set('admin-stats', JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        stats
    });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = `admin-pie-charts`;
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const [processingOrder, shippedOrder, deliveredOrder, categories, productCount, productsOutOfStock, allOrders, allUsers, adminUsers, customersUsers] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"]),
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" })
        ]);
        const orderFullfillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const stockAvailability = {
            inStock: productCount - productsOutOfStock,
            outOfStock: productsOutOfStock
        };
        const grossIncome = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const discount = allOrders.reduce((total, order) => total + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((total, order) => total + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((total, order) => total + (order.tax || 0), 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        };
        const productCategories = await getInventory({ categories, productCount });
        const usersAgeGroup = {
            teen: allUsers.filter((i) => i.age < 20).length,
            adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
            old: allUsers.filter((i) => i.age >= 40).length,
        };
        const adminCustomer = {
            admin: adminUsers,
            customer: customersUsers
        };
        charts = {
            orderFullfillment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            adminCustomer,
            usersAgeGroup
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts
    });
});
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = 'admin-bar-charts';
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(today.getMonth() - 12);
        const sixMonthsProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const sixMonthsUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const twelveMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today
            }
        }).select("createdAt");
        const [products, users, orders] = await Promise.all([
            sixMonthsProductsPromise,
            sixMonthsUsersPromise,
            twelveMonthsOrdersPromise
        ]);
        const productCount = getChartData({ length: 6, docArr: products, today });
        const userCount = getChartData({ length: 6, docArr: users, today });
        const orderCount = getChartData({ length: 12, docArr: orders, today });
        charts = {
            products: productCount,
            users: userCount,
            orders: orderCount
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts
    });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = 'admin-line-charts';
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const today = new Date();
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(today.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today
            }
        };
        const [products, users, orders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt", "discount", "total"])
        ]);
        const productCount = getChartData({ length: 12, docArr: products, today });
        const userCount = getChartData({ length: 12, docArr: users, today });
        const discount = getChartData({ length: 12, docArr: orders, today, property: "discount" });
        const revenue = getChartData({ length: 12, docArr: orders, today, property: "total" });
        charts = {
            products: productCount,
            users: userCount,
            discount,
            revenue
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts
    });
});
