(function() {
  const SECRET_KEY = 'verdent_admin_secret';
  function getSecret() { return sessionStorage.getItem(SECRET_KEY) || ''; }
  function setSecret(s) { sessionStorage.setItem(SECRET_KEY, s); }
  function apiHeaders() { return { 'Content-Type': 'application/json', 'X-Admin-Secret': getSecret() }; }

  function showMain(show) {
    document.getElementById('authRequired').classList.toggle('hidden', show);
    document.getElementById('adminMain').classList.toggle('hidden', !show);
  }

  document.getElementById('adminLogin').addEventListener('click', function() {
    const secret = document.getElementById('adminSecret').value.trim();
    if (!secret) return;
    setSecret(secret);
    fetch('/api/admin/orders', { headers: apiHeaders() })
      .then(function(r) { if (r.status === 401) throw new Error('Invalid secret'); return r.json(); })
      .then(function() { showMain(true); loadOrders(); })
      .catch(function(err) { setSecret(''); alert(err.message || 'Login failed'); });
  });

  function loadOrders() {
    const hotelId = document.getElementById('filterHotel').value.trim();
    let url = '/api/admin/orders?';
    if (hotelId) url += 'hotelId=' + encodeURIComponent(hotelId) + '&';
    fetch(url, { headers: apiHeaders() })
      .then(function(r) { if (r.status === 401) { showMain(false); return []; } return r.json(); })
      .then(function(orders) {
        if (!Array.isArray(orders)) return;
        var newOrders = orders.filter(function(o) { return o.status === 'pending' || o.status === 'confirmed'; });
        var preparing = orders.filter(function(o) { return o.status === 'preparing'; });
        var ready = orders.filter(function(o) { return o.status === 'ready'; });
        renderCol('colNew', newOrders, ['preparing', 'cancelled']);
        renderCol('colPreparing', preparing, ['ready']);
        renderCol('colReady', ready, ['completed']);
      })
      .catch(function() {});
  }

  function renderCol(colId, orders, nextStatuses) {
    const el = document.getElementById(colId);
    if (orders.length === 0) { el.innerHTML = '<p>None</p>'; return; }
    el.innerHTML = orders.map(function(o) {
      const itemsList = (o.items || []).map(function(i) { return i.item_name + ' × ' + i.quantity; }).join(', ');
      const buttons = nextStatuses.map(function(s) {
        var label = s === 'preparing' ? 'Start' : s === 'ready' ? 'Ready' : s === 'completed' ? 'Done' : s;
        return '<button type="button" data-status="' + s + '">' + label + '</button>';
      }).join(' ');
      return '<div class="order-card" data-order-id="' + o.id + '">' +
        '<h3>#' + o.id + ' Table ' + o.table_number + '</h3>' +
        '<p class="meta">' + itemsList + '</p>' +
        '<p class="total">₹' + parseFloat(o.total_amount).toFixed(2) + '</p>' +
        '<div class="actions">' + buttons + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-status]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var orderId = btn.closest('.order-card').dataset.orderId;
        var status = btn.dataset.status;
        fetch('/api/admin/orders/' + orderId, {
          method: 'PATCH',
          headers: apiHeaders(),
          body: JSON.stringify({ status: status }),
        }).then(function(r) { return r.json(); }).then(function() { loadOrders(); }).catch(function() {});
      });
    });
  }

  document.getElementById('btnRefresh').addEventListener('click', loadOrders);
  var socket = io();
  socket.on('new_order', function() { if (getSecret()) loadOrders(); });
  socket.on('order_paid', function() { if (getSecret()) loadOrders(); });
  socket.on('order_status', function() { if (getSecret()) loadOrders(); });

  if (getSecret()) {
    fetch('/api/admin/orders', { headers: apiHeaders() })
      .then(function(r) { if (r.status === 401) return; showMain(true); return r.json(); })
      .then(function(orders) { if (Array.isArray(orders)) loadOrders(); });
  }
})();
