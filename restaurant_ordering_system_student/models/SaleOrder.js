// models/SaleOrder.js
const pool = require('../config/database');

class SaleOrder {
    static async getSummary(filters) {
        // 1. Map the filters from your controller object, defaulting missing sort values
        const startDate = filters.startDate || null;
        const endDate = filters.endDate || null;
        const category = filters.productCategory || null;
        const sortBy = filters.sortBy || 'order_id';
        const sortOrder = filters.sortOrder || 'DESC';

        // 2. Target your 5 input parameters in order
        const query = `
            SELECT * FROM get_sale_order_summary($1, $2, $3, $4, $5)
        `;
        
        // 3. Bind the values array to execute safely
        const values = [startDate, endDate, category, sortBy, sortOrder];
        const result = await pool.query(query, values);
        
        return result.rows;
    }
}

// 4. Export the correct class name
module.exports = SaleOrder;