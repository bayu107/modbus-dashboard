const express = require('express');
const ModbusRTU = require('modbus-serial');

const app = express();
const port = 3000;

// Konfigurasi Modbus TCP
const client = new ModbusRTU();

client.connectTCP('127.0.0.1', { port: 502 }) // Menghubungkan ke server Modbus
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
        res.render('dashboard', { registers: registers });
    })
    .catch(err => {
        console.error('Error reading data:', err);
        res.send('Error reading data from Modbus TCP');
    });
});

// Mulai server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
