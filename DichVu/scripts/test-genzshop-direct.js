const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({
    where: { id: 'a8fb9548-6350-4c67-8b63-2ba2c946d488' }
  });

  const order = await prisma.order.findFirst({
    where: { orderCode: 'ORD853118' },
    include: {
      orderItems: {
        include: {
          product: {
            include: { supplierMapping: true }
          }
        }
      }
    }
  });

  console.log('Supplier apiKey exists:', !!supplier.apiKey);
  console.log('Product mapping:', order.orderItems[0].product.supplierMapping);

  const payload = {
    product_id: order.orderItems[0].product.supplierMapping.supplierProductCode,
    quantity: order.orderItems[0].quantity,
    idempotency_key: order.orderCode
  };

  console.log('Calling GenzShop purchase.php with payload:', payload);

  const res = await fetch('https://genzshop.vn/api/partner/v1/purchase.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': supplier.apiKey,
      'Authorization': `Bearer ${supplier.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log(`Response status: ${res.status}`);
  console.log('Response body:', text);

  // If purchase succeeded, let's parse keys and deliver to order!
  try {
    const json = JSON.parse(text);
    if (json.success) {
      console.log('SUCCESS! Saving keys to order...');
      const rawAccounts = json.deliveredAccounts ?? json.data ?? json.keys ?? [];
      const keys = Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts];
      
      const cleanKeys = keys.map(k => {
        if (typeof k === 'object' && k !== null) {
          return k.password || k.key || JSON.stringify(k);
        }
        return String(k);
      });
      
      // Update order to COMPLETED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          upstreamStatus: 'COMPLETED',
          upstreamOrderId: String(json.order_id || json.orderId || order.orderCode),
          upstreamError: null,
        }
      });

      // Also create productItems with status SOLD
      for (const secret of cleanKeys) {
        await prisma.productItem.create({
          data: {
            productId: order.orderItems[0].productId,
            secretContent: secret,
            status: 'SOLD',
            orderId: order.id
          }
        });
      }

      console.log('Order ORD853118 marked COMPLETED and keys saved successfully!');
    }
  } catch (err) {
    console.error('Parse error:', err);
  }
}

main().finally(() => prisma.$disconnect());
