import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.js";
const router = express.Router();
router.post("/new", newOrder);
router.get("/my", myOrders);
router.get("/all", adminOnly, allOrders);
router.route("/:id").get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);
export default router;
