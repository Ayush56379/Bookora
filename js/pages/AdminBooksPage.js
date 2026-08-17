// Bookora - Admin Books Management
// Firebase Firestore
// ------------------------------------------------------------

import { getFirestoreInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';

let booksCache = [];
let unsubscribeBooks = null;
let searchTerm = '';
let statusFilter = 'all';


// ------------------------------------------------------------
// SECURITY
// ------------------------------------------------------------

function isAdmin() {
  const user = state.currentUser;

  return (
    state.isAdmin === true ||
    user?.role === 'admin' ||
    user?.isMasterAdmin === true ||
    String(user?.email || '').toLowerCase() ===
      MASTER_ADMIN_EMAIL
  );
}


// ------------------------------------------------------------
// HTML ESCAPE
// ------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ------------------------------------------------------------
// DATE
// ------------------------------------------------------------

function formatDate(value) {

  if (!value) {
    return '—';
  }

  try {

    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }

  } catch (error) {
    console.warn('Date formatting error:', error);
  }

  return '—';
}


// ------------------------------------------------------------
// STATUS BADGE
// ------------------------------------------------------------

function statusBadge(status) {

  const value =
    String(status || 'pending').toLowerCase();

  let background = '#fef3c7';
  let color = '#92400e';

  if (value === 'approved') {
    background = '#dcfce7';
    color = '#166534';
  }

  if (value === 'rejected') {
    background = '#fee2e2';
    color = '#991b1b';
  }

  return `
    <span style="
      display:inline-flex;
      align-items:center;
      padding:5px 10px;
      border-radius:999px;
      background:${background};
      color:${color};
      font-size:11px;
      font-weight:800;
      text-transform:uppercase;
    ">
      ${escapeHtml(value)}
    </span>
  `;
}


// ------------------------------------------------------------
// RENDER PAGE
// ------------------------------------------------------------

export function renderAdminBooksPage() {

  if (!isAdmin()) {

    return `
      <section style="
        min-height:70vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:30px;
        background:#f8fafc;
      ">

        <div style="
          max-width:500px;
          width:100%;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:20px;
          padding:40px;
          text-align:center;
        ">

          <div style="
            font-size:40px;
            margin-bottom:15px;
          ">
            🔒
          </div>

          <h2 style="
            margin:0 0 10px;
            color:#0f172a;
          ">
            Access Denied
          </h2>

          <p style="
            margin:0;
            color:#64748b;
          ">
            Administrator authorization is required.
          </p>

        </div>

      </section>
    `;
  }


  return `

    <section
      class="admin-books-page"
      style="
        min-height:100vh;
        background:#f8fafc;
        padding:32px;
      "
    >

      <div style="
        max-width:1450px;
        margin:0 auto;
      ">

        <!-- HEADER -->

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:20px;
          flex-wrap:wrap;
          margin-bottom:25px;
        ">

          <div>

            <div style="
              display:inline-flex;
              padding:7px 12px;
              border-radius:999px;
              background:#eff6ff;
              color:#2563eb;
              font-size:12px;
              font-weight:800;
              margin-bottom:10px;
            ">
              📚 BOOK MANAGEMENT
            </div>

            <h1 style="
              margin:0;
              color:#0f172a;
              font-size:32px;
              font-weight:800;
            ">
              Books
            </h1>

            <p style="
              margin:8px 0 0;
              color:#64748b;
            ">
              Review, approve and manage Bookora books.
            </p>

          </div>


          <button
            id="admin-books-refresh"
            type="button"
            style="
              border:0;
              border-radius:12px;
              padding:13px 18px;
              background:#2563eb;
              color:#fff;
              font-weight:700;
              cursor:pointer;
            "
          >
            ↻ Refresh
          </button>

        </div>


        <!-- STATS -->

        <div style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(170px,1fr));
          gap:15px;
          margin-bottom:20px;
        ">

          <div class="book-stat-card">
            <span>Total</span>
            <strong id="books-total">0</strong>
          </div>

          <div class="book-stat-card">
            <span>Pending</span>
            <strong id="books-pending">0</strong>
          </div>

          <div class="book-stat-card">
            <span>Approved</span>
            <strong id="books-approved">0</strong>
          </div>

          <div class="book-stat-card">
            <span>Rejected</span>
            <strong id="books-rejected">0</strong>
          </div>

        </div>


        <!-- FILTERS -->

        <div style="
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:18px;
          padding:18px;
          margin-bottom:20px;
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        ">

          <input
            id="admin-books-search"
            type="search"
            placeholder="Search book title..."
            style="
              flex:1;
              min-width:220px;
              padding:13px 15px;
              border:1px solid #cbd5e1;
              border-radius:11px;
              background:#f8fafc;
              color:#0f172a;
              outline:none;
            "
          >

          <select
            id="admin-books-status"
            style="
              padding:13px 15px;
              border:1px solid #cbd5e1;
              border-radius:11px;
              background:#fff;
              color:#0f172a;
            "
          >

            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </div>


        <!-- TABLE -->

        <div style="
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:18px;
          overflow:hidden;
        ">

          <div style="
            overflow-x:auto;
          ">

            <table style="
              width:100%;
              min-width:1150px;
              border-collapse:collapse;
            ">

              <thead>

                <tr style="
                  background:#f8fafc;
                  border-bottom:1px solid #e2e8f0;
                ">

                  <th class="admin-book-th">
                    BOOK
                  </th>

                  <th class="admin-book-th">
                    PRICE
                  </th>

                  <th class="admin-book-th">
                    SELLER
                  </th>

                  <th class="admin-book-th">
                    STATUS
                  </th>

                  <th class="admin-book-th">
                    FLAGS
                  </th>

                  <th class="admin-book-th">
                    CREATED
                  </th>

                  <th class="admin-book-th">
                    ACTIONS
                  </th>

                </tr>

              </thead>

              <tbody id="admin-books-list">

                <tr>

                  <td
                    colspan="7"
                    style="
                      padding:50px;
                      text-align:center;
                      color:#64748b;
                    "
                  >
                    Loading books...
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </section>


    <style>

      .book-stat-card {
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:16px;
        padding:20px;
      }

      .book-stat-card span {
        display:block;
        color:#64748b;
        font-size:13px;
        margin-bottom:8px;
      }

      .book-stat-card strong {
        display:block;
        color:#0f172a;
        font-size:28px;
        font-weight:800;
      }

      .admin-book-th {
        padding:14px 16px;
        text-align:left;
        color:#64748b;
        font-size:11px;
        font-weight:800;
        white-space:nowrap;
      }

      .admin-book-row {
        border-bottom:1px solid #f1f5f9;
      }

      .admin-book-row:hover {
        background:#f8fafc;
      }

      .admin-book-cell {
        padding:15px 16px;
        color:#334155;
        font-size:13px;
        vertical-align:middle;
      }

      .book-action {
        border:0;
        border-radius:8px;
        padding:8px 11px;
        margin:2px;
        font-size:11px;
        font-weight:700;
        cursor:pointer;
      }

      .book-approve {
        background:#dcfce7;
        color:#166534;
      }

      .book-reject {
        background:#fee2e2;
        color:#991b1b;
      }

      .book-delete {
        background:#f1f5f9;
        color:#475569;
      }

      .book-flag {
        display:inline-flex;
        margin:2px;
        padding:4px 7px;
        border-radius:6px;
        background:#f1f5f9;
        color:#64748b;
        font-size:10px;
        font-weight:700;
      }

      .book-flag.active {
        background:#dbeafe;
        color:#1d4ed8;
      }

      @media(max-width:700px) {

        .admin-books-page {
          padding:16px !important;
        }

      }

    </style>
  `;
}


// ------------------------------------------------------------
// LOAD BOOKS - REAL TIME
// ------------------------------------------------------------

async function loadBooks() {

  if (!isAdmin()) {
    throw new Error('Administrator authorization required.');
  }

  const db =
    getFirestoreInstance();

  if (!db) {
    throw new Error('Firestore is not available.');
  }


  if (unsubscribeBooks) {
    unsubscribeBooks();
    unsubscribeBooks = null;
  }


  unsubscribeBooks =
    db.collection('books')
      .onSnapshot(

        snapshot => {

          booksCache =
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

          renderBooksTable();

        },

        error => {

          console.error(
            'Books listener error:',
            error
          );

          const tbody =
            document.getElementById(
              'admin-books-list'
            );

          if (tbody) {

            tbody.innerHTML = `
              <tr>
                <td
                  colspan="7"
                  style="
                    padding:50px;
                    text-align:center;
                    color:#dc2626;
                  "
                >
                  Unable to load books.
                  <br>
                  <small>
                    Check Firestore Rules.
                  </small>
                </td>
              </tr>
            `;

          }

          Toast.show(
            'Unable to load books.',
            'error'
          );

        }
      );
}


// ------------------------------------------------------------
// FILTER + RENDER
// ------------------------------------------------------------

function renderBooksTable() {

  const tbody =
    document.getElementById(
      'admin-books-list'
    );

  if (!tbody) {
    return;
  }


  const term =
    searchTerm.trim().toLowerCase();


  let books =
    booksCache.filter(book => {

      const status =
        String(book.status || 'pending')
          .toLowerCase();

      const title =
        String(book.title || '')
          .toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter;

      const matchesSearch =
        !term ||
        title.includes(term);

      return (
        matchesStatus &&
        matchesSearch
      );

    });


  updateStats();


  if (!books.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          style="
            padding:55px;
            text-align:center;
            color:#64748b;
          "
        >
          No books found.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    books.map(book => {

      const title =
        book.title || 'Untitled Book';

      const status =
        book.status || 'pending';

      const price =
        Number(book.price || 0);


      const cover =
        book.coverUrl ||
        book.cover_url ||
        '';


      return `

        <tr
          class="admin-book-row"
          data-book-id="${escapeHtml(book.id)}"
        >

          <!-- BOOK -->

          <td class="admin-book-cell">

            <div style="
              display:flex;
              align-items:center;
              gap:12px;
              max-width:340px;
            ">

              ${
                cover
                  ? `
                    <img
                      src="${escapeHtml(cover)}"
                      alt=""
                      style="
                        width:48px;
                        height:64px;
                        object-fit:cover;
                        border-radius:7px;
                        background:#e2e8f0;
                      "
                    >
                  `
                  : `
                    <div style="
                      width:48px;
                      height:64px;
                      border-radius:7px;
                      background:#e2e8f0;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      font-size:20px;
                    ">
                      📖
                    </div>
                  `
              }

              <div>

                <div style="
                  color:#0f172a;
                  font-weight:750;
                  line-height:1.35;
                ">
                  ${escapeHtml(title)}
                </div>

                <div style="
                  color:#94a3b8;
                  font-size:11px;
                  margin-top:4px;
                ">
                  ID: ${escapeHtml(book.id)}
                </div>

              </div>

            </div>

          </td>


          <!-- PRICE -->

          <td class="admin-book-cell">

            <strong style="
              color:#0f172a;
            ">
              ₹${price.toLocaleString('en-IN')}
            </strong>

          </td>


          <!-- SELLER -->

          <td class="admin-book-cell">

            <span style="
              font-size:11px;
              color:#64748b;
              word-break:break-all;
            ">
              ${escapeHtml(
                book.sellerId ||
                book.seller_id ||
                '—'
              )}
            </span>

          </td>


          <!-- STATUS -->

          <td class="admin-book-cell">

            ${statusBadge(status)}

          </td>


          <!-- FLAGS -->

          <td class="admin-book-cell">

            ${
              book.is_trending
                ? `
                  <span class="book-flag active">
                    TRENDING
                  </span>
                `
                : ''
            }

            ${
              book.is_bestseller
                ? `
                  <span class="book-flag active">
                    BESTSELLER
                  </span>
                `
                : ''
            }

            ${
              book.is_new
                ? `
                  <span class="book-flag active">
                    NEW
                  </span>
                `
                : ''
            }

            ${
              !book.is_trending &&
              !book.is_bestseller &&
              !book.is_new
                ? `
                  <span class="book-flag">
                    —
                  </span>
                `
                : ''
            }

          </td>


          <!-- CREATED -->

          <td class="admin-book-cell">

            ${escapeHtml(
              formatDate(book.createdAt)
            )}

          </td>


          <!-- ACTIONS -->

          <td class="admin-book-cell">

            ${
              status !== 'approved'
                ? `
                  <button
                    class="
                      book-action
                      book-approve
                    "
                    data-action="approve"
                    data-id="${escapeHtml(book.id)}"
                  >
                    Approve
                  </button>
                `
                : ''
            }


            ${
              status !== 'rejected'
                ? `
                  <button
                    class="
                      book-action
                      book-reject
                    "
                    data-action="reject"
                    data-id="${escapeHtml(book.id)}"
                  >
                    Reject
                  </button>
                `
                : ''
            }


            <button
              class="
                book-action
                book-delete
              "
              data-action="delete"
              data-id="${escapeHtml(book.id)}"
            >
              Delete
            </button>


            <button
              class="
                book-action
                book-delete
              "
              data-action="trending"
              data-id="${escapeHtml(book.id)}"
            >
              ${book.is_trending ? 'Untrend' : 'Trending'}
            </button>


            <button
              class="
                book-action
                book-delete
              "
              data-action="bestseller"
              data-id="${escapeHtml(book.id)}"
            >
              ${book.is_bestseller ? 'Unbest' : 'Bestseller'}
            </button>


            <button
              class="
                book-action
                book-delete
              "
              data-action="new"
              data-id="${escapeHtml(book.id)}"
            >
              ${book.is_new ? 'Remove New' : 'New'}
            </button>

          </td>

        </tr>

      `;

    }).join('');
}


// ------------------------------------------------------------
// STATS
// ------------------------------------------------------------

function updateStats() {

  const total =
    booksCache.length;

  const pending =
    booksCache.filter(
      book => book.status === 'pending'
    ).length;

  const approved =
    booksCache.filter(
      book => book.status === 'approved'
    ).length;

  const rejected =
    booksCache.filter(
      book => book.status === 'rejected'
    ).length;


  document.getElementById(
    'books-total'
  )?.replaceChildren(
    document.createTextNode(total)
  );

  document.getElementById(
    'books-pending'
  )?.replaceChildren(
    document.createTextNode(pending)
  );

  document.getElementById(
    'books-approved'
  )?.replaceChildren(
    document.createTextNode(approved)
  );

  document.getElementById(
    'books-rejected'
  )?.replaceChildren(
    document.createTextNode(rejected)
  );
}


// ------------------------------------------------------------
// UPDATE BOOK
// ------------------------------------------------------------

async function updateBook(bookId, data) {

  if (!isAdmin()) {
    throw new Error(
      'Administrator authorization required.'
    );
  }

  const db =
    getFirestoreInstance();

  if (!db) {
    throw new Error(
      'Firestore is not available.'
    );
  }


  await db
    .collection('books')
    .doc(bookId)
    .update({
      ...data,
      updatedAt:
        window.firebase.firestore
          .FieldValue
          .serverTimestamp()
    });


  // Admin log

  try {

    await db
      .collection('adminLogs')
      .add({

        adminId:
          state.currentUser?.uid || '',

        adminEmail:
          state.currentUser?.email || '',

        action:
          data.status
            ? `book_${data.status}`
            : 'book_updated',

        targetType:
          'book',

        targetId:
          bookId,

        details:
          JSON.stringify(data),

        createdAt:
          window.firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

  } catch (logError) {

    console.warn(
      'Admin log could not be created:',
      logError
    );

  }
}


// ------------------------------------------------------------
// ACTION
// ------------------------------------------------------------

async function handleBookAction(
  action,
  bookId
) {

  const book =
    booksCache.find(
      item => item.id === bookId
    );

  if (!book) {
    throw new Error(
      'Book not found.'
    );
  }


  if (action === 'approve') {

    if (
      !window.confirm(
        `Approve "${book.title || 'this book'}"?`
      )
    ) {
      return;
    }

    await updateBook(
      bookId,
      {
        status: 'approved'
      }
    );

    Toast.show(
      'Book approved successfully.',
      'success'
    );

    return;
  }


  if (action === 'reject') {

    if (
      !window.confirm(
        `Reject "${book.title || 'this book'}"?`
      )
    ) {
      return;
    }

    await updateBook(
      bookId,
      {
        status: 'rejected'
      }
    );

    Toast.show(
      'Book rejected.',
      'info'
    );

    return;
  }


  if (action === 'delete') {

    if (
      !window.confirm(
        `Permanently delete "${book.title || 'this book'}"?`
      )
    ) {
      return;
    }

    const db =
      getFirestoreInstance();

    await db
      .collection('books')
      .doc(bookId)
      .delete();


    try {

      await db
        .collection('adminLogs')
        .add({

          adminId:
            state.currentUser?.uid || '',

          adminEmail:
            state.currentUser?.email || '',

          action:
            'book_deleted',

          targetType:
            'book',

          targetId:
            bookId,

          details:
            book.title || '',

          createdAt:
            window.firebase.firestore
              .FieldValue
              .serverTimestamp()

        });

    } catch (error) {

      console.warn(
        'Delete log failed:',
        error
      );

    }


    Toast.show(
      'Book deleted.',
      'success'
    );

    return;
  }


  if (action === 'trending') {

    await updateBook(
      bookId,
      {
        is_trending:
          !Boolean(book.is_trending)
      }
    );

    Toast.show(
      book.is_trending
        ? 'Removed from trending.'
        : 'Added to trending.',
      'success'
    );

    return;
  }


  if (action === 'bestseller') {

    await updateBook(
      bookId,
      {
        is_bestseller:
          !Boolean(book.is_bestseller)
      }
    );

    Toast.show(
      book.is_bestseller
        ? 'Removed from bestseller.'
        : 'Added to bestseller.',
      'success'
    );

    return;
  }


  if (action === 'new') {

    await updateBook(
      bookId,
      {
        is_new:
          !Boolean(book.is_new)
      }
    );

    Toast.show(
      book.is_new
        ? 'Removed from New Releases.'
        : 'Added to New Releases.',
      'success'
    );
  }
}


// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------

export function initAdminBooksEvents() {

  if (!isAdmin()) {
    return;
  }


  const search =
    document.getElementById(
      'admin-books-search'
    );

  if (search) {

    search.addEventListener(
      'input',
      event => {

        searchTerm =
          event.target.value || '';

        renderBooksTable();

      }
    );

  }


  const status =
    document.getElementById(
      'admin-books-status'
    );

  if (status) {

    status.addEventListener(
      'change',
      event => {

        statusFilter =
          event.target.value || 'all';

        renderBooksTable();

      }
    );

  }


  const refresh =
    document.getElementById(
      'admin-books-refresh'
    );

  if (refresh) {

    refresh.addEventListener(
      'click',
      async () => {

        refresh.disabled = true;

        refresh.textContent =
          'Refreshing...';

        try {

          await loadBooks();

          Toast.show(
            'Books refreshed.',
            'success'
          );

        } catch (error) {

          console.error(error);

          Toast.show(
            error.message ||
            'Unable to refresh books.',
            'error'
          );

        } finally {

          refresh.disabled = false;

          refresh.textContent =
            '↻ Refresh';

        }

      }
    );

  }


  document.addEventListener(
    'click',
    async event => {

      const button =
        event.target.closest(
          '[data-action]'
        );

      if (!button) {
        return;
      }


      const action =
        button.dataset.action;

      const bookId =
        button.dataset.id;


      if (!bookId) {
        return;
      }


      button.disabled = true;

      const oldText =
        button.textContent;

      button.textContent =
        '...';


      try {

        await handleBookAction(
          action,
          bookId
        );

      } catch (error) {

        console.error(
          'Book action error:',
          error
        );

        Toast.show(
          error.message ||
          'Book action failed.',
          'error'
        );

      } finally {

        button.disabled = false;

        button.textContent =
          oldText;

      }

    }
  );


  loadBooks();
}


// ------------------------------------------------------------
// CLEANUP
// ------------------------------------------------------------

export function destroyAdminBooksPage() {

  if (unsubscribeBooks) {

    unsubscribeBooks();

    unsubscribeBooks = null;
  }

  booksCache = [];
  searchTerm = '';
  statusFilter = 'all';
}
