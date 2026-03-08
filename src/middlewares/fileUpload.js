const multer = require("multer");

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/\s+/g, "");
    cb(null, "api-img-" + Date.now() + "-" + sanitizedFilename);
  },
});

const upload = multer({
  storage: fileStorageEngine,
  limits: { fileSize: 200 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const fileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      // ✅ fixed optional chaining
      return res.status(400).json({
        // ✅ single response with return
        success: false,
        message: "File size too large",
      });
    }
    next(); // ✅ only runs when no error
  });
};

module.exports = fileUpload;
