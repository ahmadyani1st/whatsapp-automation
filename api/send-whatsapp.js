// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Atau ganti dengan domain spesifik Anda
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export default async function handler(req, res) {
  // Set CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

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
    const orderData = req.body;

    // Validate required fields
    if (!orderData || !orderData.invoiceNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order data - invoiceNumber is required' 
      });
    }

    // Format WhatsApp message
    const message = formatWhatsAppMessage(orderData);

    // Send WhatsApp message via Fonnte
    const result = await sendWhatsAppMessage('089675712795', message);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'WhatsApp notification sent successfully',
        messageId: result.messageId || result.id
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send WhatsApp message'
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
    if (!amount) return '0';
    return parseInt(amount).toLocaleString('id-ID');
  };

  return `🛍️ *PESANAN BARU JEJAK MUFASSIR*

📋 *Detail Pesanan:*
• Invoice: ${orderData.invoiceNumber || '-'}
• Produk: ${orderData.productName || '-'}
• Jenis: ${orderData.jenisProduk || '-'}
• Jumlah: ${orderData.quantity || '1'}
• SKU: ${orderData.sku || '-'}
• Harga: Rp ${formatCurrency(orderData.productPrice)}

👤 *Data Pembeli:*
• Nama: ${orderData.fullName || '-'}
• No. HP: ${orderData.phoneNumber || '-'}
• Email: ${orderData.email || '-'}

📍 *Alamat Pengiriman:*
${orderData.address || '-'}
${orderData.city || '-'}

🚚 *Pengiriman & Pembayaran:*
• Kurir: ${orderData.kurir || '-'}
• Metode Bayar: ${orderData.paymentMethod || '-'}
• Status: ${orderData.status || 'Pending'}

${orderData.voucher && orderData.voucher !== 'Pilih Voucher' ? `🎫 *Voucher:* ${orderData.voucher}` : ''}

💰 *Total Pembayaran:*
Rp ${formatCurrency(orderData.totalPayment)}

⏰ *Waktu Pesanan:*
${orderData.timestamp || new Date().toLocaleString('id-ID')}

${orderData.catatan ? `📝 *Catatan Pembeli:*
${orderData.catatan}` : ''}

${orderData.namaDropshipper ? `🏪 *Info Dropshipper:*
• Nama: ${orderData.namaDropshipper}
• No. HP: ${orderData.nomorDropshipper}` : ''}

---
*Jejak Mufassir - Admin Dashboard*`;
}

// Function to send WhatsApp message via Fonnte
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // Token Fonnte Anda
    const FONNTE_TOKEN = 'oLvQFQGrg6nGpFa9uFQo';
    
    // Format phone number untuk Fonnte
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN
      },
      body: new URLSearchParams({
        'target': formattedPhone,
        'message': message
      })
    });

    const result = await response.json();
    
    console.log('Fonnte Response:', result); // For debugging
    
    // Check if Fonnte response is successful
    if (result.status === true || result.status === 'true') {
      return { 
        success: true, 
        messageId: result.id || result.message_id || 'sent',
        detail: result.detail || 'Message sent successfully'
      };
    } else {
      throw new Error(result.reason || result.message || result.detail || 'Failed to send via Fonnte API');
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp via Fonnte:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Helper function to format phone number for Fonnte
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  let formatted = phoneNumber.replace(/\D/g, '');
  
  // Handle Indonesian phone numbers
  if (formatted.startsWith('08')) {
    // Convert 08xxx to 628xxx
    formatted = '62' + formatted.substring(1);
  } else if (formatted.startsWith('8')) {
    // Convert 8xxx to 628xxx
    formatted = '62' + formatted;
  } else if (!formatted.startsWith('62')) {
    // Add 62 prefix if not present
    formatted = '62' + formatted;
  }
  
  return formatted;
}
