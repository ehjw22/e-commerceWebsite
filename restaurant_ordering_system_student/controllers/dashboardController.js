// controllers/dashboardController.js
const SaleOrder = require('../models/SaleOrder');
const Product = require('../models/Product');

class DashboardController {
    static async getApiData(req, res) {
        try {
            const filters = {
                startDate: req.query.start_date,
                endDate: req.query.end_date,
                productCategory: req.query.category,
                sortBy: req.query.sort_by || 'order_date',
                sortOrder: req.query.sort_order || 'DESC'
            };

            const orders = await SaleOrder.getSummary(filters);
            const categories = await Product.getCategories();

            res.status(200).json({ 
                orders, 
                categories, 
                filters, 
                user: req.session.user ,
                success: true
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);

            if (error.code === 'P0002') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).send('Server error');
        }
    }
}

module.exports = DashboardController;