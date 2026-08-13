document.addEventListener('DOMContentLoaded', () => {
    editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    fetchProducts();
})

let allProducts = [];
let selectedProduct = null;
let editProductModal = null;

async function fetchProducts() {
    try {
        const response = await fetch('/products');
        const data = await response.json();

        const tbody = document.getElementById('products-tbody');
        const noProducts = document.getElementById('no-products');
        const tableContainer = document.getElementById('products-table-container');

        tbody.innerHTML = '';


        if (!data.success || !data.products || data.products.length === 0) {
            tableContainer.style.display = 'none';
            noProducts.style.display = 'block';

            return;
        }

        noProducts.style.display = 'none';
        tableContainer.style.display = 'block';

        allProducts = data.products;

        data.products.forEach(product => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <strong>${product.name}</strong>
                </td>

                <td>
                    ${product.description}
                </td>

                <td>
                    ${product.category}
                </td>

                <td>
                    $${parseFloat(product.price).toFixed(2)}
                </td>

                <td id="status-${product.product_id}">
                    <span class="badge ${ product.is_available ? 'bg-success' : 'bg-secondary'}">
                        ${product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </td>

                <td>
                    <div class="form-check form-switch">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="availability-${product.product_id}"
                            ${product.is_available ? 'checked' : ''}
                            onchange="toggleAvailability(${product.product_id}, this)">

                        <label class="form-check-label" for="availability-${product.product_id}">
                            ${product.is_available ? 'Available' : 'Unavailable'}
                        </label>
                    </div>
                </td>

                <td>
                    ${new Date(product.created_at).toLocaleDateString()}
                </td>

                <td>
                    <button class="btn btn-primary btn-sm" onclick="openEditModal(${product.product_id})">
                        Edit
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching products:', error);

        alert('Failed to load products.');
    }
}

async function toggleAvailability(productId, toggle) {
    const newAvailability = toggle.checked;

    try {
        const response = await fetch(`/products/${productId}/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_available: newAvailability
            })       
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to update product availability.');
        }

        // Update the status badge and label
        updateStatusDisplay(productId, newAvailability);
    } catch (error) {
        console.error('Error updating product availability:', error);

        // Revert toggle if backend update fails
        toggle.checked = !newAvailability;

        alert(error.message);
    }
}

function updateStatusDisplay(productId, isAvailable) {

    const statusCell = document.getElementById(`status-${productId}`);

    if (!statusCell) {
        return;
    }

    statusCell.innerHTML = `
        <span class="badge ${isAvailable ? 'bg-success' : 'bg-secondary'}">
            ${isAvailable ? 'Available' : 'Unavailable'}
        </span>
    `;

    const toggle = document.getElementById(`availability-${productId}`);


    const label = document.querySelector(`label[for="availability-${productId}"]`);

    if (label) {
        label.textContent = isAvailable ? 'Available' : 'Unavailable';
    }
}

function openEditModal(productId) {

    selectedProduct = allProducts.find(
        product => product.product_id === productId
    );

    if (!selectedProduct) {
        alert('Product not found.');
        return;
    }


    document.getElementById(
        'edit-product-name'
    ).value = selectedProduct.name;


    document.getElementById(
        'edit-product-description'
    ).value = selectedProduct.description || '';


    document.getElementById(
        'edit-product-category'
    ).value = selectedProduct.category || '';


    document.getElementById(
        'edit-product-price'
    ).value = parseFloat(
        selectedProduct.price
    ).toFixed(2);


    editProductModal.show();
}

async function saveProduct() {
    if (!selectedProduct) {
        return;
    }

    const name = document.getElementById('edit-product-name').value;
    const description = document.getElementById('edit-product-description').value;
    const category = document.getElementById('edit-product-category').value;
    const price = document.getElementById('edit-product-price').value;

    try {
        const response = await fetch(`/products/${selectedProduct.product_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                category: category,
                price: price
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to update product.');
        }

        alert('Product updated successfully.');

        editProductModal.hide();

        // Reload products so the table
        // displays the updated information.
        fetchProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        alert(error.message);
    }
}
