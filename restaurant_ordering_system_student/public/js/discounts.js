const discountModal = new bootstrap.Modal(document.getElementById("discountModal"));

let allProducts = [];

async function loadProducts() {
    try {
        const response = await fetch("/products");

        const result = await response.json();

        if (!result.success) {
            return alert(result.message);
        }

        allProducts = result.products;

        const dropdown = document.getElementById("targetProduct");

        dropdown.innerHTML = `
            <option value="">Select Product</option>
        `;

        allProducts.forEach(product => {
            dropdown.innerHTML += `
                <option value="${product.product_id}">
                    ${product.name}
                </option>
            `;
        });
    } catch (err) {
        console.error(err);
        alert("Unable to load products.");
    }
}

async function loadDiscounts() {
    try {
        const params = new URLSearchParams();

        const search = document.getElementById("searchInput").value;
        const discountType = document.getElementById("filterType").value;
        const isActive = document.getElementById("filterStatus").value;
        
        if (search) params.append("search", search);
        if (discountType) params.append("discountType", discountType);
        if (isActive !== "") params.append("isActive", isActive);

        const response = await fetch(`/discounts?${params}`);

        const result = await response.json();

        if (!result.success) {
            return alert(result.message);
        }

        renderDiscountTable(result.data);
    } catch (err) {
        console.error(err);
        alert("Unable to load discounts.");
    }
}

function clearFilters() {
    document.getElementById("filter-form").reset();
    loadDiscounts();
}

function openAddModal() {
    document.getElementById("modalTitle").innerText = "Add Discount";
    document.getElementById("discountForm").reset();
    document.getElementById("discountId").value = "";
    document.getElementById("valueType").value = "PERCENTAGE";
    toggleTargetProduct();
    discountModal.show();
}

async function editDiscount(id) {
    try {
        const response = await fetch(`/discounts/${id}`);

        const result = await response.json();

        if (!result.success) {
            return alert(result.message);
        }

        const discount = result.data;

        document.getElementById("modalTitle").innerText = "Edit Discount";

        document.getElementById("discountId").value = discount.discountId;
        document.getElementById("name").value = discount.name;
        document.getElementById("description").value = discount.description ?? "";
        document.getElementById("discountType").value = discount.discountType;
        document.getElementById("minTrigger").value = discount.minTrigger;
        document.getElementById("maxTrigger").value = discount.maxTrigger ?? "";
        document.getElementById("value").value = discount.value;
        document.getElementById("valueType").value = discount.valueType;
        document.getElementById("targetProduct").value = discount.targetProductId ?? "";
        document.getElementById("isActive").checked = discount.isActive;

        toggleTargetProduct();

        discountModal.show();
    } catch (err) {
        console.error(err);
        alert("Unable to load discount.");
    }
}

async function saveDiscount() {
    const id = document.getElementById("discountId").value;

    const payload = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        discountType: document.getElementById("discountType").value,
        minTrigger: document.getElementById("minTrigger").value,
        maxTrigger: document.getElementById("maxTrigger").value,
        value: document.getElementById("value").value,
        valueType: document.getElementById("valueType").value,
        targetProductId: document.getElementById("targetProduct").value,
        isActive: document.getElementById("isActive").checked
    };

    try {
        const response = await fetch(id ? `/discounts/${id}` : "/discounts", {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!result.success) {
            return alert(result.message);
        }

        alert(result.message);

        discountModal.hide();

        loadDiscounts();
    } catch (err) {
        console.error(err);
        alert("Unable to save discount.");
    }
}

async function deleteDiscount(id) {
    if (!confirm("Delete this discount?")) {
        return;
    }

    try {
        const response = await fetch(`/discounts/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!result.success) {
            return alert(result.message);
        }

        alert(result.message);

        loadDiscounts();
    }
    catch (err) {
        console.error(err);
        alert("Unable to delete discount.");
    }
}

function toggleTargetProduct() {
    const type = document.getElementById("discountType").value;
    document.getElementById("targetProductSection").style.display = type === "PRODUCT_QUANTITY" ? "block" : "none";
}

function renderDiscountTable(discounts) {
    const tbody = document.getElementById("discountTableBody");

    tbody.innerHTML = "";

    discounts.forEach(discount => {
        tbody.innerHTML += `
        <tr>
            <td>${discount.discountId}</td>

            <td>
                <strong>${discount.name}</strong><br>
                <small class="text-muted">
                    ${discount.description}
                </small>
            </td>

            <td>
                ${getTypeBadge(discount.discountType)}
            </td>

            <td>
                ${discount.minTrigger}
                ${discount.maxTrigger ? " - " + discount.maxTrigger : ""}
            </td>

            <td>
                ${discount.valueType === "PERCENTAGE" ? `${discount.value}%` : `$${discount.value}`}
            </td>

            <td>
                ${discount.targetProduct?.name ?? "-"}
            </td>

            <td>
                <span class="badge ${discount.isActive ? "bg-success" : "bg-secondary"}">
                    ${discount.isActive ? "Active" : "Inactive"}
                </span>
            </td>

            <td>
                <button
                    class="btn btn-warning btn-sm"
                    onclick="editDiscount(${discount.discountId})">

                    <i class="bi bi-pencil"></i>
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteDiscount(${discount.discountId})">

                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
}

function getTypeBadge(type) {
    switch(type){
        case "PRODUCT_QUANTITY":
            return `<span class="badge bg-primary badge-type">Product</span>`;
        case "CART_TOTAL":
            return `<span class="badge bg-success badge-type">Cart</span>`;
        case "DELIVERY":
            return `<span class="badge bg-warning text-dark badge-type">Delivery</span>`;
        default:
            return type;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadDiscounts();
    await loadProducts();
});
