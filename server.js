require('dotenv').config(); // Load konfigurasi dari .env
const express = require('express');
const ModbusRTU = require('modbus-serial');
const os = require('os'); // Untuk mendapatkan informasi jaringan

const app = express();
const port = 3000;

// Konfigurasi Modbus TCP
const client = new ModbusRTU();
const MODBUS_HOST = process.env.MODBUS_HOST || '127.0.0.1'; // Alamat host Modbus
const MODBUS_PORT = process.env.MODBUS_PORT || 502; // Port Modbus

client.connectTCP(MODBUS_HOST, { port: MODBUS_PORT }) // Menghubungkan ke server Modbus
    .then(() => {
        console.log('Connected to Modbus TCP server');
    })
    .catch(err => {
        console.error('Connection error:', err);
    });

// Pengaturan view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Nama-nama register
const registerNames = [
    "Temperature",  // Register 0
    "Pressure",     // Register 1
    "Humidity",     // Register 2
    "Status",       // Register 3
    "Error Code"    // Register 4
];

// Fungsi untuk mendapatkan alamat IP lokal
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const interface in interfaces) {
        for (const address of interfaces[interface]) {
            // Cek apakah alamatnya adalah IPv4 dan bukan alamat loopback
            if (address.family === 'IPv4' && !address.internal) {
                return address.address;
            }
        }
    }
    return '127.0.0.1'; // Kembalikan localhost jika tidak ada IP yang ditemukan
}

// Halaman utama
app.get('/', (req, res) => {
    // Membaca data dari Modbus TCP
    Promise.all([
        client.readHoldingRegisters(0, 5), // Membaca 5 register dari alamat 0
    ])
    .then(data => {
        // Menggabungkan nama register dengan nilainya
        const registers = data[0].data.map((value, index) => ({
            name: registerNames[index],
            value: value
        }));
        res.render('dashboard', { registers: registers, localIP: getLocalIP() }); // Kirim localIP ke view
    })
    .catch(err => {
        console.error('Error reading data:', err);
        res.send('Error reading data from Modbus TCP');
    });
});

// Mulai server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Access the server at: http://${getLocalIP()}:${port}`); // Print local IP
});
