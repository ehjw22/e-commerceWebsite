
document.addEventListener("DOMContentLoaded", loadDiscounts);

/* =========================
    Load Discounts
========================= */
async function loadDiscounts() {
    try {
    const response = await fetch("/discounts");
    const result = await response.json();

    console.log("Discounts:", result);

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load discounts.");
    }

    const discounts = result.data;
    displayDiscounts(discounts);

    } catch (error) {
    console.error("Error loading discounts:", error);
    const errorMessage = document.getElementById("error-message");

    errorMessage.innerText = "Unable to load discounts. Please try again later.";
    errorMessage.style.display = "block";
    }
}

/* =========================
    Separate Discounts
========================= */
function displayDiscounts(discounts) {
    const productQuantity = discounts.filter(discount => discount.discountType === "PRODUCT_QUANTITY");
    const cartTotal = discounts.filter(discount => discount.discountType === "CART_TOTAL");
    const delivery = discounts.filter(discount => discount.discountType === "DELIVERY");

    renderProductQuantityDiscounts(productQuantity);
    renderCartTotalDiscounts(cartTotal);
    renderDeliveryDiscounts(delivery);
}

/* =========================
    Product Quantity
========================= */
function renderProductQuantityDiscounts(discounts) {
    const container = document.getElementById("product-quantity-discounts");
    container.innerHTML = "";

    if (discounts.length === 0) {
    document.getElementById("no-product-quantity").style.display = "block";
    return;
    }

    document.getElementById("no-product-quantity").style.display = "none";
    discounts.forEach(discount => {
    container.appendChild(createProductDiscountCard(discount));
    });
}

function createProductDiscountCard(discount) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    const amount = formatDiscountAmount(discount);
    const requirement = getQuantityRequirement(discount);
    const targetProduct = discount.targetProduct.name;

    col.innerHTML = `
    <div class="discount-card h-100">
        <div class="card-body d-flex flex-column">
        <h5 class="discount-name">${discount.name}</h5>
        <p class="discount-description">${discount.description}</p>
        
        <div>
            <div class="discount-amount">${amount}</div>
            <div class="discount-off-label">Discount</div>
        </div>

        <div class="requirement">
            <span class="requirement-label">Requirement</span>
            <strong>${requirement}</strong>
        </div>

        <div class="target-product">
            <span class="text-muted">Applies to:</span>
            <strong>${targetProduct}</strong>
        </div>

        <a href="/member/products" class="btn btn-primary mt-auto">Shop Products</a>
        </div>
    </div>
    `;

    return col;
}

/* =========================
    Cart Total
========================= */
function renderCartTotalDiscounts(discounts) {
    const container = document.getElementById("cart-total-discounts");
    container.innerHTML = "";

    if (discounts.length === 0) {
    document.getElementById("no-cart-total").style.display = "block";
    return;
    }

    document.getElementById("no-cart-total").style.display = "none";
    discounts.forEach(discount => {
    container.appendChild(createCartDiscountCard(discount));
    });
}

function createCartDiscountCard(discount) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    const amount = formatDiscountAmount(discount);
    const requirement = getCartRequirement(discount);

    col.innerHTML = `
    <div class="discount-card h-100">
        <div class="card-body d-flex flex-column">
        <h5 class="discount-name">${discount.name}</h5>
        <p class="discount-description">${discount.description}</p>
        
        <div>
            <div class="discount-amount">${amount}</div>
            <div class="discount-off-label">Discount</div>
        </div>

        <div class="requirement">
            <span class="requirement-label">Requirement</span>
            <strong>${requirement}</strong>
        </div>

        <a href="/member/cart" class="btn btn-primary mt-auto">View Cart</a>
        </div>
    </div>
    `;

    return col;
}

/* =========================
    Delivery
========================= */
function renderDeliveryDiscounts(discounts) {
    const container = document.getElementById("delivery-discounts");
    container.innerHTML = "";

    if (discounts.length === 0) {
    document.getElementById("no-delivery").style.display = "block";
    return;
    }

    document.getElementById("no-delivery").style.display = "none";
    discounts.forEach(discount => {
    container.appendChild(createDeliveryDiscount(discount));
    });
}

function createDeliveryDiscount(discount) {
    const wrapper = document.createElement("div");
    const value = parseFloat(discount.value);
    let deliveryAmount = "";

    if (discount.valueType === "FIXED_AMOUNT") {
    deliveryAmount = value === 0 ? "FREE DELIVERY" : `$${value.toFixed(2)} DELIVERY`;
    } else if (discount.valueType === "PERCENTAGE") {
    deliveryAmount = `${value}% OFF DELIVERY`;
    }

    const requirement = getCartRequirement(discount);
    const description = discount.description;

    wrapper.innerHTML = `
    <div class="delivery-discount">
        <div class="delivery-left">
        <div class="delivery-icon">🚚</div>
        <div>
            <div class="delivery-name">${discount.name}</div>
            <p class="delivery-description">${description}</p>
            ${requirement ? `<small class="text-muted">${requirement}</small>` : ""}
        </div>
        </div>
        <div class="delivery-amount">${deliveryAmount}</div>
    </div>
    `;

    return wrapper;
}

/* =========================
    Discount Amount
========================= */
function formatDiscountAmount(discount) {
    const value = parseFloat(discount.value);

    if (isNaN(value)) return "Discount";
    if (discount.valueType === "PERCENTAGE") return `${value}% OFF`;
    if (discount.valueType === "FIXED_AMOUNT") return `$${value.toFixed(2)} OFF`;

    return value.toFixed(2);
}

/* =========================
    Quantity Requirement
========================= */
function getQuantityRequirement(discount) {
    const min = parseFloat(discount.minTrigger);
    const max = parseFloat(discount.maxTrigger);

    if (!isNaN(min) && !isNaN(max)) return `Buy ${min} to ${max} items`;
    if (!isNaN(min)) return `Buy ${min} or more items`;

    return "Meet the required quantity";
}

/* =========================
    Cart Requirement
========================= */
function getCartRequirement(discount) {
    const min = parseFloat(discount.minTrigger);
    const max = parseFloat(discount.maxTrigger);

    if (!isNaN(min) && !isNaN(max)) return `Spend $${min.toFixed(2)} to $${max.toFixed(2)}`;
    if (!isNaN(min)) return `Spend $${min.toFixed(2)} or more`;

    return "Meet the required cart total";
}
