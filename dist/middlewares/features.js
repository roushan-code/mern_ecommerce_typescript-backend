import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
export const uploadFilesToCloudinary = async (files = []) => {
    // console.log(files)
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            cloudinary.uploader.upload(getBase64(file), {
                resource_type: "auto",
                public_id: uuid(),
                folder: "ecommerce-type-avatar",
            }, (error, result) => {
                if (error)
                    reject(error);
                resolve(result);
            });
        });
    });
    try {
        const result = await Promise.all(uploadPromises);
        const formattedResults = result.map((result) => ({
            url: result.secure_url,
            public_id: result.public_id
        }));
        return formattedResults;
    }
    catch (error) {
        console.error(error);
        throw new Error("Error uploading files to cloudinary");
    }
};
export const deleteFilesFromCloudinary = async (public_id) => {
    if (public_id.length > 0) {
        try {
            for (const id of public_id) {
                await cloudinary.uploader.destroy(id);
            }
        }
        catch (error) {
            console.log(error);
            throw new Error("Error Deleting files to cloudinary");
        }
    }
    return [];
};
