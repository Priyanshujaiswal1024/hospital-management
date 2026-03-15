# 🏥 Hospital Management System – Backend

A secure and scalable backend system built using **Spring Boot** to manage hospital operations such as patients, doctors, appointments, prescriptions, and billing.

The project demonstrates **REST API development, JWT-based authentication, role-based authorization, pagination, testing, and layered architecture**.

---

# 🚀 Tech Stack

## Backend
- Java
- Spring Boot
- Spring MVC
- Spring Security
- JWT Authentication
- OAuth2 (Planned Integration)
- Hibernate ORM (JPA)
- Spring Data JPA
- JDBC

## Database
- MySQL
- MongoDB

## Testing
- JUnit
- Mockito

## API Documentation
- Swagger / OpenAPI

## Tools
- Maven
- Git
- Postman
- IntelliJ IDEA
- MySQL Workbench

---

# 📂 Project Structure


src/main/java/com/priyanshu/hospitalmanagement

├── config # Configuration classes
│ ├── WebSecurityConfig.java
│ └── OpenApiConfig.java
│
├── controller # REST API controllers
│ ├── AuthController.java
│ ├── PatientController.java
│ ├── DoctorController.java
│ └── AppointmentController.java
│
├── dto # Data Transfer Objects
│ ├── PatientDTO.java
│ └── AppointmentDTO.java
│
├── entity # Database entities
│ ├── Patient.java
│ ├── Doctor.java
│ ├── Appointment.java
│ └── Prescription.java
│
├── repository # Data access layer
│ ├── PatientRepository.java
│ ├── DoctorRepository.java
│ └── AppointmentRepository.java
│
├── service # Business logic layer
│ ├── PatientService.java
│ ├── DoctorService.java
│ └── AppointmentService.java
│
├── security # Authentication and authorization
│ ├── JwtAuthFilter.java
│ ├── JwtService.java
│ └── UserDetailsServiceImpl.java
│
├── error # Global exception handling
│ └── GlobalExceptionHandler.java
│
└── HospitalManagementApplication.java
├── screenshots
│   ├── swagger-auth.png
│   ├── swagger-patient.png
│
├── README.md


The project follows a **layered architecture** where:

- **Controllers** handle HTTP requests.
- **Services** contain business logic.
- **Repositories** interact with the database.
- **Security layer** manages authentication and authorization.

---

# 🔐 Security

The application uses **Spring Security with JWT authentication**.

Security features:

- Stateless authentication
- Role-based access control
- Password encryption using BCrypt
- JWT token validation filter
- Method-level authorization

User Roles:

- ADMIN
- DOCTOR
- PATIENT

---

# ⚙️ Core Features

## Authentication
- User registration
- Login with JWT authentication
- Role-based authorization

## Patient Management
- Register new patients
- View patient records
- Update patient details

## Doctor Management
- Manage doctor profiles
- Department-based doctor listing

## Appointment System
- Book appointments
- Cancel appointments
- Doctor slot availability

## Prescription System
- Generate prescriptions
- Download prescription PDF

## Billing System
- Invoice generation
- Payment management

## Pagination
- Efficient retrieval of large datasets

---

# 🧪 Testing

Unit testing implemented using:

- JUnit
- Mockito

Testing covers:

- Service layer
- Controller layer
- Business logic validation


The project follows a **layered architecture** where:

- **Controllers** handle HTTP requests.
- **Services** contain business logic.
- **Repositories** interact with the database.
- **Security layer** manages authentication and authorization.

---

# 🔐 Security

The application uses **Spring Security with JWT authentication**.

Security features:

- Stateless authentication
- Role-based access control
- Password encryption using BCrypt
- JWT token validation filter
- Method-level authorization

User Roles:

- ADMIN
- DOCTOR
- PATIENT

---

# ⚙️ Core Features

## Authentication
- User registration
- Login with JWT authentication
- Role-based authorization

## Patient Management
- Register new patients
- View patient records
- Update patient details

## Doctor Management
- Manage doctor profiles
- Department-based doctor listing

## Appointment System
- Book appointments
- Cancel appointments
- Doctor slot availability

## Prescription System
- Generate prescriptions
- Download prescription PDF

## Billing System
- Invoice generation
- Payment management

## Pagination
- Efficient retrieval of large datasets

---

# 🧪 Testing

Unit testing implemented using:

- JUnit
- Mockito

Testing covers:

- Service layer
- Controller layer
- Business logic validation

---
