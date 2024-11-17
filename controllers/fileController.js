const File = require('../models/File');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    cb(null, allowedTypes.includes(file.mimetype));
};

exports.upload = multer({ storage, fileFilter }).single('file');

// File upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Invalid file type.' });

        const newFile = new File({ fileName: req.file.filename, uploadedBy: req.user.userId });
        await newFile.save();

        res.status(201).json({ message: 'File uploaded successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// List uploaded files
exports.listFiles = async (req, res) => {
    try {
        const files = await File.find({}).select('fileName uploadDate');
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Download file
exports.downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await File.findById(id);
        if (!file) return res.status(404).json({ message: 'File not found.' });

        const filePath = path.join(__dirname, '../uploads', file.fileName);
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
