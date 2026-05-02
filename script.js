// Konfigurasi Harga
const RATES = {
    pending: 110, // 5-7 Hari -> 110 Rupiah per 1 Robux
    instant: 130  // Langsung Masuk -> 130 Rupiah per 1 Robux
};

let currentMode = 'pending';
let selectedRobux = 0;
let currentPrice = 0;

/* --- CEK USERNAME ROBLOX --- */
let usernameCheckTimeout = null;
let isUsernameValid = false;
let verifiedUserId = null;
let verifiedUsername = null;

// Simpan file bukti yang diupload
let buktiFile = null;

async function checkRobloxUsername(username) {
    const statusEl = document.getElementById('username-status');

    if (!username || username.trim() === '') {
        statusEl.innerHTML = '';
        isUsernameValid = false;
        verifiedUserId = null;
        return;
    }

    statusEl.innerHTML = `<span class="status-loading"><i class="fas fa-spinner fa-spin"></i> Mengecek username...</span>`;

    try {
        const response = await fetch('/api/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.trim() })
        });

        const data = await response.json();

        if (data.exists === true) {
            verifiedUserId = data.userId;
            verifiedUsername = data.username;
            isUsernameValid = true;

            const avatarHtml = data.avatarUrl
                ? `<img src="${data.avatarUrl}" alt="avatar" class="roblox-avatar" onerror="this.style.display='none'">`
                : '';

            statusEl.innerHTML = `
                <div class="status-valid">
                    ${avatarHtml}
                    <div class="status-info">
                        <span class="status-name"><i class="fas fa-check-circle"></i> ${data.username}</span>
                        <span class="status-id">ID: ${data.userId}</span>
                    </div>
                </div>`;

        } else if (data.exists === false) {
            isUsernameValid = false;
            verifiedUserId = null;
            verifiedUsername = null;
            statusEl.innerHTML = `<span class="status-invalid"><i class="fas fa-times-circle"></i> ${data.error || 'Username tidak ditemukan di Roblox'}</span>`;

        } else {
            isUsernameValid = false;
            verifiedUserId = null;
            verifiedUsername = null;
            statusEl.innerHTML = `<span class="status-error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Gagal mengecek, coba lagi'}</span>`;
        }

    } catch (err) {
        isUsernameValid = false;
        verifiedUserId = null;
        verifiedUsername = null;
        statusEl.innerHTML = `<span class="status-error"><i class="fas fa-exclamation-triangle"></i> Gagal terhubung ke server</span>`;
    }
}

function onUsernameInput() {
    clearTimeout(usernameCheckTimeout);
    isUsernameValid = false;
    verifiedUserId = null;
    verifiedUsername = null;

    const val = document.getElementById('username').value;
    const statusEl = document.getElementById('username-status');

    if (!val || val.trim() === '') {
        statusEl.innerHTML = '';
        return;
    }

    statusEl.innerHTML = `<span class="status-loading"><i class="fas fa-spinner fa-spin"></i> Mengetik...</span>`;

    usernameCheckTimeout = setTimeout(() => {
        checkRobloxUsername(val);
    }, 800);
}

const packages = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
    2000, 3000, 4000, 5000
];

function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function setMode(mode) {
    currentMode = mode;

    document.getElementById('tab-pending').classList.remove('active');
    document.getElementById('tab-instant').classList.remove('active');
    document.getElementById(`tab-${mode}`).classList.add('active');

    const warning = document.getElementById('warning-instant');
    warning.style.display = mode === 'instant' ? 'block' : 'none';

    renderGrid();
    calculateCustomPrice();
}

function renderGrid() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    packages.forEach(amount => {
        const price = amount * RATES[currentMode];

        const card = document.createElement('div');
        card.className = `product-card ${selectedRobux === amount ? 'selected' : ''}`;
        card.onclick = () => selectPackage(amount, price);

        card.innerHTML = `
            <div class="rbx-amount">
                <i class="fas fa-gem"></i> ${amount}
            </div>
            <div class="price">${formatRupiah(price)}</div>
        `;
        grid.appendChild(card);
    });
}

function selectPackage(amount, price) {
    selectedRobux = amount;
    currentPrice = price;

    document.getElementById('custom-robux').value = '';
    document.getElementById('custom-price').innerText = 'Rp 0';

    updateBottomPrice();
    renderGrid();
}

function calculateCustomPrice() {
    const inputVal = document.getElementById('custom-robux').value;

    if (inputVal && inputVal > 0) {
        selectedRobux = 0;
        renderGrid();

        let amount = parseInt(inputVal);

        if (amount > 5000) {
            amount = 5000;
            document.getElementById('custom-robux').value = 5000;
            alert('Maksimal pembelian adalah 5000 Robux per transaksi.');
        }

        currentPrice = amount * RATES[currentMode];
        document.getElementById('custom-price').innerText = formatRupiah(currentPrice);
    } else {
        currentPrice = 0;
        document.getElementById('custom-price').innerText = 'Rp 0';
    }

    updateBottomPrice();
}

function updateBottomPrice() {
    document.getElementById('bottom-total-price').innerText = formatRupiah(currentPrice);
}

document.addEventListener('DOMContentLoaded', () => {
    renderGrid();

    // Handler upload bukti transfer
    const buktiInput = document.getElementById('bukti-input');
    const buktiPreview = document.getElementById('bukti-preview');
    const buktiPreviewImg = document.getElementById('bukti-preview-img');
    const buktiUploadArea = document.getElementById('bukti-upload-area');

    if (buktiInput) {
        buktiInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validasi tipe file
            if (!file.type.startsWith('image/')) {
                alert('Hanya file gambar yang diperbolehkan (JPG, PNG, dll).');
                buktiInput.value = '';
                return;
            }

            // Validasi ukuran (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file maksimal 5MB.');
                buktiInput.value = '';
                return;
            }

            buktiFile = file;

            const reader = new FileReader();
            reader.onload = (ev) => {
                buktiPreviewImg.src = ev.target.result;
                buktiPreview.style.display = 'block';
                buktiUploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }
});

/* --- FUNGSI MODAL CARA BELI --- */
function openCaraBeli() {
    document.getElementById('modal-cara-beli').style.display = 'flex';
}

function closeCaraBeli() {
    document.getElementById('modal-cara-beli').style.display = 'none';
}

/* --- FUNGSI POP-UP QRIS --- */
function beliSekarang() {
    const username = document.getElementById('username').value;

    if (!username) {
        alert("Silakan masukkan Username Roblox kamu terlebih dahulu!");
        return;
    }

    if (!isUsernameValid) {
        alert("Username Roblox tidak valid atau belum terverifikasi. Pastikan username benar dan tunggu proses pengecekan selesai.");
        return;
    }

    if (currentPrice === 0) {
        alert("Silakan pilih atau masukkan jumlah Robux yang ingin dibeli.");
        return;
    }

    const robuxAmount = selectedRobux > 0 ? selectedRobux : document.getElementById('custom-robux').value;
    const typeName = currentMode === 'pending' ? '5-7 Hari (Gamepass)' : 'Langsung Masuk (Instant)';

    document.getElementById('qris-username').innerText = username;
    document.getElementById('qris-metode').innerText = typeName;
    document.getElementById('qris-jumlah').innerText = `${robuxAmount} Robux`;
    document.getElementById('qris-total-price').innerText = formatRupiah(currentPrice);

    // Reset bukti upload
    buktiFile = null;
    document.getElementById('bukti-input').value = '';
    document.getElementById('bukti-preview').style.display = 'none';
    document.getElementById('bukti-upload-area').style.display = 'flex';
    document.getElementById('sudah-bayar-btn').disabled = false;
    document.getElementById('sudah-bayar-btn').innerText = 'Sudah Membayar';

    document.getElementById('modal-qris').style.display = 'flex';
}

function closeQris() {
    document.getElementById('modal-qris').style.display = 'none';
}

function hapusBukti() {
    buktiFile = null;
    document.getElementById('bukti-input').value = '';
    document.getElementById('bukti-preview').style.display = 'none';
    document.getElementById('bukti-upload-area').style.display = 'flex';
}

/* --- FUNGSI KIRIM WEBHOOK + WA --- */
async function konfirmasiWhatsApp() {
    if (!buktiFile) {
        alert('Mohon upload bukti transfer terlebih dahulu sebelum melanjutkan.');
        return;
    }

    const btn = document.getElementById('sudah-bayar-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
        // Konversi gambar ke base64
        const buktiBase64 = await fileToBase64(buktiFile);
        const base64Data = buktiBase64.split(',')[1]; // Hapus prefix data:image/...;base64,

        const username = document.getElementById('username').value;
        const robuxAmount = selectedRobux > 0 ? selectedRobux : document.getElementById('custom-robux').value;
        const typeName = currentMode === 'pending' ? '5-7 Hari (Gamepass)' : 'Langsung Masuk (Instant)';

        // Kirim ke webhook
        const webhookRes = await fetch('/api/send-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: verifiedUsername || username,
                userId: verifiedUserId,
                metode: typeName,
                jumlahRobux: robuxAmount,
                totalHarga: formatRupiah(currentPrice),
                status: 'SELESAI - Bukti Diterima',
                buktiBase64: base64Data,
                buktiMimeType: buktiFile.type
            })
        });

        if (!webhookRes.ok) {
            console.warn('Webhook gagal, tapi transaksi dilanjutkan');
        }

    } catch (err) {
        console.warn('Webhook error:', err);
        // Tetap lanjut ke WhatsApp meski webhook gagal
    }

    // Redirect ke WhatsApp
    const username = document.getElementById('username').value;
    const typeName = currentMode === 'pending' ? '5-7 Hari' : 'Langsung Masuk (Instant)';
    const robuxAmount = selectedRobux > 0 ? selectedRobux : document.getElementById('custom-robux').value;
    const totalBayar = formatRupiah(currentPrice);
    const nomorWA = "6282241515939";

    const pesan =
        `Halo Admin KazeRoblox, saya sudah membayar TopUp Robux.%0A%0A` +
        `*Detail Pesanan:*%0A` +
        `- Username: ${username}%0A` +
        `- Layanan: ${typeName}%0A` +
        `- Jumlah: ${robuxAmount} Rbx%0A` +
        `- Total Bayar: ${totalBayar}%0A` +
        `- Metode: QRIS%0A%0A` +
        `Berikut saya lampirkan bukti transfernya.`;

    window.open(`https://wa.me/${nomorWA}?text=${pesan}`, '_blank');
    closeQris();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

window.onclick = function (event) {
    let modalCaraBeli = document.getElementById('modal-cara-beli');
    let modalQris = document.getElementById('modal-qris');

    if (event.target == modalCaraBeli) modalCaraBeli.style.display = "none";
    if (event.target == modalQris) modalQris.style.display = "none";
};
