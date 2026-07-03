document.addEventListener("DOMContentLoaded", async () => {
    // 1. Extract the 'id' parameter from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const feedbackId = urlParams.get('id');

    // Fallback if no ID is provided in the URL
    if (!feedbackId) {
        alert("No feedback ID provided.");
        window.location.href = "/member/feedback";
        return;
    }

    try {
        // 2. Fetch the specific feedback entry from server backend
        const response = await fetch(`/feedback/${feedbackId}`);
        const data = await response.json();

        // Check if the server returned a failure message
        if (data.success === false || !response.ok) {
            alert(data.message || "Failed to fetch feedback data");
            window.location.href = "/member/feedback";
            return;
        }
        
        const feedback = data.rows[0]; 
        
        // 3. Pre-fill the form fields with existing data
        document.getElementById('feedbackId').value = feedbackId;
        document.getElementById('productName').value = feedback.name || 'Unknown Product';
        document.getElementById('comments').value = feedback.comments || '';
        
        // 4. Set the range slider value and sync the text tracker element
        const currentRating = feedback.ratings || 3;
        document.getElementById('rating').value = currentRating;
        document.getElementById('rating-value').innerText = currentRating;

    } catch (error) {
        console.error("Error loading feedback info:", error);
        alert("Could not load feedback details.");
        window.location.href = "/member/feedback";
    }
});

// Handle submission of the changes back to database
document.getElementById('editFeedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (document.getElementById('comments').value.trim().length === 0) {
        return alert('Feedback cannot be empty')
    }

    const feedbackId = document.getElementById('feedbackId').value;
    const updatedData = {
        ratings: document.getElementById('rating').value,
        comments: document.getElementById('comments').value
    };

    try {
        const response = await fetch(`/feedback/${feedbackId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Failed to update feedback.');
            return;
        }

        alert('Feedback has been updated');
        window.location.href = "/member/feedback"; // Redirect back to main list view

    } catch (error) {
        console.error("Error updating feedback:", error);
        alert("An error occurred while saving your updates.");
    }
});