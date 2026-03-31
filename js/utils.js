/* =============================================
   utils.js — Phase 2: Data Layer
   All localStorage read/write happens HERE.
   Every other JS file uses these functions.
   ============================================= */

// ---------- STORAGE KEYS ----------
// Centralising key names means if you rename a key,
// you change it in ONE place, not scattered across files.
const KEYS = {
  products:   'ims_products',
  categories: 'ims_categories',
};


// ─────────────────────────────────────────────
// PART 1 — ID Generator
// ─────────────────────────────────────────────

/*
  generateId()
  Creates a unique ID like "p_1711234567890"
  Uses the current timestamp in milliseconds.
  No two calls in the same millisecond = no collision.
*/
function generateId() {
  return 'p_' + Date.now();
}


// ─────────────────────────────────────────────
// PART 2 — Products (the main data)
// ─────────────────────────────────────────────

/*
  getProducts()
  Reads products array from localStorage.

  HOW localStorage WORKS:
    - It only stores plain strings — not arrays or objects.
    - So we store: JSON.stringify(array)  → "[{...},{...}]"
    - And read back: JSON.parse(string)   → [{...},{...}]
    - If nothing stored yet → return empty array [] as default.
*/
function getProducts() {
  const raw = localStorage.getItem(KEYS.products);  // returns string or null
  return raw ? JSON.parse(raw) : [];
}

/*
  saveProducts(products)
  Overwrites the entire products array in localStorage.
  We always save the WHOLE array — not just one item.
  This is simpler and safer than patching individual items.
*/
function saveProducts(products) {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
}

/*
  addProduct(productObj)
  Takes a product object from the form, attaches an id
  and timestamp, pushes it into the array, and saves.

  Returns the newly created product so the caller
  can use it (e.g. show a success message with the name).
*/
function addProduct(productObj) {
  const products = getProducts();          // load current list

  const newProduct = {
    ...productObj,                         // spread: copies all form fields in
    id:        generateId(),               // attach unique id
    createdAt: new Date().toLocaleDateString('en-IN'),
  };

  products.push(newProduct);               // add to end of array
  saveProducts(products);                  // save the whole array back
  return newProduct;
}

/*
  updateProduct(id, updatedFields)
  Finds the product by id, merges the new values in, saves.

  The spread trick:
    { ...products[index], ...updatedFields }
    Keeps ALL original fields, and OVERWRITES only
    the ones present in updatedFields. Like Object.assign.

  Returns true if found and updated, false if id not found.
*/
function updateProduct(id, updatedFields) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) return false;          // id not found — nothing to update

  products[index] = {
    ...products[index],                    // keep original fields
    ...updatedFields,                      // overwrite with new values
  };

  saveProducts(products);
  return true;
}

/*
  deleteProduct(id)
  Filters OUT the matching product and saves the rest.
  filter() returns a new array without the deleted item —
  the original array is not mutated.
*/
function deleteProduct(id) {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveProducts(filtered);
}

/*
  getProductById(id)
  Returns ONE product object, or null if not found.
  Used by the edit form to pre-fill all the input fields.
*/
function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}


// ─────────────────────────────────────────────
// PART 3 — Categories
// ─────────────────────────────────────────────

/*
  getCategories()
  Returns the categories array (plain strings, not objects).
  On first ever run, seeds 5 default categories so the
  app doesn't feel empty immediately.
*/
function getCategories() {
  const raw = localStorage.getItem(KEYS.categories);
  if (raw) return JSON.parse(raw);

  // First run — seed defaults
  const defaults = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Furniture',
    'Stationery',
  ];
  saveCategories(defaults);
  return defaults;
}

/*
  saveCategories(categories)
  Writes the full categories array to localStorage.
*/
function saveCategories(categories) {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

/*
  addCategory(name)
  Adds a category name string to the array if it's not a duplicate.
  Returns true on success, false if duplicate or empty.
*/
function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const cats = getCategories();
  // case-insensitive duplicate check
  const exists = cats.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) return false;

  cats.push(trimmed);
  saveCategories(cats);
  return true;
}

/*
  deleteCategory(name)
  Removes a category by name from the array and saves.
*/
function deleteCategory(name) {
  const cats = getCategories();
  const filtered = cats.filter(c => c !== name);
  saveCategories(filtered);
}


// ─────────────────────────────────────────────
// PART 4 — Helper / Utility Functions
// ─────────────────────────────────────────────

/*
  isLowStock(product)
  Returns true if quantity is at or below the threshold.
  Used in multiple places — table rows, dashboard alerts, reports.
*/
function isLowStock(product) {
  return Number(product.quantity) <= Number(product.threshold);
}

/*
  formatCurrency(amount)
  Formats a number as Indian Rupees.
  e.g. 1500 → "₹1,500"
*/
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/*
  getStockBadge(product)
  Returns an HTML string for the coloured status badge.
  Used in tables on the products and dashboard pages.
*/
function getStockBadge(product) {
  if (Number(product.quantity) === 0) {
    return '<span class="badge badge-danger">Out of Stock</span>';
  }
  if (isLowStock(product)) {
    return '<span class="badge badge-warning">Low Stock</span>';
  }
  return '<span class="badge badge-success">In Stock</span>';
}

/*
  clearAllData()
  Nuclear option — wipes all app data from localStorage.
  Only used for testing / reset. Not exposed in the UI.
*/
function clearAllData() {
  localStorage.removeItem(KEYS.products);
  localStorage.removeItem(KEYS.categories);
}
