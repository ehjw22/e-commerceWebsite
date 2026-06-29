document.addEventListener('DOMContentLoaded', retrieveAllResponses);

async function retrieveAllResponses() {
    const responsesList = document.getElementById('responsesList');
    try {
        const response = await fetch('/response'); 
        const data = await response.json();

        const responseItems = data.rows || data;

        if (!responseItems || responseItems.length === 0) {
            responsesList.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body text-center p-3 text-muted small">
                    You haven't posted any replies to other people's feedback yet.
                </div>
            </div>
            `;
            return;
        }

        responsesList.innerHTML = responseItems.map(res => {
            const responseId = res.feedback_id;
            return `
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body p-3">
                    
                    <!-- Header Context -->
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong class="small text-secondary">
                            <i class="bi bi-chat-left-text"></i> Product: ${res.product_name}
                        </strong>
                    </div>

                    <div class="bg-light p-2 rounded text-muted small mb-3 border-start border-3 border-secondary">
                        <span class="fw-bold extra-small text-uppercase d-block" style="font-size: 0.65rem;">Product Feedback:</span>
                        "${res.feedback}"
                    </div>

                    <div class="pt-2 border-top border-light">
                        <!-- Placed Delete link side-by-side with your Reply Badge -->
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="badge bg-primary">Your Reply</span>
                            <button 
                                class="btn btn-link text-danger p-0 m-0 text-decoration-none small" 
                                style="font-size: 0.8rem;"
                                onclick="deleteResponse(${responseId})">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                        <p class="card-text text-dark fw-bold mb-0" style="font-size: 0.95rem;">
                            "${res.response}"
                        </p>
                    </div>

                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error fetching responses:', error);
        responsesList.innerHTML = `<div class="text-danger small p-2">Failed to load responses.</div>`;
    }
}

async function deleteResponse(responseId) {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
        const res = await fetch(`/response/${responseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (data.success) {
            alert(data.message || 'Response deleted successfully.');
            retrieveAllResponses();
        } else {
            alert(data.message || 'Failed to delete your response.');
        }

    } catch (err) {
        console.error('Error deleting response:', err);
        alert("An error occurred while deleting your response.");
    }
}

window.deleteResponse = deleteResponse;