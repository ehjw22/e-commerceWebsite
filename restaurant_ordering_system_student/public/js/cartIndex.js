let cartItems = [];
let availableProducts = [];
let modalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    modalInstance =
        new bootstrap.Modal(
            document.getElementById('addItemModal')
        );

    fetchCartItems();
});

async function fetchCartItems() {
    try {
        const response = await fetch('/cart');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to fetch cart.');

        cartItems = data.rows;
        renderCart();
        await updateSummary();
    } catch (error) {
        console.error('Error fetching cart:', error);
        showAlert('Could not load cart items: ' + error.message, 'danger');
    }
}

async function updateSummary() {
    const response = await fetch("/cart/summary");

    const result = await response.json();

    if (!result.success)
        return;

    const summary = result.data;

    document.getElementById("summary-subtotal").innerText = summary.subtotal.toFixed(2);

    document.getElementById("summary-total").innerText = summary.total.toFixed(2);

    let savings = 0;

    const discountList = document.getElementById("discount-list");

    discountList.innerHTML = "";

    summary.discounts.forEach(discount => {

        savings += discount.amount;

        if (discount.name.toLowerCase().includes("delivery"))
            return;

        discountList.innerHTML += `
            <div class="d-flex justify-content-between text-success mb-2">
                <span>
                    <i class="bi bi-tag-fill"></i>
                    ${discount.name}
                </span>
                <span>
                    -$${discount.amount.toFixed(2)}
                </span>
            </div>
        `;
    });

    const delivery = document.getElementById("delivery-container");

    if (summary.deliveryFee === 0) {
        savings += 8;

        delivery.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>Delivery</span>
                <span>
                    <del class="text-muted">
                        $8.00
                    </del>
                    <span class="text-success fw-bold ms-2">
                        FREE
                    </span>
                </span>
            </div>
        `;
    } else {
        delivery.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>
                    Delivery
                </span>
                <span>
                    $${summary.deliveryFee.toFixed(2)}
                </span>
            </div>
        `;
    }
    document.getElementById("summary-savings").innerText = savings.toFixed(2);
}

function renderCart() {
    const tbody = document.getElementById('cart-table-body');
    const emptyView = document.getElementById('empty-cart-view');
    const contentView = document.getElementById('cart-content-view');

    tbody.innerHTML = '';

    if (!cartItems || cartItems.length === 0) {
        contentView.classList.add('d-none');
        emptyView.classList.remove('d-none');
        return;
    }

    emptyView.classList.add('d-none');
    contentView.classList.remove('d-none');

    let grandTotal = 0;

    cartItems.sort((a, b) =>
        a.product.name.localeCompare(b.product.name)
    );
    
    cartItems.forEach(item => {
    // 1. Extract product details from nested object
        const product = item.product;
        const productId = item.productId;
        const name = product.name;
        const price = parseFloat(product.price);
        const qty = parseInt(item.quantity, 10);
        
        // 2. Calculate row totals
        const rowTotal = price * qty;
        grandTotal += rowTotal;

        // 3. Construct HTML table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold">${name}</td>
            <td>$${price.toFixed(2)}</td>
            <td>
            <div class="input-group input-group-sm mx-auto" style="max-width: 120px;">
                <button class="btn btn-outline-secondary" onclick="updateQty(${productId}, ${qty - 1})">-</button>
                <input type="text" class="form-control text-center bg-white" value="${qty}" readonly>
                <button class="btn btn-outline-secondary" onclick="updateQty(${productId}, ${qty + 1})">+</button>
            </div>
            </td>
            <td class="fw-bold text-dark">$${rowTotal.toFixed(2)}</td>
            <td class="text-end">
            <button class="btn btn-outline-danger btn-sm" onclick="deleteItem(${productId})" title="Remove item">
                <i class="bi bi-trash"></i>
            </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function updateQty(productId, newQty) {
    if (newQty < 1) {
        deleteItem(productId);
        return;
    }

    try {
        const response = await fetch(`/cart/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQty })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update quantity.');

        fetchCartItems(); // Reload table
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteItem(productId) {
    try {
        const response = await fetch(`/cart/${productId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete item.');

        showAlert('Item removed from cart.', 'info');
        fetchCartItems();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function openAddItemModal() {
    const select = document.getElementById('modal-product-select');
    select.innerHTML = '<option value="" disabled selected>Loading menu items...</option>';
    modalInstance.show();

    try {
        const res = await fetch('/products');
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch catalog.');

        availableProducts = (data.products || []).filter(p => p.is_available ?? p.isAvailable);
        
        select.innerHTML = '<option value="" disabled selected>-- Select an Item --</option>';
        availableProducts.forEach(prod => {
            const id = prod.product_id || prod.productId;
            const price = parseFloat(prod.price).toFixed(2);
            select.innerHTML += `<option value="${id}" data-price="${price}">${prod.name} ($${price})</option>`;
        });

        document.getElementById('modal-item-qty').value = 1;
        calculateModalSubtotal();
    } catch (error) {
        showAlert('Could not load products: ' + error.message, 'danger');
    }
}

function adjustModalQty(delta) {
    const qtyInput = document.getElementById('modal-item-qty');
    let current = parseInt(qtyInput.value, 10) || 1;
    current = Math.max(1, current + delta);
    qtyInput.value = current;
    calculateModalSubtotal();
}

function onModalProductChange() {
    calculateModalSubtotal();
}

function calculateModalSubtotal() {
    const select = document.getElementById('modal-product-select');
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption ? parseFloat(selectedOption.getAttribute('data-price') || 0) : 0;
    const qty = parseInt(document.getElementById('modal-item-qty').value, 10) || 1;

    document.getElementById('modal-subtotal').innerText = (price * qty).toFixed(2);
}

async function submitModalAddItem() {
    const select = document.getElementById('modal-product-select');
    const productId = select.value;
    const quantity = parseInt(document.getElementById('modal-item-qty').value, 10);

    if (!productId) {
        alert('Please choose an item from the list.');
        return;
    }

    const btn = document.getElementById('confirm-add-btn');
    btn.disabled = true;

    try {
        const response = await fetch('/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: parseInt(productId, 10), quantity })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add item to cart.');

        modalInstance.hide();
        showAlert('Item successfully added to your cart!', 'success');
        fetchCartItems();
    } catch (error) {
        alert(error.message);
    } finally {
        btn.disabled = false;
    }
}

function showAlert(msg, type) {
    const box = document.getElementById('alert-box');
    document.getElementById('alert-msg').innerText = msg;
    box.className = `alert alert-${type} alert-dismissible fade show`;
    box.classList.remove('d-none');
}

function hideAlert() {
    document.getElementById('alert-box').classList.add('d-none');
}

function goToCheckout() {
    window.location.href = "/member/checkout";
}

