module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // URL Discord Webhook kamu — ganti dengan URL asli
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'GANTI_DENGAN_URL_WEBHOOK_DISCORD_KAMU';

    try {
        const { username, userId, metode, jumlahRobux, totalHarga, status, buktiBase64, buktiMimeType } = req.body;

        if (!username || !jumlahRobux || !totalHarga) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }

        // Buat embed Discord
        const embed = {
            title: '🎮 Transaksi Baru - KazeRoblox',
            color: 0x4CAF50,
            fields: [
                { name: '👤 Username', value: username, inline: true },
                { name: '🆔 User ID', value: userId ? String(userId) : '-', inline: true },
                { name: '\u200B', value: '\u200B', inline: false },
                { name: '⚡ Metode', value: metode || '-', inline: true },
                { name: '💎 Jumlah Robux', value: `${jumlahRobux} Rbx`, inline: true },
                { name: '💰 Total Harga', value: totalHarga, inline: true },
                { name: '✅ Status', value: status || 'SELESAI', inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'KazeRoblox TopUp System' }
        };

        // Kalau ada gambar bukti, kirim sebagai file lampiran
        if (buktiBase64 && buktiMimeType) {
            // Konversi base64 ke buffer
            const imageBuffer = Buffer.from(buktiBase64, 'base64');
            const ext = buktiMimeType.includes('png') ? 'png' : buktiMimeType.includes('jpg') || buktiMimeType.includes('jpeg') ? 'jpg' : 'png';
            const filename = `bukti_transfer_${Date.now()}.${ext}`;

            // Pakai FormData untuk multipart upload ke Discord
            const FormData = require('form-data');
            const form = new FormData();

            form.append('payload_json', JSON.stringify({
                embeds: [embed],
                attachments: [{ id: 0, filename: filename }]
            }));
            form.append('files[0]', imageBuffer, { filename, contentType: buktiMimeType });

            const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: form.getHeaders(),
                body: form.getBuffer()
            });

            if (!webhookRes.ok) {
                const errText = await webhookRes.text();
                console.error('Discord webhook error:', errText);
                return res.status(500).json({ error: 'Gagal kirim webhook', detail: errText });
            }
        } else {
            // Kirim tanpa gambar
            const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!webhookRes.ok) {
                const errText = await webhookRes.text();
                console.error('Discord webhook error:', errText);
                return res.status(500).json({ error: 'Gagal kirim webhook', detail: errText });
            }
        }

        return res.status(200).json({ success: true, message: 'Webhook terkirim' });

    } catch (err) {
        console.error('send-webhook error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
};
