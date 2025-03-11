import { Product } from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../index.js";
import { findAverageRatings, invalidatesCache } from "../utils/features.js";
import { deleteFilesFromCloudinary, uploadFilesToCloudinary } from "../middlewares/features.js";
import { User } from "../models/user.js";
import { Review } from "../models/review.js";
// Revalidate on New,Udate,Delete, Product & new Order
export const getlatestProducts = TryCatch(async (req, res, next) => {
    let products = [];
    if (myCache.has("latestProducts"))
        products = JSON.parse(myCache.get("latestProducts"));
    else {
        products = await Product.find().sort({ createdAt: -1 }).limit(5);
        myCache.set("latestProducts", JSON.stringify(products));
    }
    res.status(200).json({
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
    res.status(200).json({
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
    res.status(200).json({
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
    res.status(200).json({
        status: "success",
        product,
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }
    const public_ids = [];
    product.photo.forEach((image) => public_ids.push(image.public_id));
    await deleteFilesFromCloudinary(public_ids);
    invalidatesCache({ product: true, admin: true, productId: String(product._id) });
    res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
    });
});
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, category, stock, description } = req.body;
    const photo = Array.isArray(req.files) ? req.files : [];
    // console.log(photo);
    if (photo.length < 1) {
        return next(new ErrorHandler(400, "Please upload at least one product image"));
    }
    if (!name || !price || !category || !stock) {
        return next(new ErrorHandler(400, "Please fill in all fields"));
    }
    // Upload files here
    const attachments = await uploadFilesToCloudinary(photo);
    const product = await Product.create({
        name,
        price,
        category: category.toLowerCase(),
        stock,
        photo: attachments,
        description,
    });
    invalidatesCache({ product: true, admin: true });
    res.status(201).json({
        status: "success",
        product,
        message: "Product created successfully"
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, category, stock, description } = req.body;
    const photo = Array.isArray(req.files) ? req.files : [];
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }
    const public_ids = [];
    product.photo.forEach(({ public_id }) => {
        public_ids.push(public_id);
    });
    if (photo.length > 0) {
        const attachments = await uploadFilesToCloudinary(photo);
        await deleteFilesFromCloudinary(public_ids);
        product.photo = attachments;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (category)
        product.category = category;
    if (stock)
        product.stock = stock;
    if (description)
        product.description = description;
    await product.save();
    invalidatesCache({ product: true, admin: true, productId: String(product._id) });
    res.status(200).json({
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
    res.status(200).json({
        status: "success",
        products,
        totalPage,
    });
});
export const allReviewsOfProduct = TryCatch(async (req, res, next) => {
    let reviews;
    // const key = `review-${req.params.id}`;
    // console.log(myCache.has(key))
    // if(myCache.has(key)){
    //     reviews = JSON.parse(myCache.get(key) as string);
    // } else{
    reviews = await Review.find({
        product: req.params.id,
    }).populate("user", "name photo")
        .sort({ updatedAt: -1 });
    //     myCache.set(key, JSON.stringify(reviews));
    // }
    res.status(200).json({
        success: true,
        reviews,
    });
});
export const newReview = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.query.id);
    if (!user)
        return next(new ErrorHandler(404, "Not Logged In"));
    const product = await Product.findById(req.params.id);
    if (!product)
        return next(new ErrorHandler(404, "Product Not Found"));
    const { comment, rating } = req.body;
    const alreadyReviewed = await Review.findOne({
        user: user._id,
        product: product._id,
    });
    if (alreadyReviewed) {
        alreadyReviewed.comment = comment;
        alreadyReviewed.rating = rating;
        await alreadyReviewed.save();
    }
    else {
        await Review.create({
            comment,
            rating,
            user: user._id,
            product: product._id,
        });
        //   invalidatesCache({
        //     product: true,
        //     review: true,
        //   });
    }
    const { ratings, numOfReviews } = await findAverageRatings(product?._id);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();
    //  invalidatesCache({
    //   product: true,
    //   productId: String(product._id),
    //   admin: true,
    //   review: true,
    // });
    res.status(alreadyReviewed ? 200 : 201).json({
        success: true,
        message: alreadyReviewed ? "Review Update" : "Review Added",
    });
});
export const deleteReview = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.query.id);
    if (!user)
        return next(new ErrorHandler(404, "Not Logged In"));
    const review = await Review.findById(req.params.id);
    if (!review)
        return next(new ErrorHandler(404, "Review Not Found"));
    const isAuthenticUser = review.user.toString() === user._id.toString();
    if (!isAuthenticUser)
        return next(new ErrorHandler(401, "Not Authorized"));
    await review.deleteOne();
    const product = await Product.findById(review.product);
    if (!product)
        return next(new ErrorHandler(404, "Product Not Found"));
    const { ratings, numOfReviews } = await findAverageRatings(product?._id);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();
    //  invalidatesCache({
    //   product: true,
    //   review: true,
    //   reviewId: String(review._id),
    // });
    res.status(200).json({
        success: true,
        message: "Review Deleted",
    });
});
