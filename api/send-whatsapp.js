import fetch from 'node-fetch';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.jejakmufassir.my.id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // API Key validation (opsional untuk keamanan)
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.WHATSAPP_API_KEY || 'your-secure-whatsapp-key-123';
    
    if (apiKey !== expectedApiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const orderData = req.body;

    // Validate required fields
    if (!orderData || !orderData.invoiceNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order data' 
      });
    }

    // Format WhatsApp message
    const message = formatWhatsAppMessage(orderData);

    // Send WhatsApp message
    const result = await sendWhatsAppMessage('087849484894', message);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'WhatsApp notification sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
}

// Function to format WhatsApp message
function formatWhatsAppMessage(orderData) {
  const formatCurrency = (amount) => {
    return parseInt(amount).toLocaleString('id-ID');
  };

  return `🛍️ *PESANAN BARU JEJAK MUFASSIR*

📋 *Detail Pesanan:*
• Invoice: ${orderData.invoiceNumber}
• Produk: ${orderData.productName}
• Jenis: ${orderData.jenisProduk}
• Jumlah: ${orderData.quantity}
• SKU: ${orderData.sku || '-'}
• Harga: Rp ${formatCurrency(orderData.productPrice)}

👤 *Data Pembeli:*
• Nama: ${orderData.fullName}
• No. HP: ${orderData.phoneNumber}
• Email: ${orderData.email}

📍 *Alamat Pengiriman:*
${orderData.address}
${orderData.city}

🚚 *Pengiriman & Pembayaran:*
• Kurir: ${orderData.kurir}
• Metode Bayar: ${orderData.paymentMethod}
• Status: ${orderData.status}

${orderData.voucher && orderData.voucher !== 'Pilih Voucher' ? `🎫 *Voucher:* ${orderData.voucher}` : ''}

💰 *Total Pembayaran:*
Rp ${formatCurrency(orderData.totalPayment)}

⏰ *Waktu Pesanan:*
${orderData.timestamp}

${orderData.catatan ? `📝 *Catatan Pembeli:*
${orderData.catatan}` : ''}

${orderData.namaDropshipper ? `🏪 *Info Dropshipper:*
• Nama: ${orderData.namaDropshipper}
• No. HP: ${orderData.nomorDropshipper}` : ''}

---
*Jejak Mufassir - Admin Dashboard*`;
}

// Function to send WhatsApp message
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    
    // Opsi 4: Menggunakan service custom Anda sendiri
    if (process.env.CUSTOM_WHATSAPP_API_URL) {
      return await sendViaCustomAPI(phoneNumber, message);
    }
    
    throw new Error('No WhatsApp service configured');
    
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Custom API Implementation (sesuaikan dengan API Anda)
async function sendViaCustomAPI(phoneNumber, message) {
  const response = await fetch(process.env.CUSTOM_WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CUSTOM_WHATSAPP_API_TOKEN}`
    },
    body: JSON.stringify({
      phone: phoneNumber,
      message: message
    })
  });

  const result = await response.json();
  
  if (response.ok && result.success) {
    return { 
      success: true, 
      messageId: result.messageId 
    };
  } else {
    throw new Error(result.error || 'Failed to send via Custom API');
  }
}
