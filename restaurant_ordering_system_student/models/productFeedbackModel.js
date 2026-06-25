// models/Feedback.js
const pool = require('../config/database');

class Feedback {
    // Retrieves all feedback left by a specific member
    static async findByMemberId(userId) {
        const query = `SELECT * FROM get_feedback($1)`;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    // Retrieves feedback and nested responses for a specific product
    static async findByProductId(productId) {
        const query = `
            SELECT 
                df.feedback_id,
                df.comments, 
                df.ratings, 
                df.last_updated,
                df.member_id,
                f.comments as "responses",
                df.product_id,
                f.member_id as "responder_id",
                m.username as "responder_username",
                f.feedback_id as "response_id"
            FROM dining_feedback df
            LEFT JOIN feedback f on df.feedback_id = f.dining_feedback_id
            LEFT JOIN member m on m.member_id = f.member_id
            WHERE df.product_id = $1
            ORDER BY df.last_updated DESC;
        `;
        const result = await pool.query(query, [productId]);
        return result.rows;
    }

    // Executes a stored procedure to insert a new feedback entry
    static async create(feedback, ratings, memberId, productId) {
        const query = `CALL create_feedback($1, $2, $3, $4)`;
        await pool.query(query, [feedback, ratings, memberId, productId]);
        return true;
    }

    // Executes a stored procedure to delete a feedback entry
    static async delete(feedbackId, memberId) {
        const query = `CALL delete_feedback($1, $2)`;
        await pool.query(query, [feedbackId, memberId]);
        return true;
    }

    // Executes a stored procedure to modify an existing feedback entry
    static async update(feedbackId, memberId, comments, ratings) {
        const query = `CALL update_feedback($1, $2, $3, $4)`;
        await pool.query(query, [feedbackId, memberId, comments, ratings]);
        return true;
    }
}

module.exports = Feedback;