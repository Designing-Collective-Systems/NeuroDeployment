const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
	destination: './public/uploads/',
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 1000000 }, // 1MB file size limit
	fileFilter: (req, file, cb) => {
		const filetypes = /jpeg|jpg|png|gif/;
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = filetypes.test(file.mimetype);
		if (mimetype && extname) {
			cb(null, true);
		} else {
			cb('Error: Images Only!');
		}
	}
});

module.exports = upload;
