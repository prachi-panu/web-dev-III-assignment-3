const Product = require('../models/Product');

// 1. Create Product
exports.addProduct = async (req, res) => {
  try {
    const item = await Product.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 2. Get All Products (Filter, Sort, Pagination)
exports.fetchProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }

    const currentPage = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const skip = (currentPage - 1) * pageLimit;

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit);

    res.status(200).json({
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageLimit),
      count: items.length,
      products: items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Low Stock Alert
exports.getLowStockAlerts = async (req, res) => {
  try {
    const lowStock = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    res.status(200).json({
      count: lowStock.length,
      lowStockItems: lowStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Category-wise Summary Aggregation
exports.getCategorySummary = async (req, res) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Get Single Product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Update Product
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 7. Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json({ message: 'Product deleted', id: deleted._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. Patch Stock Adjustment
exports.adjustStock = async (req, res) => {
  try {
    const { change } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.quantity += Number(change);
    if (product.quantity < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    await product.save();
    res.status(200).json({ message: 'Stock updated', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};