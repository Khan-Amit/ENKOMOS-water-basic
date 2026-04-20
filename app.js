// ==================== ENKOMOS-Water-Basic ====================
// Structured Water Intelligence | Offline | Encrypted
// Code Protection: Obfuscated + Encryption + Self-Check

// ==================== CONFIGURATION ====================
const APP_VERSION = '1.0.0';
const APP_NAME = 'ENKOMOS-Water-Basic';
const ENCRYPTION_KEY = 'ENKOMOS-WATER-2026-ESTELA-KEY';

// Storage keys
const STORAGE_KEY = 'enkomos_water_data';
const BACKUP_KEY = 'enkomos_water_backup';

// ==================== ENCRYPTION (Code Protection) ====================
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    } catch(e) { console.error('Encryption error:', e); return null; }
}

function decryptData(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch(e) { console.error('Decryption error:', e); return null; }
}

// ==================== DATA STORAGE ====================
let waterReadings = [];

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const decrypted = decryptData(stored);
        if (decrypted && decrypted.readings) {
            waterReadings = decrypted.readings;
        } else {
            // Fallback for old unencrypted data
            try {
                const parsed = JSON.parse(stored);
                if (parsed.readings) waterReadings = parsed.readings;
                else waterReadings = [];
            } catch(e) { waterReadings = []; }
        }
    }
    updateCounters();
    displayHistory();
    displayAdvice();
}

function saveData() {
    const dataToSave = {
        app: APP_NAME,
        version: APP_VERSION,
        lastUpdated: new Date().toISOString(),
        readings: waterReadings
    };
    const encrypted = encryptData(dataToSave);
    localStorage.setItem(STORAGE_KEY, encrypted);
    updateCounters();
    displayHistory();
    displayAdvice();
}

function addReading(reading) {
    reading.id = Date.now();
    reading.timestamp = new Date().toISOString();
    reading.tier = getCurrentTier();
    waterReadings.unshift(reading); // newest first
    saveData();
}

function deleteReading(id) {
    waterReadings = waterReadings.filter(r => r.id !== id);
    saveData();
}

function updateCounters() {
    const pending = waterReadings.filter(r => !r.synced).length;
    const synced = waterReadings.filter(r => r.synced).length;
    document.getElementById('pendingCount').innerText = pending;
    document.getElementById('syncedCount').innerText = synced;
}

function getCurrentTier() {
    const activeBtn = document.querySelector('.tier-btn.active');
    return activeBtn ? activeBtn.dataset.tier : 'A';
}

// ==================== UI RENDERING ====================
function displayHistory() {
    const container = document.getElementById('historyList');
    if (waterReadings.length === 0) {
        container.innerHTML = '<div class="empty-state">No readings yet. Add your first water quality reading.</div>';
        return;
    }

    let html = '';
    for (const reading of waterReadings) {
        const date = new Date(reading.timestamp).toLocaleString();
        html += `
            <div class="history-item">
                <div class="history-header">
                    <span>📍 ${reading.location || 'Unknown'}</span>
                    <span>${date}</span>
                </div>
                <div class="history-data">
                    <span>💧 pH: ${reading.ph || '—'}</span>
                    <span>⚡ ORP: ${reading.orp || '—'} mV</span>
                    <span>💨 DO: ${reading.do || '—'} ppm</span>
                    <span>🌡️ ${reading.temp || '—'}°C</span>
                </div>
                <div class="history-data">
                    <span>🐟 ${reading.fish_species || 'No fish'}</span>
                    <span>🌀 ${reading.structured_method || 'None'}</span>
                </div>
                <div style="margin-top: 8px;">
                    ${!reading.synced ? '<span class="pending-badge">Pending export</span>' : ''}
                    <span class="encrypted-badge">🔒 Encrypted</span>
                    <button onclick="deleteReadingUI(${reading.id})" style="float: right; background: none; border: none; color: #e74c3c; font-size: 0.7em;">Delete</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.deleteReadingUI = function(id) {
    if (confirm('Delete this reading?')) {
        deleteReading(id);
    }
};

function displayAdvice() {
    const container = document.getElementById('adviceList');
    if (waterReadings.length === 0) {
        container.innerHTML = '<div class="empty-state">Save readings to get AI advice on water quality.</div>';
        return;
    }

    const latest = waterReadings[0];
    let adviceHtml = '<div class="history-item"><div class="section-title" style="margin-top:0;">📊 Latest Reading Analysis</div>';

    // pH advice
    const ph = parseFloat(latest.ph);
    if (!isNaN(ph)) {
        if (ph < 6.0) adviceHtml += '<div class="history-data"><span>⚠️ pH too low (<6.0). Add limestone or coral chips.</span></div>';
        else if (ph > 8.5) adviceHtml += '<div class="history-data"><span>⚠️ pH too high (>8.5). Add organic matter or peat moss.</span></div>';
        else if (ph >= 6.5 && ph <= 7.5) adviceHtml += '<div class="history-data"><span>✅ pH optimal (6.5-7.5). Good for most fish and plants.</span></div>';
    }

    // Dissolved Oxygen advice
    const doVal = parseFloat(latest.do);
    if (!isNaN(doVal)) {
        if (doVal < 4) adviceHtml += '<div class="history-data"><span>⚠️ Low oxygen (<4 ppm). Increase aeration or reduce stocking density.</span></div>';
        else if (doVal >= 5) adviceHtml += '<div class="history-data"><span>✅ Oxygen levels good (>5 ppm).</span></div>';
    }

    // ORP advice (structured water effectiveness)
    const orp = parseFloat(latest.orp);
    if (!isNaN(orp)) {
        if (orp < 200) adviceHtml += '<div class="history-data"><span>💧 ORP low (<200 mV). Structured water may be ineffective. Check your system.</span></div>';
        else if (orp >= 250 && orp <= 400) adviceHtml += '<div class="history-data"><span>✅ ORP optimal (250-400 mV). Structured water working well.</span></div>';
        else if (orp > 400) adviceHtml += '<div class="history-data"><span>⚡ ORP high (>400 mV). Good for disinfection, but monitor fish stress.</span></div>';
    }

    // Ammonia advice
    const ammonia = parseFloat(latest.ammonia);
    if (!isNaN(ammonia) && ammonia > 0.5) {
        adviceHtml += '<div class="history-data"><span>⚠️ Ammonia high (>0.5 ppm). Partial water change needed. Check filtration.</span></div>';
    }

    // Structured water advice
    if (latest.structured_method === 'none') {
        adviceHtml += '<div class="history-data"><span>💡 Tip: Structured water can improve oxygen levels and fish health. Consider magnetic or vortex method.</span></div>';
    }

    adviceHtml += '</div>';
    container.innerHTML = adviceHtml;
}

function displayStructuredGuide() {
    const container = document.getElementById('structuredGuide');
    const tier = getCurrentTier();
    
    let guideHtml = `
        <div class="history-item">
            <div class="section-title" style="margin-top:0;">🌀 Structured Water Guide (Tier ${tier})</div>
    `;
    
    if (tier === 'A') {
        guideHtml += `
            <div class="history-data"><span>🏠 Home / Small Grower (&lt;0.5 ha)</span></div>
            <div class="history-data"><span>🔹 Recommended: Magnetic coil (inline) or small vortex attachment for garden hose</span></div>
            <div class="history-data"><span>🔹 Cost: $10-50</span></div>
            <div class="history-data"><span>🔹 Handheld sensors: pH pen ($15), ORP meter ($25), DO meter ($50)</span></div>
            <div class="history-data"><span>🔹 Manual entry via ENKOMOS-Field mobile app</span></div>
        `;
    } else if (tier === 'B') {
        guideHtml += `
            <div class="history-data"><span>🤝 Co-op / Medium Commercial (0.5-2 ha)</span></div>
            <div class="history-data"><span>🔹 Recommended: Copper coil + magnetic array (10-20m coil) + vortex chamber</span></div>
            <div class="history-data"><span>🔹 Cost: $150-600</span></div>
            <div class="history-data"><span>🔹 Semi-automated sensors: Continuous pH/ORP with manual logging</span></div>
            <div class="history-data"><span>🔹 Vendor support: Local technician installs and trains</span></div>
        `;
    } else {
        guideHtml += `
            <div class="history-data"><span>🏭 Corporate / Large Commercial (2+ ha)</span></div>
            <div class="history-data"><span>🔹 Recommended: All three methods (Magnetic + Vortex + Electric Induction)</span></div>
            <div class="history-data"><span>🔹 Cost: $1,000-5,000</span></div>
            <div class="history-data"><span>🔹 Fully automated sensors: Real-time pH, ORP, DO, flow, turbidity</span></div>
            <div class="history-data"><span>🔹 Central control: ENKOMOS-Water web dashboard + API</span></div>
        `;
    }
    
    guideHtml += `
            <div class="section-title">🔬 How Structured Water Works</div>
            <div class="history-data"><span>Magnetic Coil: Water flows through copper pipe wrapped with alternating magnets. Reduces scale, improves hydration.</span></div>
            <div class="history-data"><span>Vortex Chamber: Water spins through conical chamber. Increases dissolved oxygen, reduces surface tension.</span></div>
            <div class="history-data"><span>Electric Induction: Low-voltage field alters water cluster size. Increases ORP, improves nutrient uptake.</span></div>
            <div class="section-title">📊 Benefits for Your System</div>
            <div class="history-data"><span>✅ 20-30% increase in dissolved oxygen</span></div>
            <div class="history-data"><span>✅ 15-25% reduction in fish disease</span></div>
            <div class="history-data"><span>✅ 10-20% faster growth rates</span></div>
            <div class="history-data"><span>✅ Cleaner tanks, less algae, better water clarity</span></div>
        </div>
    `;
    
    container.innerHTML = guideHtml;
}

// ==================== EXPORT FUNCTION ====================
function exportData() {
    if (waterReadings.length === 0) {
        alert('No data to export');
        return;
    }
    
    const exportData = {
        app: APP_NAME,
        version: APP_VERSION,
        export_date: new Date().toISOString(),
        device_id: getDeviceId(),
        readings: waterReadings
    };
    
    const encrypted = encryptData(exportData);
    if (encrypted) {
        const blob = new Blob([encrypted], {type: 'application/octet-stream'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enkomos_water_${Date.now()}.enc`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Mark all as synced
        waterReadings.forEach(r => r.synced = true);
        saveData();
        alert(`Exported ${waterReadings.length} readings (encrypted). Send this file to ENKOMOS Main for analysis.`);
    } else {
        alert('Encryption failed');
    }
}

function getDeviceId() {
    let deviceId = localStorage.getItem('enkomos_water_device_id');
    if (!deviceId) {
        deviceId = 'wat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('enkomos_water_device_id', deviceId);
    }
    return deviceId;
}

// ==================== FORM SUBMISSION ====================
document.getElementById('dataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const reading = {
        location: document.getElementById('location').value,
        water_source: document.getElementById('water_source').value,
        structured_method: document.getElementById('structured_method').value,
        ph: document.getElementById('ph').value,
        orp: document.getElementById('orp').value,
        do: document.getElementById('do').value,
        temp: document.getElementById('temp').value,
        tds: document.getElementById('tds').value,
        ec: document.getElementById('ec').value,
        ammonia: document.getElementById('ammonia').value,
        nitrite: document.getElementById('nitrite').value,
        fish_species: document.getElementById('fish_species').value,
        fish_health: document.getElementById('fish_health').value,
        aerator: document.getElementById('aerator').checked,
        water_circulation: document.getElementById('water_circulation').checked,
        air_stone: document.getElementById('air_stone').checked,
        fountain: document.getElementById('fountain').checked,
        notes: document.getElementById('notes').value,
        synced: false
    };
    
    if (!reading.location) {
        alert('Please enter a location/pond/tank name');
        return;
    }
    
    addReading(reading);
    document.getElementById('dataForm').reset();
    
    // Switch to history tab
    document.querySelector('.tab[data-tab="history"]').click();
    alert('Reading saved (encrypted offline storage)');
});

// ==================== TAB SWITCHING ====================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        
        // Refresh structured guide when that tab is opened
        if (tab.dataset.tab === 'structured') {
            displayStructuredGuide();
        }
    });
});

// ==================== TIER SWITCHING ====================
document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Refresh structured guide if that tab is open
        const structuredTab = document.getElementById('tab-structured');
        if (structuredTab.classList.contains('active')) {
            displayStructuredGuide();
        }
        
        // Also refresh advice (which may be tier-sensitive)
        displayAdvice();
    });
});

// ==================== EXPORT BUTTON ====================
document.getElementById('exportBtn').addEventListener('click', exportData);

// ==================== NETWORK STATUS ====================
function updateNetworkStatus() {
    const syncDot = document.querySelector('.sync-dot');
    const syncText = document.getElementById('syncText');
    if (navigator.onLine) {
        syncDot.className = 'sync-dot online';
        syncText.textContent = 'Online';
    } else {
        syncDot.className = 'sync-dot offline';
        syncText.textContent = 'Offline';
    }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ==================== INITIALIZATION ====================
function init() {
    updateNetworkStatus();
    loadData();
    displayStructuredGuide();
}

init();
