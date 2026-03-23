# Hospital Management System

A full-stack Hospital Management System built with **Spring Boot** and **React.js** for efficient management of patients, doctors, appointments, billing, and medical records.

---

## Features

### Authentication & Security
- JWT / OAuth2 based login
- Role-based access control — Admin, Doctor, Patient
- Secured REST APIs with Spring Security

### Doctor Module
- Manage doctor profiles and specializations
- Set availability slots
- View and manage appointments

### Patient Module
- Patient registration and login
- Book and cancel appointments
- View prescriptions and medical history

### Appointment Management
- Slot-based booking system
- Appointment status tracking (Pending / Confirmed / Cancelled)

### Prescription & Billing
- Generate and manage prescriptions
- Download prescription as PDF
- Invoice and billing generation

### Admin Dashboard
- Manage doctors, patients, and departments
- View system analytics
- Full control over appointments

### Monitoring, Logging & Testing
- Centralized logging using SLF4J / Logback
- Application monitoring with Spring Boot Actuator
- Health checks and metrics endpoints
- Unit testing using JUnit
- Mock-based testing using Mockito
- Tested service and controller layers

---

## Tech Stack

**Backend**
- Java 17
- Spring Boot
- Spring Security
- JWT / OAuth2
- JPA / Hibernate
- MySQL / MongoDB
- Maven
- Spring Boot Actuator
- SLF4J / Logback (Logging)

**Frontend**
- React.js
- Axios
- Tailwind CSS / Bootstrap

**Tools**
- Swagger (API Docs)
- JUnit (Unit Testing)
- Mockito (Mock Testing)
- Postman
- Git & GitHub

---

## Folder Structure

**Backend**
```
hospital-management-backend/
│
├── src/main/java/com/hospital/
│   ├── config/              # Security, JWT, OAuth configs
│   ├── controller/          # REST API controllers
│   ├── service/             # Business logic
│   ├── repository/          # JPA repositories
│   ├── entity/              # Database entities
│   ├── dto/                 # Request/Response DTOs
│   ├── exception/           # Global exception handling
│   ├── util/                # Utility classes (PDF, etc.)
│   └── HospitalApplication.java
│
├── src/main/resources/
│   └── application.properties
│
├── pom.xml
└── README.md
```

**Frontend**
```
hospital-management-frontend/
│
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Login, Dashboard, Appointments, etc.
│   ├── services/            # Axios API calls
│   ├── context/             # Auth context (JWT storage)
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Helper functions
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── README.md
```

---

## Installation & Setup

**Backend**
```bash
git clone https://github.com/Priyanshujaiswal1024/hospital-management-backend.git
cd hospital-management-backend
mvn clean install
mvn spring-boot:run
```

**Frontend**
```bash
git clone https://github.com/Priyanshujaiswal1024/hospital-management-frontend.git
cd hospital-management-frontend
npm install
npm start
```

---

## Environment Variables

Create a `.env` or update `application.properties` in the backend:

```
SPRING_DATASOURCE_URL=your_db_url
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## API Documentation

Swagger UI available at:
```
http://localhost:8080/swagger-ui/index.html
```

---

## Deployment

| Layer     | Platform              |
|-----------|-----------------------|
| Frontend  | Vercel                |
| Backend   | Render                |
| Database  | MySQL / MongoDB Cloud |

---

## Screenshots

> Add screenshots here — Login Page, Dashboard, Appointment Page, Billing, etc.

---

## Testing

- Unit testing using **JUnit**
- Mock testing using **Mockito**
- Service and Controller layer testing
- API testing using **Postman**

---

## Monitoring & Health Check

Spring Boot Actuator endpoints:

- `/actuator/health`
- `/actuator/info`
- `/actuator/metrics`

Used for monitoring application health and performance.

---

## Future Enhancements

- Email / SMS notifications
- Doctor-Patient chat system
- Payment gateway integration
- Advanced analytics dashboard
- AI-based symptom checker

---

## Author

**Priyanshu**  
Aspiring Java Full Stack Developer  
[LinkedIn](https://www.linkedin.com/in/priyanshujava/)

---

> If you found this project helpful, please give it a ⭐ on GitHub!
