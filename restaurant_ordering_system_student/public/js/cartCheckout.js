let checkoutData = null;
let finalDiscountedAmount = 0;

/* ===========================================
Load Checkout
=========================================== */
async function loadCheckout() {
    try {
        const response = await fetch("/cart/checkout");

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load checkout.");
        }

        checkoutData = result.data;
        renderAvailableItems(checkoutData.availableItems);
        renderUnavailableItems(checkoutData.unavailableItems);
        if (!checkoutData.availableItems || checkoutData.availableItems.length === 0) {
            document.getElementById("place-order-btn").disabled = true;
            showAlert(
                "We are working hard to restock the items as quickly as possible. In the meantime, you can explore similar products.",
                "warning"
            );
            return;
        }
        finalDiscountedAmount = checkoutData.total;
        
        renderSummary(checkoutData);
    } catch (error) {
        console.error(error);
        showAlert(error.message, "danger");
    }
}

/* ===========================================
Available Items
=========================================== */
function renderAvailableItems(items) {

    const tbody = document.getElementById("available-table-body");

    tbody.innerHTML = "";

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center text-muted py-4">
                    No available items.
                </td>
            </tr>
        `;
        return;
    }

    items.forEach(item => {
        const product = item.product;

        const price = Number(product.price);

        const quantity = Number(item.quantity);

        const subtotal = price * quantity;

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>
                        ${product.name}
                    </strong>
                </td>

                <td>
                    $${price.toFixed(2)}
                </td>

                <td>
                    ${quantity}
                </td>

                <td class="fw-bold">
                    $${subtotal.toFixed(2)}
                </td>
            </tr>
        `;
    });
}

/* ===========================================
Unavailable Items
=========================================== */
function renderUnavailableItems(items) {
    const tbody = document.getElementById("unavailable-table-body");

    tbody.innerHTML = "";

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center text-success py-4">
                    <i class="bi bi-check-circle-fill"></i>
                    All items are available.
                </td>
            </tr>
        `;
        return;
    }

    items.forEach(item => {
        const product = item.product;

        const price = Number(product.price);

        tbody.innerHTML += `
            <tr class="table-danger">
                <td>
                    <strong>
                        ${product.name}
                    </strong>
                </td>

                <td>
                    $${price.toFixed(2)}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    <span class="badge bg-danger">
                        Out of Stock
                    </span>
                </td>
            </tr>
        `;
    });
}

/* ===========================================
Summary
=========================================== */
function renderSummary(summary) {
    document.getElementById("summary-subtotal").innerText = summary.subtotal.toFixed(2);

    document.getElementById("summary-total").innerText = summary.total.toFixed(2);

    const discountList = document.getElementById("discount-list");
    const deliveryContainer = document.getElementById("delivery-container");

    discountList.innerHTML = "";
    deliveryContainer.innerHTML = "";

    let savings = 0;

    summary.discounts.forEach(discount => {

        savings += Number(discount.amount);

        if (discount.discountType === "DELIVERY") {

            deliveryContainer.innerHTML = `
                <div class="d-flex justify-content-between mb-2">
                    <span>Delivery</span>
                    <span>$${summary.deliveryFee.toFixed(2)}</span>
                </div>
            `;

        } else {
            discountList.innerHTML += `
                <div class="d-flex justify-content-between text-success mb-2">
                    <span>${discount.name}</span>
                    <span>-$${Number(discount.amount).toFixed(2)}</span>
                </div>
            `;
        }
    });

    // If no delivery discount was applied, still show the delivery fee
    if (deliveryContainer.innerHTML === "") {
        deliveryContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>Delivery</span>
                <span>$${summary.deliveryFee.toFixed(2)}</span>
            </div>
        `;
    }

    document.getElementById("summary-savings").innerText = savings.toFixed(2);
}

/* ===========================================
Alerts
=========================================== */
function showAlert(message, type) {
    const box = document.getElementById("alert-box");
    document.getElementById("alert-msg").innerText =message;

    box.className = `alert alert-${type} alert-dismissible fade show`;

    box.classList.remove("d-none");
}

function hideAlert() {
    document.getElementById("alert-box").classList.add("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
    loadCheckout();
});

async function placeOrder() {
    const deliveryAddress = document.getElementById("delivery-address").value.trim();

    if (!deliveryAddress) {
        alert('Please enter your delivery address.');
        return;
    }

    if (!confirm("Confirm placing this order?")) {
        return;
    }

    try {
        const response = await fetch("/cart/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                deliveryAddress,
                finalAmount: finalDiscountedAmount
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to place order.");
        }

        showAlert(
            "Order placed successfully!",
            "success"
        );

        setTimeout(() => {
            window.location.href = "/member/cart";
        }, 1500);

    } catch (error) {
        console.error(error);
        showAlert(error.message, "danger");
    }
}
