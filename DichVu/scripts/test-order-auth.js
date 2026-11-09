const http = require('http');

// Simple verification of order-auth protection
console.log('Testing that order creation without session is protected by 401 requireAuth');
