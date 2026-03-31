/* =============================================
   products.js — Phase 3: Products CRUD
   Handles:
     - Listing all products (products.html)
     - Add / Edit form (add-product.html)
     - Delete with confirmation
   ============================================= */


// ─────────────────────────────────────────────
// DETECT WHICH PAGE WE ARE ON
// Both products.html and add-product.html load
// this file. We check which elements exist to
// decide what to run.
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  if (document.getElementById('products-tbody')) {
    // We are on products.html
    initProductsPage();
  }

  if (document.getElementById('product-form')) {
    // We are on add-product.html
    initProductForm();
  }

});


// ═════════════════════════════════════════════
// SECTION A — PRODUCTS LIST PAGE (products.html)
// ═════════════════════════════════════════════

function initProductsPage() {
  renderTable();           // draw table on load
  populateCategoryFilter();// fill the category dropdown
  attachSearchListeners(); // wire up search & filter inputs
}

/*
  renderTable(filteredList)
  Draws the products table. If filteredList is passed,
  renders that subset. Otherwise renders all products.
*/
function renderTable(filteredList) {
  const tbody = document.getElementById('products-tbody');
  const products = filteredList !== undefined ? filteredList : getProducts();

  // Empty state
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

  // Build one <tr> per product
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

/*
  populateCategoryFilter()
  Fills the category <select> on products.html
  with all categories from localStorage.
*/
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

/*
  attachSearchListeners()
  Runs filterAndRender() every time the user types
  in the search box or changes a dropdown filter.
*/
function attachSearchListeners() {
  document.getElementById('search-input')
    .addEventListener('input', filterAndRender);

  document.getElementById('filter-category')
    .addEventListener('change', filterAndRender);

  document.getElementById('filter-stock')
    .addEventListener('change', filterAndRender);
}

/*
  filterAndRender()
  Reads all 3 filter values and filters the products array,
  then passes the result to renderTable().

  Three filters working together:
    1. Text search  — checks name and description
    2. Category     — exact match
    3. Stock status — "low" or "ok"
*/
function filterAndRender() {
  const searchVal  = document.getElementById('search-input').value.toLowerCase().trim();
  const catVal     = document.getElementById('filter-category').value;
  const stockVal   = document.getElementById('filter-stock').value;

  let products = getProducts();

  // Filter 1: text search
  if (searchVal) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchVal) ||
      (p.description && p.description.toLowerCase().includes(searchVal))
    );
  }

  // Filter 2: category
  if (catVal) {
    products = products.filter(p => p.category === catVal);
  }

  // Filter 3: stock status
  if (stockVal === 'low') {
    products = products.filter(p => isLowStock(p));
  } else if (stockVal === 'ok') {
    products = products.filter(p => !isLowStock(p));
  }

  renderTable(products);
}

/*
  handleEdit(id)
  Navigates to add-product.html with ?id=xxx in the URL.
  The form page reads this URL param to know it's in edit mode.
*/
function handleEdit(id) {
  window.location.href = `add-product.html?id=${id}`;
}

/*
  handleDelete(id, name)
  Shows a browser confirm dialog.
  If confirmed, deletes and re-renders the table.
*/
function handleDelete(id, name) {
  const confirmed = confirm(`Delete "${name}"?\nThis cannot be undone.`);
  if (!confirmed) return;

  deleteProduct(id);    // from utils.js
  filterAndRender();    // re-render with current filters still applied
  showToast(`"${name}" deleted.`, 'danger');
}


// ═════════════════════════════════════════════
// SECTION B — ADD / EDIT FORM (add-product.html)
// ═════════════════════════════════════════════

function initProductForm() {
  populateCategoryDropdown();   // fill the category <select>
  checkEditMode();              // pre-fill form if ?id= present in URL
  attachFormSubmit();           // handle form submit
}

/*
  populateCategoryDropdown()
  Fills the category <select> in the add/edit form
  with all categories from localStorage.
*/
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

/*
  checkEditMode()
  Reads the URL query string for ?id=xxx.
  If found, this is an EDIT — load that product's data
  and pre-fill all the form fields.
  If not found, this is ADD — leave the form empty.
*/
function checkEditMode() {
  // URLSearchParams parses the query string for us
  const params  = new URLSearchParams(window.location.search);
  const editId  = params.get('id');   // returns null if not present

  if (!editId) return;  // ADD mode — nothing to pre-fill

  // EDIT mode
  const product = getProductById(editId);
  if (!product) return;  // id not found — treat as add

  // Update page titles
  document.getElementById('form-title').textContent    = 'Edit Product';
  document.getElementById('form-subtitle').textContent = `Editing: ${product.name}`;
  document.title = `Edit ${product.name} — Inventory MS`;

  // Pre-fill every form field with the product's current values
  document.getElementById('product-id').value         = product.id;
  document.getElementById('product-name').value       = product.name;
  document.getElementById('product-qty').value        = product.quantity;
  document.getElementById('product-price').value      = product.price;
  document.getElementById('product-threshold').value  = product.threshold;
  document.getElementById('product-desc').value       = product.description || '';

  // For <select>, we set value AFTER the options are populated
  document.getElementById('product-category').value   = product.category;
}

/*
  attachFormSubmit()
  Intercepts the form's submit event.
  Reads all field values, validates, then calls
  addProduct() or updateProduct() from utils.js.
*/
function attachFormSubmit() {
  document.getElementById('product-form')
    .addEventListener('submit', function(e) {
      e.preventDefault();   // stop browser's default page reload

      // Read all values from the form
      const id          = document.getElementById('product-id').value;
      const name        = document.getElementById('product-name').value.trim();
      const category    = document.getElementById('product-category').value;
      const quantity    = document.getElementById('product-qty').value;
      const price       = document.getElementById('product-price').value;
      const threshold   = document.getElementById('product-threshold').value || '10';
      const description = document.getElementById('product-desc').value.trim();

      // ── Validation ──────────────────────────
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
      // ────────────────────────────────────────

      // Build the product data object from form values
      const productData = {
        name,
        category,
        quantity:    Number(quantity),
        price:       Number(price),
        threshold:   Number(threshold),
        description,
      };

      if (id) {
        // EDIT — id field had a value (pre-filled in checkEditMode)
        updateProduct(id, productData);
        showAlert('✅ Product updated successfully!');
      } else {
        // ADD — id field was empty
        addProduct(productData);
        showAlert('✅ Product added successfully!');
        resetForm();   // clear the form for the next entry
      }
    });
}

/*
  resetForm()
  Clears all form fields back to their defaults.
  Called after a successful add, and by the "Clear Form" button.
*/
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


// ─────────────────────────────────────────────
// SECTION C — UI Helpers
// ─────────────────────────────────────────────

/*
  showAlert(message)
  Shows the green success banner on the form page.
  Auto-hides after 3 seconds.
*/
function showAlert(message) {
  const el = document.getElementById('form-alert');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

/*
  showToast(message, type)
  Shows a small floating toast notification.
  Creates a div, injects it, then removes it after 2.5s.
  type: 'success' | 'danger' | 'warning'
*/
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

