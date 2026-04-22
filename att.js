// This IP must match where your Python server is running!
const SERVER_URL = "http://10.39.119.36:5000/attendance";

async function fetchAttendance() {
    try {
        const response = await fetch(SERVER_URL);
        const data = await response.json();
        
        // Assuming the Python server sends JSON like: { "common_devices": ["AA:BB:CC:DD", "11:22:33:44"], "count": 2 }
        const deviceList = document.getElementById('device-list');
        const countBadge = document.getElementById('total-count');
        
        deviceList.innerHTML = ''; // Clear old data
        
        if (data.common_devices && data.common_devices.length > 0) {
            countBadge.innerText = `Total: ${data.common_devices.length}`;
            
            data.common_devices.forEach(mac => {
                const li = document.createElement('li');
                li.className = 'student-card';
                li.innerHTML = `
                    <div class="status-dot"></div>
                    <span class="mac-address">${mac}</span>
                `;
                deviceList.appendChild(li);
            });
        } else {
            countBadge.innerText = `Total: 0`;
            deviceList.innerHTML = '<li style="color: var(--text-muted);">No common devices detected in zone.</li>';
        }

    } catch (error) {
        console.error("Error fetching attendance:", error);
        document.getElementById('device-list').innerHTML = '<li style="color: #ef4444;">Server offline or disconnected. Check Python script.</li>';
    }
}

// Refresh attendance list every 5 seconds
setInterval(fetchAttendance, 5000);
fetchAttendance();