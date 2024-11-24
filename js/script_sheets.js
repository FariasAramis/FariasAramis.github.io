let data = []; // Global variable to store fetched data
let lastFetchTime = 0; // Timestamp to track the last fetch time

// Function to fetch data from Google Sheets
async function fetchDataFromSheet() {
  const sheetID = '12Uv47AZc5e0VqkYuq_Pu5rGHTf2Z-qty-pKOlvQcv9w'; // Replace with your actual Sheet ID
  const range = 'data!A1:E11'; // Adjust the range as per your sheet layout
  const apiKey = 'AIzaSyABEvZcpC1TWyzk6UkOjusxQTLShRxzzJg'; // Replace with your API key
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${range}?key=${apiKey}`;

  const response = await fetch(url);
  const fetchedData = await response.json();

  // Parse the data and return it in the format you need
  const rows = fetchedData.values.slice(1); // Remove header row
  data = rows.map(row => ({
    country: row[0],
    historicDownloads: parseInt(row[1], 10),
    lastHour: parseInt(row[2], 10),
    lat: parseFloat(row[3]),
    lon: parseFloat(row[4]),
  }));

  lastFetchTime = Date.now(); // Update the fetch timestamp
}

// Function to update the map labels
async function updateMap() {
  const currentTime = Date.now();
  
  // Fetch new data if it's empty or 15 minutes have passed (900,000 ms)
  if (data.length === 0 || currentTime - lastFetchTime >= 900000) {
    await fetchDataFromSheet();
  }

  // Clear existing markers before adding new ones
  markersLayer.clearLayers();

  // Calculate and display real-time download count
  data.forEach(item => {
    const elapsedSeconds = new Date().getSeconds() + (new Date().getMinutes() * 60); // Total seconds in the current hour
    const increment = Math.floor(item.lastHour * (elapsedSeconds / 3600)); // 3600 seconds in an hour
    const currentDownloads = item.historicDownloads + increment;

    // Create a text label for each country
    const label = L.divIcon({
      className: 'download-label',
      html: `<div>${item.country} <br>
      ${currentDownloads.toLocaleString()}</div>`,
      iconSize: [100, 40],
      iconAnchor: [50, 20],
    });

    // Add the label as a marker
    L.marker([item.lat, item.lon], { icon: label }).addTo(markersLayer);
  });
}

// Initialize map
const map = L.map('map', {
  worldCopyJump: false,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ]
}).setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Layer group to hold markers
const markersLayer = L.layerGroup().addTo(map);

// Initial map load
updateMap();

// Update every 1 second
setInterval(updateMap, 1000); // 1,000 milliseconds = 1 second
