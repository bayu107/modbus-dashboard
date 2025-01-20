require('dotenv').config(); // Load konfigurasi dari .env

const express = require('express');
const ModbusRTU = require('modbus-serial'); // Untuk komunikasi Modbus
const os = require('os'); // Untuk mendapatkan informasi jaringan
const app = express();
const port = 3000;

// Ambil konfigurasi dari file .env
const MODBUS_HOST = process.env.MODBUS_HOST || '127.0.0.1';
const MODBUS_PORT = parseInt(process.env.MODBUS_PORT) || 502;
const MODBUS_ID = parseInt(process.env.MODBUS_ID) || 1;
const REGISTER_START = parseInt(process.env.REGISTER_START) || 0;
const REGISTER_COUNT = parseInt(process.env.REGISTER_COUNT) || 5;

const modbusClient = new ModbusRTU();

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

// Connect to Modbus server
async function connectModbus() {
    try {
        await modbusClient.connectTCP(MODBUS_HOST, { port: MODBUS_PORT });
        modbusClient.setID(MODBUS_ID);
        console.log('Connected to Modbus server');
    } catch (error) {
        console.error('Failed to connect to Modbus server:', error);
    }
}

// Fetch Modbus data
async function fetchModbusData() {
    try {
        const data = await modbusClient.readHoldingRegisters(REGISTER_START, REGISTER_COUNT);
        return data.data;
    } catch (error) {
        console.error('Failed to fetch Modbus data:', error);
        return [];
    }
}

// Route for dashboard
app.get('/', async (req, res) => {
    const modbusData = await fetchModbusData();
    res.render('dashboard', { modbusData });
});

// Start server
app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Access the server at: http://${getLocalIP()}:${port}`); // Print local IP
    await connectModbus();
});
