import { BluetoothLe } from '@capacitor-community/bluetooth-le';
let selectedDeviceId = null;

document.getElementById("scanButton").addEventListener("click", scanDevices);
document.getElementById("readDataButton").addEventListener("click", readData);

export async function scanDevices() {
    document.getElementById('status').textContent = 'Scanning for devices...';
    try {
        // Initialize Bluetooth if not already initialized
        await BluetoothLe.initialize();
        // await BleClient.initialize({ androidNeverForLocation: true });
        console.log('Bluetooth Initialized');

        // Scan for devices that support specific services (scales or blood pressure)
        const devices = await BluetoothLe.requestDevice({
            services: [
                '00001810-0000-1000-8000-00805f9b34fb',  // Weight Scale Service UUID
                '0000181d-0000-1000-8000-00805f9b34fb'   // Blood Pressure
            ]
        });

        if (devices.devices && devices.devices.length > 0) {
            selectedDeviceId = devices.devices[0].deviceId;
            document.getElementById('status').textContent = `Device found: ${selectedDeviceId}`;
        } else {
            document.getElementById('status').textContent = 'No devices found.';
        }
    } catch (err) {
        console.error("Error while scanning for devices", err);
        document.getElementById('status').textContent = 'Error while scanning for devices.' + err;
    }
}

// Connect to the device and read data
export async function readData() {
    if (!selectedDeviceId) {
        document.getElementById('status').textContent = 'Please scan for a device first.';
        return;
    }

    document.getElementById('status').textContent = 'Connecting to device...';

    try {
        // Connect to the device
        await BluetoothLe.connect({ deviceId: selectedDeviceId });
        document.getElementById('status').textContent = `Connected to device: ${selectedDeviceId}`;

        // Discover services and characteristics
        const services = await BluetoothLe.discoverServices({ deviceId: selectedDeviceId });
        console.log('Discovered services:', services);

        // Read data from weight scale (example UUIDs)
        const weightData = await BluetoothLe.read({
            deviceId: selectedDeviceId,
            service: '00001810-0000-1000-8000-00805f9b34fb', // UUID for weight scale service
            characteristic: '2A9D' // UUID for weight characteristic
        });

        const bloodPressureData = await BluetoothLe.read({
            deviceId: selectedDeviceId,
            service: '0000181d-0000-1000-8000-00805f9b34fb', // UUID for blood pressure service
            characteristic: '2A35' // UUID for blood pressure characteristic
        });

        // Display the parsed data
        document.getElementById('data').innerHTML = `
            <p>Weight: ${parseWeightData(weightData)} kg</p>
            <p>Blood Pressure: ${parseBloodPressureData(bloodPressureData).systolic}/${parseBloodPressureData(bloodPressureData).diastolic} mmHg</p>
        `;
        document.getElementById('status').textContent = 'Data read successfully.';
    } catch (err) {
        console.error("Error connecting or reading from device", err);
        document.getElementById('status').textContent = 'Error reading data from device.';
    }
}

// parse weight data
function parseWeightData(rawData) {
    const data = new Uint8Array(rawData.value);
    return data
    // const weight = (data[1] << 8) | data[0]; // Example parsing for 2 bytes
    // return weight / 100; // Convert to kilograms (adjust based on device format)
}

// parse blood pressure data
function parseBloodPressureData(rawData) {
    const data = new Uint8Array(rawData.value);
    const systolic = data[1];
    const diastolic = data[3];
    return { systolic, diastolic, pulse };
}
