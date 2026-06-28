// controllers/productFeedbackController.js
const feedbackModel = require('../models/productFeedbackModel');

class ProductFeedbackController {
    // GET / (Retrieve all feedback from a member)
    static async getMemberFeedback(req, res) {
        try {
            const userId = req.session.userId;
            const rows = await feedbackModel.findByMemberId(userId);

            res.json({
                success: true,
                rows: rows
            });
        } catch (error) {
            console.error('Error fetching dining_feedback:', error);
            
            if (error.code === 'P0003' || error.code === 'P0002') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                    rows: 0
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve dining_feedback'
            });
        }
    }

    // GET /:id (Retrieve product feedback and responses)
    static async getProductFeedback(req, res) {
        try {
            const { id } = req.params;
            const rows = await feedbackModel.findByProductId(id);

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No feedback found'
                });
            }

            res.json({
                success: true,
                rows: rows
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product'
            });
        }
    }

    // POST / (Create new feedback)
    static async createFeedback(req, res) {
        try {
            const { feedback, ratings, product_id } = req.body;
            const member_id = req.session.userId;

            await feedbackModel.create(feedback, ratings, member_id, product_id);

            res.json({
                success: true,
                message: 'Feedback submitted successfully'
            });
        } catch (error) {
            console.error('Error creating feedback:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /:id (Delete feedback)
    static async deleteFeedback(req, res) {
        try {
            const feedbackId = parseInt(req.params.id);
            const member_id = req.session.userId;

            await feedbackModel.delete(feedbackId, member_id);

            res.json({
                success: true,
                message: 'Feedback deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting feedback:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // PUT /:id (Update feedback)
    static async updateFeedback(req, res) {
        try {
            const feedbackId = parseInt(req.params.id);
            const { ratings, comments } = req.body;
            const member_id = req.session.userId;

            await feedbackModel.update(feedbackId, member_id, comments, ratings);

            res.json({
                success: true,
                message: 'Feedback successfully editted'
            });
        } catch (error) {
            console.error('Error updating feedback:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getFeedbackById(req, res) {
        try {
            const feedbackId = parseInt(req.params.id);

            const rows = await feedbackModel.retrieveFeedbackById(feedbackId);

            res.json({
                success: true,
                rows
            });
        } catch (error) {
            console.error('Error retrieving feedback:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ProductFeedbackController;