import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAllProducts, updateProduct, getAllCategories, getlatestProducts, getSingleProduct, newProduct, allReviewsOfProduct, newReview, deleteReview } from "../controllers/product.js";
import { attachmentsMulter } from "../middlewares/multer.js";
// import { singleUpload } from "../middlewares/multer.js";
const app = express.Router();
app.post("/newProduct", adminOnly, attachmentsMulter, newProduct);
// To get all products with filter
app.get("/all", getAllProducts);
app.get("/latestProducts", getlatestProducts);
app.get("/categories", getAllCategories);
app.get("/admin/products", adminOnly, getlatestProducts);
app.route("/:id").get(getSingleProduct).delete(adminOnly, deleteProduct).put(adminOnly, attachmentsMulter, updateProduct);
app.get("/reviews/:id", allReviewsOfProduct);
app.post("/review/new/:id", newReview);
app.delete("/review/:id", deleteReview);
export default app;
