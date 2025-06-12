// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Element refs
const tbody = document.getElementById('sensorData');
const totalDataEl = document.getElementById('totalData');
const container = document.getElementById('container');

let chart;
const chartLabels = [];
const chartTemps = [];

// Render Chart
function renderChart() {
  const ctx = document.getElementById('chartTemperature').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Temperature (°C)',
        data: chartTemps,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Tampilkan data realtime
function loadData(snapshot) {
  tbody.innerHTML = "";
  let no = 1;
  chartLabels.length = 0;
  chartTemps.length = 0;

  snapshot.forEach(doc => {
    const data = doc.data().SensorValue;
    const tanggal = doc.id.split("_")[0].replace(/-/g, "/");
    const waktuKirim = data.WaktuLengkap;
    const waktuTerima = new Date().toLocaleTimeString('id-ID');
    const delay = new Date().getTime() - new Date(waktuKirim).getTime();
    const suhu = data.Temperature;
    const kelembapan = data.HumidityPercent;

    let rowClass = "";
    if (suhu > 30) rowClass += " hot-temp";
    if (kelembapan < 30) rowClass += " low-humidity";

    tbody.innerHTML += `
      <tr class="${rowClass}">
        <td>${no++}</td>
        <td>${tanggal}</td>
        <td class="icon-cell">💧 ${data.Humidity}</td>
        <td>${kelembapan}%</td>
        <td class="icon-cell">🌡 ${suhu}°C</td>
        <td>${data.WaterLevel}</td>
        <td>${data.WaterLevelPercent}%</td>
        <td>${waktuTerima}</td>
        <td>${new Date(waktuKirim).toLocaleTimeString('id-ID')}</td>
        <td>${delay} ms</td>
      </tr>
    `;

    chartLabels.push(new Date(waktuKirim).toLocaleTimeString('id-ID'));
    chartTemps.push(suhu);
  });

  totalDataEl.textContent = snapshot.size;
  renderChart();
}

db.collection("Terrarium")
  .orderBy(firebase.firestore.FieldPath.documentId())
  .onSnapshot(loadData);

// Fitur
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  document.getElementById('dataTable').classList.toggle('dark-mode');
  container.classList.toggle('dark-mode');
}
function exportTableToCSV(filename = 'sensor_data.csv') {
  const table = document.getElementById("dataTable");
  let csv = [];
  for (let row of table.rows) {
    let rowData = [];
    for (let cell of row.cells) {
      rowData.push(cell.innerText);
    }
    csv.push(rowData.join(","));
  }
  const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = URL.createObjectURL(csvFile);
  downloadLink.click();
}
function filterByDate() {
  const selectedDate = document.getElementById("dateFilter").value;
  if (!selectedDate) return;
  const filteredDate = selectedDate.replace(/-/g, "");
  db.collection("Terrarium")
    .orderBy(firebase.firestore.FieldPath.documentId())
    .get()
    .then(snapshot => {
      const filtered = snapshot.docs.filter(doc => doc.id.startsWith(filteredDate));
      loadData(filtered);
    });
}
function resetFilter() {
  document.getElementById("dateFilter").value = "";
  db.collection("Terrarium")
    .orderBy(firebase.firestore.FieldPath.documentId())
    .get()
    .then(loadData);
}
