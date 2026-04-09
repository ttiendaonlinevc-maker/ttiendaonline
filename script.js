/* ============================================
   CAMVIC HOUSE — script.js con Firebase
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, setDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ── ESTADO ──
let cart = [];
let products = [];
let currentCategory = 'all';
let currentProductId = null;
let currentQty = 1;
let currentNotes = '';
let currentUser = null;

// ── PRODUCTOS DE EJEMPLO ──
const defaultProducts = [
  { id:'m1', name:'Hamburguesa Clásica', category:'hamburguesas', price:18000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', desc:'Hamburguesa clásica con carne de res, lechuga, tomate, cebolla y salsa especial de la casa. Pan artesanal tostado.', featured:true, showStock:false, showAgotado:true },
  { id:'m2', name:'Hamburguesa Doble Carne', category:'hamburguesas', price:24000, oldPrice:28000, stock:999, img:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80', desc:'Doble porción de carne jugosa con queso cheddar derretido, tocino crocante y nuestras salsas secretas.', featured:true, showStock:false, showAgotado:true },
  { id:'m3', name:'Pizza Margarita Personal', category:'pizzas', price:22000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', desc:'Pizza personal con salsa de tomate casera, mozzarella fresca y albahaca. Masa crujiente horneada al momento.', featured:false, showStock:false, showAgotado:true },
  { id:'m4', name:'Pizza Pepperoni Familiar', category:'pizzas', price:45000, oldPrice:52000, stock:999, img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', desc:'Pizza familiar con generosa cantidad de pepperoni, queso mozzarella y salsa de tomate. 8 porciones grandes.', featured:true, showStock:false, showAgotado:true },
  { id:'m5', name:'Pollo Broaster x3 Piezas', category:'pollos', price:25000, oldPrice:30000, stock:999, img:'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', desc:'3 piezas de pollo broaster crujiente y jugoso. Acompañado de papas fritas y salsa de elección.', featured:true, showStock:false, showAgotado:true },
  { id:'m6', name:'Perro Caliente Especial', category:'perros', price:12000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1612392062631-94c01de6b961?w=400&q=80', desc:'Perro caliente en pan suave con salchicha especial, papas en hojuelas, salsas variadas y queso rallado.', featured:false, showStock:false, showAgotado:true },
  { id:'m7', name:'Gaseosa 400ml', category:'bebidas', price:4000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', desc:'Gaseosa fría de tu elección: Coca-Cola, Pepsi, Sprite o Manzana. Presentación 400ml bien helada.', featured:false, showStock:false, showAgotado:true },
  { id:'m8', name:'Malteada Artesanal', category:'bebidas', price:12000, oldPrice:15000, stock:999, img:'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', desc:'Malteada cremosa preparada al momento. Sabores: vainilla, chocolate, fresa o arequipe. 500ml.', featured:true, showStock:false, showAgotado:true },
  { id:'m9', name:'Helado de Paleta', category:'postres', price:5000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80', desc:'Paleta artesanal de sabores variados. Sabores del día según disponibilidad.', featured:false, showStock:false, showAgotado:true },
  { id:'m10', name:'Combo Familiar CamVic', category:'combos', price:65000, oldPrice:80000, stock:999, img:'https://images.unsplash.com/photo-1619881585386-4e15c55d8a95?w=400&q=80', desc:'2 hamburguesas dobles + 1 pizza mediana + 4 gaseosas + papas familiares. ¡El combo perfecto para 4 personas!', featured:true, showStock:false, showAgotado:true },
  { id:'m11', name:'Combo Pareja', category:'combos', price:38000, oldPrice:45000, stock:999, img:'https://images.unsplash.com/photo-1626082927389-6cd097cee6a6?w=400&q=80', desc:'2 hamburguesas clásicas + 2 gaseosas + 2 porciones de papas fritas. Ideal para compartir en pareja.', featured:false, showStock:false, showAgotado:true },
  { id:'m12', name:'Papas Fritas Porción', category:'otros', price:8000, oldPrice:0, stock:999, img:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', desc:'Porción generosa de papas fritas crocantes, sazonadas con sal y especias. Acompañadas de salsa de elección.', featured:false, showStock:false, showAgotado:true }
];

// ── INICIO ──
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  await loadProductsFromFirebase();
  showLoading(false);
  const cartStored = localStorage.getItem('cv_cart');
  cart = cartStored ? JSON.parse(cartStored) : [];
  renderProducts();
  updateCartBadge();
  await loadSocialLinks();
  await loadLogoDisplay();
  checkUserSession();
});

// ── LOADER ──
function showLoading(show) {
  let loader = document.getElementById('page-loader');
  if (!loader && show) {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <p style="color:var(--primary);font-weight:700;font-size:1rem;">Cargando menú... 🍔</p>`;
    document.body.appendChild(loader);
  }
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

// ── FIREBASE PRODUCTOS ──
async function loadProductsFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) { await uploadDefaultProducts(); }
    else { products = []; snapshot.forEach(d => products.push({ id: d.id, ...d.data() })); }
  } catch(e) { console.error(e); products = defaultProducts; }
}

async function uploadDefaultProducts() {
  try {
    for (const p of defaultProducts) {
      const { id, ...data } = p;
      await setDoc(doc(db, 'products', id), data);
    }
    products = [...defaultProducts];
  } catch(e) { products = defaultProducts; }
}

async function saveProductToFirebase(product) {
  try { const { id, ...data } = product; await setDoc(doc(db, 'products', id), data); return true; }
  catch(e) { return false; }
}

// ── LOGO Y REDES DESDE FIREBASE ──
async function loadLogoDisplay() {
  const el = document.getElementById('logo-display');
  if (!el) return;
  el.innerHTML = '<div class="logo-default">🍔</div>';
  try {
    const snap = await getDoc(doc(db, 'settings', 'logo'));
    if (snap.exists() && snap.data().url) {
      const url = snap.data().url;
      el.innerHTML = `<img src="${url}" alt="Logo" style="height:48px;width:48px;object-fit:contain;border-radius:50%;" />`;
      localStorage.setItem('cv_logo', url);
    }
  } catch(e) {
    const url = localStorage.getItem('cv_logo');
    if (url) el.innerHTML = `<img src="${url}" alt="Logo" style="height:48px;width:48px;object-fit:contain;border-radius:50%;" />`;
  }
}

async function loadSocialLinks() {
  const container = document.getElementById('social-links');
  if (!container) return;
  let socials = {};
  try {
    const snap = await getDoc(doc(db, 'settings', 'socials'));
    socials = snap.exists() ? snap.data() : JSON.parse(localStorage.getItem('cv_socials') || '{}');
    if (snap.exists()) localStorage.setItem('cv_socials', JSON.stringify(socials));
  } catch(e) { socials = JSON.parse(localStorage.getItem('cv_socials') || '{}'); }
  const links = [];
  if (socials.facebook)  links.push(`<a href="${socials.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`);
  if (socials.instagram) links.push(`<a href="${socials.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`);
  links.push(`<a href="https://wa.me/${socials.whatsapp || '573136918054'}" target="_blank"><i class="fab fa-whatsapp"></i></a>`);
  if (socials.tiktok)    links.push(`<a href="${socials.tiktok}" target="_blank"><i class="fab fa-tiktok"></i></a>`);
  container.innerHTML = links.join('');
}

function saveCart() { localStorage.setItem('cv_cart', JSON.stringify(cart)); }

// ── RENDER ──
function renderProducts() {
  const grid  = document.getElementById('products-grid');
  const empty = document.getElementById('empty-state');
  if (!grid) return;
  const query = document.getElementById('search-input')?.value.toLowerCase() || '';
  const filtered = products.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchQ   = p.name.toLowerCase().includes(query) || (p.desc||'').toLowerCase().includes(query);
    return matchCat && matchQ;
  });
  const countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = `${filtered.length} productos`;
  if (filtered.length === 0) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = filtered.map(p => {
    const hasOld  = p.oldPrice && p.oldPrice > 0;
    const noStock = p.stock <= 0;
    return `
      <div class="product-card" onclick="openProduct('${p.id}')">
        <div class="product-img">
          ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=no-img>🍔</div>'" />` : `<div class="no-img">🍔</div>`}
          ${p.featured ? '<span class="badge-featured">⭐ Popular</span>' : ''}
          ${p.showStock && p.stock > 0 && p.stock <= 5 ? `<span class="badge-stock-low">Últimas ${p.stock}</span>` : ''}
          ${p.showStock && p.stock > 5 ? `<span class="badge-disponible">${p.stock} disp.</span>` : ''}
          ${noStock && p.showAgotado !== false ? '<div class="badge-no-stock">AGOTADO</div>' : ''}
        </div>
        <div class="product-info">
          <div class="product-category-tag">${categoryLabel(p.category)}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc-short">${p.desc || ''}</div>
          <div class="product-price-row">
            <span class="product-price">${formatPrice(p.price)}</span>
            ${hasOld ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
          </div>
          <button class="btn-add" onclick="event.stopPropagation();addToCart('${p.id}')" ${noStock && p.showAgotado !== false ? 'disabled' : ''}>
            <i class="fas fa-plus-circle"></i> ${noStock && p.showAgotado !== false ? 'Agotado' : 'Pedir'}
          </button>
        </div>
      </div>`;
  }).join('');
}

window.filterProducts = () => renderProducts();
window.goHome = () => { setCategory('all'); window.scrollTo({top:0,behavior:'smooth'}); };
window.scrollToCatalog = () => document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});

window.setCategory = function(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else { const t = document.querySelector(`[data-cat="${cat}"]`); if (t) t.classList.add('active'); }
  const titles = { all:'🍽️ Nuestro Menú', hamburguesas:'🍔 Hamburguesas', pizzas:'🍕 Pizzas', pollos:'🍗 Pollos', perros:'🌭 Perros Calientes', bebidas:'🥤 Bebidas', postres:'🍦 Postres', combos:'📦 Combos', otros:'🍟 Otros' };
  const el = document.getElementById('catalog-title');
  if (el) el.textContent = titles[cat] || 'Menú';
  renderProducts(); window.scrollToCatalog();
};

// ── DETALLE ──
window.openProduct = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProductId = id; currentQty = 1; currentNotes = '';
  document.getElementById('modal-img').src = p.img || '';
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-price').textContent = formatPrice(p.price);
  document.getElementById('modal-desc').textContent = p.desc || '';
  document.getElementById('modal-category').textContent = categoryLabel(p.category);
  document.getElementById('modal-qty').textContent = 1;
  const notesEl = document.getElementById('modal-notes');
  if (notesEl) notesEl.value = '';
  const stockEl = document.getElementById('modal-stock');
  if (p.stock <= 0 && p.showAgotado !== false) stockEl.innerHTML = '<span style="color:var(--danger)"><i class="fas fa-times-circle"></i> Agotado</span>';
  else if (p.showStock && p.stock <= 5) stockEl.innerHTML = `<span style="color:var(--primary)"><i class="fas fa-fire"></i> ¡Solo quedan ${p.stock}!</span>`;
  else if (p.showStock) stockEl.innerHTML = `<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Disponible (${p.stock})</span>`;
  else stockEl.innerHTML = `<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Disponible</span>`;
  openModal('product-modal');
};

window.changeQty = function(delta) {
  const p = products.find(x => x.id === currentProductId);
  if (!p) return;
  const max = p.showStock ? p.stock : 99;
  currentQty = Math.max(1, Math.min(currentQty + delta, max));
  document.getElementById('modal-qty').textContent = currentQty;
};

window.addToCartFromModal = function() {
  if (!currentProductId) return;
  const notesEl = document.getElementById('modal-notes');
  currentNotes = notesEl ? notesEl.value.trim() : '';
  addToCart(currentProductId, currentQty, currentNotes);
  closeProductModal();
};

window.buyDirectWhatsApp = function() {
  const p = products.find(x => x.id === currentProductId);
  if (!p) return;
  const notesEl = document.getElementById('modal-notes');
  const notes = notesEl ? notesEl.value.trim() : '';
  const msg = `🍔 *Pedido CamVic House*\n\n` +
    `Quiero pedir:\n• ${p.name} x${currentQty} = ${formatPrice(p.price * currentQty)}` +
    (notes ? `\n📝 Nota: ${notes}` : '') +
    `\n\n💰 Subtotal: ${formatPrice(p.price * currentQty)}\n🛵 Domicilio a coordinar`;
  window.open(`https://wa.me/573136918054?text=${encodeURIComponent(msg)}`, '_blank');
};

window.closeProductModal = function(e) { if (!e || e.target.id === 'product-modal') closeModal('product-modal'); };

// ── CARRITO ──
function addToCart(id, qty = 1, notes = '') {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.stock <= 0 && p.showAgotado !== false) { showToast('Producto no disponible', 'error'); return; }
  const existing = cart.find(x => x.id === id && x.notes === notes);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty, price: p.price, name: p.name, img: p.img, notes });
  }
  saveCart(); updateCartBadge();
  showToast(`✅ ${p.name} agregado al pedido`, 'success');
}
window.addToCart = addToCart;

window.removeFromCart = function(idx) { cart.splice(idx, 1); saveCart(); updateCartBadge(); renderCart(); };

window.updateCartQty = function(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart(); updateCartBadge(); renderCart();
};

window.clearCart = function() { cart = []; saveCart(); updateCartBadge(); renderCart(); };

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = total;
}

window.openCart = function() { renderCart(); openModal('cart-modal'); };
window.closeCart = function(e) { if (!e || e.target.id === 'cart-modal') closeModal('cart-modal'); };

function renderCart() {
  const list   = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Tu pedido está vacío 🍔</p></div>`;
    if (footer) footer.style.display = 'none'; return;
  }
  if (footer) footer.style.display = 'flex';
  list.innerHTML = cart.map((item, idx) => {
    const p = products.find(x => x.id === item.id);
    const price = p ? p.price : item.price;
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.img||''}" alt="${item.name}" onerror="this.src=''" />
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${item.notes ? `<div class="cart-item-note">📝 ${item.notes}</div>` : ''}
          <div class="cart-item-price">${formatPrice(price * item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="updateCartQty(${idx},-1)">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="cart-qty-btn" onclick="updateCartQty(${idx},1)">+</button>
          <button class="cart-remove" onclick="removeFromCart(${idx})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');
  const total = cart.reduce((s, i) => { const p = products.find(x => x.id === i.id); return s + (p ? p.price : i.price) * i.qty; }, 0);
  const el = document.getElementById('cart-total-amount');
  if (el) el.textContent = formatPrice(total);
}

// ── CHECKOUT ──
window.openCheckout = function() {
  if (cart.length === 0) { showToast('Tu pedido está vacío', 'error'); return; }
  window.closeCart(); renderCheckoutSummary(); openModal('checkout-modal');
};
window.closeCheckout = function(e) { if (!e || e.target.id === 'checkout-modal') closeModal('checkout-modal'); };

function renderCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;
  const total = cart.reduce((s, i) => { const p = products.find(x => x.id === i.id); return s + (p ? p.price : i.price) * i.qty; }, 0);
  let html = `<strong>🍔 Resumen del pedido:</strong>`;
  cart.forEach(i => {
    const p = products.find(x => x.id === i.id);
    const price = p ? p.price : i.price;
    html += `<div class="cs-item"><span>${i.name} x${i.qty}${i.notes ? ` (${i.notes})` : ''}</span><span>${formatPrice(price * i.qty)}</span></div>`;
  });
  html += `<div class="cs-total"><span>💰 SUBTOTAL</span><span>${formatPrice(total)}</span></div>`;
  html += `<p style="font-size:.75rem;color:var(--primary);margin-top:6px;font-style:italic;">🛵 El costo del domicilio será informado por WhatsApp.</p>`;
  el.innerHTML = html;
}

window.submitOrder = async function(e) {
  e.preventDefault();
  const name      = document.getElementById('f-name').value.trim();
  const address   = document.getElementById('f-address').value.trim();
  const city      = document.getElementById('f-city').value.trim();
  const phone     = document.getElementById('f-phone').value.trim();
  const reference = document.getElementById('f-reference').value.trim();
  const email     = document.getElementById('f-email').value.trim();
  const notes     = document.getElementById('f-notes').value.trim();
  const pago      = document.querySelector('input[name="pago"]:checked')?.value || 'Efectivo';

  const total = cart.reduce((s, i) => { const p = products.find(x => x.id === i.id); return s + (p ? p.price : i.price) * i.qty; }, 0);
  const items = cart.map(i => {
    const p = products.find(x => x.id === i.id);
    const price = p ? p.price : i.price;
    return `• ${i.name} x${i.qty}${i.notes ? ` (📝 ${i.notes})` : ''} = ${formatPrice(price * i.qty)}`;
  }).join('\n');

  const msg = `🍔 *NUEVO PEDIDO — CAMVIC HOUSE* 🏠\n\n` +
    `👤 *Cliente:* ${name}\n` +
    `📍 *Dirección:* ${address}, ${city}\n` +
    (reference ? `🏠 *Referencia:* ${reference}\n` : '') +
    `📞 *Teléfono:* ${phone}\n` +
    (email ? `📧 *Correo:* ${email}\n` : '') +
    `💳 *Forma de pago:* ${pago}\n\n` +
    `🛒 *Pedido:*\n${items}\n\n` +
    `💰 *SUBTOTAL: ${formatPrice(total)}*\n` +
    `🛵 *Domicilio:* A confirmar por WhatsApp` +
    (notes ? `\n\n📝 *Observaciones:* ${notes}` : '');

  // Reducir stock si aplica
  cart.forEach(async item => {
    const p = products.find(x => x.id === item.id);
    if (p && p.showStock) {
      p.stock = Math.max(0, p.stock - item.qty);
      await saveProductToFirebase(p);
    }
  });

  // Guardar pedido
  try {
    await addDoc(collection(db, 'orders'), { name, address, city, phone, reference, email, notes, pago, items: [...cart], total, date: new Date().toISOString() });
  } catch(err) {
    const orders = JSON.parse(localStorage.getItem('cv_orders') || '[]');
    orders.unshift({ name, address, city, phone, reference, email, notes, pago, items: [...cart], total, date: new Date().toISOString() });
    localStorage.setItem('cv_orders', JSON.stringify(orders));
  }

  window.open(`https://wa.me/573136918054?text=${encodeURIComponent(msg)}`, '_blank');
  window.clearCart(); window.closeCheckout();
  showToast('¡Pedido enviado! 🎉 Te contactamos pronto', 'success');
};

// ── USUARIOS ──
function checkUserSession() {
  const u = localStorage.getItem('cv_user');
  if (u) { currentUser = JSON.parse(u); updateUserUI(); }
}
function updateUserUI() {
  const label = document.getElementById('user-label');
  if (label) label.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Entrar';
}
window.openUserModal = function() {
  if (currentUser) {
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'none';
    document.getElementById('logged-section').style.display = 'block';
    document.getElementById('logged-name').textContent = `Hola, ${currentUser.name}! 👋`;
    document.getElementById('logged-email-display').textContent = currentUser.email;
  } else { switchUserTab('login'); }
  openModal('user-modal');
};
window.closeUserModal = function(e) { if (!e || e.target.id === 'user-modal') closeModal('user-modal'); };
window.switchUserTab = function(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form-section').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form-section').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('logged-section').style.display = 'none';
};
window.doLogin = function() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!user || !pass) { showToast('Completa todos los campos', 'error'); return; }
  const users = JSON.parse(localStorage.getItem('cv_users') || '[]');
  const found = users.find(u => (u.username === user || u.email === user) && u.password === pass);
  if (!found) { showToast('Credenciales incorrectas', 'error'); return; }
  currentUser = found; localStorage.setItem('cv_user', JSON.stringify(found));
  updateUserUI(); window.closeUserModal(); showToast(`Bienvenido, ${found.name}! 👋`, 'success');
};
window.doRegister = function() {
  const name  = document.getElementById('reg-name').value.trim();
  const uname = document.getElementById('reg-user').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!name || !uname || !email || !pass) { showToast('Completa todos los campos', 'error'); return; }
  if (pass.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
  const users = JSON.parse(localStorage.getItem('cv_users') || '[]');
  if (users.find(u => u.username === uname || u.email === email)) { showToast('Usuario ya registrado', 'error'); return; }
  const newUser = { id: 'u' + Date.now(), name, username: uname, email, password: pass, created: new Date().toISOString() };
  users.push(newUser); localStorage.setItem('cv_users', JSON.stringify(users));
  currentUser = newUser; localStorage.setItem('cv_user', JSON.stringify(newUser));
  updateUserUI(); window.closeUserModal(); showToast(`Cuenta creada. Bienvenido, ${name}! 🎉`, 'success');
};
window.doLogout = function() { currentUser = null; localStorage.removeItem('cv_user'); updateUserUI(); window.closeUserModal(); showToast('Sesión cerrada', 'info'); };

// ── MODALES ──
function openModal(id) { const m = document.getElementById(id); if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('open'), 10); } document.body.style.overflow = 'hidden'; }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); setTimeout(() => { m.style.display = 'none'; }, 250); } document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') ['product-modal','cart-modal','checkout-modal','user-modal'].forEach(closeModal); });

// ── UTILS ──
function formatPrice(n) { return '$' + Number(n).toLocaleString('es-CO'); }
function categoryLabel(cat) {
  return { hamburguesas:'Hamburguesas', pizzas:'Pizzas', pollos:'Pollos', perros:'Perros Calientes', bebidas:'Bebidas', postres:'Postres', combos:'Combos', otros:'Otros' }[cat] || cat;
}
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
