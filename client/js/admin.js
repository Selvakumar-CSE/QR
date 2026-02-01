(function() {
  const SECRET_KEY = 'verdent_admin_secret';
  function getSecret() { return sessionStorage.getItem(SECRET_KEY) || ''; }
  function setSecret(s) { sessionStorage.setItem(SECRET_KEY, s); }

  function apiHeaders() {
    return { 'Content-Type': 'application/json', 'X-Admin-Secret': getSecret() };
  }

  function showMain(show) {
    document.getElementById('authRequired').classList.toggle('hidden', show);
    document.getElementById('adminMain').classList.toggle('hidden', !show);
  }

  document.getElementById('adminLogin').addEventListener('click', function() {
    const secret = document.getElementById('adminSecret').value.trim();
    if (!secret) return;
    setSecret(secret);
    fetch('/api/admin/orders', { headers: apiHeaders() })
      .then(function(r) {
        if (r.status === 401) throw new Error('Invalid secret');
        return r.json();
      })
      .then(function() {
        showMain(true);
        loadOrders();
      })
      .catch(function(err) {
        setSecret('');
        alert(err.message || 'Login failed');
      });
  });

  function loadOrders() {
    const hotelId = document.getElementById('filterHotel').value.trim();
    const status = document.getElementById('filterStatus').value;
    let url = '/api/admin/orders?';
    if (hotelId) url += 'hotelId=' + encodeURIComponent(hotelId) + '&';
    if (status) url += 'status=' + encodeURIComponent(status);
    fetch(url, { headers: apiHeaders() })
      .then(function(r) {
        if (r.status === 401) { showMain(false); return []; }
        return r.json();
      })
      .then(function(orders) {
        if (!Array.isArray(orders)) return;
        renderOrders(orders);
      })
      .catch(function() {
        document.getElementById('ordersList').innerHTML = '<p>Failed to load orders.</p>';
      });
  }

  function setOrderStatus(orderId, status) {
    fetch('/api/admin/orders/' + orderId, {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ status: status }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error);
        loadOrders();
      })
      .catch(function(err) { alert(err.message); });
  }

  function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (orders.length === 0) {
      list.innerHTML = '<p>No orders.</p>';
      return;
    }
    list.innerHTML = orders.map(function(o) {
      const itemsList = (o.items || []).map(function(i) {
        return '<li>' + i.item_name + ' × ' + i.quantity + ' @ ₹' + parseFloat(i.unit_price).toFixed(2) + '</li>';
      }).join('');
      const status = o.status;
      const actions = [];
      if (status === 'pending') actions.push('<button type="button" data-action="confirmed">Confirm</button>', '<button type="button" data-action="preparing">Preparing</button>');
      if (status === 'confirmed') actions.push('<button type="button" data-action="preparing">Preparing</button>');
      if (status === 'preparing') actions.push('<button type="button" data-action="ready">Mark Ready</button>');
      if (status === 'ready') actions.push('<button type="button" data-action="completed">Completed</button>');
      if (status !== 'cancelled' && status !== 'completed') actions.push('<button type="button" class="secondary" data-action="cancelled">Cancel</button>');
      return '<div class="order-card ' + status + '" data-order-id="' + o.id + '">' +
        '<h3>Order #' + o.id + ' – Table ' + o.table_number + '</h3>' +
        '<p class="meta">' + o.status + ' · ' + new Date(o.created_at).toLocaleString() + '</p>' +
        '<ul>' + itemsList + '</ul>' +
        '<p class="total">Total: ₹' + parseFloat(o.total_amount).toFixed(2) + '</p>' +
        '<div class="actions">' + actions.join('') + '</div>' +
        '</div>';
    }).join('');
    list.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const card = this.closest('.order-card');
        const orderId = card.dataset.orderId;
        const status = this.dataset.action;
        setOrderStatus(orderId, status);
      });
    });
  }

  document.getElementById('btnRefresh').addEventListener('click', loadOrders);
  document.getElementById('filterStatus').addEventListener('change', function() {
    if (getSecret()) loadOrders();
  });

  var socket = io();
  socket.on('new_order', function() { if (getSecret()) loadOrders(); });
  socket.on('order_paid', function() { if (getSecret()) loadOrders(); });

  if (getSecret()) {
    fetch('/api/admin/orders', { headers: apiHeaders() })
      .then(function(r) {
        if (r.status === 401) { showMain(false); return; }
        showMain(true);
        return r.json();
      })
      .then(function(orders) {
        if (Array.isArray(orders)) renderOrders(orders);
      });
  }
})();
