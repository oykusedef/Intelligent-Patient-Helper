// API_URL for backend
const API_URL = 'http://localhost:8005/api';
const OPENAI_API_KEY = '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';

// Departments
const DEPARTMENTS = [
    "Neurology",
    "Cardiology",
    "Internal Medicine",
    "Dermatology",
    "Gastroenterology",
    "ENT",
    "Ophthalmology",
    "Pulmonology",
    "Orthopedics",
    "Endocrinology",
    "Diabetes Management",
    "Infectious Diseases",
    "Primary Care",
    "Emergency Room",
    "Urgent Care",
    "Trauma Surgery",
    "Wound Care"
];

// Language settings
let currentLanguage = 'en'; // 'en' for English, 'tr' for Turkish

// Function to get department name
function getDepartmentName(department) {
    return department;
}

// Function to get department name in English
function getEnglishDepartmentName(name) {
    return name;
}

// Mock data flag
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
                "name": "Dr. Jane Smith",
                "specialization": "Neurology",
                "past_visit": {"date": "2024-01-15", "diagnosis": "Migraine"}
            },
            {
                "name": "Dr. John Davis",
                "specialization": "Neurology"
            },
            {
                "name": "Dr. Emily Wilson",
                "specialization": "Neurology"
            }
        ]
    }
};

// Mock users
const MOCK_USERS = {
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

// DOM Elements
const dashboardSection = document.getElementById('dashboardSection');
const dashboardPatientName = document.getElementById('dashboardPatientName');
const dashboardPatientTc = document.getElementById('dashboardPatientTc');
const logoutButton = document.getElementById('logoutButton');
const navTabs = document.querySelectorAll('.nav-tab');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const appointmentsList = document.getElementById('appointmentsList');
const expertDoctorsList = document.getElementById('expertDoctorsList');
const departmentFilter = document.getElementById('departmentFilter');
const pastConditionsList = document.getElementById('pastConditionsList');
const medicationsList = document.getElementById('medicationsList');
const pastAppointmentsList = document.getElementById('pastAppointmentsList');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsList = document.getElementById('recommendationsList');

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

// Global doktor listesi
let allDoctors = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in (via sessionStorage)
    checkLoginStatus();
    
    // Send message with Enter key
    userInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // Button click handlers
    sendButton.addEventListener('click', sendMessage);
    
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
    departmentFilter?.addEventListener('change', () => {
        const selectedDepartment = departmentFilter.value;
        filterDoctorsByDepartment(selectedDepartment);
    });
    
    // Logout button
    logoutButton.addEventListener('click', logout);
});

// Check if user is logged in
function checkLoginStatus() {
    // Randevuları silme kodunu kaldırdık - kalıcı kalmaları için
    
    const savedTc = sessionStorage.getItem('currentTcNumber');
    const savedPatient = sessionStorage.getItem('currentPatient');
    
    if (savedTc && savedPatient) {
        currentTcNumber = savedTc;
        currentPatient = JSON.parse(savedPatient);
        
        // Update dashboard patient info
        dashboardPatientName.textContent = currentPatient.name;
        dashboardPatientTc.textContent = currentTcNumber;
        
        // Kullanıcıya özel randevu anahtarını ayarla
        setupUserSpecificStorage();
        
        // Load patient data
        loadPatientAppointments();
        loadDoctorsData();
        loadPatientHealthHistory();
        
        // Add welcome message to chat
        addMessage(`Hello ${currentPatient.name}! I'm your AI-powered health assistant. You can describe your symptoms and I'll provide diagnostic support. How can I help you today?`, 'system');
        
        // Start inactivity timer
        resetInactivityTimer();
    } else {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
    }
}

// Kullanıcıya özel storage anahtarı
function setupUserSpecificStorage() {
    // Kullanıcı TC numarasına göre benzersiz bir localStorage anahtarı oluştur
    if (currentTcNumber) {
        window.USER_STORAGE_KEY = `patientAppointments_${currentTcNumber}`;
        console.log("Kullanıcıya özel depolama anahtarı oluşturuldu:", window.USER_STORAGE_KEY);
    }
}

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
    // Randevuları silme kodunu kaldırdık - kalıcı kalmaları için
    
    // Clear session storage (oturum bilgilerini sil ama randevuları değil)
    sessionStorage.removeItem('currentTcNumber');
    sessionStorage.removeItem('currentPatient');
    
    currentPatient = null;
    currentTcNumber = null;
    selectedDepartment = null;
    selectedDoctor = null;
    selectedDate = null;
    detectedSymptoms = [];
    chatMessages.innerHTML = '';
    
    // Redirect back to login page
    window.location.href = 'index.html';
}

// OpenAI API fonksiyonları
async function analyzeSymptoms(symptoms) {
    try {
        console.log("Sending symptoms to API:", symptoms);
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{
                    role: "system",
                    content: "You are a medical assistant. Analyze the patient's symptoms and recommend appropriate departments. Provide your response in the following format:\n\nAnalysis: [brief analysis of symptoms]\nRecommended Department: [department name]\nRecommendations: [general health recommendations]\nWarnings: [special warnings if any]"
                }, {
                    role: "user",
                    content: `Patient's symptoms: ${symptoms}`
                }],
                model: "gpt-3.5-turbo",
                temperature: 0.7,
                max_tokens: 500
            })
        });

        console.log("API Response status:", response.status);
        const responseText = await response.text();
        console.log("API Response text:", responseText);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log("Parsed API response:", data);

        if (!data || !data.content) {
            throw new Error("Invalid response format from API");
        }

        return data.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Backup simple symptom analysis
        const symptoms_lower = symptoms.toLowerCase();
        if (symptoms_lower.includes('headache') || symptoms_lower.includes('baş ağrısı')) {
            return 'Analysis: Headache symptoms\nRecommended Department: Neurology\nRecommendations: Rest in a quiet, dark room. Stay hydrated.\nWarnings: Seek immediate medical attention if headache is severe or accompanied by fever, stiff neck, or confusion.';
        }
        if (symptoms_lower.includes('fever') || symptoms_lower.includes('ateş')) {
            return 'Analysis: Fever symptoms\nRecommended Department: Internal Medicine\nRecommendations: Stay hydrated, get rest\nWarnings: Seek emergency care if fever exceeds 39°C (102.2°F).';
        }
        
        return 'Sorry, I cannot analyze symptoms at the moment. Please select a department directly or try again later.';
    }
}

// Update sendMessage function
async function sendMessage() {
    const message = userInput.value.trim().toLowerCase();
    if (!message) return;

    // Show user message
    addMessage(userInput.value.trim(), 'user');
    userInput.value = '';

    // Handle final yes/no responses
    if (message === 'no') {
        addMessage("Thank you for using our service! We hope you're satisfied with your experience. Have a great day!", 'system');
        return;
    } else if (message === 'yes') {
        addMessage("How can I help you today?", 'system');
        return;
    }

    // Store the symptoms
    detectedSymptoms = [message];

    // Add typing indicator
    addTypingIndicator();

    try {
        // Analyze symptoms with OpenAI
        const aiResponse = await analyzeSymptoms(message);
        
        // Remove typing indicator
        removeTypingIndicator();

        // Format AI response for better readability
        let formattedResponse = aiResponse;
        if (typeof formattedResponse === 'string') {
            formattedResponse = formattedResponse
                .replace(/(Analysis:)/g, '<br><b>$1</b>')
                .replace(/(Recommended Department:)/g, '<br><b>$1</b>')
                .replace(/(Recommendations:)/g, '<br><b>$1</b>')
                .replace(/(Warnings:)/g, '<br><b>$1</b>');
            // Remove leading <br> if present
            formattedResponse = formattedResponse.replace(/^<br>/, '');
        }

        // Show AI response
        addMessage(formattedResponse, 'system');

        // Parse department recommendation
        const departmentMatch = aiResponse.match(/Recommended Department:\s*([^\n]+)/i);
        if (departmentMatch) {
            const recommendedDepartments = departmentMatch[1].trim().split(' or ').map(dept => dept.trim());
            
            // Show department options
            setTimeout(() => {
                addMessage(`I can help you schedule an appointment. Please select a department:`, 'system');
                displayDepartmentOptions(recommendedDepartments);
            }, 1000);
        }
    } catch (error) {
        console.error('Message processing error:', error);
        removeTypingIndicator();
        addMessage('Sorry, an error occurred. Please try again or select a department directly.', 'system');
    }
}

// Display department options
function displayDepartmentOptions(departments) {
    const deptContainer = document.createElement('div');
    deptContainer.className = 'department-options';
    
    // Remove duplicates and sort departments
    const uniqueDepartments = [...new Set(departments)].sort();
    
    uniqueDepartments.forEach(dept => {
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

// Load patient's appointments
async function loadPatientAppointments() {
    try {
        let appointments = new Map(); // Use Map to track unique appointments by ID
        
        // Try loading from API first
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_URL}/appointment/list/${currentTcNumber}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Appointments from API:", data);
                    
                    if (data && data.appointments) {
                        data.appointments.forEach(apt => {
                            appointments.set(apt.id, {
                                ...apt,
                                appointment_date: apt.appointment_date
                            });
                        });
                    }
                }
            } catch (apiError) {
                console.error("API error:", apiError);
                const localAppointments = await getAppointmentsFromLocalStorage();
                localAppointments.forEach(apt => {
                    if (!appointments.has(apt.id)) {
                        appointments.set(apt.id, apt);
                    }
                });
            }
        } else {
            const localAppointments = await getAppointmentsFromLocalStorage();
            localAppointments.forEach(apt => {
                appointments.set(apt.id, apt);
            });
        }
        
        // Convert Map values back to array and sort by date
        const sortedAppointments = Array.from(appointments.values())
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        
        // Display appointments
        if (sortedAppointments.length > 0) {
            let appointmentsHTML = '';
            
            sortedAppointments.forEach(appointment => {
                const appointmentDateUTC = new Date(appointment.appointment_date);
                const timezoneOffsetMinutes = new Date().getTimezoneOffset();
                const appointmentTimeMillis = appointmentDateUTC.getTime();
                const appointmentLocalTimeMillis = appointmentTimeMillis - (timezoneOffsetMinutes * 60 * 1000);
                const appointmentDateLocal = new Date(appointmentLocalTimeMillis);

                const isUpcoming = appointmentDateLocal > new Date();
                
                appointmentsHTML += `
                    <div class="appointment-card">
                        <h3>${appointment.department} Appointment ${isUpcoming ? '<span class="upcoming-tag">Upcoming</span>' : ''}</h3>
                        <p><strong>Doctor:</strong> ${appointment.doctor_name}</p>
                        <div class="appointment-details">
                            <div class="appointment-detail">
                                <i class="fas fa-calendar"></i>
                                <span>${formatDate(appointmentDateLocal)}</span>
                            </div>
                            <div class="appointment-detail">
                                <i class="fas fa-clock"></i>
                                <span>${formatTime(appointmentDateLocal)}</span>
                            </div>
                        </div>
                        ${appointment.symptoms ? `<p><strong>Symptoms:</strong> ${appointment.symptoms}</p>` : ''}
                        <p class="appointment-id"><small>Appointment ID: ${appointment.id}</small></p>
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
    } catch (error) {
        console.error("Error loading appointments:", error);
        appointmentsList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading appointments: ${error.message}</p>
            </div>
        `;
    }
}

// Yerel depolamadan randevuları al
async function getAppointmentsFromLocalStorage() {
    // Kullanıcıya özel storage anahtarını kullan
    const storageKey = window.USER_STORAGE_KEY || `patientAppointments_${currentTcNumber}`;
    
    // Önceden kaydedilmiş randevuları al
    let storedAppointments = [];
    try {
        const savedAppointments = localStorage.getItem(storageKey);
        if (savedAppointments) {
            storedAppointments = JSON.parse(savedAppointments);
            
            // Randevuları doğrula ve temizle
            storedAppointments = storedAppointments
                .filter(apt => {
                    // Geçerli bir ID'si var mı?
                    if (!apt.id) return false;
                    
                    // Geçerli bir tarih mi?
                    const appointmentDate = new Date(apt.appointment_date);
                    if (isNaN(appointmentDate.getTime())) return false;
                    
                    // Gerekli alanlar var mı?
                    if (!apt.doctor_name || !apt.department) return false;
                    
                    return true;
                })
                .map(apt => ({
                    ...apt,
                    // Tarihleri ISO formatına dönüştür
                    appointment_date: new Date(apt.appointment_date).toISOString(),
                    // Eksik alanları tamamla
                    symptoms: apt.symptoms || 'No specific symptoms',
                    status: apt.status || 'scheduled'
                }));
            
            // Mükerrer randevuları temizle
            const uniqueAppointments = new Map();
            storedAppointments.forEach(apt => {
                const timeKey = new Date(apt.appointment_date).getTime();
                if (!uniqueAppointments.has(timeKey) || 
                    uniqueAppointments.get(timeKey).id > apt.id) {
                    uniqueAppointments.set(timeKey, apt);
                }
            });
            
            // Map'ten array'e dönüştür
            storedAppointments = Array.from(uniqueAppointments.values());
            
            // Güncellenmiş listeyi kaydet
            localStorage.setItem(storageKey, JSON.stringify(storedAppointments));
            
            console.log("Yerel depolamadan randevular yüklendi:", storedAppointments.length);
        }
    } catch (e) {
        console.error('Error loading saved appointments:', e);
    }
    
    return storedAppointments;
}

// Function to save appointment to localStorage
async function saveAppointmentToLocalStorage(appointmentData) {
    try {
        // Kullanıcıya özel storage anahtarını kullan
        const storageKey = window.USER_STORAGE_KEY || `patientAppointments_${currentTcNumber}`;
        
        // Önceden kaydedilmiş randevuları al
        let storedAppointments = [];
        const savedAppointments = localStorage.getItem(storageKey);
        if (savedAppointments) {
            storedAppointments = JSON.parse(savedAppointments);
        }
        
        // Randevu tarihini Date objesine çevir
        const newAppointmentTime = new Date(appointmentData.appointment_date).getTime();
        
        // Aynı ID'li randevu var mı kontrol et
        const existingAppointmentIndex = storedAppointments.findIndex(app => app.id === appointmentData.id);
        
        if (existingAppointmentIndex === -1) {
            // Yeni randevuyu ekle
            storedAppointments.push({
                ...appointmentData,
                appointment_date: new Date(appointmentData.appointment_date).toISOString()
            });
        } else {
            // Mevcut randevuyu güncelle
            storedAppointments[existingAppointmentIndex] = {
                ...appointmentData,
                appointment_date: new Date(appointmentData.appointment_date).toISOString()
            };
        }
        
        // Randevuları tarih sırasına göre sırala
        storedAppointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        
        // Randevuları kaydet
        localStorage.setItem(storageKey, JSON.stringify(storedAppointments));
        console.log("Appointment saved to local storage:", appointmentData);
        
        return true;
    } catch (error) {
        console.error('Error saving appointment:', error);
        return false;
    }
}

// Load doctors data
function loadDoctorsData() {
    // Mock doctors data - Daha fazla doktor ve departman
    allDoctors = [
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
            department: "Internal Medicine",
            specialization: "General Internal Medicine",
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
        },
        {
            id: "D11",
            name: "Dr. Thomas Wright",
            department: "Orthopedics",
            specialization: "Sports Medicine",
            experience: "12 years",
            education: "Northwestern University",
            languages: "English"
        },
        {
            id: "D12",
            name: "Dr. Jessica Lee",
            department: "Cardiology",
            specialization: "Heart Failure",
            experience: "9 years",
            education: "University of California San Francisco",
            languages: "English, Korean"
        },
        {
            id: "D13",
            name: "Dr. Richard Allen",
            department: "ENT",
            specialization: "Head and Neck Surgery",
            experience: "17 years",
            education: "University of Washington",
            languages: "English"
        },
        {
            id: "D14",
            name: "Dr. Sophia Patel",
            department: "Ophthalmology",
            specialization: "Glaucoma Treatment",
            experience: "11 years",
            education: "University of Chicago",
            languages: "English, Hindi"
        },
        {
            id: "D15",
            name: "Dr. Daniel Rodriguez",
            department: "Gastroenterology",
            specialization: "Inflammatory Bowel Disease",
            experience: "14 years",
            education: "Vanderbilt University",
            languages: "English, Spanish"
        },
        {
            id: "D16",
            name: "Dr. Maria Garcia",
            department: "Endocrinology",
            specialization: "Diabetes and Metabolic Disorders",
            experience: "15 years",
            education: "University of California San Francisco",
            languages: "English, Spanish"
        },
        {
            id: "D17",
            name: "Dr. Ahmed Hassan",
            department: "Endocrinology",
            specialization: "Thyroid Disorders",
            experience: "12 years",
            education: "Johns Hopkins University",
            languages: "English, Arabic"
        },
        {
            id: "D18",
            name: "Dr. Sarah Chen",
            department: "Endocrinology",
            specialization: "Endocrine Disorders",
            experience: "10 years",
            education: "Harvard Medical School",
            languages: "English, Mandarin"
        },
        {
            id: "D19",
            name: "Dr. James Wilson",
            department: "Infectious Diseases",
            specialization: "Viral Infections",
            experience: "14 years",
            education: "Harvard Medical School",
            languages: "English, French"
        },
        {
            id: "D20",
            name: "Dr. Lisa Patel",
            department: "Infectious Diseases",
            specialization: "Bacterial Infections",
            experience: "11 years",
            education: "Johns Hopkins University",
            languages: "English, Hindi"
        },
        {
            id: "D21",
            name: "Dr. Robert Chen",
            department: "Primary Care",
            specialization: "Family Medicine",
            experience: "16 years",
            education: "Stanford University",
            languages: "English, Mandarin"
        },
        {
            id: "D22",
            name: "Dr. Emily Thompson",
            department: "Primary Care",
            specialization: "General Practice",
            experience: "13 years",
            education: "University of California San Francisco",
            languages: "English, Spanish"
        },
        {
            id: "D23",
            name: "Dr. Sarah Williams",
            department: "Emergency Room",
            specialization: "Emergency Medicine",
            experience: "15 years",
            education: "Johns Hopkins University",
            languages: "English, Spanish"
        },
        {
            id: "D24",
            name: "Dr. Michael Chang",
            department: "Emergency Room",
            specialization: "Trauma Care",
            experience: "12 years",
            education: "Harvard Medical School",
            languages: "English, Mandarin"
        },
        {
            id: "D25",
            name: "Dr. Emily Rodriguez",
            department: "Emergency Room",
            specialization: "Critical Care",
            experience: "14 years",
            education: "Stanford University",
            languages: "English, Spanish"
        },
        {
            id: "D26",
            name: "Dr. James Thompson",
            department: "Urgent Care",
            specialization: "Acute Care",
            experience: "10 years",
            education: "University of California San Francisco",
            languages: "English"
        },
        {
            id: "D27",
            name: "Dr. Lisa Chen",
            department: "Urgent Care",
            specialization: "Minor Injuries",
            experience: "8 years",
            education: "Yale University",
            languages: "English, Mandarin"
        },
        {
            id: "D28",
            name: "Dr. Robert Martinez",
            department: "Urgent Care",
            specialization: "Emergency Medicine",
            experience: "11 years",
            education: "Duke University",
            languages: "English, Spanish"
        },
        {
            id: "D29",
            name: "Dr. Patricia Kim",
            department: "Trauma Surgery",
            specialization: "Surgical Trauma",
            experience: "16 years",
            education: "Mayo Clinic College of Medicine",
            languages: "English, Korean"
        },
        {
            id: "D30",
            name: "Dr. David Wilson",
            department: "Trauma Surgery",
            specialization: "Emergency Surgery",
            experience: "13 years",
            education: "University of Pennsylvania",
            languages: "English"
        },
        {
            id: "D31",
            name: "Dr. Sophia Patel",
            department: "Wound Care",
            specialization: "Wound Management",
            experience: "9 years",
            education: "University of Chicago",
            languages: "English, Hindi"
        },
        {
            id: "D32",
            name: "Dr. Thomas Anderson",
            department: "Wound Care",
            specialization: "Burn Care",
            experience: "12 years",
            education: "University of Michigan",
            languages: "English"
        }
    ];
    
    // Departman filtresini güncelle
    updateDepartmentFilter();
    
    // Doktorları görüntüle
    displayDoctors(allDoctors);
}

// Departman filtresini güncelleme
function updateDepartmentFilter() {
    if (!departmentFilter) return;
    
    // Mevcut seçili değeri sakla
    const currentSelection = departmentFilter.value;
    
    // Filtre içeriğini oluştur
    let filterHTML = `<option value="all">All Departments</option>`;
    
    DEPARTMENTS.forEach(department => {
        filterHTML += `<option value="${department}">${department}</option>`;
    });
    
    // Filtreyi güncelle
    departmentFilter.innerHTML = filterHTML;
    
    // Önceki seçimi koru
    if (currentSelection && DEPARTMENTS.includes(currentSelection)) {
        departmentFilter.value = currentSelection;
    }
}

// Helper functions for date/time formatting
function formatDate(date) {
    // Tarihi yerel saat dilimine göre formatla
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    // Saati 24 saatlik formatta göster
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Display time options in 24-hour format
function formatTimeOption(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
}

// Convert UTC ISO string to local date
function UTCtoLocalDate(utcString) {
    // Parse the UTC string and create a new Date object
    const date = new Date(utcString);
    // Return the date as is - JavaScript's Date object automatically handles timezone conversion
    return date;
}

// Convert local date to UTC ISO string
function localToUTCString(localDate) {
    // Create a new Date object and convert to UTC
    return localDate.toISOString();
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
            
            // Seçilen doktoru ve departmanı kaydet
            selectedDepartment = doctorDept;
            const selectedDoctorData = allDoctors.find(d => d.id === doctorId);
            
            if (selectedDoctorData) {
                selectedDoctor = selectedDoctorData;
                
                // Switch to AI Diagnosis tab
                document.querySelector('.nav-tab[data-section="aiDiagnosisSection"]').click();
                
                // Add message to chat
                addMessage(`I'd like to book an appointment with ${doctorName} in the ${doctorDept} department.`, 'user');
                
                // Typing indicator
                addTypingIndicator();
                
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage(`Great choice! Dr. ${selectedDoctorData.name.split(' ')[1]} is a specialist in ${selectedDoctorData.specialization}.`, 'system');
                    addMessage(`Let me help you book an appointment with ${doctorName}.`, 'system');
                    
                    // Randevu sürecine devam et
                    proceedToBooking();
                }, 1500);
            }
        });
    });
}

// Randevu işlemine devam et
function proceedToBooking() {
    if (!selectedDoctor) return;
    
    // Tarih seçimi için typing indicator göster
    addTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        // Tarih seçimini göster
        addMessage(`Please select a date for your appointment with ${selectedDoctor.name}:`, 'system');
        
        // Tarih seçenekleri
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
    }, 1500);
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

// Load patient health history
async function loadPatientHealthHistory() {
    let healthHistory = null;
    try {
        // Giriş yapan hastanın TC numarasını al
        const tcNumber = currentTcNumber;
        if (!tcNumber) throw new Error("TC numarası bulunamadı");
        // API'den sağlık geçmişi verisini çek
        const response = await fetch(`${API_URL}/health_history/${tcNumber}`);
        if (!response.ok) throw new Error("API'den sağlık geçmişi alınamadı");
        healthHistory = await response.json();
    } catch (err) {
        // Hata olursa kullanıcıya bilgi ver
        pastConditionsList.innerHTML = '<p>Sağlık geçmişi verisi bulunamadı.</p>';
        medicationsList.innerHTML = '<p>Sağlık geçmişi verisi bulunamadı.</p>';
        pastAppointmentsList.innerHTML = '<p>Sağlık geçmişi verisi bulunamadı.</p>';
        return;
    }
    // Geçmiş hastalıkları göster
    let conditionsHTML = '';
    if (healthHistory.past_conditions && healthHistory.past_conditions.length > 0) {
        healthHistory.past_conditions.forEach(condition => {
            conditionsHTML += `
                <li>
                    <i class="fas fa-file-medical"></i>
                    <span>${condition}</span>
                </li>
            `;
        });
        pastConditionsList.innerHTML = conditionsHTML;
    } else {
        pastConditionsList.innerHTML = '<p>No past conditions recorded.</p>';
    }
    // İlaçları göster
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
                        <p class="medication-details">${medication.dosage ? medication.dosage : ''}${medication.dosage && medication.frequency ? ', ' : ''}${medication.frequency ? medication.frequency : ''}</p>
                    </div>
                </li>
            `;
        });
        medicationsList.innerHTML = medicationsHTML;
    } else {
        medicationsList.innerHTML = '<p>No medications recorded.</p>';
    }
    // Geçmiş randevuları göster
    let appointmentsHTML = '';
    if (healthHistory.past_appointments && healthHistory.past_appointments.length > 0) {
        healthHistory.past_appointments.forEach(appointment => {
            appointmentsHTML += `
                <div class="past-appointment-card">
                    <p><strong>Department:</strong> ${appointment.department}</p>
                    <p><strong>Doctor:</strong> ${appointment.doctor}</p>
                    <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
                    <p><strong>Diagnosis:</strong> ${appointment.diagnosis}</p>
                </div>
            `;
        });
        pastAppointmentsList.innerHTML = appointmentsHTML;
    } else {
        pastAppointmentsList.innerHTML = '<p>No past appointments recorded.</p>';
    }
}

// Function to select department
function selectDepartment(department) {
    // Normalize department name: remove " Department" if present
    const normalizedDepartment = department.replace(/ Department$/i, '').trim();

    selectedDepartment = normalizedDepartment;

    addMessage(`You've selected the ${department} department. Let me find available doctors for you.`, 'system');

    // Show typing indicator
    addTypingIndicator();

    // Simulate API call to get doctors
    setTimeout(() => {
        removeTypingIndicator();

        // Seçilen departmana göre doktorları filtrele
        const departmentDoctors = allDoctors.filter(doctor => doctor.department === normalizedDepartment);

        if (departmentDoctors.length === 0) {
            addMessage(`Sorry, there are no doctors available in the ${department} department at the moment.`, 'system');
            return;
        }

        // Internal Medicine departmanı için Dr. Michael Brown'ı ilk sıraya getir
        if (normalizedDepartment === "Internal Medicine") {
            // Dr. Michael Brown'ı bul ve listeden çıkar
            const michaelBrownIndex = departmentDoctors.findIndex(d => d.name === "Dr. Michael Brown");
            if (michaelBrownIndex !== -1) {
                const michaelBrown = departmentDoctors.splice(michaelBrownIndex, 1)[0];
                // Listenin başına ekle
                departmentDoctors.unshift(michaelBrown);
            }
        }
        
        addMessage(`I found ${departmentDoctors.length} doctors in the ${department} department. Please select one:`, 'system');
        
        // Display doctor options
        const doctorContainer = document.createElement('div');
        doctorContainer.className = 'doctor-options';
        
        departmentDoctors.forEach(doctor => {
            const doctorButton = document.createElement('button');
            doctorButton.className = 'doctor-button';
            doctorButton.textContent = doctor.name;
            doctorButton.addEventListener('click', () => {
                // Seçilen doktoru kaydet
                selectedDoctor = doctor;
                addMessage(`You've selected ${doctor.name}, ${doctor.specialization}.`, 'system');
                
                // Randevu sürecine devam et
                proceedToBooking();
            });
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
    }, 1500);
}

// Tarih seçimi
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
    
    // Seçilen tarihi yerel saat dilimine göre ayarla
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0); // Set to midnight local time

    for (let hour = 9; hour <= 16; hour++) {
        const time = new Date(localDate);
        time.setHours(hour, 0, 0, 0); // Sets hours in local time

        // Store as UTC ISO string
        const utcTimeISOString = time.toISOString();

        timeSlots.push({ localTime: time, utcTimeISOString: utcTimeISOString });
    }
    
    timeSlots.forEach(slot => {
        const timeButton = document.createElement('button');
        timeButton.className = 'time-button';
        // Show local time on button
        // This will effectively show UTC time if local time is UTC+X
        // const shiftedLocalTime = new Date(slot.localTime.getTime() - new Date().getTimezoneOffset() * 60000);
        timeButton.textContent = formatTime(slot.localTime);

        timeButton.dataset.utcTime = slot.utcTimeISOString; // Stores the correct UTC ISO string
        timeButton.addEventListener('click', () => {
            // Pass the UTC Date object created from the stored UTC ISO string
            const selectedUtcDate = new Date(slot.utcTimeISOString);
            finalizeAppointment(selectedUtcDate);
        });
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
    console.log("finalizeAppointment called with Date object:", dateTime);

    // UTC zamanını sakla (gelen dateTime objesi zaten UTC'den oluşturuldu)
    const utcDateTime = new Date(dateTime); // Should be UTC Date object
    selectedDate = utcDateTime.toISOString();
    
    // Calculate local time Date object for display and saving local time to DB as requested
    const appointmentDateLocal = new Date(utcDateTime.getTime() + new Date().getTimezoneOffset() * 60 * 1000);

    // Show appointment summary
    addMessage(`
        <div class="appointment-summary">
            <h3>Appointment Summary</h3>
            <p><strong>Department:</strong> ${selectedDoctor.department}</p>
            <p><strong>Doctor:</strong> ${selectedDoctor.name}</p>
            <p><strong>Date & Time:</strong> ${formatDate(utcDateTime)} at ${formatTime(utcDateTime)}</p>
            <p><strong>Symptoms:</strong> ${detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms'}</p>
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

// Book appointment function update
async function bookAppointment() {
    try {
        addMessage('Booking your appointment...', 'system');
        
        // UTC zamanını al (selectedDate zaten UTC ISO string)
        const appointmentDateUTC = new Date(selectedDate);

        // Calculate local time Date object for display and saving local time to DB as requested
        const appointmentDateLocal = new Date(appointmentDateUTC.getTime() + new Date().getTimezoneOffset() * 60 * 1000);

        // Seçilen saatte randevu var mı kontrol et (UTC bazlı karşılaştırma)
        const existingAppointments = await getAppointmentsFromLocalStorage();
        const sameTimeAppointment = existingAppointments.find(apt => {
            const aptTime = new Date(apt.appointment_date);
            // Compare UTC hours for simplicity, assuming whole hours slots
            return aptTime.getUTCFullYear() === appointmentDateUTC.getUTCFullYear() &&
                   aptTime.getUTCMonth() === appointmentDateUTC.getUTCMonth() &&
                   aptTime.getUTCDate() === appointmentDateUTC.getUTCDate() &&
                   aptTime.getUTCHours() === appointmentDateUTC.getUTCHours();
        });
        
        if (sameTimeAppointment) {
            addMessage('Error: You already have an appointment at this time.', 'system');
            return;
        }
        
        // Generate a shorter, more readable appointment ID
        const date = appointmentDateLocal.getDate().toString().padStart(2, '0');
        const month = (appointmentDateLocal.getMonth() + 1).toString().padStart(2, '0');
        const hour = appointmentDateLocal.getHours().toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        currentAppointmentId = `${date}${month}${hour}${randomNum}`;
        
        addMessage('Sending data to the server...', 'system');
        
        const appointmentData = {
            id: currentAppointmentId,
            tc_number: currentTcNumber,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            department: selectedDoctor.department,
            appointment_date: appointmentDateLocal.getFullYear() + '-' +
                              String(appointmentDateLocal.getMonth() + 1).padStart(2, '0') + '-' +
                              String(appointmentDateLocal.getDate()).padStart(2, '0') + ' ' +
                              String(appointmentDateLocal.getHours()).padStart(2, '0') + ':' +
                              String(appointmentDateLocal.getMinutes()).padStart(2, '0') + ':' +
                              String(appointmentDateLocal.getSeconds()).padStart(2, '0'),
            symptoms: detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms',
            status: 'confirmed'
        };

        console.log("Appointment data before sending to server:", appointmentData);

        let result;
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_URL}/appointment/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appointmentData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                result = await response.json();
                console.log("API response:", result);
            } catch (apiError) {
                console.error("API error:", apiError);
                result = { success: true };
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
            result = { success: true };
        }
        
        if (result.success) {
            // Önce localStorage'ı temizle ve yeni randevuyu kaydet
            const savedSuccessfully = await saveAppointmentToLocalStorage(appointmentData);
            
            if (!savedSuccessfully) {
                addMessage('Error: Could not save the appointment. Please try again.', 'system');
                return;
            }
            
            // Show success message
            addMessage(`
                <div class="appointment-success">
                    <h3>Appointment Booked Successfully!</h3>
                    <p>Your appointment has been confirmed with ${selectedDoctor.name} on ${formatDate(appointmentDateUTC)} at ${formatTime(appointmentDateUTC)}.</p>
                    <p>Appointment ID: ${currentAppointmentId}</p>
                    <p>Please arrive 15 minutes before your appointment time.</p>
                </div>
            `, 'system');
            
            // Update appointments list
            await loadPatientAppointments();
            
            // Reset current appointment data
            currentAppointmentId = null;
            selectedDoctor = null;
            selectedDate = null;
            detectedSymptoms = [];
            
            addMessage('Is there anything else I can help you with today?', 'system');
        } else {
            addMessage('Sorry, there was an issue saving your appointment. Please try again.', 'system');
        }
    } catch (error) {
        console.error('Booking error:', error);
        addMessage('An error occurred while booking your appointment. Please try again.', 'system');
    }
} 