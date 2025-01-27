import express from "express";
import { allCoupons, applyDiscount, createPayment, deleteCoupon, newCoupon } from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/create", createPayment);

app.post("/coupon/new", adminOnly,  newCoupon);

app.get("/discount",  applyDiscount);

app.get('/coupon/all', adminOnly, allCoupons);

app.delete('/coupon/:id', adminOnly, deleteCoupon);



export default app;

