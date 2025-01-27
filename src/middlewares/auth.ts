import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { ControllerType } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// Middleware to make sure only admin are allowed to access certain routes
export const adminOnly:ControllerType = TryCatch(async (req:Request, res:Response, next:NextFunction) => {
    const {id} = req.query;

    if(!id){
        return next(new ErrorHandler(401,"First login to access this route"));
    }
    const user = await User.findById(id);
    if (!user ) {
        return next(new ErrorHandler(401, "User not found"));
    }
    if(user.role !== "admin") {
        return next(new ErrorHandler(403, "You are not authorized to access this route"));
    }   

    next();
})