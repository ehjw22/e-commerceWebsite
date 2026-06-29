import {formatDate, createStarRating} from '../js/utilities.js';

document.addEventListener("DOMContentLoaded", async () => {
    const productSelect = document.getElementById('productSelect');

    try {
        // 1. Fetch the user's completed orders to populate the dropdown
        const response = await fetch('/products/memberOrder'); 
        const data = await response.json();

        const orders = data.products;

        // Handle when data.products is missing, not an array, or length is 0
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            productSelect.innerHTML = '<option value="" disabled selected>No purchased products available for feedback</option>';
            return;
        }

        // Clear out the loading placeholder option if products exist
        productSelect.innerHTML = '<option value="" disabled selected>Choose a product...</option>';

        // 2. Loop through and add options to the select element
        orders.forEach(item => {
            const option = document.createElement('option');
            option.value = item.product_id; 
            
            // Check which date property your backend returns (order_date or purchase_date)
            const rawDate = item.order_date || item.purchase_date;
            
            // Format it using your custom utility function if available, or fall back to text
            const purchaseDateText = rawDate ? ` (Bought on ${formatDate(rawDate)})` : '';

            // Combines them nicely: "Burger (Bought on 15 Jun 2026)"
            option.textContent = `${item.name}${purchaseDateText}`;
            
            productSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading eligible products:", error);
        productSelect.innerHTML = '<option value="" disabled selected>Error loading products</option>';
    }
});

// 3. Handle the submission of the new feedback form
document.getElementById('createFeedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ratingInput = document.getElementById('ratingInput');
    const commentInput = document.getElementById('commentInput');
    const productSelect = document.getElementById('productSelect');

    const payload = {
        product_id: productSelect.value,
        ratings: Number(ratingInput.value),
        feedback: commentInput.value
    };

    try {
        const res = await fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'Failed to submit feedback');
            return;
        }

        alert('Feedback has been submitted successfully!');

        // Reset fields to original default states
        commentInput.value = '';
        ratingInput.value = 3;
        document.getElementById('rating-value').innerText = 3;

        // Redirect back to the main feedback dashboard page
        window.location.href = "/member/feedback";

    } catch (err) {
        console.error('Error creating feedback:', err);
        alert('An error occurred while saving your feedback.');
    }
});