// models/responseModel.js
const pool = require('../config/database');

class Response {
    // Retrieves all responses written by a specific user via custom function
    static async findByUserId(userId) {
        const query = `SELECT * FROM get_response($1)`;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    // Executes stored procedure to create a new response
    static async create(responseText, memberId, diningFeedbackId) {
        const query = `CALL create_response($1, $2, $3)`;
        await pool.query(query, [responseText, memberId, diningFeedbackId]);
        return true;
    }

    // Executes stored procedure to delete a response
    static async delete(responseId, memberId) {
        const query = `CALL delete_response($1, $2)`;
        await pool.query(query, [responseId, memberId]);
        return true;
    }
}

module.exports = Response;