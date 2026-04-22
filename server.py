from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app) # CRITICAL: Allows your HTML file to fetch data from Python

# Store data: { "node_1": {"MAC1": timestamp, "MAC2": timestamp}, "node_2": {...} }
scans = {"node_1": {}, "node_2": {}}

@app.route('/scan', methods=['POST'])
def receive_scan():
    data = request.json
    node = data.get("node_id")
    mac = data.get("device_mac")
    
    if node in scans:
        scans[node][mac] = time.time() # Record the exact time we saw it
    return jsonify({"status": "success"}), 200

@app.route('/attendance', methods=['GET'])
def get_attendance():
    current_time = time.time()
    active_timeout = 30 # Drop devices not seen in the last 30 seconds

    # Clean up old devices
    active_node_1 = [mac for mac, ts in scans["node_1"].items() if current_time - ts < active_timeout]
    active_node_2 = [mac for mac, ts in scans["node_2"].items() if current_time - ts < active_timeout]

    # Find the COMMON devices (Intersection of both lists)
    common_devices = list(set(active_node_1) & set(active_node_2))

    return jsonify({
        "common_devices": common_devices,
        "count": len(common_devices)
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)