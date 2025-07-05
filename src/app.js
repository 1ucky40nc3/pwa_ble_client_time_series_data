console.log("Hello, GeeksforGeeks!");
import { add } from "./utils.js";
console.log(`1 + 1 = ${add(1, 1)}`);

let newWorker; // to hold the new service worker
let refreshing; // flag to prevent multiple reloads

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("service worker registered:", reg);

      // listen for when a new service worker is found and waiting
      reg.addEventListener("updatefound", () => {
        newWorker = reg.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // a new service worker is installed and waiting
              // (and there's an old one controlling the page)
              document.getElementById("updateButton").style.display = "block";
            }
          });
        }
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
    window.location.reload(); // reload the page to apply the update
  });
}

document.getElementById("updateButton").addEventListener("click", () => {
  if (newWorker) {
    // tell the waiting service worker to skip waiting and activate
    newWorker.postMessage({ type: "SKIP_WAITING" });
  }
});
// ********************************************
// Web Bluetooth API Example
// ********************************************

const scanButton = document.getElementById("scanButton");
const disconnectButton = document.getElementById("disconnectButton");
const bluetoothStatus = document.getElementById("bluetooth-status");
const deviceInfo = document.getElementById("device-info");
const characteristicData = document.getElementById("characteristic-data");

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

    // Request a Bluetooth device
    // filters: Specify what kind of devices to show in the chooser.
    // For a minimal example, we can accept all devices.
    // In a real app, you'd use specific service UUIDs or names.
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      // filters: [{ services: ['battery_service'] }], // Example: Filter for battery service
      acceptAllDevices: true, // Accept any discoverable device
      optionalServices: ["battery_service", "device_information"], // Important: Declare services you intend to access
    });

    // Add a disconnect event listener
    bluetoothDevice.addEventListener("gattserverdisconnected", onDisconnected);

    updateBluetoothStatus(
      `Connecting to "${bluetoothDevice.name || "Unnamed Device"}"...`
    );

    // Connect to the GATT server
    gattServer = await bluetoothDevice.gatt.connect();
    if (gattServer.connected) {
      updateBluetoothStatus(
        `Connected to "${bluetoothDevice.name || "Unnamed Device"}"!`,
        true
      );
      deviceInfo.textContent = `Device ID: ${bluetoothDevice.id}`;
      console.log("Connected GATT Server:", gattServer);

      // Example: Try to read Device Information (if available)
      try {
        const deviceInformationService = await gattServer.getPrimaryService(
          "device_information"
        );
        const modelNumberCharacteristic =
          await deviceInformationService.getCharacteristic(
            "model_number_string"
          );
        const modelValue = await modelNumberCharacteristic.readValue();
        const modelNumber = new TextDecoder().decode(modelValue);
        characteristicData.textContent += `Model Number: ${modelNumber}\n`;
        console.log("Model Number:", modelNumber);
      } catch (error) {
        console.warn(
          "Could not read Device Information Service/Characteristic:",
          error
        );
        characteristicData.textContent +=
          "Device Information Service not found or accessible.\n";
      }
    } else {
      updateBluetoothStatus("Failed to connect to GATT server.");
    }
  } catch (error) {
    console.error("Bluetooth error:", error);
    updateBluetoothStatus(`Error: ${error.message}`);
    // Handle UserCancelledProductChooser or similar errors gracefully
    if (error.name === "NotFoundError" || error.name === "NotAllowedError") {
      // User cancelled the device picker or permission denied
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
