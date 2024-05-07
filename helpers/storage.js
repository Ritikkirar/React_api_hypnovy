const multer = require('multer')

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname;
        cb(null, fileName)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes) { allowedMimeTypes.includes(file.mimetype) ? cb(null, true) : cb(null, true); }

    // Accept PDF and Excel files only
    else if (file.mimetype === 'application/pdf' || file.mimetype === 'application/xlsx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

var upload = multer({ storage: storage, fileFilter: fileFilter })

module.exports = upload;