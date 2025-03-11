import { stripe } from "../index.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";
export const createPayment = TryCatch(async (req, res, next) => {
    const { amount } = req.body;
    if (!amount) {
        return next(new ErrorHandler(400, 'Please Enter Amount'));
    }
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount) * 100,
        currency: 'inr',
    });
    res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret
    });
});
export const newCoupon = TryCatch(async (req, res, next) => {
    const { code, amount } = req.body;
    console.log(req.body);
    if (!code || !amount) {
        return next(new ErrorHandler(400, 'Please Enter Coupon Code and Discount Amount'));
    }
    await Coupon.create({ code, amount });
    res.status(201).json({
        success: true,
        message: `Coupon ${code} Created Successfully`
    });
});
export const applyDiscount = TryCatch(async (req, res, next) => {
    const { coupon } = req.query;
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount) {
        return next(new ErrorHandler(400, 'Invalid Coupon Code'));
    }
    res.status(200).json({
        success: true,
        discount: discount.amount
    });
});
export const allCoupons = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find();
    if (!coupons) {
        return next(new ErrorHandler(400, 'No Coupons Found'));
    }
    res.status(200).json({
        success: true,
        coupons,
    });
});
export const getCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon)
        return next(new ErrorHandler(400, "Invalid Coupon ID"));
    res.status(200).json({
        success: true,
        coupon,
    });
});
export const updateCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { code, amount } = req.body;
    const coupon = await Coupon.findById(id);
    if (!coupon)
        return next(new ErrorHandler(400, "Invalid Coupon ID"));
    if (code)
        coupon.code = code;
    if (amount)
        coupon.amount = amount;
    await coupon.save();
    res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Updated Successfully`,
    });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
        return next(new ErrorHandler(400, 'Coupon Not Found'));
    }
    res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully`,
    });
});
