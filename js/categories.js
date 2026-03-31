/* =============================================
   categories.js — Phase 4: Categories
   Handles:
     - Listing all categories with product counts
     - Adding a new category
     - Deleting a category (with safety check)
   This file only runs on categories.html
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  renderCategoriesTable();   // draw the table on page load
});


// ─────────────────────────────────────────────
// SECTION A — Render the categories table
// ─────────────────────────────────────────────

/*
  renderCategoriesTable()
  Reads all categories and all products.
  For each category, counts how many products belong to it.
  Builds one <tr> per category and injects into the table.
*/
function renderCategoriesTable() {
  const tbody    = document.getElementById('categories-tbody');
  const cats     = getCategories();    // ['Electronics', 'Clothing', ...]
  const products = getProducts();      // full products array

  // Empty state
  if (cats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-icon">🏷️</div>
            <p>No categories yet. Add one above.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = cats.map((cat, index) => {

    // Count how many products belong to this category
    const count = products.filter(p => p.category === cat).length;

    // Total stock value for this category
    const value = products
      .filter(p => p.category === cat)
      .reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);

    return `
      <tr>
        <td style="color:var(--text-muted); font-size:13px">${index + 1}</td>
        <td>
          <strong>${cat}</strong>
        </td>
        <td>
          <span class="badge badge-info">${count} product${count !== 1 ? 's' : ''}</span>
        </td>
        <td>${formatCurrency(value)}</td>
        <td>
          <button
            class="btn btn-danger"
            style="padding:5px 14px; font-size:13px"
            onclick="handleDeleteCategory('${cat}', ${count})">
            🗑️ Delete
          </button>
        </td>
      </tr>`;
  }).join('');
}


// ─────────────────────────────────────────────
// SECTION B — Add a category
// ─────────────────────────────────────────────

/*
  addCategory() — called by the "Add" button onclick in HTML.
  Reads the input, calls addCategory() from utils.js,
  shows feedback, and re-renders the table.

  NOTE: utils.js also has a function called addCategory().
  Here we wrap it with UI logic (alerts, clearing input).
  We rename our local wrapper to avoid collision.
*/
function handleAddCategory() {
  const input = document.getElementById('cat-input');
  const name  = input.value.trim();

  if (!name) {
    showCatAlert('Please enter a category name.', 'danger');
    return;
  }

  // addCategory() is from utils.js — returns false if duplicate
  const success = addCategory(name);

  if (!success) {
    showCatAlert(`"${name}" already exists.`, 'danger');
    return;
  }

  input.value = '';                        // clear the input
  showCatAlert(`✅ "${name}" added!`, 'success');
  renderCategoriesTable();                 // refresh table
}


// ─────────────────────────────────────────────
// SECTION C — Delete a category
// ─────────────────────────────────────────────

/*
  handleDeleteCategory(name, productCount)
  Safety check: if products are using this category,
  warn the user. They must reassign those products first.
  If no products use it, delete freely.
*/
function handleDeleteCategory(name, productCount) {
  if (productCount > 0) {
    // Safety guard — don't allow deleting a category in use
    alert(
      `Cannot delete "${name}".\n\n` +
      `${productCount} product(s) are assigned to this category.\n` +
      `Please reassign or delete those products first.`
    );
    return;
  }

  const confirmed = confirm(`Delete category "${name}"?`);
  if (!confirmed) return;

  deleteCategory(name);           // from utils.js
  showCatAlert(`"${name}" deleted.`, 'danger');
  renderCategoriesTable();        // refresh table
}


// ─────────────────────────────────────────────
// SECTION D — UI Helpers
// ─────────────────────────────────────────────

/*
  showCatAlert(message, type)
  Shows the inline alert below the add-category form.
  type: 'success' | 'danger'
  Auto-hides after 3 seconds.
*/
function showCatAlert(message, type = 'success') {
  const el = document.getElementById('cat-alert');
  el.textContent = message;
  el.className   = `alert alert-${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

