(function() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || sessionStorage.getItem('lastOrderId');
  if (!orderId) {
    document.getElementById('orderLoading').textContent = 'No order found. Place an order from the menu.';
    return;
  }

  sessionStorage.setItem('lastOrderId', orderId);
  document.getElementById('orderId').textContent = orderId;

  function setStatus(status) {
    document.getElementById('statusText').textContent = status;
    document.querySelectorAll('.status-bar .step').forEach(function(el) { el.classList.remove('active', 'done'); });
    var steps = { pending: 'stepPending', preparing: 'stepPreparing', ready: 'stepReady', completed: 'stepDone' };
    var normalized = status === 'confirmed' ? 'pending' : status;
    var order = ['pending', 'preparing', 'ready', 'completed'];
    var idx = order.indexOf(normalized);
    if (idx < 0) idx = 0;
    for (var i = 0; i <= idx; i++) {
      var stepId = steps[order[i]];
      if (stepId) {
        var stepEl = document.getElementById(stepId);
        if (stepEl) stepEl.classList.add(i === idx ? 'active' : 'done');
      }
    }
    if (status === 'ready' || status === 'completed') {
      document.getElementById('readyCta').classList.remove('hidden');
      document.getElementById('linkBill').setAttribute('href', 'bill.html?orderId=' + orderId);
    }
  }

  function loadOrder() {
    fetch('/api/orders/' + orderId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error);
        document.getElementById('orderLoading').classList.add('hidden');
        document.getElementById('orderInfo').classList.remove('hidden');
        setStatus(data.status);
      })
      .catch(function() {
        document.getElementById('orderLoading').textContent = 'Could not load order.';
      });
  }

  var socket = io();
  socket.emit('join_order', orderId);
  socket.on('order_status', function(payload) {
    if (payload.orderId === parseInt(orderId, 10)) setStatus(payload.status);
  });

  loadOrder();
})();
