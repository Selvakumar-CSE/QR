(function() {
  const CART_KEY = 'verdent_cart';
  const hotelId = sessionStorage.getItem('hotelId');
  const tableId = sessionStorage.getItem('tableId');

  if (!hotelId || !tableId) {
    window.location.replace('index.html');
    return;
  }

  document.getElementById('tableInfo').textContent = 'Table ' + tableId;

  function getCart() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : { items: [], hotelId, tableId };
    } catch (_) {
      return { items: [], hotelId, tableId };
    }
  }

  function saveCart(cart) {
    cart.hotelId = hotelId;
    cart.tableId = tableId;
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item, quantity) {
    quantity = quantity || 1;
    const cart = getCart();
    const existing = cart.items.find(function(i) { return i.menu_item_id === item.id; });
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        menu_item_id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: quantity,
      });
    }
    saveCart(cart);
  }

  function removeFromCart(menuItemId) {
    const cart = getCart();
    cart.items = cart.items.filter(function(i) { return i.menu_item_id !== menuItemId; });
    saveCart(cart);
  }

  function updateCartQty(menuItemId, delta) {
    const cart = getCart();
    const item = cart.items.find(function(i) { return i.menu_item_id === menuItemId; });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart.items = cart.items.filter(function(i) { return i.menu_item_id !== menuItemId; });
    saveCart(cart);
  }

  function renderCart() {
    const cart = getCart();
    const countEl = document.getElementById('cartCount');
    const listEl = document.getElementById('cartList');
    const emptyEl = document.getElementById('cartEmpty');
    const totalEl = document.getElementById('cartTotal');
    const totalAmountEl = document.getElementById('totalAmount');
    const placeBtn = document.getElementById('placeOrder');

    const total = cart.items.reduce(function(sum, i) { return sum + i.price * i.quantity; }, 0);
    const count = cart.items.reduce(function(sum, i) { return sum + i.quantity; }, 0);

    countEl.textContent = count;
    placeBtn.disabled = count === 0;

    if (cart.items.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      totalEl.classList.add('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    totalEl.classList.remove('hidden');
    totalAmountEl.textContent = total.toFixed(2);
    listEl.innerHTML = cart.items.map(function(i) {
      return '<li data-id="' + i.menu_item_id + '">' +
        '<span>' + i.name + ' × <span class="qty">' + i.quantity + '</span> ₹' + (i.price * i.quantity).toFixed(2) + '</span>' +
        '<span><button type="button" class="qty-minus">−</button><button type="button" class="qty-plus">+</button><button type="button" class="remove-item">Remove</button></span>' +
        '</li>';
    }).join('');

    listEl.querySelectorAll('.qty-minus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = parseInt(btn.closest('li').dataset.id, 10);
        updateCartQty(id, -1);
      });
    });
    listEl.querySelectorAll('.qty-plus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = parseInt(btn.closest('li').dataset.id, 10);
        updateCartQty(id, 1);
      });
    });
    listEl.querySelectorAll('.remove-item').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = parseInt(btn.closest('li').dataset.id, 10);
        removeFromCart(id);
      });
    });
  }

  document.getElementById('cartToggle').addEventListener('click', function() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('show');
  });
  document.getElementById('closeCart').addEventListener('click', function() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('show');
  });
  document.getElementById('cartOverlay').addEventListener('click', function() {
    document.getElementById('cartDrawer').classList.remove('open');
    this.classList.remove('show');
  });

  document.getElementById('placeOrder').addEventListener('click', function() {
    const cart = getCart();
    if (cart.items.length === 0) return;
    const payload = {
      hotelId: parseInt(hotelId, 10),
      tableId: parseInt(tableId, 10),
      items: cart.items.map(function(i) {
        return { menuItemId: i.menu_item_id, quantity: i.quantity, unitPrice: i.price };
      }),
    };
    this.disabled = true;
    this.textContent = 'Placing...';
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error);
        sessionStorage.setItem('lastOrderId', String(data.orderId));
        sessionStorage.removeItem(CART_KEY);
        window.location.replace('waiting.html?orderId=' + data.orderId);
      })
      .catch(function(err) {
        alert(err.message || 'Failed to place order');
        document.getElementById('placeOrder').disabled = false;
        document.getElementById('placeOrder').textContent = 'Place order';
      });
  });

  fetch('/api/hotels/' + hotelId + '/menu')
    .then(function(r) { return r.json(); })
    .then(function(categories) {
      if (categories.error) throw new Error(categories.error);
      const root = document.getElementById('menuRoot');
      const loading = document.getElementById('menuLoading');
      loading.classList.add('hidden');
      root.classList.remove('hidden');
      root.innerHTML = categories.map(function(cat) {
        const itemsHtml = (cat.items || []).map(function(item) {
          var price = parseFloat(item.price);
          return '<div class="menu-item" data-id="' + item.id + '" data-name="' + escapeAttr(item.name) + '" data-price="' + price + '">' +
            '<div class="info">' +
            '<p class="name">' + escapeHtml(item.name) + '</p>' +
            (item.description ? '<p class="desc">' + escapeHtml(item.description) + '</p>' : '') +
            '<p class="price">₹' + price.toFixed(2) + '</p>' +
            '</div>' +
            '<div class="add-wrap"><button type="button" class="btn-add">Add</button></div>' +
            '</div>';
        }).join('');
        return '<section class="category-section">' +
          '<h2>' + escapeHtml(cat.name) + '</h2>' +
          '<div class="category-items">' + itemsHtml + '</div>' +
          '</section>';
      }).join('');
      root.querySelectorAll('.btn-add').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const itemEl = btn.closest('.menu-item');
          const id = parseInt(itemEl.dataset.id, 10);
          const name = itemEl.dataset.name || itemEl.querySelector('.name').textContent;
          const price = parseFloat(itemEl.dataset.price);
          addToCart({ id: id, name: name, price: price }, 1);
        });
      });
    })
    .catch(function(err) {
      document.getElementById('menuLoading').textContent = err.message || 'Failed to load menu';
    });

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  renderCart();
})();
