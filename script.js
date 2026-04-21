const channelID = "YOUR_CHANNEL_ID"; 

async function updateDashboard() {
    try {
        const response = await fetch(`https://api.thingspeak.com/channels/${channelID}/feeds/last.json`);
        const data = await response.json();

        // Remove loading state
        document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));

        // 1. Get values from ThingSpeak fields
        let occ = parseInt(data.field1) || 0; // ESP1
        let ldr = parseInt(data.field2) || 0; // ESP1
        let temp = parseInt(data.field3) || 0; // ESP2
        let aqi = parseInt(data.field5) || 0; // ESP2

        // 2. Update UI Numbers
        document.getElementById('occ-value').innerText = occ;
        document.getElementById('aqi-value').innerText = aqi;

        // 3. COMBINED INTELLIGENCE LOGIC
        let msg = "System Online";
        let color = "#22c55e"; // Default Green

        if (aqi > 800) {
            msg = "CRITICAL: Poor Air Quality !";
            color = "#ef4444"; // Red
        } 
        else if (occ > 0 && temp > 28) {
            msg = "COMFORT ALERT: Room is too warm.";
            color = "#f59e0b"; // Orange
        }
        else if (occ > 0 && temp < 18) {
            msg = "COMFORT ALERT: Room is too cold.";
            color = "#f59e0b"; // Orange
        }
        else if (occ > 0 && ldr < 300) {
            msg = "WARNING: Low Light Levels.";
            color = "#f59e0b"; // Orange
        } 
        else if (occ === 0) {
            msg = "STANDBY: No Occupancy. Energy Saving Active.";
            color = "#38bdf8"; // Blue
        } 
        else {
            msg = "OPTIMAL: Classroom environment is perfect.";
            color = "#22c55e"; // Green
        }

        // 4. Update Status Card
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

// Refresh every 15 seconds
setInterval(updateDashboard, 15000);
updateDashboard();