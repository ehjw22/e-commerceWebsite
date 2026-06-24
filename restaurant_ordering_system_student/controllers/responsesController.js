// controllers/responseController.js
const Response = require('../models/responsesModel');

class ResponseController {
    // GET / (Retrieve all responses of a user)
    static async getUserResponses(req, res) {
        try {
            const userId = req.session.userId;
            const rows = await Response.findByUserId(userId);

            res.json({
                success: true,
                rows: rows
            });
        } catch (error) {
            console.error('Error fetching responses:', error);

            if (error.code === 'P0003' || error.code === 'P0002') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                    rows: 0
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve responses'
            });
        }
    }

    // POST /:id (Create a new response by the dining feedback ID)
    static async createResponse(req, res) {
        try {
            const diningFeedbackId = parseInt(req.params.id);
            const { response } = req.body;
            const member_id = req.session.userId

            await Response.create(response, member_id, diningFeedbackId);

            res.json({
                success: true,
                message: 'Response successfully added.'
            });
        } catch (error) {
            console.error('Error creating response:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /:id (Delete a response based on its id)
    static async deleteResponse(req, res) {
        try {
            const responseId = parseInt(req.params.id);
            const member_id = req.session.userId;

            await Response.delete(responseId, member_id);

            res.json({
                success: true,
                message: 'Response successfully deleted.'
            });
        } catch (error) {
            console.error('Error deleting response:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ResponseController;