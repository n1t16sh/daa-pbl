document.addEventListener('DOMContentLoaded', () => {

  if (document.getElementById('products-tbody')) {
    initProductsPage();
  }

  if (document.getElementById('product-form')) {
    initProductForm();
  }

});


function initProductsPage() {
  renderTable();
  populateCategoryFilter();
  attachSearchListeners();
}


function renderTable(filteredList) {
  const tbody = document.getElementById('products-tbody');
  const products = filteredList !== undefined ? filteredList : getProducts();

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No products found. <a href="add-product.html" style="color:var(--accent)">Add your first product →</a></p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = products.map((p, index) => `
    <tr>
      <td style="color:var(--text-muted); font-size:13px">${index + 1}</td>
      <td>
        <strong>${p.name}</strong>
        ${p.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${p.description}</div>` : ''}
      </td>
      <td><span class="badge badge-info">${p.category}</span></td>
      <td>${p.quantity}</td>
      <td>${formatCurrency(p.price)}</td>
      <td>${getStockBadge(p)}</td>
      <td>
        <div style="display:flex; gap:8px">
          <button
            class="btn btn-outline"
            style="padding:5px 12px; font-size:13px"
            onclick="handleEdit('${p.id}')">
            ✏️ Edit
          </button>
          <button
            class="btn btn-danger"
            style="padding:5px 12px; font-size:13px"
            onclick="handleDelete('${p.id}', '${p.name}')">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}


function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  const cats = getCategories();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}


function attachSearchListeners() {
  document.getElementById('search-input')
    .addEventListener('input', filterAndRender);

  document.getElementById('filter-category')
    .addEventListener('change', filterAndRender);

  document.getElementById('filter-stock')
    .addEventListener('change', filterAndRender);
}


function filterAndRender() {
  const searchVal  = document.getElementById('search-input').value.toLowerCase().trim();
  const catVal     = document.getElementById('filter-category').value;
  const stockVal   = document.getElementById('filter-stock').value;

  let products = getProducts();

  if (searchVal) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchVal) ||
      (p.description && p.description.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) {
    products = products.filter(p => p.category === catVal);
  }

  if (stockVal === 'low') {
    products = products.filter(p => isLowStock(p));
  } else if (stockVal === 'ok') {
    products = products.filter(p => !isLowStock(p));
  }

  renderTable(products);
}


function handleEdit(id) {
  window.location.href = `add-product.html?id=${id}`;
}


function handleDelete(id, name) {
  const confirmed = confirm(`Delete "${name}"?\nThis cannot be undone.`);
  if (!confirmed) return;

  deleteProduct(id);    
  filterAndRender();   
  showToast(`"${name}" deleted.`, 'danger');
}


function initProductForm() {
  populateCategoryDropdown();  
  checkEditMode();              
  attachFormSubmit();         
}


function populateCategoryDropdown() {
  const select = document.getElementById('product-category');
  if (!select) return;

  const cats = getCategories();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function checkEditMode() {
  
  const params  = new URLSearchParams(window.location.search);
  const editId  = params.get('id');   
  if (!editId) return;  

  const product = getProductById(editId);
  if (!product) return;  

  document.getElementById('form-title').textContent    = 'Edit Product';
  document.getElementById('form-subtitle').textContent = `Editing: ${product.name}`;
  document.title = `Edit ${product.name} — Inventory MS`;

  document.getElementById('product-id').value         = product.id;
  document.getElementById('product-name').value       = product.name;
  document.getElementById('product-qty').value        = product.quantity;
  document.getElementById('product-price').value      = product.price;
  document.getElementById('product-threshold').value  = product.threshold;
  document.getElementById('product-desc').value       = product.description || '';
  document.getElementById('product-category').value   = product.category;
}

function attachFormSubmit() {
  document.getElementById('product-form')
    .addEventListener('submit', function(e) {
      e.preventDefault();  

      const id          = document.getElementById('product-id').value;
      const name        = document.getElementById('product-name').value.trim();
      const category    = document.getElementById('product-category').value;
      const quantity    = document.getElementById('product-qty').value;
      const price       = document.getElementById('product-price').value;
      const threshold   = document.getElementById('product-threshold').value || '10';
      const description = document.getElementById('product-desc').value.trim();

      if (!name) {
        alert('Please enter a product name.');
        document.getElementById('product-name').focus();
        return;
      }
      if (!category) {
        alert('Please select a category.');
        document.getElementById('product-category').focus();
        return;
      }
      if (quantity === '' || Number(quantity) < 0) {
        alert('Please enter a valid quantity (0 or more).');
        document.getElementById('product-qty').focus();
        return;
      }
      if (price === '' || Number(price) < 0) {
        alert('Please enter a valid price.');
        document.getElementById('product-price').focus();
        return;
      }

      const productData = {
        name,
        category,
        quantity:    Number(quantity),
        price:       Number(price),
        threshold:   Number(threshold),
        description,
      };

      if (id) {
        updateProduct(id, productData);
        showAlert('✅ Product updated successfully!');
      } else {
        addProduct(productData);
        showAlert('✅ Product added successfully!');
        resetForm(); 
      }
    });
}

function resetForm() {
  document.getElementById('product-id').value        = '';
  document.getElementById('product-name').value      = '';
  document.getElementById('product-category').value  = '';
  document.getElementById('product-qty').value       = '';
  document.getElementById('product-price').value     = '';
  document.getElementById('product-threshold').value = '10';
  document.getElementById('product-desc').value      = '';
  document.getElementById('form-title').textContent  = 'Add New Product';
}

function showAlert(message) {
  const el = document.getElementById('form-alert');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 4px solid var(--${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success'});
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 9999;
    animation: slideIn 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

