const cloudinary = require('cloudinary').v2;
const uuid = require('uuid').v4;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
exports.uploadFilesToCloudinary = async (files = []) => {
    // console.log(files)
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            cloudinary.uploader.upload(getBase64(file), {
                resource_type: "auto",
                public_id: uuid(),
                folder: "employee-avatar",
            }, (error, result) => {
                if (error)
                    return reject(error);
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
        throw new Error("Error uploading files to cloudinary", error);
    }
};
exports.deleteFilesFromCloudinary = async (public_id) => {
    if (public_id) {
        try {
            console.log(public_id);
            await cloudinary.uploader.destroy(public_id);
        }
        catch (error) {
            console.log(error);
            throw new Error("Error Deleting files to cloudinary", error);
        }
    }
    return [];
};
export {};
