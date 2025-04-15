import QRCode from 'qrcode';

export  async function generateQRCodeBase64(data) {
  try {
    const jsonData = JSON.stringify(data);
    const base64Image = await QRCode.toDataURL(jsonData);
    return base64Image;
  } catch (err) {
    console.error("Error generating base64 QR code:", err);
    throw err;
  }
}