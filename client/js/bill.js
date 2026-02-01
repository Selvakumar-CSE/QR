(function() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || sessionStorage.getItem('lastOrderId');
  if (!orderId) {
    document.getElementById('billLoading').textContent = 'No order found.';
    return;
  }

  function showError(msg) {
    var el = document.getElementById('paymentError');
    el.textContent = msg || 'Payment failed. Please try again.';
    el.classList.remove('hidden');
    document.getElementById('paymentSuccess').classList.add('hidden');
  }
  function showSuccess() {
    document.getElementById('paymentError').classList.add('hidden');
    document.getElementById('paymentSuccess').classList.remove('hidden');
    document.getElementById('payBtn').disabled = true;
    document.getElementById('payBtn').textContent = 'Paid';
  }

  fetch('/api/orders/' + orderId)
    .then(function(r) { return r.json(); })
    .then(function(order) {
      if (order.error) throw new Error(order.error);
      document.getElementById('billLoading').classList.add('hidden');
      document.getElementById('billContent').classList.remove('hidden');
      document.getElementById('orderId').textContent = orderId;
      document.getElementById('tableNumber').textContent = order.table_number || '--';
      var itemsHtml = (order.items || []).map(function(i) {
        var lineTotal = i.quantity * parseFloat(i.unit_price);
        return '<li><span>' + i.item_name + ' × ' + i.quantity + '</span><span>₹' + lineTotal.toFixed(2) + '</span></li>';
      }).join('');
      document.getElementById('billItems').innerHTML = itemsHtml;
      document.getElementById('totalAmount').textContent = parseFloat(order.total_amount).toFixed(2);

      if (order.paid_at) {
        showSuccess();
        document.getElementById('payBtn').style.display = 'none';
        return;
      }

      document.getElementById('payBtn').addEventListener('click', function() {
        var btn = this;
        btn.disabled = true;
        document.getElementById('paymentError').classList.add('hidden');
        fetch('/api/orders/' + orderId + '/create-payment', { method: 'POST' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) throw new Error(data.error);
            if (!window.Razorpay) throw new Error('Razorpay not loaded');
            var options = {
              key: data.key_id,
              amount: Math.round(parseFloat(data.amount) * 100),
              currency: 'INR',
              order_id: data.razorpay_order_id,
              name: 'Verdent Cafe',
              description: 'Order #' + orderId,
              handler: function(response) {
                fetch('/api/orders/' + orderId + '/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                })
                  .then(function(r) { return r.json(); })
                  .then(function(verify) {
                    if (verify.error) throw new Error(verify.error);
                    showSuccess();
                  })
                  .catch(function(err) { showError(err.message); btn.disabled = false; });
              },
            };
            var rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function() {
              showError('Payment failed. Please try again.');
              btn.disabled = false;
            });
            rzp.open();
          })
          .catch(function(err) {
            showError(err.message || 'Could not start payment');
            btn.disabled = false;
          });
      });
    })
    .catch(function() {
      document.getElementById('billLoading').textContent = 'Could not load bill.';
    });
})();
