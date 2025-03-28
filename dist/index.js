import express from 'express';
import userRoute from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
const port = process.env.PORT || 3000;
config({
    path: './.env',
});
const app = express();
app.use(cors({
    origin: [process.env.CLIENT_URL || "http://default-url.com", "http://localhost:5173"],
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
const mongoURI = process.env.MONGODB_URI || "";
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
connectDB(mongoURI);
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/uploads", express.static("uploads"));
// Error-handling middleware must be defined last
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
export default app;
