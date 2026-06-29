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
                        <span class="badge bg-primary mb-1">Your Reply</span>
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