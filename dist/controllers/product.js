import { Product } from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../index.js";
import { invalidatesCache } from "../utils/features.js";
// Revalidate on New,Udate,Delete, Product & new Order
export const getlatestProducts = TryCatch(async (req, res, next) => {
    let products = [];
    if (myCache.has("latestProducts"))
        products = JSON.parse(myCache.get("latestProducts"));
    else {
        products = await Product.find().sort({ createdAt: -1 }).limit(5);
        myCache.set("latestProducts", JSON.stringify(products));
    }
    return res.status(200).json({
        status: "success",
        products,
    });
});
// Revalidate on New,Udate,Delete, Product & new Order
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;
    if (myCache.has("categories"))
        categories = JSON.parse(myCache.get("categories"));
    else {
        categories = await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }
    return res.status(200).json({
        status: "success",
        categories,
    });
});
// Revalidate on New,Udate,Delete, Product & new Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products = [];
    if (myCache.has("all-Products"))
        products = JSON.parse(myCache.get("all-Products"));
    else {
        products = await Product.find();
        myCache.set("all-Products", JSON.stringify(products));
    }
    return res.status(200).json({
        status: "success",
        products,
    });
});
// Revalidate on New,Udate,Delete, Product & new Order
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const id = req.params.id;
    if (myCache.has(`product-${id}`)) {
        product = JSON.parse(myCache.get(`product-${id}`));
    }
    else {
        product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorHandler(404, "Product not found"));
        }
        myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        status: "success",
        product,
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }
    rm(product.photo, () => {
        console.log("Deleted photo from disk");
    });
    invalidatesCache({ product: true, admin: true, productId: String(product._id) });
    return res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
    });
});
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, category, stock } = req.body;
    const photo = req.file;
    if (!photo) {
        return next(new ErrorHandler(400, "Please upload a photo"));
    }
    if (!name || !price || !category || !stock) {
        rm(photo.path, () => {
            console.log("Deleted photo from disk");
        });
        return next(new ErrorHandler(400, "Please fill in all fields"));
    }
    const product = await Product.create({
        name,
        price,
        category: category.toLowerCase(),
        stock,
        photo: photo?.path,
    });
    invalidatesCache({ product: true, admin: true });
    return res.status(201).json({
        status: "success",
        product,
        message: "Product created successfully"
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }
    if (photo) {
        rm(product.photo, () => {
            console.log("Deleted old photo");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (category)
        product.category = category;
    if (stock)
        product.stock = stock;
    await product.save();
    invalidatesCache({ product: true, admin: true, productId: String(product._id) });
    return res.status(200).json({
        status: "success",
        message: "Product Updated Successfully",
    });
});
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, sort, category, price = 10000000 } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCTS_PER_PAGE) || 10;
    const skip = (page - 1) * limit || 0;
    const baseQuery = {};
    // const products = await Product.find(baseQuery);
    if (search)
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    if (price)
        baseQuery.price = {
            $lte: Number(price),
        };
    if (category)
        baseQuery.category = category;
    const [products, filteredProduct] = await Promise.all([
        Product.find(baseQuery)
            .sort(sort && { price: sort === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(limit),
        Product.find(baseQuery)
    ]);
    const totalPage = Math.ceil(filteredProduct.length / limit);
    return res.status(200).json({
        status: "success",
        products,
        totalPage,
    });
});
