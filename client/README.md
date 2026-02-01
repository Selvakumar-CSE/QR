# Verdent Client - Complete Source Code

Complete client-side implementation for the Verdent food ordering system.

## Structure

```
client/
├── js/
│   ├── admin.js          # Admin dashboard - order management & status updates
│   ├── bill.js           # Bill/payment page - Razorpay integration
│   ├── menu.js           # Menu page - browse items, add to cart
│   ├── waiting.js        # Order status tracking - real-time updates
│   ├── kitchen.js        # Kitchen display system - order workflow
│   └── game.js           # Bonus game - lane-based obstacle avoidance
└── css/
    ├── common.css        # Global styles & utilities
    ├── menu.css          # Menu & cart styling
    ├── admin.css         # Admin dashboard styles
    └── waiting.css       # Order tracking styles
```

## Features

### 📱 Customer App
- **Menu Page** (`menu.js`) - Browse categories, view items, add to cart
- **Cart Drawer** - Floating side panel with quantity management
- **Order Placement** - Submit orders with hotel/table info
- **Bill & Payment** (`bill.js`) - View bill, integrate Razorpay payment
- **Order Status** (`waiting.js`) - Real-time tracking with WebSocket updates
- **Bonus Game** (`game.js`) - Lane-based gameplay while waiting

### 👨‍💼 Admin App
- **Admin Dashboard** (`admin.js`) - View all orders with filtering
- **Kitchen Display** (`kitchen.js`) - Kanban-style order management
- **Status Updates** - Update order states (pending → preparing → ready → completed)
- **Live Sync** - WebSocket-based real-time updates

## Technology Stack

- **Vanilla JavaScript** - No frameworks, lightweight & fast
- **Fetch API** - HTTP requests to Node.js backend
- **Socket.IO** - Real-time bidirectional communication
- **HTML5 Canvas** - Game rendering
- **CSS3** - Responsive styling with flexbox

## API Integration

All files connect to the backend API:
- `GET /api/hotels/:hotelId/menu` - Fetch menu
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Fetch order details
- `POST /api/orders/:orderId/create-payment` - Initialize payment
- `POST /api/orders/:orderId/verify-payment` - Verify payment
- `GET /api/admin/orders` - Fetch orders (admin)
- `PATCH /api/admin/orders/:id` - Update order status

## WebSocket Events

**Admin/Kitchen:**
- `new_order` - New order placed
- `order_paid` - Order payment received
- `order_status` - Order status changed

**Customer:**
- `join_order` - Subscribe to order updates
- `order_status` - Order status changed

## Key Functions

### Menu (`menu.js`)
```javascript
getCart()           // Get current cart from sessionStorage
addToCart(item)     // Add/update item in cart
removeFromCart(id)  // Remove item from cart
placeOrder()        // Submit order to backend
```

### Waiting (`waiting.js`)
```javascript
setStatus(status)   // Update status display
loadOrder()         // Fetch order details
```

### Admin (`admin.js`)
```javascript
loadOrders()        // Fetch filtered orders
setOrderStatus()    // Update order status
renderOrders()      // Render order cards
```

### Kitchen (`kitchen.js`)
```javascript
renderCol()         // Render Kanban column
loadOrders()        // Fetch orders with status filter
```

## Security Notes

- Admin secret stored in `X-Admin-Secret` header
- Razorpay signature verification on backend
- Session storage for table/hotel info
- CORS enabled for cross-origin requests

## Setup Instructions

1. Copy `client/js/*.js` to your server's public folder
2. Copy `client/css/*.css` to your server's public CSS folder
3. Ensure Socket.IO is loaded in HTML: `<script src="/socket.io/socket.io.js"></script>`
4. For Razorpay, load: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`

## Browser Support

- Modern browsers with ES5+ support
- Touch events for mobile
- Fallback for non-WebSocket browsers

---

**Ready to integrate!** Copy all files to your server and test with sample data.
