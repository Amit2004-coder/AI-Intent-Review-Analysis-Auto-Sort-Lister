const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|doc|docx/;
  allowed.test(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Invalid file type'));
};

exports.upload = (field) => multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).single(field);
exports.uploadFields = (fields) => multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter }).fields(fields);
