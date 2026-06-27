import {formatDate, createStarRating} from '../../js/utilities.js';

document.addEventListener("DOMContentLoaded", retrieveAllFeedback);

async function retrieveAllFeedback() {
    try {
        const response = await fetch('/feedback');

        const data = await response.json();

        const feedbackList = document.getElementById('feedbackList');

        // No feedback
        if (!data || data.rows === 0) {
            feedbackList.innerHTML = `
            <div class="no-feedback">
                <h4>No feedback given yet</h4>
                <p class="text-muted">Give your first review!</p>
            </div>
            `;
            return;
        }
        
        // Generate feedback cards
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
                        <button class="btn btn-sm btn-outline-primary edit-btn"">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn"">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>

                
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error fetching dining feedback:', error);
        alert('Failed to load dining feedback.');
    }
}
