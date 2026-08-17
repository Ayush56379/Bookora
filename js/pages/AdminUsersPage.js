// Bookora - Admin Users Management
// Firebase Authentication + Firestore
// ------------------------------------------------------------

import {
  getAuthInstance,
  getFirestoreInstance
} from '../services/firebase.js';

import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';

let unsubscribeUsers = null;
let usersCache = [];
let searchTerm = '';


// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function formatDate(value) {

  if (!value) {
    return '—';
  }

  try {

    if (value.toDate) {
      return value.toDate().toLocaleString();
    }

    const date = new Date(value);

    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }

  } catch (error) {
    console.warn('Date format error:', error);
  }

  return '—';
}


function getInitials(name, email) {

  const source =
    name ||
    email ||
    'U';

  return source
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}


function isMasterAdmin(user) {

  return (
    user?.isMasterAdmin === true ||
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL
  );
}


function isCurrentAdmin() {

  const current = state.currentUser;

  return (
    state.isAdmin === true ||
    current?.role === 'admin' ||
    current?.isMasterAdmin === true ||
    current?.email?.toLowerCase() === MASTER_ADMIN_EMAIL
  );
}


// ------------------------------------------------------------
// Render Page
// ------------------------------------------------------------

export function renderAdminUsersPage() {

  if (!isCurrentAdmin()) {

    return `
      <section style="
        min-height:70vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:40px;
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
          box-shadow:0 10px 30px rgba(15,23,42,.08);
        ">

          <div style="
            width:60px;
            height:60px;
            margin:0 auto 20px;
            border-radius:16px;
            background:#fee2e2;
            color:#dc2626;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:28px;
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
            line-height:1.6;
          ">
            Administrator authorization is required.
          </p>

        </div>

      </section>
    `;
  }


  return `

    <section class="admin-users-page"
      style="
        min-height:100vh;
        background:#f8fafc;
        padding:32px;
      ">

      <div style="
        max-width:1400px;
        margin:0 auto;
      ">

        <!-- HEADER -->

        <div style="
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:20px;
          flex-wrap:wrap;
          margin-bottom:28px;
        ">

          <div>

            <div style="
              display:inline-flex;
              align-items:center;
              gap:8px;
              padding:7px 12px;
              border-radius:999px;
              background:#eff6ff;
              color:#2563eb;
              font-size:13px;
              font-weight:700;
              margin-bottom:12px;
            ">
              🛡️ ADMIN USER MANAGEMENT
            </div>

            <h1 style="
              margin:0;
              font-size:32px;
              font-weight:800;
              color:#0f172a;
            ">
              Users
            </h1>

            <p style="
              margin:8px 0 0;
              color:#64748b;
            ">
              Manage Bookora users, roles and account status.
            </p>

          </div>


          <button
            id="admin-users-refresh"
            type="button"
            style="
              border:0;
              border-radius:12px;
              background:#2563eb;
              color:white;
              padding:13px 18px;
              font-weight:700;
              cursor:pointer;
              box-shadow:0 8px 20px rgba(37,99,235,.20);
            "
          >
            ↻ Refresh Users
          </button>

        </div>


        <!-- STATS -->

        <div style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(180px,1fr));
          gap:16px;
          margin-bottom:24px;
        ">

          <div class="user-stat-card">
            <span>Total Users</span>
            <strong id="users-total">0</strong>
          </div>

          <div class="user-stat-card">
            <span>Active</span>
            <strong id="users-active">0</strong>
          </div>

          <div class="user-stat-card">
            <span>Sellers</span>
            <strong id="users-sellers">0</strong>
          </div>

          <div class="user-stat-card">
            <span>Admins</span>
            <strong id="users-admins">0</strong>
          </div>

        </div>


        <!-- SEARCH -->

        <div style="
          background:white;
          border:1px solid #e2e8f0;
          border-radius:18px;
          padding:18px;
          margin-bottom:20px;
        ">

          <input
            id="admin-users-search"
            type="search"
            placeholder="Search by name or email..."
            autocomplete="off"
            style="
              width:100%;
              box-sizing:border-box;
              padding:14px 16px;
              border:1px solid #cbd5e1;
              border-radius:12px;
              outline:none;
              font-size:15px;
              color:#0f172a;
              background:#f8fafc;
            "
          >

        </div>


        <!-- TABLE -->

        <div style="
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 5px 20px rgba(15,23,42,.04);
        ">

          <div style="
            overflow-x:auto;
          ">

            <table style="
              width:100%;
              border-collapse:collapse;
              min-width:900px;
            ">

              <thead>

                <tr style="
                  background:#f8fafc;
                  border-bottom:1px solid #e2e8f0;
                ">

                  <th class="admin-user-th">USER</th>
                  <th class="admin-user-th">EMAIL</th>
                  <th class="admin-user-th">ROLE</th>
                  <th class="admin-user-th">STATUS</th>
                  <th class="admin-user-th">SELLER</th>
                  <th class="admin-user-th">CREATED</th>
                  <th class="admin-user-th">ACTION</th>

                </tr>

              </thead>

              <tbody id="admin-users-list">

                <tr>

                  <td
                    colspan="7"
                    style="
                      text-align:center;
                      padding:50px;
                      color:#64748b;
                    "
                  >
                    Loading users...
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </section>

    <style>

      .admin-user-th {
        text-align:left;
        padding:14px 16px;
        font-size:11px;
        letter-spacing:.05em;
        color:#64748b;
        font-weight:800;
        white-space:nowrap;
      }

      .user-stat-card {
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:16px;
        padding:20px;
        box-shadow:0 5px 20px rgba(15,23,42,.04);
      }

      .user-stat-card span {
        display:block;
        color:#64748b;
        font-size:13px;
        font-weight:600;
        margin-bottom:8px;
      }

      .user-stat-card strong {
        display:block;
        color:#0f172a;
        font-size:28px;
        font-weight:800;
      }

      .admin-user-row {
        border-bottom:1px solid #f1f5f9;
      }

      .admin-user-row:hover {
        background:#f8fafc;
      }

      .admin-user-cell {
        padding:15px 16px;
        color:#334155;
        font-size:14px;
        vertical-align:middle;
      }

      .admin-user-select {
        border:1px solid #cbd5e1;
        background:white;
        border-radius:9px;
        padding:8px 10px;
        color:#0f172a;
        font-size:13px;
        outline:none;
      }

      .admin-user-status {
        border-radius:999px;
        padding:5px 9px;
        font-size:11px;
        font-weight:800;
        display:inline-block;
      }

      .status-active {
        background:#dcfce7;
        color:#15803d;
      }

      .status-suspended {
        background:#fee2e2;
        color:#b91c1c;
      }

      .status-pending {
        background:#fef3c7;
        color:#a16207;
      }

      .status-default {
        background:#e2e8f0;
        color:#475569;
      }

      .admin-user-action {
        border:0;
        border-radius:9px;
        padding:8px 12px;
        background:#eff6ff;
        color:#2563eb;
        font-weight:700;
        cursor:pointer;
      }

      .admin-user-action:hover {
        background:#dbeafe;
      }

      .master-badge {
        display:inline-flex;
        align-items:center;
        gap:4px;
        padding:5px 8px;
        border-radius:999px;
        background:#ede9fe;
        color:#6d28d9;
        font-size:10px;
        font-weight:800;
      }

      @media(max-width:700px) {

        .admin-users-page {
          padding:16px !important;
        }

        .admin-users-page h1 {
          font-size:26px !important;
        }

      }

    </style>
  `;
}


// ------------------------------------------------------------
// Load Users
// ------------------------------------------------------------

async function loadUsers() {

  const db = getFirestoreInstance();

  if (!db) {
    throw new Error('Firestore is not available.');
  }

  if (!isCurrentAdmin()) {
    throw new Error('Administrator authorization required.');
  }


  const tbody =
    document.getElementById('admin-users-list');

  if (tbody) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          style="
            text-align:center;
            padding:50px;
            color:#64748b;
          "
        >
          Loading users...
        </td>
      </tr>
    `;
  }


  try {

    /*
      Real-time Firestore listener.

      This means when a user registers,
      the Admin Users page updates automatically.
    */

    if (unsubscribeUsers) {
      unsubscribeUsers();
      unsubscribeUsers = null;
    }


    unsubscribeUsers =
      db.collection('users')
        .onSnapshot(

          snapshot => {

            usersCache =
              snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));

            renderUsersTable();

          },

          error => {

            console.error(
              'Users listener error:',
              error
            );

            if (tbody) {

              tbody.innerHTML = `
                <tr>
                  <td
                    colspan="7"
                    style="
                      text-align:center;
                      padding:50px;
                      color:#dc2626;
                    "
                  >
                    Unable to load users.
                    <br>
                    <small>
                      Check Firestore security rules.
                    </small>
                  </td>
                </tr>
              `;

            }

            Toast.show(
              'Unable to load users.',
              'error'
            );

          }
        );

  } catch (error) {

    console.error(
      'Load users error:',
      error
    );

    Toast.show(
      error.message ||
      'Failed to load users.',
      'error'
    );

  }

}


// ------------------------------------------------------------
// Render Users
// ------------------------------------------------------------

function renderUsersTable() {

  const tbody =
    document.getElementById('admin-users-list');

  if (!tbody) {
    return;
  }


  const term =
    searchTerm.trim().toLowerCase();


  let users =
    usersCache.filter(user => {

      if (!term) {
        return true;
      }

      const name =
        String(user.name || '').toLowerCase();

      const email =
        String(user.email || '').toLowerCase();

      return (
        name.includes(term) ||
        email.includes(term)
      );

    });


  users.sort((a, b) => {

    const aName =
      String(a.name || a.email || '');

    const bName =
      String(b.name || b.email || '');

    return aName.localeCompare(bName);

  });


  updateStats(usersCache);


  if (!users.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          style="
            text-align:center;
            padding:55px;
            color:#64748b;
          "
        >
          No users found.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    users.map(user => {

      const master =
        isMasterAdmin(user);

      const status =
        user.status || 'active';

      const role =
        user.role || 'buyer';

      const sellerStatus =
        user.seller_status || 'none';


      const statusClass =
        status === 'active'
          ? 'status-active'
          : status === 'suspended'
            ? 'status-suspended'
            : status === 'pending'
              ? 'status-pending'
              : 'status-default';


      return `

        <tr
          class="admin-user-row"
          data-user-id="${escapeHtml(user.id)}"
        >

          <!-- USER -->

          <td class="admin-user-cell">

            <div style="
              display:flex;
              align-items:center;
              gap:11px;
            ">

              <div style="
                width:38px;
                height:38px;
                flex:0 0 38px;
                border-radius:50%;
                background:#dbeafe;
                color:#2563eb;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:800;
                font-size:12px;
              ">
                ${escapeHtml(
                  getInitials(
                    user.name,
                    user.email
                  )
                )}
              </div>

              <div>

                <div style="
                  font-weight:750;
                  color:#0f172a;
                ">
                  ${escapeHtml(
                    user.name ||
                    'Bookora User'
                  )}
                </div>

                ${
                  master
                    ? `
                      <span class="master-badge">
                        👑 MASTER ADMIN
                      </span>
                    `
                    : ''
                }

              </div>

            </div>

          </td>


          <!-- EMAIL -->

          <td class="admin-user-cell">

            ${escapeHtml(
              user.email || '—'
            )}

          </td>


          <!-- ROLE -->

          <td class="admin-user-cell">

            ${
              master
                ? `
                  <span class="master-badge">
                    ADMIN
                  </span>
                `
                : `
                  <select
                    class="admin-user-select user-role-select"
                    data-id="${escapeHtml(user.id)}"
                    data-old="${escapeHtml(role)}"
                  >

                    <option
                      value="buyer"
                      ${role === 'buyer' ? 'selected' : ''}
                    >
                      Buyer
                    </option>

                    <option
                      value="creator"
                      ${role === 'creator' ? 'selected' : ''}
                    >
                      Creator
                    </option>

                    <option
                      value="seller"
                      ${role === 'seller' ? 'selected' : ''}
                    >
                      Seller
                    </option>

                    <option
                      value="admin"
                      ${role === 'admin' ? 'selected' : ''}
                    >
                      Admin
                    </option>

                  </select>
                `
            }

          </td>


          <!-- STATUS -->

          <td class="admin-user-cell">

            ${
              master
                ? `
                  <span class="
                    admin-user-status
                    status-active
                  ">
                    ACTIVE
                  </span>
                `
                : `
                  <select
                    class="admin-user-select user-status-select"
                    data-id="${escapeHtml(user.id)}"
                    data-old="${escapeHtml(status)}"
                  >

                    <option
                      value="active"
                      ${status === 'active' ? 'selected' : ''}
                    >
                      Active
                    </option>

                    <option
                      value="suspended"
                      ${status === 'suspended' ? 'selected' : ''}
                    >
                      Suspended
                    </option>

                    <option
                      value="pending"
                      ${status === 'pending' ? 'selected' : ''}
                    >
                      Pending
                    </option>

                  </select>
                `
            }

          </td>


          <!-- SELLER -->

          <td class="admin-user-cell">

            <span style="
              font-size:12px;
              font-weight:700;
              color:${
                sellerStatus === 'approved'
                  ? '#15803d'
                  : '#64748b'
              };
            ">

              ${escapeHtml(
                sellerStatus
              )}

            </span>

          </td>


          <!-- CREATED -->

          <td class="admin-user-cell">

            ${escapeHtml(
              formatDate(
                user.createdAt
              )
            )}

          </td>


          <!-- ACTION -->

          <td class="admin-user-cell">

            ${
              master
                ? `
                  <span style="
                    color:#64748b;
                    font-size:12px;
                  ">
                    Protected
                  </span>
                `
                : `
                  <button
                    type="button"
                    class="admin-user-action user-save-btn"
                    data-id="${escapeHtml(user.id)}"
                  >
                    Save
                  </button>
                `
            }

          </td>

        </tr>

      `;

    }).join('');

}


// ------------------------------------------------------------
// Stats
// ------------------------------------------------------------

function updateStats(users) {

  const total =
    users.length;

  const active =
    users.filter(
      user =>
        (user.status || 'active') ===
        'active'
    ).length;

  const sellers =
    users.filter(
      user =>
        user.seller_status ===
        'approved' ||
        user.role === 'seller' ||
        user.role === 'creator'
    ).length;

  const admins =
    users.filter(
      user =>
        user.role === 'admin' ||
        user.isMasterAdmin === true
    ).length;


  const totalEl =
    document.getElementById(
      'users-total'
    );

  const activeEl =
    document.getElementById(
      'users-active'
    );

  const sellersEl =
    document.getElementById(
      'users-sellers'
    );

  const adminsEl =
    document.getElementById(
      'users-admins'
    );


  if (totalEl) {
    totalEl.textContent = total;
  }

  if (activeEl) {
    activeEl.textContent = active;
  }

  if (sellersEl) {
    sellersEl.textContent = sellers;
  }

  if (adminsEl) {
    adminsEl.textContent = admins;
  }

}


// ------------------------------------------------------------
// Update User
// ------------------------------------------------------------

async function updateUser(userId) {

  const db =
    getFirestoreInstance();

  if (!db) {
    throw new Error(
      'Firestore is not available.'
    );
  }


  const user =
    usersCache.find(
      item => item.id === userId
    );


  if (!user) {
    throw new Error(
      'User not found.'
    );
  }


  if (isMasterAdmin(user)) {

    Toast.show(
      'Master Admin account is protected.',
      'warning'
    );

    return;
  }


  const roleSelect =
    document.querySelector(
      `.user-role-select[data-id="${CSS.escape(userId)}"]`
    );

  const statusSelect =
    document.querySelector(
      `.user-status-select[data-id="${CSS.escape(userId)}"]`
    );


  const role =
    roleSelect?.value ||
    user.role ||
    'buyer';

  const status =
    statusSelect?.value ||
    user.status ||
    'active';


  const confirmation =
    window.confirm(
      `Update ${user.name || user.email}?\n\nRole: ${role}\nStatus: ${status}`
    );


  if (!confirmation) {
    return;
  }


  await db
    .collection('users')
    .doc(userId)
    .set(
      {
        role,
        status,
        updatedAt:
          window.firebase.firestore
            .FieldValue
            .serverTimestamp()
      },
      {
        merge:true
      }
    );


  Toast.show(
    'User updated successfully.',
    'success'
  );

}


// ------------------------------------------------------------
// Events
// ------------------------------------------------------------

export function initAdminUsersEvents() {

  if (!isCurrentAdmin()) {
    return;
  }


  const search =
    document.getElementById(
      'admin-users-search'
    );


  if (search) {

    search.addEventListener(
      'input',
      event => {

        searchTerm =
          event.target.value || '';

        renderUsersTable();

      }
    );

  }


  const refresh =
    document.getElementById(
      'admin-users-refresh'
    );


  if (refresh) {

    refresh.addEventListener(
      'click',
      async () => {

        refresh.disabled = true;

        refresh.textContent =
          'Refreshing...';

        try {

          await loadUsers();

          Toast.show(
            'Users refreshed.',
            'success'
          );

        } catch (error) {

          console.error(error);

          Toast.show(
            error.message ||
            'Refresh failed.',
            'error'
          );

        } finally {

          refresh.disabled = false;

          refresh.textContent =
            '↻ Refresh Users';

        }

      }
    );

  }


  document.addEventListener(
    'click',
    async event => {

      const button =
        event.target.closest(
          '.user-save-btn'
        );

      if (!button) {
        return;
      }


      const userId =
        button.dataset.id;

      if (!userId) {
        return;
      }


      button.disabled = true;

      button.textContent =
        'Saving...';


      try {

        await updateUser(
          userId
        );

      } catch (error) {

        console.error(
          'User update error:',
          error
        );

        Toast.show(
          error.message ||
          'Unable to update user.',
          'error'
        );

      } finally {

        button.disabled = false;

        button.textContent =
          'Save';

      }

    }
  );


  loadUsers();

}


// ------------------------------------------------------------
// Cleanup
// ------------------------------------------------------------

export function destroyAdminUsersPage() {

  if (unsubscribeUsers) {

    unsubscribeUsers();

    unsubscribeUsers =
      null;

  }

  usersCache = [];
  searchTerm = '';

}
