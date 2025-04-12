import QRCode from 'qrcode';
import { writeFile } from 'fs/promises';

export async function makeQr(data, filename = 'qrcode_with_json.png') {

  try {
    const jsonData = JSON.stringify(data);
    const buffer = await QRCode.toBuffer(jsonData);
    await writeFile(filename, buffer);
    console.log(`QR code saved to ${filename}`);
  } catch (err) {
    console.error("Error generating QR code:", err);
  }
}
