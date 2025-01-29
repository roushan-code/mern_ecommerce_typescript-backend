import { NextFunction, Request, Response } from "express";

export interface File {
    mimetype: string;
    buffer: Buffer;
}   

export interface newUserRequestBody {
    _id: string;
    name: string;
    email: string;
    photo: string;
    gender: string;
    dob: Date;
}

export interface newProductRequestBody {
    name: string;
    photo: {
        public_id: string;
        url: string;
      }[];
    price: number;
    stock: number;
    category: String;
}



export type ControllerType = (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
) => Promise<void>;


export type SearchRequestQuery = {
    search?: string;
    page?: string;
    price?: number;
    category?: string;
    sort?: string;
};

export interface BaseQuery {
    name?: {
        $regex: string;
        $options: string;
    };
    price?: {$lte: number};
    category?: string;
}

export type InvalidateCacheProps = {
    product?: boolean;
    order?: boolean;
    admin?: boolean;
    userId?: string;
    orderId?: string;
    productId?: string | string[];
};

export type orderItemType = {
    name: string;
    photo: string;
    price: number;
    quantity: number;
    productId: string;
};
    

export interface newOrderRequestBody  {
    shippingInfo: {
        address: string;
        city: string;
        state: string;
        country: string;
        pinCode: number;
    };
    user: string;
    subtotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    status?: "Processing" | "Shipped" | "Delivered" | "Cancelled";
    orderItems: orderItemType[];

}