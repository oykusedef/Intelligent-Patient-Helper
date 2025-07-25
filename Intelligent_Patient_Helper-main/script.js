// API_URL for backend
const API_URL = 'http://localhost:8005/api';
const OPENAI_API_KEY = '';

// Debug mode
const DEBUG = true;

// Mock data flag - NeonDB'ye kaydetmek için false yapıyoruz
const USE_MOCK_DATA = false;

// Mock data
const MOCK_DATA = {
    patientHistory: {
        "past_conditions": ["Migraine", "Hypertension"],
        "medications": [
            {"name": "Beloc", "status": "active", "dosage": "50mg", "frequency": "once daily"},
            {"name": "Majezik", "status": "past", "dosage": "100mg", "frequency": "as needed"}
        ],
        "past_appointments": [
            {"department": "Neurology", "date": "2024-01-15", "doctor": "Dr. Jane Smith", "diagnosis": "Migraine"},
            {"department": "Cardiology", "date": "2024-02-20", "doctor": "Dr. Michael Brown", "diagnosis": "Hypertension"}
        ]
    },
    
    diagnoseResult: {
        "recommended_departments": ["Neurology", "Internal Medicine", "Ophthalmology"],
        "initial_treatment": ["Rest in a quiet, dark room. You may take pain relievers."],
        "warnings": ["Headaches with vision problems can be serious. Please seek medical help soon."],
        "patient_specific_notes": ["Please inform your doctor about your current medications: Beloc (50mg)"]
    },
    
    doctorRecommendations: {
        "available_doctors": [
            {
                "name": "Dr. Michael Brown",
                "specialization": "Neurology"
            },
            {
                "name": "Dr. John Smith",
                "specialization": "Neurology"
            },
            {
                "name": "Dr. Emily Wilson",
                "specialization": "Neurology"
            }
        ]
    },
    
    appointmentCreated: {
        "success": true,
        "appointment_id": 123,
        "department": "Neurology",
        "appointment_date": "2024-04-15T14:30:00",
        "doctor_name": "Dr. Michael Brown"
    }
};

// Load saved users from localStorage if available
let MOCK_USERS = {
    "12345678901": {
        name: "John Smith",
        email: "john@example.com",
        phone: "5551234567"
    },
    "98765432109": {
        name: "Emily Johnson",
        email: "emily@example.com",
        phone: "5559876543"
    }
};

// Try to load saved users from localStorage
try {
    const savedUsers = localStorage.getItem('mockUsers');
    if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        // Merge with default users, keeping any existing ones
        MOCK_USERS = { ...MOCK_USERS, ...parsedUsers };
        console.log('Loaded saved users from localStorage:', MOCK_USERS);
    }
} catch (e) {
    console.error('Error loading saved users:', e);
}

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const tcInput = document.getElementById('tcInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const showRegisterButton = document.getElementById('showRegisterButton');
const showLoginButton = document.getElementById('showLoginButton');
const patientInfo = document.getElementById('patientInfo');
const patientName = document.getElementById('patientName');
const patientTc = document.getElementById('patientTc');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsList = document.getElementById('recommendationsList');
const departmentsSection = document.getElementById('departmentsSection');
const departmentsList = document.getElementById('departmentsList');
const doctorsSection = document.getElementById('doctorsSection');
const doctorsList = document.getElementById('doctorsList');
const confirmationSection = document.getElementById('confirmationSection');
const confirmationDetails = document.getElementById('confirmationDetails');

// Registration form elements
const registerTcInput = document.getElementById('registerTcInput');
const nameInput = document.getElementById('nameInput');
const dobInput = document.getElementById('dobInput');
const phoneInput = document.getElementById('phoneInput');
const emailInput = document.getElementById('emailInput');

// Chat state
let currentState = 'initial';
let selectedDepartment = null;
let selectedDate = null;
let currentTcNumber = null;
let currentPatient = null;
let selectedDoctor = null;
let inactivityTimer = null;
let currentAppointmentId = null;
let detectedSymptoms = [];

// DOM Elements - Add new dashboard elements
const dashboardSection = document.getElementById('dashboardSection');
const dashboardPatientName = document.getElementById('dashboardPatientName');
const dashboardPatientTc = document.getElementById('dashboardPatientTc');
const logoutButton = document.getElementById('logoutButton');
const navTabs = document.querySelectorAll('.nav-tab');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const appointmentsList = document.getElementById('appointmentsList');
const expertDoctorsList = document.getElementById('expertDoctorsList');
const departmentFilter = document.getElementById('departmentFilter');
const pastConditionsList = document.getElementById('pastConditionsList');
const medicationsList = document.getElementById('medicationsList');
const pastAppointmentsList = document.getElementById('pastAppointmentsList');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mevcut randevuları temizle
    localStorage.removeItem('patientAppointments');
    
    // Login with Enter key
    tcInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await loginUser();
        }
    });

    // Migrate localStorage users to NeonDB
    if (!USE_MOCK_DATA) {
        migrateMockUsersToDB();
    }

    // Send message with Enter key
    userInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // Button click handlers
    loginButton.addEventListener('click', loginUser);
    sendButton.addEventListener('click', sendMessage);
    registerButton.addEventListener('click', register);
    
    // Toggle registration/login form
    showRegisterButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });
    
    showLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Reset inactivity timer on user activity
    ['mousemove', 'keypress', 'click', 'scroll'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });

    // Set ARIA labels for buttons with icons
    sendButton.setAttribute('aria-label', 'Send message');

    // Navigation tab switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all sections
            dashboardSections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            const sectionId = tab.dataset.section;
            document.getElementById(sectionId).classList.remove('hidden');
        });
    });
    
    // Department filter for doctors
    departmentFilter.addEventListener('change', () => {
        const selectedDepartment = departmentFilter.value;
        filterDoctorsByDepartment(selectedDepartment);
    });
    
    // Logout button
    logoutButton.addEventListener('click', logout);
});

// Reset inactivity timer
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (currentPatient) {
        inactivityTimer = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
    }
}

// Logout function
function logout() {
    // Mevcut randevuları temizle
    localStorage.removeItem('patientAppointments');
    
    currentPatient = null;
    currentTcNumber = null;
    selectedDepartment = null;
    selectedDoctor = null;
    selectedDate = null;
    detectedSymptoms = [];
    chatMessages.innerHTML = '';
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    tcInput.value = '';
    userInput.value = '';
    
    // Clear appointment section
    appointmentsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-calendar-xmark"></i>
            <p>You don't have any appointments yet.</p>
        </div>
    `;
    
    // Clear doctors section
    expertDoctorsList.innerHTML = '';
    
    // Clear health history sections
    pastConditionsList.innerHTML = '';
    medicationsList.innerHTML = '';
    pastAppointmentsList.innerHTML = '';
    
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

// Login user
async function loginUser() {
    const tcNumber = tcInput.value.trim();
    
    if (!tcNumber || tcNumber.length !== 11 || isNaN(tcNumber)) {
        showNotification('Please enter a valid 11-digit ID number', 'error');
        return;
    }
    
    try {
        // Show loading state
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Checking...';
        loginButton.disabled = true;
        
        // Log API call for debugging
        console.log(`Checking patient with TC: ${tcNumber}`);
        
        // Simulate API call with mock data
        let result;
        if (USE_MOCK_DATA) {
            // Add a small delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the latest mock users from localStorage
            try {
                const savedUsers = localStorage.getItem('mockUsers');
                if (savedUsers) {
                    const parsedUsers = JSON.parse(savedUsers);
                    // Update MOCK_USERS with the latest data
                    MOCK_USERS = { ...MOCK_USERS, ...parsedUsers };
                    console.log('Updated MOCK_USERS from localStorage for login check:', MOCK_USERS);
                }
            } catch (e) {
                console.error('Error loading saved users during login:', e);
            }
            
            // Check if patient exists in mock users
            if (MOCK_USERS[tcNumber]) {
                result = {
                    exists: true,
                    patient: MOCK_USERS[tcNumber]
                };
            } else {
                result = {
                    exists: false,
                    patient: null
                };
            }
        } else {
            // In a real app, we would make an actual API call here
            const response = await fetch(`${API_URL}/patient/check/${tcNumber}`);
            result = await response.json();
        }
        
        // Log response for debugging
        console.log('Patient check response:', result);
        
        // Reset button state
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> Sign In';
        loginButton.disabled = false;
        
        if (result.exists) {
            // Patient exists, save to session storage and redirect to dashboard
            currentTcNumber = tcNumber;
            currentPatient = result.patient;
            
            // Save to session storage
            sessionStorage.setItem('currentTcNumber', currentTcNumber);
            sessionStorage.setItem('currentPatient', JSON.stringify(currentPatient));
            
            // Redirect to dashboard page
            window.location.href = 'dashboard.html';
        } else {
            // Patient not found, redirect to registration
            showNotification('User not found. Please register first.', 'info');
            
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
            registerTcInput.value = tcNumber;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> Sign In';
        loginButton.disabled = false;
    }
}

// Register new patient
async function register() {
    const tcNumber = registerTcInput.value.trim();
    const name = nameInput.value.trim();
    const dob = dobInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    
    // Input validation
    if (!tcNumber || tcNumber.length !== 11 || isNaN(tcNumber)) {
        showNotification('Please enter a valid 11-digit ID number', 'error');
        return;
    }
    
    if (!name) {
        showNotification('Please enter your full name', 'error');
        return;
    }
    
    if (!dob) {
        showNotification('Please enter your date of birth', 'error');
        return;
    }
    
    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        // Show loading state
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Registering...';
        registerButton.disabled = true;
        
        const patientData = {
            tc_number: tcNumber,
            name: name,
            date_of_birth: dob,
            phone: phone,
            email: email,
            gender: "" // Boş olarak gönderelim, gerekirse form güncellenebilir
        };
        
        // Log for debugging
        console.log('Registering patient:', patientData);
        
        let result;
        
        if (USE_MOCK_DATA) {
            // Mock veri kullan
            console.log('Using mock data for registration');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Add to mock users
            MOCK_USERS[tcNumber] = {
                name: name,
                email: email,
                phone: phone
            };
            
            // Save to localStorage
            try {
                localStorage.setItem('mockUsers', JSON.stringify(MOCK_USERS));
                console.log('Saved users to localStorage', MOCK_USERS);
            } catch (e) {
                console.error('Error saving users to localStorage:', e);
            }
            
            result = {
                success: true,
                message: 'Registration successful',
                patient: {
                    tc_number: tcNumber,
                    name: name,
                    email: email,
                    phone: phone
                }
            };
        } else {
            // API URL'yi göster
            if (DEBUG) {
                console.log('API URL:', `${API_URL}/patient/register`);
            }
            
            // API'ye gönder
            const response = await fetch(`${API_URL}/patient/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });
            
            if (!response.ok) {
                if (DEBUG) {
                    console.error('API Error:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            }
            
            result = await response.json();
        }
        
        // Log response for debugging
        console.log('Registration response:', result);
        
        // Reset button state
        registerButton.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Register';
        registerButton.disabled = false;
        
        if (result.success) {
            // Registration successful
            showNotification('Registration successful! You can now sign in.', 'success');
            
            // Automatically populate login field and switch to login view
            tcInput.value = tcNumber;
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            
            // Focus on the login button
            loginButton.focus();
        } else {
            // Registration failed
            showNotification(result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
        registerButton.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Register';
        registerButton.disabled = false;
    }
}

// OpenAI API fonksiyonları
async function analyzeSymptoms(symptoms) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "Sen bir sağlık asistanısın. Hastanın semptomlarını analiz edip, uygun bölüme yönlendirme yapacaksın."
                }, {
                    role: "user",
                    content: `Hastanın semptomları: ${symptoms}. Lütfen bu semptomlara göre hangi bölüme başvurması gerektiğini ve genel önerilerini belirt.`
                }]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API hatası:', error);
        return 'Üzgünüm, şu anda semptom analizi yapamıyorum. Lütfen daha sonra tekrar deneyin.';
    }
}

// Mevcut sendMessage fonksiyonunu güncelle
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Kullanıcı mesajını göster
    addMessage(message, 'user');
    userInput.value = '';

    // Typing göstergesi ekle
    addTypingIndicator();

    // OpenAI ile semptom analizi yap
    const aiResponse = await analyzeSymptoms(message);
    
    // Typing göstergesini kaldır
    removeTypingIndicator();

    // AI yanıtını göster
    addMessage(aiResponse, 'system');

    // Yanıttaki bölüm önerisini analiz et ve UI'ı güncelle
    const departmentMatch = aiResponse.match(/bölüm[üu]:?\s*([^\.]+)/i);
    if (departmentMatch) {
        const recommendedDepartment = departmentMatch[1].trim();
        // Önerilen bölümü göster ve seçenekleri güncelle
        displayDepartmentOptions([recommendedDepartment]);
        departmentsSection.classList.remove('hidden');
    }
}

// Display department options
function displayDepartmentOptions(departments) {
    const deptContainer = document.createElement('div');
    deptContainer.className = 'department-options';
    
    departments.forEach(dept => {
        const deptButton = document.createElement('button');
        deptButton.className = 'department-button';
        deptButton.textContent = dept;
        deptButton.addEventListener('click', () => selectDepartment(dept));
        deptContainer.appendChild(deptButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(deptContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Select department
function selectDepartment(department) {
    selectedDepartment = department;
    
    addMessage(`You've selected the ${department} department. Let me find available doctors for you.`, 'system');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API call to get doctors
    setTimeout(() => {
        removeTypingIndicator();
        
        // Fetch doctors for the selected department
        fetchDoctorsForDepartment(department);
    }, 1500);
}

// Fetch doctors for department
async function fetchDoctorsForDepartment(department) {
    try {
        // In a real app, we would make an API call here
        // For now, we'll create mock data
        let doctors = [];
        
        if (department === "Internal Medicine") {
            // For Internal Medicine, ensure Dr. Michael Brown is listed first
            doctors = [
                { id: "D3", name: "Dr. Michael Brown", department: department, available: true },
                { id: "D1", name: "Dr. John Smith", department: department, available: true },
                { id: "D2", name: "Dr. Sarah Johnson", department: department, available: true }
            ];
        } else {
            doctors = [
                { id: "D1", name: "Dr. John Smith", department: department, available: true },
                { id: "D2", name: "Dr. Sarah Johnson", department: department, available: true },
                { id: "D3", name: "Dr. Michael Brown", department: department, available: true }
            ];
        }
        
        displayDoctorOptions(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        addMessage('Sorry, I could not fetch the list of doctors. Please try again.', 'system');
    }
}

// Display doctor options
function displayDoctorOptions(doctors) {
    addMessage(`Here are the available doctors in the ${selectedDepartment} department:`, 'system');
    
    const doctorContainer = document.createElement('div');
    doctorContainer.className = 'doctor-options';
    
    doctors.forEach(doctor => {
        const doctorButton = document.createElement('button');
        doctorButton.className = 'doctor-button';
        doctorButton.textContent = doctor.name;
        doctorButton.addEventListener('click', () => selectDoctor(doctor));
        doctorContainer.appendChild(doctorButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(doctorContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Select doctor
function selectDoctor(doctor) {
    selectedDoctor = doctor;
    
    addMessage(`You've selected ${doctor.name}. Let me show you the available appointment dates.`, 'system');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API call to get available dates
    setTimeout(() => {
        removeTypingIndicator();
        
        // Show available dates (next 5 days)
        displayAvailableDates();
    }, 1500);
}

// Display available dates
function displayAvailableDates() {
    addMessage(`Here are the available dates for your appointment with ${selectedDoctor.name}:`, 'system');
    
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-options';
    
    // Generate next 5 days
    const today = new Date();
    const dates = [];
    
    for (let i = 1; i <= 5; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    
    dates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.className = 'date-button';
        dateButton.textContent = formatDate(date);
        dateButton.addEventListener('click', () => selectDate(date));
        dateContainer.appendChild(dateButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(dateContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Select date
function selectDate(date) {
    const formattedDate = formatDate(date);
    
    addMessage(`You've selected ${formattedDate}. Let me show you the available time slots.`, 'system');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API call to get available time slots
    setTimeout(() => {
        removeTypingIndicator();
        
        // Show available time slots
        displayAvailableTimeSlots(date);
    }, 1500);
}

// Display available time slots
function displayAvailableTimeSlots(date) {
    addMessage(`Here are the available time slots for ${formatDate(date)} with ${selectedDoctor.name}:`, 'system');
    
    const timeContainer = document.createElement('div');
    timeContainer.className = 'time-options';
    
    // Generate time slots (9 AM to 5 PM, 1-hour intervals)
    const timeSlots = [];
    
    for (let hour = 9; hour <= 16; hour++) {
        const time = new Date(date);
        time.setHours(hour, 0, 0, 0);
        timeSlots.push(time);
    }
    
    timeSlots.forEach(time => {
        const timeButton = document.createElement('button');
        timeButton.className = 'time-button';
        timeButton.textContent = formatTime(time);
        timeButton.addEventListener('click', () => finalizeAppointment(time));
        timeContainer.appendChild(timeButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(timeContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Finalize appointment
function finalizeAppointment(dateTime) {
    selectedDate = dateTime.toISOString();
    
    // Show appointment summary
    addMessage(`
        <div class="appointment-summary">
            <h3>Appointment Summary</h3>
            <p><strong>Department:</strong> ${selectedDepartment}</p>
            <p><strong>Doctor:</strong> ${selectedDoctor.name}</p>
            <p><strong>Date & Time:</strong> ${formatDate(dateTime)} at ${formatTime(dateTime)}</p>
            <p><strong>Symptoms:</strong> ${detectedSymptoms.join(', ')}</p>
        </div>
    `, 'system');
    
    // Add confirmation buttons
    const confirmContainer = document.createElement('div');
    confirmContainer.className = 'confirmation-buttons';
    confirmContainer.innerHTML = `
        <button id="confirmButton" class="confirm-button" aria-label="Confirm appointment">Confirm Appointment</button>
        <button id="cancelButton" class="cancel-button" aria-label="Cancel appointment">Cancel</button>
    `;
    chatMessages.appendChild(confirmContainer);
    
    // Add event listeners to confirmation buttons
    document.getElementById('confirmButton').addEventListener('click', async () => {
        // Book the appointment
        await bookAppointment();
    });
    
    document.getElementById('cancelButton').addEventListener('click', () => {
        addMessage('Appointment booking cancelled.', 'system');
        addMessage('How else can I help you today?', 'system');
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Book appointment
async function bookAppointment() {
    try {
        // Show loading message
        addMessage('Booking your appointment...', 'system');
        
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create mock result
        const result = {
            success: true,
            appointment_id: Math.floor(Math.random() * 10000),
                department: selectedDepartment,
            appointment_date: selectedDate,
            doctor_name: selectedDoctor.name
        };
        
        if (result.success) {
            // Store appointment ID
            currentAppointmentId = result.appointment_id;
            
            // Show success message
            addMessage(`
                <div class="appointment-success">
                    <h3>Appointment Booked Successfully!</h3>
                    <p>Your appointment has been confirmed with ${selectedDoctor.name} on ${formatDate(new Date(selectedDate))} at ${formatTime(new Date(selectedDate))}.</p>
                    <p>Appointment ID: ${result.appointment_id}</p>
                    <p>Please arrive 15 minutes before your appointment time.</p>
                </div>
            `, 'system');
            
            // Update appointments list in Online Appointments section
            loadPatientAppointments();
            
            // Show notification to check appointments
            addMessage(`
                <p>Your appointment has been added to your <strong>Online Appointments</strong> section. 
                You can view all your appointments by clicking on the "Online Appointments" tab above.</p>
            `, 'system');
            
            // Reset selection for next booking
            selectedDepartment = null;
            selectedDoctor = null;
            selectedDate = null;
            
            // Ask if they need anything else
            addMessage('Is there anything else I can help you with today?', 'system');
        } else {
            // Show error message
            addMessage('Sorry, we could not book your appointment. Please try again.', 'system');
        }
    } catch (error) {
        console.error('Booking error:', error);
        addMessage('An error occurred while booking your appointment. Please try again.', 'system');
    }
}

// Helper functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

// Add message to chat
function addMessage(message, sender = 'system') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.innerHTML = `<p>${message}</p>`;
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'message system typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-dots" aria-label="Bot is typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification type and message
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// Function to load patient's appointments
function loadPatientAppointments() {
    // Temiz bir başlangıç için, mevcut randevuları sıfırla
    if (currentAppointmentId === null) {
        localStorage.removeItem('patientAppointments');
    }
    
    // Daha önce localStorage'a kaydedilmiş randevuları kontrol et
    let storedAppointments = [];
    try {
        const savedAppointments = localStorage.getItem('patientAppointments');
        if (savedAppointments) {
            storedAppointments = JSON.parse(savedAppointments);
        }
    } catch (e) {
        console.error('Error loading saved appointments:', e);
    }
    
    // Check if patient has any appointments in mock data
    const patientAppointments = [...storedAppointments];
    
    // Add the newly booked appointment if available
    if (currentAppointmentId) {
        const appointmentDate = new Date(selectedDate);
        
        // Yeni randevuyu ekle
        const newAppointment = {
            id: currentAppointmentId,
            doctor_name: selectedDoctor ? selectedDoctor.name : 'Dr. Michael Brown',
            department: selectedDepartment,
            appointment_date: appointmentDate.toISOString(), // ISO formatında kaydet
            symptoms: detectedSymptoms.join(', ')
        };
        
        patientAppointments.push(newAppointment);
        
        // Randevuları localStorage'a kaydet
        localStorage.setItem('patientAppointments', JSON.stringify(patientAppointments));
    }
    
    // For demo purposes, add a mock appointment if the list is empty
    if (patientAppointments.length === 0 && Math.random() > 0.5) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
        futureDate.setHours(9 + Math.floor(Math.random() * 7), 0, 0, 0);
        
        // Use the selected doctor instead of hardcoded "Dr. Sarah Johnson"
        const mockAppointment = {
            id: Math.floor(Math.random() * 1000),
            doctor_name: selectedDoctor ? selectedDoctor.name : 'Dr. Michael Brown',
            department: selectedDepartment || 'Internal Medicine',
            appointment_date: futureDate.toISOString(), // ISO formatında kaydet
            symptoms: detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'Chest pain, shortness of breath'
        };
        
        patientAppointments.push(mockAppointment);
        
        // Mock randevuyu da localStorage'a kaydet
        localStorage.setItem('patientAppointments', JSON.stringify(patientAppointments));
    }
    
    // Display appointments
    if (patientAppointments.length > 0) {
        let appointmentsHTML = '';
        
        patientAppointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.appointment_date);
            const isUpcoming = appointmentDate > new Date();
            
            appointmentsHTML += `
                <div class="appointment-card">
                    <h3>${appointment.department} Appointment ${isUpcoming ? '<span class="upcoming-tag">Upcoming</span>' : ''}</h3>
                    <p><strong>Doctor:</strong> ${appointment.doctor_name}</p>
                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(appointmentDate)}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-clock"></i>
                            <span>${formatTime(appointmentDate)}</span>
                        </div>
                    </div>
                    ${appointment.symptoms ? `<p><strong>Symptoms:</strong> ${appointment.symptoms}</p>` : ''}
                </div>
            `;
        });
        
        appointmentsList.innerHTML = appointmentsHTML;
    } else {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-xmark"></i>
                <p>You don't have any appointments yet.</p>
            </div>
        `;
    }
}

// Function to load doctors data
function loadDoctorsData() {
    // Mock doctors data
    const doctors = [
        {
            id: "D1",
            name: "Dr. John Smith",
            department: "Neurology",
            specialization: "Headache and Migraine Specialist",
            experience: "15 years",
            education: "Harvard Medical School",
            languages: "English, Spanish"
        },
        {
            id: "D2",
            name: "Dr. Sarah Johnson",
            department: "Cardiology",
            specialization: "Interventional Cardiology",
            experience: "12 years",
            education: "Johns Hopkins University",
            languages: "English, French"
        },
        {
            id: "D3",
            name: "Dr. Michael Brown",
            department: "Orthopedics",
            specialization: "Sports Medicine",
            experience: "10 years",
            education: "Stanford University",
            languages: "English"
        },
        {
            id: "D4",
            name: "Dr. Emily Davis",
            department: "Dermatology",
            specialization: "Cosmetic Dermatology",
            experience: "8 years",
            education: "Yale University",
            languages: "English, German"
        },
        {
            id: "D5",
            name: "Dr. Robert Wilson",
            department: "Gastroenterology",
            specialization: "Digestive Disorders",
            experience: "14 years",
            education: "Columbia University",
            languages: "English, Italian"
        },
        {
            id: "D6",
            name: "Dr. Lisa Chen",
            department: "ENT",
            specialization: "Otolaryngology",
            experience: "9 years",
            education: "UCLA Medical School",
            languages: "English, Mandarin"
        },
        {
            id: "D7",
            name: "Dr. James Taylor",
            department: "Ophthalmology",
            specialization: "Retina Specialist",
            experience: "11 years",
            education: "Duke University",
            languages: "English"
        },
        {
            id: "D8",
            name: "Dr. Patricia Moore",
            department: "Internal Medicine",
            specialization: "Primary Care",
            experience: "20 years",
            education: "University of Pennsylvania",
            languages: "English, Portuguese"
        },
        {
            id: "D9",
            name: "Dr. David Kim",
            department: "Pulmonology",
            specialization: "Respiratory Diseases",
            experience: "13 years",
            education: "University of Michigan",
            languages: "English, Korean"
        },
        {
            id: "D10",
            name: "Dr. Olivia Martinez",
            department: "Neurology",
            specialization: "Movement Disorders",
            experience: "16 years",
            education: "Mayo Clinic College of Medicine",
            languages: "English, Spanish"
        }
    ];
    
    displayDoctors(doctors);
}

// Function to display doctors
function displayDoctors(doctors) {
    let doctorsHTML = '';
    
    doctors.forEach(doctor => {
        doctorsHTML += `
            <div class="doctor-card" data-department="${doctor.department}">
                <div class="doctor-card-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <h3>${doctor.name}</h3>
                    <p class="doctor-department">${doctor.department}</p>
                </div>
                <div class="doctor-card-body">
                    <div class="doctor-info">
                        <div class="doctor-info-item">
                            <i class="fas fa-stethoscope"></i>
                            <span>${doctor.specialization}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-briefcase"></i>
                            <span>Experience: ${doctor.experience}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${doctor.education}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-language"></i>
                            <span>${doctor.languages}</span>
                        </div>
                    </div>
                    <button class="book-appointment-btn" data-doctor-id="${doctor.id}">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>
        `;
    });
    
    expertDoctorsList.innerHTML = doctorsHTML;
    
    // Add event listeners to book appointment buttons
    document.querySelectorAll('.book-appointment-btn').forEach(button => {
        button.addEventListener('click', () => {
            const doctorId = button.dataset.doctorId;
            const doctorCard = button.closest('.doctor-card');
            const doctorName = doctorCard.querySelector('h3').textContent;
            const doctorDept = doctorCard.querySelector('.doctor-department').textContent;
            
            // Switch to AI Diagnosis tab
            document.querySelector('.nav-tab[data-section="aiDiagnosisSection"]').click();
            
            // Add message to chat
            addMessage(`I'd like to book an appointment with ${doctorName} in the ${doctorDept} department.`, 'user');
            
            // Process request
            processAppointmentRequest(doctorId, doctorName, doctorDept);
        });
    });
}

// Filter doctors by department
function filterDoctorsByDepartment(department) {
    const doctorCards = document.querySelectorAll('.doctor-card');
    
    doctorCards.forEach(card => {
        if (department === 'all' || card.dataset.department === department) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Process appointment request from doctors section
async function processAppointmentRequest(doctorId, doctorName, department) {
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Add system response
    addMessage(`I'll help you book an appointment with ${doctorName} in the ${department} department.`, 'system');
    
    // Set selected department and doctor
    selectedDepartment = department;
    selectedDoctor = {
        id: doctorId,
        name: doctorName,
        department: department
    };
    
    // Show date selection
    addTypingIndicator();
    await new Promise(resolve => setTimeout(resolve, 800));
    removeTypingIndicator();
    
    // Show available dates
    displayAvailableDates();
}

// Function to load patient health history
function loadPatientHealthHistory() {
    // Mock health history data
    const healthHistory = {
        pastConditions: [
            { name: "Migraine", date: "2023-10-15" },
            { name: "Hypertension", date: "2022-05-20" }
        ],
        medications: [
            { name: "Beloc", dosage: "50mg", frequency: "once daily", status: "active" },
            { name: "Majezik", dosage: "100mg", frequency: "as needed", status: "past" }
        ],
        pastAppointments: [
            { 
                department: "Neurology",
                doctor: "Dr. Jane Smith",
                date: "2024-01-15",
                diagnosis: "Migraine",
                treatment: "Prescribed Sumatriptan 50mg"
            },
            {
                department: "Cardiology",
                doctor: "Dr. Michael Brown",
                date: "2024-02-20",
                diagnosis: "Hypertension",
                treatment: "Prescribed Beloc 50mg, lifestyle modifications"
            }
        ]
    };
    
    // Display past conditions
    let conditionsHTML = '';
    if (healthHistory.pastConditions && healthHistory.pastConditions.length > 0) {
        healthHistory.pastConditions.forEach(condition => {
            conditionsHTML += `
                <li>
                    <i class="fas fa-file-medical"></i>
                    <span>${condition.name} <small>(since ${new Date(condition.date).toLocaleDateString()})</small></span>
                </li>
            `;
        });
        pastConditionsList.innerHTML = conditionsHTML;
    } else {
        pastConditionsList.innerHTML = '<p>No past conditions recorded.</p>';
    }
    
    // Display medications
    let medicationsHTML = '';
    if (healthHistory.medications && healthHistory.medications.length > 0) {
        healthHistory.medications.forEach(medication => {
            const statusTag = medication.status === 'active' 
                ? '<span class="active-medication">Current</span>' 
                : '<span class="past-medication">Past</span>';
            
            medicationsHTML += `
                <li>
                    <i class="fas fa-pills"></i>
                    <div>
                        <span class="medication-name">${medication.name} ${statusTag}</span>
                        <p class="medication-details">${medication.dosage}, ${medication.frequency}</p>
                    </div>
                </li>
            `;
        });
        medicationsList.innerHTML = medicationsHTML;
    } else {
        medicationsList.innerHTML = '<p>No medications recorded.</p>';
    }
    
    // Display past appointments
    let appointmentsHTML = '';
    if (healthHistory.pastAppointments && healthHistory.pastAppointments.length > 0) {
        healthHistory.pastAppointments.forEach(appointment => {
            appointmentsHTML += `
                <div class="past-appointment-card">
                    <p><strong>Department:</strong> ${appointment.department}</p>
                    <p><strong>Doctor:</strong> ${appointment.doctor}</p>
                    <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
                    <p><strong>Diagnosis:</strong> ${appointment.diagnosis}</p>
                    <p><strong>Treatment:</strong> ${appointment.treatment}</p>
                </div>
            `;
        });
        pastAppointmentsList.innerHTML = appointmentsHTML;
    } else {
        pastAppointmentsList.innerHTML = '<p>No past appointments recorded.</p>';
    }
}

// Function to migrate mock users from localStorage to NeonDB
async function migrateMockUsersToDB() {
    try {
        // Get users from localStorage
        const savedUsers = localStorage.getItem('mockUsers');
        if (!savedUsers) {
            console.log('No saved users to migrate to DB');
            return;
        }
        
        const parsedUsers = JSON.parse(savedUsers);
        console.log('Attempting to migrate users to NeonDB:', parsedUsers);
        
        // Loop through users and register them in DB if they don't exist
        const registeredUsers = [];
        const failedUsers = [];
        
        for (const [tcNumber, userData] of Object.entries(parsedUsers)) {
            try {
                // First check if user already exists in the database
                console.log(`Checking if user ${tcNumber} exists in database...`);
                const checkResponse = await fetch(`${API_URL}/patient/check/${tcNumber}`);
                const checkResult = await checkResponse.json();
                
                if (checkResult.exists) {
                    console.log(`User ${tcNumber} already exists in database, skipping`);
                    continue;
                }
                
                // Create date of birth if not available
                const dob = userData.date_of_birth || '1990-01-01';
                
                // Register user in DB
                const registrationData = {
                    tc_number: tcNumber,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    date_of_birth: dob,
                    gender: ""
                };
                
                console.log(`Registering user ${tcNumber} in database...`, registrationData);
                
                const response = await fetch(`${API_URL}/patient/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to register user ${tcNumber}:`, errorText);
                    failedUsers.push(tcNumber);
                    continue;
                }
                
                const result = await response.json();
                
                if (result.success) {
                    console.log(`Successfully migrated user ${tcNumber} to database`);
                    registeredUsers.push(tcNumber);
                } else {
                    console.error(`Failed to register user ${tcNumber}:`, result.message);
                    failedUsers.push(tcNumber);
                }
            } catch (error) {
                console.error(`Error migrating user ${tcNumber} to database:`, error);
                failedUsers.push(tcNumber);
            }
        }
        
        if (registeredUsers.length > 0) {
            console.log(`Successfully migrated ${registeredUsers.length} users to database`);
        }
        
        if (failedUsers.length > 0) {
            console.error(`Failed to migrate ${failedUsers.length} users to database`);
        }
        
    } catch (error) {
        console.error('Error migrating users to database:', error);
    }
} 