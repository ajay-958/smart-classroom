from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import socket
import time

app = FastAPI()

# --- CRITICAL: CORS SETTINGS ---
# This allows your HTML dashboard to read data from this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (local files, github pages, etc)
    allow_methods=["*"],
    allow_headers=["*"],
)

class BLEScanData(BaseModel):
    node_id: str
    device_mac: str
    rssi: int

# Store data with timestamps: { "node_1": {"MAC_ADDR": time}, "node_2": {...} }
scans = {"node_1": {}, "node_2": {}}

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

@app.post("/scan")
async def receive_scan(data: BLEScanData):
    # .strip() removes any accidental hidden spaces sent by the ESP32
    received_node = data.node_id.strip() 
    
    if received_node in scans:
        scans[received_node][data.device_mac] = time.time()
        print(f"✅ SUCCESS: Saved {data.device_mac} into {received_node}")
    else:
        # If the ESP32 sends the wrong name, the terminal will scream in red/error!
        print(f"❌ ERROR: ESP32 sent wrong node name: '{received_node}'. Expected 'node_1' or 'node_2'.")
        
    return {"status": "success"}

@app.get("/attendance")
async def get_attendance():
    current_time = time.time()
    active_timeout = 40  # If a device isn't seen for 40s, consider it gone
    
    # Filter only recently seen devices for each node
    active_node_1 = [mac for mac, ts in scans["node_1"].items() if current_time - ts < active_timeout]
    active_node_2 = [mac for mac, ts in scans["node_2"].items() if current_time - ts < active_timeout]

    # Find COMMON devices (The student is in the middle of both sensors)
    common_devices = list(set(active_node_1) & set(active_node_2))

    return {
        "common_devices": common_devices, 
        "count": len(common_devices),
        "node_1_count": len(active_node_1),
        "node_2_count": len(active_node_2)
    }

@app.get("/")
async def root():
    return {"message": "Smart Classroom Attendance Server is Active"}

if __name__ == "__main__":
    local_ip = get_local_ip()
    print("\n" + "="*60)
    print("🚀 ATTENDANCE SERVER IS STARTING...")
    print(f"👉 DASHBOARD URL:  http://{local_ip}:5000/attendance")
    print(f"👉 ESP32 CONFIG:   http://{local_ip}:5000/scan")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=5000)