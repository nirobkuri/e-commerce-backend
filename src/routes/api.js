const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/adminController.js");
const authVerificationAdmin = require("../middlewares/authVerificationAdmin.js");
const userController = require("../controllers/userController.js");
const authVerificationUser = require("../middlewares/authVerificationUser.js");
const productController = require("../controllers/productController.js");
const categoryController = require("../controllers/categoryController.js");
const brandController = require("../controllers/brandController.js");
const reviewController = require("../controllers/reviewController.js");
const cartController = require("../controllers/cartController.js");
const invoiceController = require("../controllers/invoiceController.js");
const fileController = require("../controllers/fileController.js");
const fileUpload = require("../middlewares/fileUpload.js"); // ✅ only once
const deshboardSummaryController = require("../controllers/deshboardSummaryController.js");

// =====================
// Admin Routes
// =====================
router.post("/admin-register", adminController.register);
router.post("/admin-login", adminController.login);
router.get("/admin", authVerificationAdmin, adminController.admin);
router.get("/admin-verify", authVerificationAdmin, adminController.adminVerify);
router.get("/admin-logout", authVerificationAdmin, adminController.logout);
router.put("/admin-update", authVerificationAdmin, adminController.update);

// =====================
// User Routes
// =====================
router.post("/user-register", userController.register);
router.post("/user-login", userController.login);
router.get("/user", authVerificationUser, userController.user);
router.get("/user-verify", authVerificationUser, userController.userVerify);
router.get("/user-logout", authVerificationUser, userController.logout);
router.put("/user-update", authVerificationUser, userController.update);

// =====================
// Product Routes
// =====================
router.post(
  "/create-product",
  authVerificationAdmin,
  productController.createProduct,
);
router.get(
  "/all-products/:category_id/:brand_id/:remark/:keyword/:per_page/:page_no",
  productController.allProduct,
);
router.get("/single-product/:product_id", productController.singleProduct);
router.put(
  "/update-product/:product_id",
  authVerificationAdmin,
  productController.updateProduct,
);
router.delete(
  "/delete-product/:product_id",
  authVerificationAdmin,
  productController.deleteProduct,
);

// =====================
// Category Routes
// =====================
router.post(
  "/create-category",
  authVerificationAdmin,
  categoryController.createCategory,
);
router.get(
  "/all-categories/:per_page/:page_no",
  categoryController.allCategory,
);
router.get("/single-category/:category_id", categoryController.singleCategory);
router.put(
  "/update-category/:category_id",
  authVerificationAdmin,
  categoryController.updateCategory,
);
router.delete(
  "/delete-category/:category_id",
  authVerificationAdmin,
  categoryController.deleteCategory,
);

// =====================
// Brand Routes
// =====================
router.post(
  "/create-brand",
  authVerificationAdmin,
  brandController.createBrand,
);
router.get("/all-brands/:per_page/:page_no", brandController.allBrand);
router.get("/single-brand/:id", brandController.singleBrand);
router.put(
  "/update-brand/:id",
  authVerificationAdmin,
  brandController.updateBrand,
);
router.delete(
  "/delete-brand/:id",
  authVerificationAdmin,
  brandController.deleteBrand,
);

// =====================
// Review Routes
// =====================
router.post(
  "/create-review",
  authVerificationUser,
  reviewController.createReview,
);
router.get(
  "/all-reviews/:per_page/:page_no",
  authVerificationAdmin,
  reviewController.allReview,
);
router.get(
  "/all-reviews-by-product/:product_id",
  reviewController.allReviewByProduct,
);

// =====================
// Cart Routes
// =====================
router.post("/create-cart", authVerificationUser, cartController.createCart);
router.get("/read-cart", authVerificationUser, cartController.readCart);
router.put(
  "/update-cart/:cart_id",
  authVerificationUser,
  cartController.updateCart,
);
router.delete(
  "/delete-cart/:cart_id",
  authVerificationUser,
  cartController.deleteCart,
);

// =====================
// Invoice Routes
// =====================
router.post(
  "/create-invoice",
  authVerificationUser,
  invoiceController.createInvoice,
);
router.get(
  "/read-all-invoice-single-user/:per_page/:page_no",
  authVerificationUser,
  invoiceController.readAllInvoiceSingleUser,
);
router.get(
  "/read-single-invoice-single-user/:invoice_id",
  authVerificationUser,
  invoiceController.readSingleInvoiceSingleUser,
); // ✅ fixed: added leading /
router.get(
  "/read-invoice-product-list-single-user/:per_page/:page_no",
  authVerificationUser,
  invoiceController.readInvoiceProductListSingleUser,
);
router.post("/payment-success/:trx_id", invoiceController.paymentSuccess);
router.post("/payment-cancel/:trx_id", invoiceController.paymentCancel);
router.post("/payment-fail/:trx_id", invoiceController.paymentFail);
router.post("/payment-ipn/:trx_id", invoiceController.paymentIpn);
router.post(
  "/all-order-list/:per_page/:page_no",
  authVerificationAdmin,
  invoiceController.allOrderList,
);
router.get("/export-csv", authVerificationAdmin, invoiceController.exportCSV);
router.put(
  "/update-invoice",
  authVerificationAdmin,
  invoiceController.updateInvoice,
);

// =====================
// File Routes
// =====================
router.post(
  "/file-upload",
  authVerificationAdmin,
  fileUpload,
  fileController.fileUpload,
);
router.get(
  "/all-file/:per_page/:page_no",
  authVerificationAdmin,
  fileController.allFile,
);
router.post("/file-remove", authVerificationAdmin, fileController.fileRemove);

// =====================
// Dashboard Routes
// =====================
router.get(
  "/dashboard-summary",
  authVerificationAdmin,
  deshboardSummaryController.deshboardSummary,
);

module.exports = router;
