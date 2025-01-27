import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";


export const createPayment = TryCatch(async (req, res, next) => {
    const {amount} = req.body;
    console.log(amount)
    if(!amount){
        return next(new ErrorHandler( 400, 'Please Enter Amount'))
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount) * 100,
        currency: 'inr',
    });

    return res.status(200).json({
        success: true, 
        client_secret: paymentIntent.client_secret
    })
});

export const newCoupon = TryCatch(async (req, res, next) => {
    const {coupon, amount} = req.body;

    if(!coupon || !amount){
        return next(new ErrorHandler( 400, 'Please Enter Coupon Code and Discount Amount'))
    }

    await Coupon.create({code: coupon, amount})

    return res.status(201).json({
        success: true, 
        message: `Coupon ${coupon} Created Successfully`
    })
})

export const applyDiscount = TryCatch(async (req, res, next) => {
    const {coupon} = req.query;

    const discount = await Coupon.findOne({code: coupon});

    if(!discount){
        return next(new ErrorHandler( 400, 'Invalid Coupon Code'))
    }

    return res.status(200).json({
        success: true, 
        discount: discount.amount
    })
});

export const allCoupons = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find();

    if(!coupons){
        return next(new ErrorHandler( 400, 'No Coupons Found'))
    }

    return res.status(200).json({
        success: true, 
        coupons,
    })
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
    const {id} = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if(!coupon){
        return next(new ErrorHandler( 400, 'Coupon Not Found'))
    }

    return res.status(200).json({
        success: true, 
        message: `Coupon ${coupon.code} Deleted Successfully`,
    })
});