# Intelligent Patient System

A modern healthcare platform for symptom analysis, doctor recommendations, and appointment scheduling.

## Features

- AI-powered symptom analysis
- Department and doctor recommendations
- Appointment scheduling
- Patient registration
- Responsive design for all devices

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: FastAPI (Python)
- **Database**: Neon PostgreSQL

## Getting Started

### Prerequisites

- Python 3.8+
- Neon DB account (https://neon.tech)

### Setting Up Neon DB

1. Create a free account on [Neon](https://neon.tech)
2. Create a new project
3. Create a new database
4. Copy your connection string from the Neon dashboard
5. Update the `.env` file with your connection string:

```
DATABASE_URL=postgres://your-username:your-password@your-neon-db-host/your-database
```

### Installation

1. Clone the repository
2. Install dependencies:

```
pip install -r requirements.txt
```

3. Run the application:

```
python -m uvicorn main:app --reload
```

4. Open your browser and navigate to `http://localhost:8000`

## API Endpoints

- `GET /api/patient/check/{tc_number}` - Check if a patient exists
- `POST /api/patient/register` - Register a new patient
- `POST /api/chat` - Process chat messages for symptom analysis
- `POST /api/appointment/create` - Create a new appointment

## Database Structure

The application uses Neon PostgreSQL with the following tables:

### Patients Table

| Column        | Type           | Description               |
|---------------|----------------|---------------------------|
| id            | SERIAL         | Primary key               |
| tc_number     | VARCHAR(11)    | Unique patient ID number  |
| name          | VARCHAR(100)   | Patient's full name       |
| date_of_birth | DATE           | Date of birth             |
| phone         | VARCHAR(20)    | Contact phone number      |
| email         | VARCHAR(100)   | Email address             |
| created_at    | TIMESTAMP      | Record creation timestamp |

### Appointments Table

| Column           | Type           | Description               |
|------------------|----------------|---------------------------|
| id               | SERIAL         | Primary key               |
| patient_id       | INTEGER        | Foreign key to patients   |
| department       | VARCHAR(100)   | Medical department        |
| doctor_name      | VARCHAR(100)   | Doctor's name             |
| doctor_id        | VARCHAR(100)   | Doctor's ID               |
| appointment_date | TIMESTAMP      | Appointment date and time |
| symptoms         | TEXT           | Patient's symptoms        |
| status           | VARCHAR(20)    | Appointment status        |
| created_at       | TIMESTAMP      | Record creation timestamp |

## Fallback Mechanism

The application includes a fallback to use in-memory data structures if the database connection fails. This ensures the application remains functional even without database access.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Installation and Startup Instructions

### Requirements
- Python 3.9 or later
- pip (Python package manager)

### Installing on a New Computer

1. **Copy the repository to the new computer:**
```

git clone <repo-url> or download and extract as a ZIP
```

2. **Go to the project directory:**
```
cd IntelligentPatientHelper
```

3. **Create and activate the virtual environment:**
```
# Windows
python -m venv .venv
.venv\Scripts\activate

# Mac/Linux
python3 -m venv .venv
source .venv/bin/activate
```

4. **Install the required packages:**
```
pip install -r requirements.txt
```

### Running the Application

#### Running with a Single Command (Recommended)
To start both the backend and frontend servers with a single command:

```
python start_app.py
```

This command:
1. Starts the Backend API server on port 8005
2. Starts the Frontend HTTP server on port 8000
3. Shows the URL you need to open in the browser

Once the application starts, open the following address in your browser: http://localhost:8000/index.html

#### Manual Run
You can open two different terminal windows and run the following commands:

**For the Backend (API) server:**
```
python modified_main.py
```

**For the Frontend (HTTP) server:**
```
python -m http.server 8000
```

### Database Connection

The application, It uses NeonDB. If you want to use another database, change the `DATABASE_URL` variable in the `modified_main.py` file:

```python
DATABASE_URL = "postgresql://user:password@server:port/veritabani?sslmode=require"
```

## Troubleshooting

### Backend Not Working
If the backend server (`modified_main.py`) is not working:
1. Make sure that the Python packages are installed
2. Make sure that the DATABASE_URL is correct

### Frontend Not Working
If the frontend server is not working:
1. Make sure that port 8000 is not being used by another application
2. Make sure that Python is properly installed

### Database Connection Problems
1. Make sure that the database connection information is correct
2. Make sure that your NeonDB account is active
3. Check your network connection
