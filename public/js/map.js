// Initialize the Leaflet map centered on UNCG
var map = L.map('map').setView([36.0687, -79.8072], 15); // Centered on UNCG

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Charging station locations with images and statuses
var chargers = [
    {
        id: 1,
        name: "Nursing Building Chargers",
        lat: 36.068158,
        lng: -79.8066976,
        status: "available",
        image: "images/walker.jpg"
    },
    {
        id: 2,
        name: "Oakland Ave Parking Deck",
        lat: 36.064840,
        lng: -79.811777,
        status: "in_use",
        image: "images/oakland.jpg"
    },
    {
        id: 3,
        name: "McIver Deck Chargers",
        lat: 36.071605,
        lng: -79.807059,
        status: "available",
       image: "images/spring_garden.jpg"
    },

];

// Function to open Google Maps directions
function openDirections(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// Define icons for each status
const chargerIcons = {
    available: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    }),
    in_use: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    }),
    out_of_order: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    }),
    maintenance: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    })
};

// Loop through each charger and place a custom marker
chargers.forEach(station => {
    const icon = chargerIcons[station.status] || chargerIcons.available;

    L.marker([station.lat, station.lng], { icon })
        .addTo(map)
        .bindPopup(`
            <div style="text-align:center;">
                <b>${station.name}</b><br>
                <img src="${station.image}" alt="${station.name}" style="width:100%; max-width:250px; border-radius:10px; margin-top:5px;"><br>
                Status: <strong>${station.status.replaceAll("_", " ")}</strong><br>
                <div style="margin-top:10px;">
                    <button onclick="openDirections(${station.lat}, ${station.lng})" 
                        style="margin:3px; padding:5px 10px; background:#0f2044; color:white; border:none; cursor:pointer;">
                        Get Directions
                    </button>
                    <button onclick="navigateToBooking(${station.id})" 
                        style="margin:3px; padding:5px 10px; background:#2d7f2d; color:white; border:none; cursor:pointer;">
                        Book Now
                    </button>
                    <button onclick="navigateToReportIssue(${station.id})" 
                        style="margin:3px; padding:5px 10px; background:#a32020; color:white; border:none; cursor:pointer;">
                        Report Issue
                    </button>
                </div>
            </div>
        `);
});

// Navigate to the booking page with the station ID as a query parameter
function navigateToBooking(stationId) {
    window.location.href = `booking.html?stationId=${stationId}`;
}

// Navigate to the report issue page with the station ID as a query parameter
function navigateToReportIssue(stationId) {
    window.location.href = `issue_report.html?stationId=${stationId}`;
}

// WebSocket for real-time charger updates
const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', event => {
    const chargerData = JSON.parse(event.data);
    updateChargerStatus(chargerData);
});

function updateChargerStatus(chargerData) {
    chargerData.forEach(charger => {
        const chargerElement = document.getElementById(`charger-${charger.id}`);
        if (chargerElement) {
            chargerElement.className = `charger-status ${charger.status}`;
            chargerElement.title = `Status: ${charger.status}`;
        }
    });
}

// Cache charger data to reduce unnecessary API calls
let cachedChargerData = null;
function fetchChargerData() {
    fetch('/api/charger-locations')
        .then(response => response.json())
        .then(data => {
            if (JSON.stringify(data) !== JSON.stringify(cachedChargerData)) {
                cachedChargerData = data;
                updateChargerStatus(data);
            }
        });
}

// Poll for updates every 30 seconds
setInterval(fetchChargerData, 30000);
