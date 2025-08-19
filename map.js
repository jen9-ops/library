const $ = id => document.getElementById(id);
function showErr(msg) {
    const errDiv = $('err');
    errDiv.textContent = msg;
    errDiv.style.display = 'block';
    setTimeout(() => { errDiv.style.display = 'none'; }, 3000);
}

function mgrsToLatLng(s) {
  try {
    const pt = mgrs.toPoint(s.trim().replace(/\s+/g, ' ').toUpperCase());
    return { lat: pt[1], lng: pt[0] };
  } catch { throw new Error("Неверный формат MGRS"); }
}

const map = L.map('map', { 
    zoomControl: false, 
    zoomSnap: 0.25, 
    zoomDelta: 0.25,
    attributionControl: false
}).setView([49.83, 24.01], 10);

L.control.zoom({ position: 'bottomright' }).addTo(map);

const layers = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
};

let currentLayer = 'esri';
layers[currentLayer].addTo(map);

const searchPanel = $('searchPanel');
const mgrsInput = $('mgrsInput');

mgrsInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5);
    e.target.value = value;
});

function hideSearchPanel() {
    searchPanel.classList.remove('visible');
}

function searchMgrs() {
  const userInput = mgrsInput.value;
  if (userInput.replace(/\s/g, '').length !== 10) {
    showErr("Введите 10 цифр координат");
    return;
  }
  const fullMgrs = "37U DQ " + userInput;
  try {
    const ll = mgrsToLatLng(fullMgrs);
    map.setView(ll, 15);
    mgrsInput.value = '';
    hideSearchPanel();
  } catch (e) {
    showErr("Неверные координаты");
  }
}

$('searchToggleBtn').onclick = (e) => {
    e.stopPropagation();
    searchPanel.classList.toggle('visible');
    if (searchPanel.classList.contains('visible')) mgrsInput.focus();
};

$('goBtn').onclick = searchMgrs;
mgrsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchMgrs(); });
map.on('click', hideSearchPanel);

$('layerBtn').onclick = () => {
  map.removeLayer(layers[currentLayer]);
  currentLayer = currentLayer === 'esri' ? 'osm' : 'esri';
  layers[currentLayer].addTo(map);
};

$('snapBtn').onclick = () => {
  leafletImage(map, (err, canvas) => {
    if (err) { showErr('Не удалось создать изображение.'); return; }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'map_snapshot.png';
    a.click();
  });
};

const modal = $('modal');
const iframe1 = $('iframe1');
const secondModal = $('secondModal');
const iframe2 = $('iframe2');
const gpsPermissionModal = $('gpsPermissionModal');

$('openModalBtn').onclick = () => {
    iframe1.src = '1.html';
    modal.style.display = 'flex'; 
};
$('closeModalBtn').onclick = () => { modal.style.display = 'none'; };

$('openSecondModalBtn').onclick = () => { 
    iframe2.src = '2.html';
    secondModal.style.display = 'flex'; 
};
$('closeSecondModalBtn').onclick = () => { secondModal.style.display = 'none'; };
$('closeGpsModalBtn').onclick = () => { gpsPermissionModal.style.display = 'none'; };

const zoomDisplay = $('zoomDisplay');
let zoomTimeout;

const centerCrosshair = $('centerCrosshair');
const mgrsDisplay = $('mgrsDisplay');
const latLonDisplay = $('latLonDisplay');

function updateUIOnMapChange() {
    clearTimeout(zoomTimeout);
    const currentZoom = map.getZoom();
    zoomDisplay.textContent = `Зум: ${currentZoom.toFixed(2)}`;
    zoomDisplay.classList.add('visible');
    zoomTimeout = setTimeout(() => {
        zoomDisplay.classList.remove('visible');
    }, 2000);

    const baseSize = 30;
    const minSize = 10;
    const maxSize = 24;
    let size = baseSize - currentZoom * 1.6;
    size = Math.max(minSize, Math.min(maxSize, size));
    centerCrosshair.style.width = `${size}px`;
    centerCrosshair.style.height = `${size}px`;

    const center = map.getCenter();
    const mgrsString = mgrs.forward([center.lng, center.lat], 5);
    const formattedMgrs = mgrsString.replace(/^(\d{2}[A-Z]\s[A-Z]{2})(\d{5})(\d{5})$/, '$1 $2 $3');
    mgrsDisplay.textContent = 'MGRS: ' + formattedMgrs;
    latLonDisplay.textContent = `Lat: ${center.lat.toFixed(5)} Lon: ${center.lng.toFixed(5)}`;
}

map.on('zoomend move', updateUIOnMapChange);
map.on('move', () => {
    const center = map.getCenter();
    const mgrsString = mgrs.forward([center.lng, center.lat], 5);
    const formattedMgrs = mgrsString.replace(/^(\d{2}[A-Z]\s[A-Z]{2})(\d{5})(\d{5})$/, '$1 $2 $3');
    mgrsDisplay.textContent = 'MGRS: ' + formattedMgrs;
    latLonDisplay.textContent = `Lat: ${center.lat.toFixed(5)} Lon: ${center.lng.toFixed(5)}`;
});


mgrsDisplay.addEventListener('click', () => {
    const textToCopy = mgrsDisplay.textContent.replace('MGRS: ', '');
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = mgrsDisplay.textContent;
        mgrsDisplay.textContent = 'Скопировано!';
        setTimeout(() => { mgrsDisplay.textContent = originalText; }, 1500);
    });
});

latLonDisplay.addEventListener('click', () => {
    const textToCopy = latLonDisplay.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = latLonDisplay.textContent;
        latLonDisplay.textContent = 'Скопировано!';
        setTimeout(() => { latLonDisplay.textContent = originalText; }, 1500);
    });
});

updateUIOnMapChange();

const geoBtn = $('geoBtn');
function handleGeoError(error) {
    let message;
    switch (error.code) {
        case error.PERMISSION_DENIED:
            gpsPermissionModal.style.display = 'flex';
            return;
        case error.POSITION_UNAVAILABLE:
            message = "Информация о местоположении недоступна.";
            break;
        case error.TIMEOUT:
            message = "Время запроса истекло.";
            break;
        default:
            message = "Произошла неизвестная ошибка.";
            break;
    }
    showErr(message);
}

geoBtn.onclick = () => {
    if (!navigator.geolocation) {
        showErr("Геолокация не поддерживается вашим браузером.");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 16);
            L.circleMarker([latitude, longitude], {radius: 8, color: '#136ef6', fillOpacity: 0.8}).addTo(map)
                .bindPopup("Вы здесь").openPopup();
        },
        handleGeoError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
};
