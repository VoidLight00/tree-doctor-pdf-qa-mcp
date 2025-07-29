// App initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global variables
let currentSection = 'search';
let currentMonth = new Date();
let searchData = [];
let scheduleData = [];

// Initialize app
function initializeApp() {
    setupEventListeners();
    loadInitialData();
    setupServiceWorker();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', toggleMobileMenu);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Quick tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', handleQuickTag);
    });

    // Photo upload
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });
    document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    // Medicine search
    document.getElementById('medicineSearchBtn').addEventListener('click', searchMedicine);
    document.getElementById('medicineSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMedicine();
    });

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryClick);
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.className === 'modal') closeModal();
    });

    // Filter changes
    document.getElementById('treeType').addEventListener('change', performSearch);
    document.getElementById('symptomType').addEventListener('change', performSearch);
}

// Navigation handling
function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    // Update active states
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show selected section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    currentSection = section;
    
    // Initialize section-specific content
    if (section === 'calendar') {
        renderCalendar();
    }
    
    // Close mobile menu
    document.getElementById('navMenu').classList.remove('active');
}

// Mobile menu toggle
function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

// Search functionality
async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const treeType = document.getElementById('treeType').value;
    const symptomType = document.getElementById('symptomType').value;
    
    if (!searchTerm && !treeType && !symptomType) {
        showNotification('검색어를 입력하거나 필터를 선택해주세요.');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&tree=${treeType}&symptom=${symptomType}`);
        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        // Use mock data for demo
        displaySearchResults(getMockSearchResults(searchTerm, treeType, symptomType));
    }
    
    showLoading(false);
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(result => `
        <div class="result-item" onclick="showDetail('${result.id}')">
            <h3 class="result-title">${result.name}</h3>
            <p class="result-description">${result.description}</p>
            <div class="result-tags">
                ${result.tags.map(tag => `<span class="result-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Quick tag handling
function handleQuickTag(e) {
    const searchTerm = e.target.dataset.search;
    document.getElementById('searchInput').value = searchTerm;
    performSearch();
}

// Photo upload handling
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded photo">`;
        preview.style.display = 'block';
        
        // Simulate photo analysis
        analyzePhoto(file);
    };
    reader.readAsDataURL(file);
}

// Photo analysis (mock)
async function analyzePhoto(file) {
    showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        const mockResults = [
            {
                id: '1',
                name: '잎마름병',
                confidence: 85,
                description: '잎의 가장자리부터 갈변하며 마르는 증상',
                tags: ['곰팡이병', '잎병해']
            },
            {
                id: '2',
                name: '탄저병',
                confidence: 65,
                description: '잎에 원형의 갈색 반점이 생기는 증상',
                tags: ['곰팡이병', '잎병해']
            }
        ];
        
        displayPhotoResults(mockResults);
        showLoading(false);
    }, 2000);
}

// Calendar rendering
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('currentMonth').textContent = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Week headers
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    weekDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Empty cells for first week
    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }
    
    // Calendar days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Check if today
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Check for schedules
        if (hasSchedule(year, month, day)) {
            dayElement.classList.add('has-schedule');
        }
        
        dayElement.addEventListener('click', () => showDaySchedule(year, month, day));
        calendarGrid.appendChild(dayElement);
    }
    
    // Load month schedules
    loadMonthSchedules(year, month);
}

// Change calendar month
function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    renderCalendar();
}

// Medicine search
async function searchMedicine() {
    const searchTerm = document.getElementById('medicineSearch').value.trim();
    if (!searchTerm) {
        showNotification('약제명을 입력해주세요.');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/medicine?q=${encodeURIComponent(searchTerm)}`);
        const results = await response.json();
        displayMedicineResults(results);
    } catch (error) {
        console.error('Medicine search error:', error);
        // Use mock data for demo
        displayMedicineResults(getMockMedicineResults(searchTerm));
    }
    
    showLoading(false);
}

// Display medicine results
function displayMedicineResults(results) {
    const resultsContainer = document.getElementById('medicineResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(medicine => `
        <div class="medicine-item">
            <h3>${medicine.name}</h3>
            <p><strong>성분:</strong> ${medicine.ingredient}</p>
            <p><strong>용도:</strong> ${medicine.usage}</p>
            <p><strong>사용법:</strong> ${medicine.dosage}</p>
            <p class="caution"><strong>주의사항:</strong> ${medicine.caution}</p>
        </div>
    `).join('');
}

// Category click handling
function handleCategoryClick(e) {
    const category = e.currentTarget.dataset.category;
    searchMedicineByCategory(category);
}

// Show detail modal
function showDetail(id) {
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    // Load detail content
    modalBody.innerHTML = getDetailContent(id);
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// Loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.toggle('active', show);
}

// Show notification
function showNotification(message) {
    // Simple alert for now, can be replaced with toast notification
    alert(message);
}

// Service Worker setup for offline functionality
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
}

// Mock data functions
function getMockSearchResults(searchTerm, treeType, symptomType) {
    const mockData = [
        {
            id: '1',
            name: '소나무재선충병',
            description: '소나무와 곰솔에 발생하는 치명적인 병해. 재선충이 소나무의 수액 이동을 막아 고사시킴',
            tags: ['소나무', '재선충', '매개충', '긴급방제']
        },
        {
            id: '2',
            name: '참나무시들음병',
            description: '참나무류에 발생하는 곰팡이병. 광릉긴나무좀이 매개하며 급속히 확산',
            tags: ['참나무', '곰팡이병', '매개충방제']
        },
        {
            id: '3',
            name: '벚나무 빗자루병',
            description: '벚나무의 가지가 빗자루처럼 총생하는 병해. 파이토플라스마가 원인',
            tags: ['벚나무', '빗자루병', '가지이상']
        }
    ];
    
    // Filter based on search criteria
    return mockData.filter(item => {
        const matchesSearch = !searchTerm || 
            item.name.includes(searchTerm) || 
            item.description.includes(searchTerm);
        const matchesTree = !treeType || item.tags.includes(treeType);
        const matchesSymptom = !symptomType || item.tags.some(tag => tag.includes(symptomType));
        
        return matchesSearch && matchesTree && matchesSymptom;
    });
}

function getMockMedicineResults(searchTerm) {
    const mockData = [
        {
            name: '아바멕틴 유제',
            ingredient: '아바멕틴 1.8%',
            usage: '응애류, 굴파리류, 총채벌레 방제',
            dosage: '1,000배 희석, 10a당 200L 살포',
            caution: '꿀벌에 독성이 있으므로 개화기 사용 금지'
        },
        {
            name: '만코제브 수화제',
            ingredient: '만코제브 75%',
            usage: '탄저병, 잎마름병 등 곰팡이병 방제',
            dosage: '500배 희석, 충분히 살포',
            caution: '강알칼리성 농약과 혼용 금지'
        }
    ];
    
    return mockData.filter(item => 
        item.name.includes(searchTerm) || 
        item.ingredient.includes(searchTerm)
    );
}

function hasSchedule(year, month, day) {
    // Mock schedule data
    const schedules = [
        { date: '2024-3-15', event: '소나무재선충 예방주사' },
        { date: '2024-4-1', event: '봄철 병해충 방제' },
        { date: '2024-6-15', event: '장마철 대비 살균제 살포' }
    ];
    
    const dateStr = `${year}-${month + 1}-${day}`;
    return schedules.some(s => s.date === dateStr);
}

function getDetailContent(id) {
    // Mock detail content
    const details = {
        '1': `
            <h2>소나무재선충병</h2>
            <h3>병원체</h3>
            <p>Bursaphelenchus xylophilus (소나무재선충)</p>
            
            <h3>매개충</h3>
            <p>솔수염하늘소, 북방수염하늘소</p>
            
            <h3>증상</h3>
            <ul>
                <li>초기: 잎이 연녹색으로 변색</li>
                <li>중기: 잎이 황갈색으로 변하며 시들음</li>
                <li>말기: 전체 고사, 송진 분비 정지</li>
            </ul>
            
            <h3>방제방법</h3>
            <ul>
                <li>예방주사: 아바멕틴, 에마멕틴벤조에이트</li>
                <li>고사목 제거: 반드시 5월 이전 완료</li>
                <li>매개충 방제: 항공방제, 지상방제</li>
            </ul>
        `
    };
    
    return details[id] || '<p>상세 정보를 불러올 수 없습니다.</p>';
}

function loadMonthSchedules(year, month) {
    // Load and display schedules for the month
    const scheduleList = document.getElementById('scheduleList');
    const monthSchedules = [
        { date: 15, event: '소나무재선충 예방주사 시기' },
        { date: 20, event: '봄철 응애류 방제' }
    ];
    
    scheduleList.innerHTML = '<h3>이달의 방제 일정</h3>' + 
        monthSchedules.map(s => `
            <div class="schedule-item">
                <strong>${month + 1}월 ${s.date}일:</strong> ${s.event}
            </div>
        `).join('');
}

// Initialize mock data
function loadInitialData() {
    // This would normally load from the server/database
    console.log('App initialized');
}