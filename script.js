// API configuration
const API_BASE = "https://api.alquran.cloud/v1";
const SURAH_LIST_URL = `${API_BASE}/surah`;
const EDITION_URL = `${API_BASE}/edition`;
const LANGUAGE_URL = `${API_BASE}/edition/language`;
const TYPE_URL = `${API_BASE}/edition/type`;
const FORMAT_URL = `${API_BASE}/edition/format`;

// DOM elements
const surahsContainer = document.getElementById('surahs-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const verseModal = document.getElementById('verse-modal');
const verseText = document.getElementById('verse-text');
const verseTranslation = document.getElementById('verse-translation');
const verseInfo = document.getElementById('verse-info');
const closeModal = document.getElementById('close-modal');
const filterButtons = document.querySelectorAll('.filter-btn');
const languageSelect = document.getElementById('language-select');
const typeSelect = document.getElementById('type-select');
const formatSelect = document.getElementById('format-select');
const editionList = document.getElementById('edition-list');
const currentEditionInfo = document.getElementById('current-edition-info');
const audioPlayerBtn = document.getElementById('audio-player-btn');
const settingsBtn = document.getElementById('settings-btn');
const audioPlayerContainer = document.getElementById('audio-player-container');

// App state
let allSurahs = [];
let filteredSurahs = [];
let allEditions = [];
let filteredEditions = [];
let selectedEdition = null;
let languages = [];
let types = [];
let audioPlayer = null;

// Initialize the app
async function initApp() {
    try {
        // Fetch surah list
        const surahResponse = await fetch(SURAH_LIST_URL);
        const surahData = await surahResponse.json();
        allSurahs = surahData.data;
        filteredSurahs = [...allSurahs];
        renderSurahs(filteredSurahs);
        
        // Fetch editions
        const editionResponse = await fetch(EDITION_URL);
        const editionData = await editionResponse.json();
        allEditions = editionData.data;
        filteredEditions = [...allEditions];
        
        // Extract unique languages and types
        extractLanguages();
        extractTypes();
        
        // Populate filters
        populateLanguageFilter();
        populateTypeFilter();
        
        // Render editions
        renderEditions();
        
        // Set default edition
        selectedEdition = allEditions.find(edition => 
            edition.identifier === 'quran-uthmani'
        );
        updateCurrentEditionInfo();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        surahsContainer.innerHTML = `
            <div class="error" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h2>Failed to load data</h2>
                <p>Please check your internet connection and try again.</p>
                <button class="btn" onclick="initApp()" style="margin-top: 20px;">Retry</button>
            </div>
        `;
    }
}

// Extract unique languages from editions
function extractLanguages() {
    const uniqueLanguages = new Set();
    allEditions.forEach(edition => {
        if (edition.language && edition.language !== "unknown") {
            uniqueLanguages.add(edition.language);
        }
    });
    languages = Array.from(uniqueLanguages).sort();
}

// Extract unique types from editions
function extractTypes() {
    const uniqueTypes = new Set();
    allEditions.forEach(edition => {
        if (edition.type) {
            uniqueTypes.add(edition.type);
        }
    });
    types = Array.from(uniqueTypes).sort();
}

// Populate language filter dropdown
function populateLanguageFilter() {
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang.toUpperCase();
        languageSelect.appendChild(option);
    });
}

// Populate type filter dropdown
function populateTypeFilter() {
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeSelect.appendChild(option);
    });
}

// Filter editions based on selections
function filterEditions() {
    const language = languageSelect.value;
    const type = typeSelect.value;
    const format = formatSelect.value;
    
    filteredEditions = allEditions.filter(edition => {
        const matchesLanguage = !language || edition.language === language;
        const matchesType = !type || edition.type === type;
        const matchesFormat = !format || edition.format === format;
        
        return matchesLanguage && matchesType && matchesFormat;
    });
    
    renderEditions();
}

// Render editions to the list
function renderEditions() {
    editionList.innerHTML = '';
    
    if (filteredEditions.length === 0) {
        editionList.innerHTML = '<p class="no-results">No editions match your filters.</p>';
        return;
    }
    
    filteredEditions.forEach(edition => {
        const isSelected = selectedEdition && selectedEdition.identifier === edition.identifier;
        const editionElement = document.createElement('div');
        editionElement.className = `edition-item ${isSelected ? 'selected' : ''}`;
        editionElement.dataset.identifier = edition.identifier;
        
        editionElement.innerHTML = `
            <div class="edition-name">${edition.name}</div>
            <div class="edition-meta">
                <span>${edition.language.toUpperCase()}</span>
                <span>${edition.type}</span>
                <span>${edition.format}</span>
            </div>
        `;
        
        editionElement.addEventListener('click', () => {
            selectedEdition = edition;
            updateCurrentEditionInfo();
            renderEditions();
        });
        
        editionList.appendChild(editionElement);
    });
}

// Update current edition info display
function updateCurrentEditionInfo() {
    if (selectedEdition) {
        currentEditionInfo.innerHTML = `
            <strong>${selectedEdition.name}</strong> (${selectedEdition.language}, ${selectedEdition.type})
        `;
    }
}

// Render surahs to the DOM
function renderSurahs(surahs) {
    if (surahs.length === 0) {
        surahsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h2>No Surahs Found</h2>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }
    
    surahsContainer.innerHTML = surahs.map(surah => `
        <div class="surah-card" data-number="${surah.number}" data-revelation="${surah.revelationType.toLowerCase()}">
            <div class="card-header">
                <div class="surah-number">${surah.number}</div>
                <div class="surah-name">${surah.name}</div>
            </div>
            <div class="card-body">
                <h3 class="surah-title">${surah.englishName} (${surah.englishNameTranslation})</h3>
                <p>${surah.englishNameTranslation} - ${surah.numberOfAyahs} Verses</p>
                <div class="revelation">Revelation: ${surah.revelationType}</div>
            </div>
            <div class="card-footer">
                <button class="btn read-btn" data-surah="${surah.number}">
                    <i class="fas fa-book-open"></i> Read
                </button>
                <button class="btn audio-btn" data-surah="${surah.number}">
                    <i class="fas fa-play-circle"></i> Listen
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to the buttons
    document.querySelectorAll('.read-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const surahNumber = btn.getAttribute('data-surah');
            showSurah(surahNumber);
        });
    });
    
    // Add event listeners for audio buttons
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const surahNumber = btn.getAttribute('data-surah');
            playSurahAudio(surahNumber);
        });
    });
}

// Show a specific surah
async function showSurah(surahNumber) {
    try {
        // Show loading state in modal
        verseText.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading verses...</p></div>';
        verseTranslation.innerHTML = '';
        verseInfo.innerHTML = '';
        verseModal.style.display = 'block';
        
        // Determine edition identifier
        const editionIdentifier = selectedEdition ? selectedEdition.identifier : 'quran-uthmani';
        
        // Fetch surah details
        const response = await fetch(`${API_BASE}/surah/${surahNumber}/${editionIdentifier}`);
        const data = await response.json();
        const surah = data.data;
        
        // Display surah details
        verseText.innerHTML = '';
        verseTranslation.innerHTML = '';
        
        // Display Arabic text
        verseText.innerHTML = surah.ayahs.map(ayah => `
            <p>${ayah.text} <span style="font-size: 1rem; color: var(--accent);">(${ayah.numberInSurah})</span></p>
        `).join('');
        
        // Display translation
        verseTranslation.innerHTML = surah.ayahs.map(ayah => `
            <p><strong>${ayah.numberInSurah}.</strong> ${ayah.translation}</p>
        `).join('');
        
        // Display surah info
        verseInfo.innerHTML = `
            <p><strong>Surah ${surah.englishName} (${surah.englishNameTranslation})</strong></p>
            <p>Revelation: ${surah.revelationType} | Verses: ${surah.numberOfAyahs}</p>
            <p>Edition: ${editionIdentifier}</p>
        `;
    } catch (error) {
        console.error("Error fetching Surah details:", error);
        verseText.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Failed to load Surah</h2>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Play surah audio
function playSurahAudio(surahNumber) {
    if (!audioPlayer) {
        // Create audio player if it doesn't exist
        audioPlayer = document.createElement('audio');
        audioPlayer.id = 'audio-player';
        audioPlayer.controls = true;
        audioPlayer.style.width = '100%';
        audioPlayerContainer.appendChild(audioPlayer);
    }
    
    // Set audio source
    audioPlayer.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
    audioPlayer.play();
    
    // Show notification
    const surah = allSurahs.find(s => s.number == surahNumber);
    if (surah) {
        showNotification(`Playing Surah ${surah.englishName}`);
    }
}

// Show notification
function showNotification(message) {
    // Remove existing notification if any
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '80px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'var(--accent)';
    notification.style.color = 'var(--dark)';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '50px';
    notification.style.zIndex = '1000';
    notification.style.fontWeight = 'bold';
    notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    document.body.appendChild(notification);
    
    // Show notification
    notification.style.display = 'block';
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Search functionality
function searchSurahs() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        filteredSurahs = [...allSurahs];
        renderSurahs(filteredSurahs);
        return;
    }
    
    filteredSurahs = allSurahs.filter(surah => 
        surah.englishName.toLowerCase().includes(searchTerm) ||
        surah.englishNameTranslation.toLowerCase().includes(searchTerm) ||
        surah.name.toLowerCase().includes(searchTerm) ||
        surah.number.toString().includes(searchTerm)
    );
    
    renderSurahs(filteredSurahs);
}

// Filter by revelation type
function filterSurahs(type) {
    if (type === 'all') {
        filteredSurahs = [...allSurahs];
    } else if (type === 'juz') {
        // For simplicity, we'll just show all surahs for now
        filteredSurahs = [...allSurahs];
        showNotification('Juz filter is not implemented yet');
    } else {
        filteredSurahs = allSurahs.filter(surah => 
            surah.revelationType.toLowerCase() === type
        );
    }
    renderSurahs(filteredSurahs);
}

// Event listeners for edition filters
languageSelect.addEventListener('change', filterEditions);
typeSelect.addEventListener('change', filterEditions);
formatSelect.addEventListener('change', filterEditions);

// Event listeners for surah actions
searchBtn.addEventListener('click', searchSurahs);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchSurahs();
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterSurahs(btn.getAttribute('data-filter'));
    });
});

closeModal.addEventListener('click', () => {
    verseModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === verseModal) {
        verseModal.style.display = 'none';
    }
});

// Audio player button
audioPlayerBtn.addEventListener('click', () => {
    if (audioPlayer) {
        audioPlayerContainer.style.display = audioPlayerContainer.style.display === 'none' ? 'block' : 'none';
    } else {
        showNotification('Play a Surah to activate the audio player');
    }
});

// Settings button
settingsBtn.addEventListener('click', () => {
    showNotification('Settings panel is under development');
});

// Initialize the app
initApp();