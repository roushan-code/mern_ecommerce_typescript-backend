import express from "express";
import { allCoupons, applyDiscount, createPayment, deleteCoupon, getCoupon, newCoupon, updateCoupon } from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/create", createPayment);

app.post("/coupon/new", adminOnly,  newCoupon);

app.get("/discount",  applyDiscount);

app.get('/coupon/all', adminOnly, allCoupons);

// route - /api/v1/payment/coupon/:id
app
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);



export default app;

