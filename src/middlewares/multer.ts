import multer from 'multer';

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads');
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now();
//         cb(null, uniqueSuffix + '-' + file.originalname);
//     }
// })
export const multerUpload = multer({limits: {
    fileSize: 1024 * 1024 *12,
},
})


export const attachmentsMulter = multerUpload.array("files", 5);

// export const singleUpload = multer({storage}).single('photo');