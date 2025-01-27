import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { newUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";


export const newUser = TryCatch(async (
    req: Request<{}, {}, newUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { _id, name, email, photo, gender, dob } = req.body;

    let user = await User.findById(_id);
    if (user) {
        return res.status(400).json({
            status: true,
            message: `Welcome, ${user.name}`,
        });
    }

    if (!name || !email || !_id || !photo || !gender || !dob) {
        return next(new ErrorHandler(400, "Please provide all the required fields"));
    }

    user = await User.create({
        _id,
        name,
        email,
        photo,
        gender,
        dob: new Date(dob)
    });

    res.status(201).json({
        status: "success",
        user,
    });
});

export const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: "success",
        users,
    });
});

export const getUser = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(404, "User not found"));
    }
    res.status(200).json({
        status: "success",
        user,
    });
});

export const deleteUser = TryCatch(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        return next(new ErrorHandler(404, "User not found"));
    }

    res.status(200).json({
        status: "success",
        message: "User Deleted Successfully"
    });
})