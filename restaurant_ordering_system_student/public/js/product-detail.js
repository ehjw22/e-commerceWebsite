import {formatDate, createStarRating} from '../js/utilities.js';

window.submitFeedback = submitFeedback;
window.deleteFeedback = deleteFeedback;
window.editFeedback = editFeedback;
window.saveFeedback = saveFeedback; 
window.createResponse = createResponse;
window.deleteResponse = deleteResponse;

document.addEventListener('DOMContentLoaded', fetchProductDetail);
document.addEventListener('DOMContentLoaded', fetchProductFeedback);

async function fetchProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const productDetail = document.getElementById('product-detail');

    // If no product ID is present in the URL, show error immediately
    if (!productId) {
    loading.style.display = 'none';
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'No product specified.';
    return;
    }

    try {
    const response = await fetch(`/products/${productId}`);
    const data = await response.json();

    loading.style.display = 'none';

    if (!data.success || !data.product) {
        errorMessage.style.display = 'block';
        return;
    }

    const product = data.product;

    document.title = `${product.name} - Member View`;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-category').textContent = product.category || '-';
    document.getElementById('detail-description').textContent = product.description || '-';
    document.getElementById('detail-price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
    document.getElementById('detail-created-at').textContent = new Date(product.created_at).toLocaleDateString();

    // Render availability badge, consistent with products.html
    const statusCell = document.getElementById('detail-status');
    statusCell.innerHTML = `
        <span class="badge ${product.is_available ? 'bg-success' : 'bg-secondary'}">
        ${product.is_available ? 'Available' : 'Unavailable'}
        </span>
    `;

    productDetail.style.display = 'block';

    } catch (error) {
    console.error('Error fetching product detail:', error);
    loading.style.display = 'none';
    errorMessage.style.display = 'block';
    }
}

async function fetchProductFeedback() {
    try {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const res = await fetch(`/feedback/${productId}`);
    const data = await res.json();

    const feedbackSection = document.getElementById('feedback-section');
    const feedbackList = document.getElementById('feedback-list');
    const noFeedback = document.getElementById('no-feedback');
    
    const userIdRes = await fetch('/auth/status');
    const userIdData = await userIdRes.json();
    
    let userId = ''

    if (userIdData.authenticated) {
        userId = userIdData.user.id
    }

    if (data.success === false || data.message === "No feedback found") {
        noFeedback.style.display = 'block';
        feedbackSection.style.display = 'none';
        return;
    }

    feedbackSection.style.display = 'block';
    noFeedback.style.display = 'none';
    // Group the flat database rows into a structured object
    const feedbackMap = {};

    data.rows.forEach(row => {
        if (!feedbackMap[row.feedback_id]) {
            feedbackMap[row.feedback_id] = {
                feedback_id: row.feedback_id,
                comments: row.comments,
                ratings: row.ratings,
                last_updated: row.last_updated,
                member_id: row.member_id,
                product_id: row.product_id,
                replies: [] // Array to collect all responses
            };
        }
        // If a response exists for this row, push it to the replies array
        if (row.responses) {
            feedbackMap[row.feedback_id].replies.push({
                text: row.responses,
                responder_id: row.responder_id,
                username: row.responder_username,
                response_id: row.response_id
            });
        }
    });

    // Convert the map back to an array and render the HTML
    feedbackList.innerHTML = Object.values(feedbackMap).map(fb => `
        <div class="card feedback-card mb-3 w-50">
        <div class="card-body">

            <div class="d-flex justify-content-between align-items-center mb-2">
            <div>${createStarRating(fb.ratings)}</div>
            <small class="text-muted">
                ${formatDate(fb.last_updated)}
            </small>
            </div>

            <p class="mb-3" id="comment-${fb.feedback_id}">
            ${fb.comments || 'No comment provided.'}
            </p>

            ${Number(fb.member_id) === Number(userId) ? `
            <div class="d-flex gap-2 mb-3">
                <button class="btn btn-sm btn-outline-primary"
                onclick="editFeedback(${fb.feedback_id}, ${fb.ratings}, \'${fb.comments}\')">
                Edit
                </button>

                <button class="btn btn-sm btn-outline-danger"
                onclick="deleteFeedback(${fb.feedback_id})">
                Delete
                </button>
            </div>
            ` : ''}

            <div class="responses-container mb-3 ps-3 border-start">
            ${fb.replies.length > 0 ? fb.replies.map(reply => `
                <div class="reply-item p-2 mb-2 bg-light rounded" style="font-size: 0.9rem;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-primary" style="font-size: 0.85rem;">
                    @${reply.username || 'unknown_user'} 
                    ${Number(reply.responder_id) === Number(userId) ? '<span class="text-muted fw-normal">(You)</span>' : ''}
                    </strong>
                    
                    ${Number(reply.responder_id) === Number(userId) ? `
                    <button 
                        class="btn btn-link text-danger p-0 m-0 style="font-size: 0.8rem; text-decoration: none;" 
                        onclick="deleteResponse(${reply.response_id})">
                        Delete
                    </button>
                    ` : ''}
                </div>
                <p class="mb-0 text-dark">${reply.text}</p>
                </div>
            `).join('') : '<small class="text-muted d-block mb-2">No responses yet.</small>'}
            </div>

            ${Number(fb.member_id) !== Number(userId) ? `
            <div class="d-flex gap-2 align-items-center">
            <input 
                type="text"
                class="form-control form-control-sm"
                placeholder="Write a response..."
                id="reply-input-${fb.feedback_id}"
            />

            <button 
                class="btn btn-sm btn-primary"
                onclick="createResponse(${fb.feedback_id})">
                Post
            </button>
            </div>` : ``}

        </div>
        </div>
    `).join('');
    } catch (err) {
    console.error('Error loading feedback:', err);
    }
}

async function submitFeedback() {
    try {
    const productId = new URLSearchParams(window.location.search).get('id');

    const ratings = document.getElementById('rating-input').value;
    const comments = document.getElementById('comment-input').value;

    const res = await fetch('/feedback', {
        method: 'POST',
        headers: {
        'Content-Type':'application/json'
        },
        body: JSON.stringify({
        product_id: productId,
        ratings: Number(ratings),
        feedback: comments
        })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.message || 'Failed to submit feedback');
        return;
    }

    document.getElementById('comment-input').value = '';
    document.getElementById('rating-input').value = 3;
    document.getElementById('rating-value').innerText = 3;

    // refresh list
    fetchProductFeedback();

    } catch (err) {
    console.error('Error creating feedback:', err);
    }
}

async function deleteFeedback(feedbackId) {
    console.log(feedbackId)
    try {
    const response = await fetch(`/feedback/${feedbackId}`, {
        method : 'Delete',
        headers : {
        'Content-Type' : 'application/json' 
        }
    }) 

    const data = await response.json();

    if (!data.success) {
        alert(data.message);
    } else {
        alert(data.message);
    }
    fetchProductFeedback()

    } catch (err) {
    console.error('Error deleting feedback:', err);
    }
}

function editFeedback(feedbackId, rating, comment) {
    console.log(feedbackId, rating, comment)
    document.getElementById('edit-feedback-id').value = feedbackId;

    document.getElementById('edit-rating').value = rating;
    document.getElementById('edit-rating-value').innerText = rating;

    document.getElementById('edit-comment').value = comment;

    const modal = new bootstrap.Modal(
    document.getElementById('editFeedbackModal')
    );

    modal.show();
}

async function saveFeedback() {
    try {

    const feedbackId =
        document.getElementById('edit-feedback-id').value;

    const rating =
        document.getElementById('edit-rating').value;

    const comment =
        document.getElementById('edit-comment').value;

    const response = await fetch(`/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        ratings: rating,
        comments: comment
        })
    });

    const data = await response.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    bootstrap.Modal.getInstance(
        document.getElementById('editFeedbackModal')
    ).hide();

    alert('Feedback has been updated');
    
    fetchProductFeedback();

    } catch (err) {
    console.error(err);
    alert('Failed to update feedback');
    }
}

async function createResponse(feedbackId) {
    try {
    const inputElement = document.getElementById(`reply-input-${feedbackId}`);
    const responseText = inputElement.value.trim();

    if (!responseText) {
        alert("Please write something before posting!");
        return;
    }

    const res = await fetch(`/response/${feedbackId}`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        response: responseText
        })
    });

    const data = await res.json();

    if (data.success) {
        inputElement.value = '';
        
        alert(data.message);
        fetchProductFeedback();
    } else {
        alert(data.message || "Failed to submit response.");
    }

    } catch (err) {
    console.error('Error creating response:', err);
    alert("An error occurred while posting your response.");
    }
}

async function deleteResponse(responseId) {
    try {
    const res = await fetch(`/response/${responseId}`, {
        method: 'DELETE',
        headers: {
        'Content-Type': 'application/json'
        }
    });

    const data = await res.json();

    if (data.success) {
        alert(data.message);
        fetchProductFeedback();
    } 

    } catch (err) {
    console.error('Error deleting response:', err);
    alert("An error occurred while deleting your response.");
    }
}
