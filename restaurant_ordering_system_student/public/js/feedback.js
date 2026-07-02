// Import utility helper functions for formatting data and rendering stars
import {formatDate, createStarRating} from '../../js/utilities.js';

document.addEventListener("DOMContentLoaded", retrieveAllFeedback);

window.handleEdit = handleEdit;
window.deleteFeedback = deleteFeedback;

// Fetches all feedback items and dynamically renders them into the UI container
async function retrieveAllFeedback() {
    try {
        // Fetch feedback data from the API endpoint
        const response = await fetch('/feedback');
        const data = await response.json();

        const feedbackList = document.getElementById('feedbackList');

        // Render empty state UI if no feedback items exist or are returned
        if (!data || data.rows === 0) {
            feedbackList.innerHTML = `
            <div class="no-feedback">
                <h4>No feedback given yet</h4>
                <p class="text-muted">Give your first review!</p>
            </div>
            `;
            return;
        }
        
        // Loop through feedback records and generate HTML template cards
        feedbackList.innerHTML = data.rows.map(feedback => {
            const rating = feedback.ratings || 0;

            return `
            <div class="card feedback-card mb-3">
                <div class="card-body">
                
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-secondary">ID: #${feedback.feedback_id}</span>
                        <div class="stars">${createStarRating(rating)}</div>
                        </div>
                        <div class="feedback-date text-muted small">
                        ${formatDate(feedback.last_updated)}
                        </div>
                    </div>

                    <h5 class="card-title h6 mb-2 text-primary">
                        Product: <span class="text-dark font-weight-bold">${feedback.product_name || 'Unknown Product'}</span>
                    </h5>

                    <p class="card-text mb-0 mt-2 text-secondary">
                        ${feedback.comments || '<em>No comments provided.</em>'}
                    </p>

                    <!-- Edit and Delete Actions -->
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button class="btn btn-sm btn-outline-primary edit-btn" onclick="handleEdit(${feedback.feedback_id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" onclick="deleteFeedback(${feedback.feedback_id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>

                
            </div>
            `;
        }).join(''); // Join array into a single HTML string

    } catch (error) {
        console.error('Error fetching dining feedback:', error);
        alert('Failed to load dining feedback.');
    }
}

// Redirects the user to the feedback modification page with the specific ID query parameters
function handleEdit(feedbackId) {
    window.location.href = `/member/feedback/edit?id=${feedbackId}`;
}

// Sends a DELETE request to the backend server to completely remove a feedback record
async function deleteFeedback(feedbackId) {
    // Prompt confirmation dialogue
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
        // Send the DELETE request to the backend route
        const response = await fetch(`/feedback/${feedbackId}`, {
            method : 'Delete',
            headers : {
                'Content-Type' : 'application/json' 
            }
        }) 

        const data = await response.json();

        // Alert user of the server response message regardless of success or failure state
        if (!data.success) {
            alert(data.message);
        } else {
            alert(data.message);
        }

        // Refresh the main feedback display list to reflect changes
        retrieveAllFeedback()

    } catch (err) {
        console.error('Error deleting feedback:', err);
        alert('Failed to delete dining feedback.');
    }
}