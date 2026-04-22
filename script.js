const channelID = "3352393"; 
const readKey = "POU0CT2FSCQS37VE";

// --- GLOBAL MEMORY ---
// These variables store the last known good value to prevent flickering to 0
let lastOcc = 0;
let lastLdr = 0;
let lastTemp = 0;
let lastAqi = 0;

async function updateDashboard() {
    try {
        const response = await fetch(`https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readKey}`);
        const data = await response.json();

        document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));

        // 1. SELECTIVE UPDATE LOGIC
        // Only update memory if the field is NOT null (blank) from the latest feed
        if (data.field1 !== null) lastOcc = parseInt(data.field1);
        if (data.field2 !== null) lastLdr = parseInt(data.field2);
        if (data.field3 !== null) lastTemp = parseInt(data.field3);
        if (data.field4 !== null) lastAqi = parseInt(data.field4);

        // 2. Update UI Numbers using the Memory variables
        document.getElementById('occ-value').innerText = lastOcc;
        document.getElementById('aqi-value').innerText = lastAqi;
        document.getElementById('temp-value').innerText = `${lastTemp}°C`;
        
        // 3. COMBINED INTELLIGENCE LOGIC
        let msg = "System Online";
        let color = "#22c55e"; // Default Green

        // Fire Alert Priority
        if (lastTemp > 45 && lastAqi > 400) {
            msg = "CRITICAL: POSSIBLE FIRE ALERT !";
            color = "#b91c1c"; // Dark Red
        }
        else if (lastAqi > 400) {
            msg = "CRITICAL: Poor Air Quality !";
            color = "#ef4444"; // Red
        } 
        else if (lastOcc > 0 && lastTemp > 38) {
            msg = "COMFORT ALERT: Room is too warm.";
            color = "#ef9952"; // Orange
        }
        else if (lastOcc > 0 && lastTemp < 18) {
            msg = "COMFORT ALERT: Room is too cold.";
            color = "#a1d4f1"; // Blue-ish
        }
        else if (lastOcc > 0 && lastLdr === 0) {
            msg = "WARNING: Lights Off while Occupied.";
            color = "#f59e0b"; // Orange
        } 
        else if (lastOcc === 0) {
            msg = "STANDBY: No Occupancy. Energy Saving Active.";
            color = "#38bdf8"; // Blue
        } 
        else {
            msg = "OPTIMAL: Classroom environment is perfect.";
            color = "#22c55e"; // Green
        }

        // 4. Update Status Card Styling
        const statusBox = document.getElementById('status-card');
        const statusText = document.getElementById('status-message');

        statusText.innerText = msg;
        statusText.style.color = color;
        statusBox.style.borderColor = color;
        statusBox.style.boxShadow = `0 0 20px ${color}33`;

    } catch (error) {
        console.error("Connection Error:", error);
        document.getElementById('status-message').innerText = "Offline: Check ESP32";
    }
}

// Refresh every 15 seconds to match ThingSpeak's free tier limit
setInterval(updateDashboard, 15000);
updateDashboard();