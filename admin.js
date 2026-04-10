/* ============================================
   CAMVIC HOUSE — admin.js con Firebase
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── REEMPLAZA CON TU FIREBASE CONFIG ──
const firebaseConfig = {
  apiKey: "AIzaSyB_w8t-QOspWpSD4AuMnsW7CMcrxtoWZ7Q",
  authDomain: "tiendaonline-503a4.firebaseapp.com",
  projectId: "tiendaonline-503a4",
  storageBucket: "tiendaonline-503a4.firebasestorage.app",
  messagingSenderId: "695687655721",
  appId: "1:695687655721:web:f51d937d8534295b434738"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const DEFAULT_ADMIN = { user: 'admin', pass: 'Admin2026A**' };
let adminProducts = [];
let currentCreds = { ...DEFAULT_ADMIN };

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar credenciales desde Firebase (fuente de verdad global)
  await loadCredsFromFirebase();
  if (localStorage.getItem('cv_admin_session') === 'active') showAdminPanel();
});

async function loadCredsFromFirebase() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'adminCreds'));
    if (snap.exists()) {
      currentCreds = snap.data();
    } else {
      // Primera vez: guardar las credenciales por defecto en Firebase
      await setDoc(doc(db, 'settings', 'adminCreds'), DEFAULT_ADMIN);
      currentCreds = { ...DEFAULT_ADMIN };
    }
  } catch(e) {
    // Sin conexión: usar default
    currentCreds = { ...DEFAULT_ADMIN };
  }
}

// ── LOGIN ──
window.adminLogin = async function() {
  const user = document.getElementById('adm-user').value.trim();
  const pass = document.getElementById('adm-pass').value;
  // Recargar credenciales frescas de Firebase antes de validar
  await loadCredsFromFirebase();
  if (user === currentCreds.user && pass === currentCreds.pass) {
    localStorage.setItem('cv_admin_session', 'active'); showAdminPanel();
  } else { showToast('Credenciales incorrectas', 'error'); }
};

window.adminLogout = function() {
  localStorage.removeItem('cv_admin_session');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-login-screen').style.display = 'flex';
  showToast('Sesión cerrada', 'info');
};

async function showAdminPanel() {
  document.getElementById('admin-login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'grid';
  await loadAdminProducts();
  renderDashboard(); renderAdminProducts(); renderOrders(); renderUsers(); loadSettingsForm();
}

// ── PRODUCTOS ──
async function loadAdminProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    adminProducts = [];
    snapshot.forEach(d => adminProducts.push({ id: d.id, ...d.data() }));
  } catch(e) { showToast('Error conectando Firebase', 'error'); }
}

window.adminTab = function(name, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => { t.style.display = 'none'; t.classList.remove('active'); });
  document.querySelectorAll('.snav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.abn-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(`tab-${name}`);
  if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
  if (btn) btn.classList.add('active');
  // Sync bottom nav
  document.querySelectorAll(`.abn-btn`).forEach(b => { if(b.getAttribute('onclick')?.includes(`'${name}'`)) b.classList.add('active'); });
  const titles = { dashboard:'Dashboard', products:'Menú / Productos', orders:'Pedidos', users:'Usuarios', settings:'Ajustes' };
  const el = document.getElementById('admin-page-title');
  if (el) el.textContent = titles[name] || name;
};

window.adminTabMobile = function(name, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => { t.style.display = 'none'; t.classList.remove('active'); });
  document.querySelectorAll('.snav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.abn-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(`tab-${name}`);
  if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
  if (btn) btn.classList.add('active');
  // Sync sidebar
  document.querySelectorAll(`.snav-btn`).forEach(b => { if(b.getAttribute('onclick')?.includes(`'${name}'`)) b.classList.add('active'); });
  const titles = { dashboard:'Dashboard', products:'Menú / Productos', orders:'Pedidos', users:'Usuarios', settings:'Ajustes' };
  const el = document.getElementById('admin-page-title');
  if (el) el.textContent = titles[name] || name;
  // Scroll to top on mobile
  window.scrollTo({top:0, behavior:'smooth'});
};

function renderDashboard() {
  document.getElementById('stat-products').textContent = adminProducts.length;
  const orders  = JSON.parse(localStorage.getItem('cv_orders') || '[]');
  const users   = JSON.parse(localStorage.getItem('cv_users')  || '[]');
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById('stat-orders').textContent  = orders.length;
  document.getElementById('stat-users').textContent   = users.length;
  document.getElementById('stat-revenue').textContent = '$' + Number(revenue).toLocaleString('es-CO');
  const lowStock = adminProducts.filter(p => p.showStock && p.stock <= 5);
  const el = document.getElementById('low-stock-list');
  if (el) el.innerHTML = lowStock.length === 0
    ? '<p style="color:var(--gray);font-size:.88rem;">✅ Todo disponible</p>'
    : lowStock.map(p => `<div class="low-stock-item"><span>${p.name}</span><span class="stock-badge">${p.stock === 0 ? 'AGOTADO' : `${p.stock} restantes`}</span></div>`).join('');
}

function renderAdminProducts() {
  const query    = document.getElementById('admin-search')?.value.toLowerCase() || '';
  const filtered = adminProducts.filter(p => p.name.toLowerCase().includes(query));
  const list     = document.getElementById('admin-products-list');
  if (!list) return;
  if (filtered.length === 0) { list.innerHTML = '<p style="color:var(--gray);">No se encontraron productos.</p>'; return; }
  list.innerHTML = filtered.map(p => `
    <div class="admin-product-card">
      <img class="admin-prod-img" src="${p.img||''}" alt="${p.name}" onerror="this.src=''" />
      <div class="admin-prod-info">
        <h4>${p.name}</h4>
        <p>${p.category}${p.showStock ? ` • Stock: ${p.stock}` : ''}</p>
        <p class="ap-price">$${Number(p.price).toLocaleString('es-CO')}</p>
        <div class="admin-prod-actions">
          <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>`).join('');
}
window.renderAdminProducts = renderAdminProducts;

window.openProductForm = function(id = null) {
  const titleEl = document.getElementById('product-form-title');
  if (titleEl) titleEl.innerHTML = id ? '<i class="fas fa-edit"></i> Editar producto' : '<i class="fas fa-utensils"></i> Agregar producto';
  ['pf-id','pf-name','pf-price','pf-oldprice','pf-stock','pf-desc','pf-imgurl'].forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
  document.getElementById('pf-category').value = '';
  document.getElementById('pf-featured').checked = false;
  document.getElementById('pf-show-stock').checked = false;
  document.getElementById('pf-show-agotado').checked = true;
  const preview = document.getElementById('pf-img-preview');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }

  if (id) {
    const p = adminProducts.find(x => x.id === id);
    if (p) {
      document.getElementById('pf-id').value       = p.id;
      document.getElementById('pf-name').value     = p.name;
      document.getElementById('pf-category').value = p.category;
      document.getElementById('pf-price').value    = p.price;
      document.getElementById('pf-oldprice').value = p.oldPrice || '';
      document.getElementById('pf-stock').value    = p.stock || '';
      document.getElementById('pf-desc').value     = p.desc || '';
      document.getElementById('pf-featured').checked     = !!p.featured;
      document.getElementById('pf-show-stock').checked   = !!p.showStock;
      document.getElementById('pf-show-agotado').checked = p.showAgotado !== false;
      if (p.img) { document.getElementById('pf-imgurl').value = p.img; if (preview) { preview.src = p.img; preview.style.display = 'block'; } }
    }
  }
  openAdminModal('product-form-modal');
};

window.editProduct = id => window.openProductForm(id);

window.saveProduct = async function(e) {
  e.preventDefault();
  const id          = document.getElementById('pf-id').value;
  const name        = document.getElementById('pf-name').value.trim();
  const category    = document.getElementById('pf-category').value;
  const price       = parseFloat(document.getElementById('pf-price').value);
  const oldPrice    = parseFloat(document.getElementById('pf-oldprice').value) || 0;
  const showStock   = document.getElementById('pf-show-stock').checked;
  const showAgotado = document.getElementById('pf-show-agotado').checked;
  const stockVal    = document.getElementById('pf-stock').value;
  const stock       = showStock ? (parseInt(stockVal) || 0) : (stockVal ? parseInt(stockVal) : 999);
  const desc        = document.getElementById('pf-desc').value.trim();
  const img         = document.getElementById('pf-imgurl').value.trim();
  const featured    = document.getElementById('pf-featured').checked;

  const productId   = id || 'p' + Date.now();
  const productData = { name, category, price, oldPrice, stock, desc, img, featured, showStock, showAgotado };

  try {
    showToast('Guardando producto...', 'info');
    await setDoc(doc(db, 'products', productId), productData);
    await loadAdminProducts(); renderAdminProducts(); renderDashboard(); closeProductForm();
    showToast(id ? '✅ Producto actualizado — visible para todos' : '✅ Producto agregado — visible para todos', 'success');
  } catch(e) { showToast('Error guardando el producto', 'error'); }
};

window.deleteProduct = async function(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    await loadAdminProducts(); renderAdminProducts(); renderDashboard();
    showToast('Producto eliminado', 'info');
  } catch(e) { showToast('Error eliminando', 'error'); }
};


// ── IMGBB UPLOAD ──
const IMGBB_API_KEY = '5b8f761d3197f50a909ebe8d224dada7';

window.uploadImageImgBB = async function(inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  const btn = document.getElementById('imgbb-upload-btn');
  const progress = document.getElementById('imgbb-progress');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...'; }
  if (progress) progress.style.display = 'block';
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      const url = data.data.url;
      document.getElementById('pf-imgurl').value = url;
      window.previewImgUrl(url);
      showToast('✅ Imagen subida correctamente', 'success');
    } else {
      showToast('Error al subir imagen: ' + (data.error?.message || 'desconocido'), 'error');
    }
  } catch(e) {
    showToast('Error de conexión con ImgBB', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload"></i> Subir foto'; }
    if (progress) progress.style.display = 'none';
    inputEl.value = '';
  }
};

window.uploadLogoImgBB = async function(inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  const btn = document.getElementById('imgbb-logo-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...'; }
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      const url = data.data.url;
      document.getElementById('s-logourl').value = url;
      window.previewLogoUrl(url);
      showToast('✅ Logo listo, haz clic en Guardar Logo', 'success');
    } else {
      showToast('Error al subir logo: ' + (data.error?.message || 'desconocido'), 'error');
    }
  } catch(e) {
    showToast('Error de conexión con ImgBB', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload"></i> Subir logo'; }
    inputEl.value = '';
  }
};

window.previewImgUrl = function(url) {
  const preview = document.getElementById('pf-img-preview');
  if (!preview) return;
  if (url) { preview.src = url; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
};

window.closeProductForm = function(e) { if (!e || e.target.id === 'product-form-modal') closeAdminModal('product-form-modal'); };

// ── PEDIDOS ──
function renderOrders() {
  const orders = JSON.parse(localStorage.getItem('cv_orders') || '[]');
  const list   = document.getElementById('orders-list');
  if (!list) return;
  list.innerHTML = orders.length === 0
    ? '<div class="order-card"><p style="color:var(--gray);">No hay pedidos registrados aún.</p></div>'
    : orders.map(o => `
        <div class="order-card">
          <div>
            <h4>🛵 ${o.name}</h4>
            <p>📍 ${o.address}, ${o.city}${o.reference ? ` — Ref: ${o.reference}` : ''}</p>
            <p>📞 ${o.phone} ${o.email ? '• 📧 ' + o.email : ''}</p>
            <p>💳 Pago: ${o.pago || 'No especificado'}</p>
            <p style="font-size:.78rem;color:var(--gray);margin-top:4px;">${new Date(o.date).toLocaleString('es-CO')}</p>
            <div style="margin-top:8px;font-size:.82rem;">${(o.items||[]).map(i => `<div>• ${i.name} x${i.qty}${i.notes ? ` (${i.notes})` : ''}</div>`).join('')}</div>
            ${o.notes ? `<p style="font-size:.82rem;margin-top:4px;color:var(--primary);">📝 ${o.notes}</p>` : ''}
          </div>
          <div class="order-total">$${Number(o.total||0).toLocaleString('es-CO')}</div>
        </div>`).join('');
}

// ── USUARIOS ──
function renderUsers() {
  const users = JSON.parse(localStorage.getItem('cv_users') || '[]');
  const list  = document.getElementById('users-list');
  if (!list) return;
  list.innerHTML = users.length === 0
    ? '<div class="user-card"><p style="color:var(--gray);">No hay usuarios registrados.</p></div>'
    : users.map(u => `
        <div class="user-card">
          <div><h4><i class="fas fa-user" style="color:var(--primary)"></i> ${u.name}</h4><p>@${u.username} • ${u.email}</p></div>
          <button class="btn-delete" onclick="deleteUser('${u.id}')"><i class="fas fa-user-times"></i></button>
        </div>`).join('');
}

window.deleteUser = function(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  let users = JSON.parse(localStorage.getItem('cv_users') || '[]');
  users = users.filter(u => u.id !== id); localStorage.setItem('cv_users', JSON.stringify(users));
  renderUsers(); showToast('Usuario eliminado', 'info');
};

// ── AJUSTES ──
async function loadSettingsForm() {
  const info = JSON.parse(localStorage.getItem('cv_store_info') || '{}');
  try {
    const logoSnap = await getDoc(doc(db, 'settings', 'logo'));
    const logoUrl  = logoSnap.exists() ? (logoSnap.data().url || '') : '';
    if (document.getElementById('s-logourl')) document.getElementById('s-logourl').value = logoUrl;
  } catch(e) {
    if (document.getElementById('s-logourl')) document.getElementById('s-logourl').value = localStorage.getItem('cv_logo') || '';
  }
  try {
    const socSnap = await getDoc(doc(db, 'settings', 'socials'));
    const socials = socSnap.exists() ? socSnap.data() : JSON.parse(localStorage.getItem('cv_socials') || '{}');
    if (document.getElementById('s-facebook'))  document.getElementById('s-facebook').value  = socials.facebook  || '';
    if (document.getElementById('s-instagram')) document.getElementById('s-instagram').value = socials.instagram || '';
    if (document.getElementById('s-whatsapp'))  document.getElementById('s-whatsapp').value  = socials.whatsapp  || '573136918054';
    if (document.getElementById('s-tiktok'))    document.getElementById('s-tiktok').value    = socials.tiktok    || '';
  } catch(e) {
    const socials = JSON.parse(localStorage.getItem('cv_socials') || '{}');
    if (document.getElementById('s-facebook'))  document.getElementById('s-facebook').value  = socials.facebook  || '';
    if (document.getElementById('s-instagram')) document.getElementById('s-instagram').value = socials.instagram || '';
    if (document.getElementById('s-whatsapp'))  document.getElementById('s-whatsapp').value  = socials.whatsapp  || '573136918054';
  }
  if (document.getElementById('s-storename')) document.getElementById('s-storename').value = info.name  || 'CamVic House';
  if (document.getElementById('s-storedesc')) document.getElementById('s-storedesc').value = info.desc  || '';
  if (document.getElementById('s-email'))     document.getElementById('s-email').value     = info.email || '';

  // Cargar horario
  try {
    const schSnap = await getDoc(doc(db, 'settings', 'schedule'));
    const sch = schSnap.exists() ? schSnap.data() : JSON.parse(localStorage.getItem('cv_schedule') || '{}');
    if (document.getElementById('s-schedule')) document.getElementById('s-schedule').value = sch.text || '';
    if (sch.status === 'cerrado') { const el = document.getElementById('s-closed'); if(el) el.checked = true; }
    else { const el = document.getElementById('s-open'); if(el) el.checked = true; }
  } catch(e) {
    const sch = JSON.parse(localStorage.getItem('cv_schedule') || '{}');
    if (document.getElementById('s-schedule')) document.getElementById('s-schedule').value = sch.text || '';
  }

  loadLogoPreviewAdmin();
}

window.previewLogoUrl = function(url) {
  const el = document.getElementById('logo-preview-admin');
  if (!el) return;
  if (url) el.innerHTML = `<img src="${url}" alt="Logo" style="max-height:70px;" />`;
  else loadLogoPreviewAdmin();
};

window.saveSchedule = async function() {
  const text   = document.getElementById('s-schedule')?.value.trim();
  const status = document.querySelector('input[name="s-status"]:checked')?.value || 'abierto';
  if (!text) { showToast('Escribe el horario primero', 'error'); return; }
  try {
    await setDoc(doc(db, 'settings', 'schedule'), { text, status });
    localStorage.setItem('cv_schedule', JSON.stringify({ text, status }));
    showToast('✅ Horario guardado — visible para todos', 'success');
  } catch(e) {
    localStorage.setItem('cv_schedule', JSON.stringify({ text, status }));
    showToast('✅ Horario guardado localmente', 'success');
  }
};

window.saveLogoFromUrl = async function() {
  const url = document.getElementById('s-logourl')?.value.trim();
  if (!url) { showToast('Ingresa una URL válida de imgbb.com', 'error'); return; }
  try {
    await setDoc(doc(db, 'settings', 'logo'), { url });
    localStorage.setItem('cv_logo', url);
    loadLogoPreviewAdmin();
    showToast('✅ Logo guardado — visible para todos', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
};

window.removeLogo = async function() {
  try { await deleteDoc(doc(db, 'settings', 'logo')); } catch(e) {}
  localStorage.removeItem('cv_logo');
  if (document.getElementById('s-logourl')) document.getElementById('s-logourl').value = '';
  loadLogoPreviewAdmin(); showToast('Logo eliminado', 'info');
};

function loadLogoPreviewAdmin() {
  const el   = document.getElementById('logo-preview-admin');
  if (!el) return;
  const logo = localStorage.getItem('cv_logo');
  el.innerHTML = logo ? `<img src="${logo}" alt="Logo" style="max-height:70px;" />` : `<span style="font-size:2rem;">🍔</span>`;
}

window.saveSocials = async function() {
  const data = {
    facebook:  document.getElementById('s-facebook').value.trim(),
    instagram: document.getElementById('s-instagram').value.trim(),
    whatsapp:  document.getElementById('s-whatsapp').value.trim(),
    tiktok:    document.getElementById('s-tiktok').value.trim(),
  };
  try {
    await setDoc(doc(db, 'settings', 'socials'), data);
    localStorage.setItem('cv_socials', JSON.stringify(data));
    showToast('✅ Redes guardadas — visible para todos', 'success');
  } catch(e) { showToast('Error guardando redes: ' + e.message, 'error'); }
};

window.saveStoreInfo = function() {
  const data = {
    name:  document.getElementById('s-storename').value.trim(),
    desc:  document.getElementById('s-storedesc').value.trim(),
    email: document.getElementById('s-email').value.trim(),
  };
  localStorage.setItem('cv_store_info', JSON.stringify(data));
  showToast('Información guardada ✅', 'success');
};

window.changeAdminPass = async function() {
  const oldp = document.getElementById('s-oldpass').value;
  const newp = document.getElementById('s-newpass').value;
  const conf = document.getElementById('s-confpass').value;
  // Recargar credenciales frescas antes de validar
  await loadCredsFromFirebase();
  if (oldp !== currentCreds.pass) { showToast('Contraseña actual incorrecta', 'error'); return; }
  if (newp.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
  if (newp !== conf) { showToast('Las contraseñas no coinciden', 'error'); return; }
  try {
    const newCreds = { user: currentCreds.user, pass: newp };
    await setDoc(doc(db, 'settings', 'adminCreds'), newCreds);
    currentCreds = newCreds;
    ['s-oldpass','s-newpass','s-confpass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    showToast('✅ Contraseña cambiada — aplicada en todos los dispositivos', 'success');
  } catch(e) {
    showToast('Error al guardar en Firebase: ' + e.message, 'error');
  }
};

// ── MODALES ──
function openAdminModal(id) { const m = document.getElementById(id); if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('open'), 10); } document.body.style.overflow = 'hidden'; }
function closeAdminModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); setTimeout(() => { m.style.display = 'none'; }, 250); } document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdminModal('product-form-modal'); });

// ── TOAST ──
function showToast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}"></i> ${msg}`;
  tc.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => toast.remove(), 320); }, 2800);
}
