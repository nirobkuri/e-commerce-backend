const fs = require("fs");
const path = require("path");
const fileModel = require("../models/fileModel"); // ✅ added



exports.fileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.allFile = async (req, res) => {
  try {
    const page_no = Number(req.params.page_no);
    const per_page = Number(req.params.per_page);
    const skip_row = (page_no - 1) * per_page;
    const sortStage = { createdAt: -1 }; // ✅ fixed typo

    let facetStage = {
      $facet: {
        // ✅ fixed: was $fact
        totalCount: [{ $count: "count" }],
        files: [
          { $sort: sortStage },
          { $skip: skip_row },
          { $limit: per_page },
          { $project: { updatedAt: 0 } }, // ✅ fixed: moved inside array, fixed typo
        ],
      },
    };

    let files = await fileModel.aggregate([facetStage]);

    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: files[0],
    });
  } catch (error) {
    res.status(500).json({
      // ✅ fixed: was empty catch
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.fileDelete = async (req, res) => {
  try {
    let filename = req.params.filename;
    let filePath = path.join(__dirname, "../../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.fileRemove = async (req, res) => {
  try {
    let _id = req.body?._id;
    let filename = req.body?.filename;
    let filePath = path.join(__dirname, `../../uploads/${filename}`); // ✅ fixed: removed extra "

    fs.unlinkSync(filePath); // ✅ fixed: was async fs.unlink

    const data = await fileModel.findByIdAndDelete(_id); // ✅ fixed: removed wrong second arg

    res.status(200).json({
      // ✅ added missing response
      success: true,
      message: "File removed successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};
