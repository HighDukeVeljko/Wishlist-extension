// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum characters shown for a page title in the preview box and saved list.
 * Titles longer than this are truncated and suffixed with "…".
 */
const MAX_TITLE_LENGTH = 50;

/**
 * Canonical category order and their display emojis.
 * The sections in the pop-up always appear in this order, regardless of
 * the order in which items were saved. Add or remove entries here to change
 * which categories are supported across the whole extension.
 *
 * Shape: { [categoryName: string]: string (emoji) }
 */
const CATEGORY_META = {
  Books:       "📚",
  Clothes:     "👗",
  Shoes:       "👟",
  Electronics: "💻",
  Pets:        "🐾",
  Health:      "💊",
};


// =============================================================================
// UTILITY
// =============================================================================

/**
 * Truncates `text` to `limit` characters. If the string is longer, the
 * excess is replaced with a single "…" character so the result is still
 * readable at a glance.
 *
 * @param {string} text  - Original string.
 * @param {number} limit - Maximum allowed character count.
 * @returns {string}
 */
function truncate(text, limit) {
  return text.length > limit ? text.slice(0, limit) + "…" : text;
}


// =============================================================================
// TAB HELPERS
// =============================================================================

/**
 * Queries Chrome for the tab that is currently active in the focused window.
 * The "tabs" permission in manifest.json is required to read `tab.title`
 * and `tab.url` — without it, those properties would be undefined.
 *
 * @param {function(chrome.tabs.Tab): void} callback
 */
function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}


// =============================================================================
// PREVIEW
// =============================================================================

/**
 * Reads the active tab's title and writes a truncated version into the
 * preview box at the top of the pop-up. This lets the user confirm which
 * page they are saving before they choose a category.
 *
 * Falls back to the raw URL when the tab has no title (e.g., a blank tab).
 */
function showPreview() {
  getActiveTab((tab) => {
    const rawName    = tab.title || tab.url;
    const previewEl  = document.getElementById("preview-title");
    previewEl.textContent = truncate(rawName, MAX_TITLE_LENGTH);
  });
}


// =============================================================================
// STORAGE — READ
// =============================================================================

/**
 * Retrieves the full items array from chrome.storage.local and passes it
 * to the callback. Defaults to an empty array when nothing has been saved yet.
 *
 * chrome.storage.local survives browser restarts, unlike sessionStorage or
 * plain JS variables, which are wiped whenever the popup closes.
 *
 * @param {function(Array<{category:string, title:string, url:string}>): void} callback
 */
function getItems(callback) {
  chrome.storage.local.get({ items: [] }, (data) => {
    callback(data.items);
  });
}


// =============================================================================
// STORAGE — SAVE
// =============================================================================

/**
 * Appends a new item to the stored array and persists it.
 *
 * The callback receives the zero-based index the item was assigned inside
 * the storage array. This index is later attached to the DOM element as
 * `data-index` so the delete handler knows which slot to remove.
 *
 * @param {{ category: string, title: string, url: string }} item
 * @param {function(newIndex: number): void} callback
 */
function saveItem(item, callback) {
  getItems((items) => {
    items.push(item);
    chrome.storage.local.set({ items }, () => {
      // New item sits at the last position in the updated array
      callback(items.length - 1);
    });
  });
}


// =============================================================================
// STORAGE — DELETE
// =============================================================================

/**
 * Removes one item from the stored array by its current index, then persists
 * the shorter array so the deletion survives future popup openings.
 *
 * IMPORTANT: after any deletion, the indices of every item that followed the
 * removed one shift down by 1. Call updateIndices() on the DOM after this
 * to keep data-index attributes in sync with the storage array.
 *
 * @param {number}   index    - Zero-based position of the item to remove.
 * @param {function(): void} callback - Called once storage is updated.
 */
function deleteItem(index, callback) {
  getItems((items) => {
    // splice mutates the array in place; 1 = remove exactly one element
    items.splice(index, 1);
    chrome.storage.local.set({ items }, callback);
  });
}


// =============================================================================
// CATEGORY SECTION HELPERS
// =============================================================================

/**
 * Finds an existing category section in the DOM, or creates and inserts a
 * new one in the canonical order defined by CATEGORY_META.
 *
 * Each section looks like:
 *   <div class="category-section" data-category="Books">
 *     <h3>📚 BOOKS</h3>
 *     <ul></ul>
 *   </div>
 *
 * New sections are inserted so that the final order always matches
 * CATEGORY_META regardless of which category receives an item first.
 *
 * @param {string} category - Category name, e.g., "Books".
 * @returns {HTMLUListElement} The <ul> inside the section.
 */
function getOrCreateCategoryList(category) {
  const container = document.getElementById("categories-container");

  // Check whether a section for this category already exists
  let section = container.querySelector(
    `.category-section[data-category="${category}"]`
  );

  if (!section) {
    // Build the new section element
    section = document.createElement("div");
    section.classList.add("category-section");
    section.dataset.category = category;

    const emoji = CATEGORY_META[category] || "";
    section.innerHTML = `<h3>${emoji} ${category}</h3><ul></ul>`;

    // -----------------------------------------------------------------------
    // Insert the section in canonical order so the UI is always sorted the
    // same way (Books → Clothes → Shoes → Electronics → Pets → Health).
    //
    // Strategy: find the first existing section whose category comes AFTER
    // the new one in CATEGORY_META, then insert before it.
    // If no such section exists, simply append to the container.
    // -----------------------------------------------------------------------
    const categoryKeys = Object.keys(CATEGORY_META);
    const newCatIndex  = categoryKeys.indexOf(category);

    // Collect all existing sections with their canonical position
    const existingSections = Array.from(
      container.querySelectorAll(".category-section")
    );

    const insertBefore = existingSections.find((el) => {
      const existingIndex = categoryKeys.indexOf(el.dataset.category);
      return existingIndex > newCatIndex;
    });

    if (insertBefore) {
      container.insertBefore(section, insertBefore);
    } else {
      container.appendChild(section);
    }
  }

  // Return the <ul> inside the (possibly newly created) section
  return section.querySelector("ul");
}

/**
 * Removes a category section from the DOM when its <ul> becomes empty.
 * Called after a delete to keep the UI tidy — no blank section headings.
 *
 * @param {string} category - Category name whose section should be checked.
 */
function removeEmptyCategorySection(category) {
  const container = document.getElementById("categories-container");
  const section   = container.querySelector(
    `.category-section[data-category="${category}"]`
  );

  if (section && section.querySelector("ul").children.length === 0) {
    section.remove();
  }
}


// =============================================================================
// RENDERING
// =============================================================================

/**
 * Creates one <li> for the given item, attaches a delete handler, and
 * appends it to the correct category section (creating the section if needed).
 *
 * Each <li> stores its position in the flat storage array as `data-index`.
 * The delete handler reads this value at click time, so it always targets
 * the correct storage slot even after earlier items have been removed.
 *
 * @param {{ category: string, title: string, url: string }} item
 * @param {number} index - The item's current position in the storage array.
 */
function renderItem(item, index) {
  // Locate (or build) the <ul> for this category
  const ul = getOrCreateCategoryList(item.category);

  const li = document.createElement("li");

  // Persist the storage index on the element so the delete handler can
  // retrieve it without having to search the whole DOM.
  li.dataset.index = index;

  li.innerHTML = `
    <div class="item-content">
      <a href="${item.url}" target="_blank" title="${item.url}">${item.title}</a>
    </div>
    <button class="delete-btn" title="Delete item">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;

  // ----- Delete handler ----------------------------------------------------
  li.querySelector(".delete-btn").addEventListener("click", () => {
    // Read the index at click time (not at render time) because earlier
    // deletions in the same popup session may have shifted indices.
    const currentIndex = parseInt(li.dataset.index, 10);
    const categoryName = item.category;

    deleteItem(currentIndex, () => {
      // 1. Remove this <li> from the DOM
      li.remove();

      // 2. If the section is now empty, remove its heading too
      removeEmptyCategorySection(categoryName);

      // 3. Re-sync every remaining <li>'s data-index so future deletes
      //    in this same session target the correct storage slots.
      updateIndices();
    });
  });

  ul.appendChild(li);
}

/**
 * Re-numbers the `data-index` attribute on every <li> across ALL categories
 * sections so that each value matches the item's current position in the
 * flat storage array.
 *
 * Why this is necessary:
 *   Items are stored as a flat array, e.g., [Books#0, Clothes#1, Books#2].
 *   After deleting Books#0 the array becomes [Clothes#0, Books#1].
 *   Without re-numbering, the DOM still thinks Clothes is at index 1 and
 *   The book is at index 2 — the next delete would remove the wrong entry.
 *
 * The correct order to iterate is the document order of the <li> elements
 * across all category sections, which mirrors insertion order into storage.
 *
 * NOTE: This function queries ALL list items in document order. That order
 * must match the order items were pushed into the storage array. Because
 * new items are always appended (both in storage and in the DOM), the two
 * orders stay in sync throughout the popup's lifetime.
 */
function updateIndices() {
  const allItems = document.querySelectorAll(
    "#categories-container .category-section li"
  );
  allItems.forEach((li, i) => {
    li.dataset.index = i;
  });
}


// =============================================================================
// LOAD ON OPEN
// =============================================================================

/**
 * Fetches every saved item from storage and renders them into their
 * respective category sections. Called once when the pop-up opens.
 *
 * Items are rendered in their storage-array order (i.e,. the order they were
 * originally saved). The category sections are then sorted visually by
 * getOrCreateCategoryList() according to CATEGORY_META.
 */
function loadItems() {
  getItems((items) => {
    items.forEach((item, index) => renderItem(item, index));
  });
}


// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Bootstraps the pop-up once the HTML is fully parsed.
 *
 * Execution order:
 *   1. showPreview()  — fills the preview box with the active tab's title
 *   2. loadItems()    — renders persisted items grouped by category
 *   3. save-btn click — saves the current tab and renders it immediately
 */
document.addEventListener("DOMContentLoaded", () => {

  // Show the active tab's title so the user knows what they are about to save
  showPreview();

  // Re-populate the list from storage (persists across popup close/reopen)
  loadItems();

  // ---- Save button ---------------------------------------------------------
  document.getElementById("save-btn").addEventListener("click", () => {
    const category = document.getElementById("category").value;

    getActiveTab((tab) => {
      const item = {
        category: category,
        title:    truncate(tab.title || tab.url, MAX_TITLE_LENGTH),
        url:      tab.url,
      };

      // Persist first; render only after storage confirms the write so the
      // data-index on the new <li> matches its actual storage position.
      saveItem(item, (newIndex) => {
        renderItem(item, newIndex);
      });
    });
  });

});
