import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
import { File } from '../types/types.js';






export const uploadFilesToCloudinary = async (files: File[] = []): Promise<any[]> => {
    // console.log(files)
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            const getBase64 = (file: File) => 
                `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

            cloudinary.uploader.upload(getBase64(file), {
                resource_type: "auto",
                public_id: uuid(),
                folder: "ecommerce-type-avatar",
            }, (error: any, result: any) => {
                if (error)  reject(error);
                resolve(result);
            })
        })
    })

    try {
        const result: any[] = await Promise.all(uploadPromises);

        const formattedResults = result.map((result) => ({
            url: result.secure_url,
            public_id: result.public_id
        }))
        return formattedResults;
    } catch (error) {
        console.error(error);
        throw new Error("Error uploading files to cloudinary");
    }

}

export const deleteFilesFromCloudinary = async (public_id: string[]): Promise<any> => {

    if(public_id.length > 0){
        try {
                for (const id of public_id) {
                    await cloudinary.uploader.destroy(id);
                }
        } catch (error) {
            console.log(error)
            throw new Error("Error Deleting files to cloudinary");
        }
    }
    return []
}