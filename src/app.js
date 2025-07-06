import {
  TIME_SERIES_SERVICE_UUID,
  TIME_SERIES_CHARACTERISTIC_UUID,
} from "./config.js";
import { add } from "./utils.js";

let serviceWorker; // to hold the new service worker
let refreshing; // flag to prevent multiple reloads

const updateButton = document.getElementById("update-button");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("service worker registered:", reg);

      // listen for when a new service worker is found and waiting
      reg.addEventListener("updatefound", () => {
        serviceWorker = reg.installing;
      });
    })
    .catch((error) => {
      console.error("service worker registration failed:", error);
    });

  // listen for the controllerchange event
  // this fires when a new service worker takes control
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return; // prevent infinite reload loops
    refreshing = true;
    globalThis.location.reload(); // reload the page to apply the update
  });
}

updateButton.addEventListener("click", () => {
  if (serviceWorker) {
    // tell the waiting service worker to skip waiting and activate
    serviceWorker.postMessage({ type: "SKIP_WAITING" });
  }
});

const scanButton = document.getElementById("scan-button");
const disconnectButton = document.getElementById("disconnect-button");
const bluetoothStatus = document.getElementById("bluetooth-status");
const deviceInfo = document.getElementById("device-info");
const characteristicData = document.getElementById("characteristic-data");
const slider = document.getElementById("time-series-range");

let bluetoothDevice = null;
let gattServer = null;

// Function to update UI for connection status
function updateBluetoothStatus(message, isConnected = false) {
  bluetoothStatus.textContent = `Bluetooth Status: ${message}`;
  if (isConnected) {
    scanButton.style.display = "none";
    disconnectButton.style.display = "inline-block";
  } else {
    scanButton.style.display = "inline-block";
    disconnectButton.style.display = "none";
    deviceInfo.textContent = "";
    characteristicData.textContent = "";
  }
}

updateBluetoothStatus("Not connected"); // Initial status

// Event listener for the Scan & Connect button
scanButton.addEventListener("click", async () => {
  updateBluetoothStatus("Scanning...");
  try {
    if (!navigator.bluetooth) {
      updateBluetoothStatus(
        "Web Bluetooth is not supported on this browser or device."
      );
      alert(
        "Web Bluetooth is not supported on this browser or device. Try Chrome on Desktop/Android over HTTPS or localhost."
      );
      return;
    }

    const serviceUUID = TIME_SERIES_SERVICE_UUID;
    const characteristicUUID = TIME_SERIES_CHARACTERISTIC_UUID;

    bluetoothDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [serviceUUID],
    });

    bluetoothDevice.addEventListener("gattserverdisconnected", onDisconnected);

    updateBluetoothStatus(
      `Connecting to "${bluetoothDevice.name || "Unnamed Device"}"...`
    );

    gattServer = await bluetoothDevice.gatt.connect();
    if (gattServer.connected) {
      updateBluetoothStatus(
        `Connected to "${bluetoothDevice.name || "Unnamed Device"}"!`,
        true
      );
      deviceInfo.textContent = `Device ID: ${bluetoothDevice.id}`;
      console.log("Connected GATT Server:", gattServer);

      try {
        const service = await gattServer.getPrimaryService(serviceUUID);
        const characteristic = await service.getCharacteristic(
          characteristicUUID
        );

        // *** NEW: Add event listener for characteristic value changes ***
        characteristic.addEventListener(
          "characteristicvaluechanged",
          (event) => {
            const value = event.target.value; // DataView object
            const timeSeriesNumber = new TextDecoder().decode(value);
            characteristicData.textContent += `Time series number (updated): ${timeSeriesNumber}\n`;
            slider.value = timeSeriesNumber;
            console.log("Time Series Updated:", timeSeriesNumber);
          }
        );

        // *** NEW: Start notifications to receive updates ***
        await characteristic.startNotifications();
        console.log("Notifications started for timeSeriesCharacteristic.");

        // Initial read (optional, if you want the first value immediately)
        const initialValue = await characteristic.readValue();
        const initialTimeSeriesNumber = new TextDecoder().decode(initialValue);
        characteristicData.textContent += `Initial Time series number: ${initialTimeSeriesNumber}\n`;
        console.log("Initial Time Series Value:", initialTimeSeriesNumber);
      } catch (error) {
        console.warn(
          "Could not set up notifications or read characteristic:",
          error
        );
        characteristicData.textContent +=
          "Failed to access or monitor Time Series Characteristic.\n";
      }
    } else {
      updateBluetoothStatus("Failed to connect to GATT server.");
    }
  } catch (error) {
    console.error("Bluetooth error:", error);
    updateBluetoothStatus(`Error: ${error.message}`);
    if (error.name === "NotFoundError" || error.name === "NotAllowedError") {
      updateBluetoothStatus("Scan cancelled or permission denied.");
    }
  }
});

// Event listener for the Disconnect button
disconnectButton.addEventListener("click", () => {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
    updateBluetoothStatus("Disconnecting...");
  } else {
    updateBluetoothStatus("Already disconnected.");
  }
});

// Handler for when the device disconnects
function onDisconnected(event) {
  const device = event.target;
  console.log(`Device "${device.name}" disconnected.`);
  updateBluetoothStatus(
    `Disconnected from "${device.name || "Unnamed Device"}"`
  );
  bluetoothDevice = null;
  gattServer = null;
}

// Check if Bluetooth is available initially (optional)
if ("bluetooth" in navigator) {
  navigator.bluetooth.getAvailability().then((isAvailable) => {
    if (!isAvailable) {
      updateBluetoothStatus("Bluetooth adapter not available on this device.");
      scanButton.disabled = true;
    }
  });
}
