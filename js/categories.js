document.addEventListener('DOMContentLoaded', () => {
  renderCategoriesTable();
});

function renderCategoriesTable() {
  const tbody    = document.getElementById('categories-tbody');
  const cats     = getCategories();
  const products = getProducts();

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


function handleAddCategory() {
  const input = document.getElementById('cat-input');
  const name  = input.value.trim();

  if (!name) {
    showCatAlert('Please enter a category name.', 'danger');
    return;
  }

  const success = addCategory(name);

  if (!success) {
    showCatAlert(`"${name}" already exists.`, 'danger');
    return;
  }

  input.value = '';
  showCatAlert(`✅ "${name}" added!`, 'success');
  renderCategoriesTable();
}

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

  deleteCategory(name);
  showCatAlert(`"${name}" deleted.`, 'danger');
  renderCategoriesTable();
}


function showCatAlert(message, type = 'success') {
  const el = document.getElementById('cat-alert');
  el.textContent = message;
  el.className   = `alert alert-${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

