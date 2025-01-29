import { NextFunction, Request, Response } from "express";
import { Product } from "../models/product.js";
import { BaseQuery, ControllerType, newProductRequestBody, SearchRequestQuery, } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../index.js";
import { invalidatesCache } from "../utils/features.js";
import { deleteFilesFromCloudinary, uploadFilesToCloudinary } from "../middlewares/features.js";



// Revalidate on New,Udate,Delete, Product & new Order
export const getlatestProducts: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    let products = []
    if(myCache.has("latestProducts"))
        products = JSON.parse(myCache.get("latestProducts") as string);
    else{
        products = await Product.find().sort({ createdAt: -1 }).limit(5);
        myCache.set("latestProducts", JSON.stringify(products));
    }
    
     res.status(200).json({
        status: "success",
        products,
    });

});

// Revalidate on New,Udate,Delete, Product & new Order
export const getAllCategories: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let categories;

    if(myCache.has("categories"))
        categories = JSON.parse(myCache.get("categories") as string);
    else{
        categories = await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }

     res.status(200).json({
        status: "success",
        categories,
    });

});

// Revalidate on New,Udate,Delete, Product & new Order
export const getAdminProducts: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let products = [];

    if(myCache.has("all-Products"))
        products = JSON.parse(myCache.get("all-Products") as string);
    else{
        products = await Product.find();
        myCache.set("all-Products", JSON.stringify(products));
    }
     res.status(200).json({
        status: "success",
        products,
    });

});

// Revalidate on New,Udate,Delete, Product & new Order
export const getSingleProduct: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let product;

    const id = req.params.id;

    if(myCache.has(`product-${id}`)){
        product = JSON.parse(myCache.get(`product-${id}`) as string);
    }
    else{
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
export const deleteProduct: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }

    const public_ids: string[] = [];

    product.photo.forEach((image) => public_ids.push(image.public_id));

    await deleteFilesFromCloudinary(public_ids);

     invalidatesCache({ product: true, admin: true,  productId: String(product._id) });

    
     res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
    });
});

export const newProduct = TryCatch(async (
    req: Request<{}, {}, newProductRequestBody>,
    res:Response,
    next: NextFunction
): Promise<void> => {
    const { name, price, category, stock } = req.body;
    const photo = Array.isArray(req.files) ? req.files : [];
    // console.log(photo);

    if ( photo.length < 1) {
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
    })

     invalidatesCache({ product: true, admin: true });

     res.status(201).json({
        status: "success",
        product,
        message: "Product created successfully"
    });



});

export const updateProduct: ControllerType = TryCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;
    const photo = Array.isArray(req.files) ? req.files : [];
    const product = await Product.findById(id);

    if (!product) {
        return next(new ErrorHandler(404, "Product not found"));
    }

    const public_ids: string[] = [];
    
    product.photo.forEach(({public_id})=>{
            public_ids.push(public_id);
        })
    

    if (photo.length > 0) {
        await deleteFilesFromCloudinary(public_ids);
        const attachments = await uploadFilesToCloudinary(photo);
        product.photo = attachments;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock) product.stock = stock;
    await product.save();

     invalidatesCache({ product: true, admin: true,  productId: String(product._id) });
     res.status(200).json({
        status: "success",
        message: "Product Updated Successfully",
    });
});

export const getAllProducts = TryCatch(async (req: Request<{}, {}, {}, SearchRequestQuery>, res: Response, next: NextFunction): Promise<void> => {
    const { search, sort, category, price = 10000000 } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCTS_PER_PAGE) || 10;

    const skip = (page - 1) * limit || 0;

    const baseQuery: BaseQuery = {}

    // const products = await Product.find(baseQuery);

    if (search)
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };

    if (price)
        baseQuery.price = {
            $lte: Number(price),
        }


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