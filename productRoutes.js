const express = require('express');
const router = express.Rounode ter();
const {
  addProduct,
  fetchProducts,
  getLowStockAlerts,
  getCategorySummary,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock
} = require('../controllers/productController');

// Ye do routes hamesha /:id se pehle aane chahiye
router.get('/low-stock', getLowStockAlerts);
router.get('/summary', getCategorySummary);

router.route('/')
  .post(addProduct)
  .get(fetchProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.patch('/:id/stock', adjustStock);

module.exports = router;