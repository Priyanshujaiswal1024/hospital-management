# Hospital Management System – Backend

A secure and scalable backend system built with **Spring Boot** to manage hospital operations including patients, doctors, appointments, prescriptions, and billing.

> Demonstrates REST API development, JWT-based authentication, role-based authorization, pagination, layered architecture, and test-driven development.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Language** | Java 17 |
| **Framework** | Spring Boot, Spring MVC, Spring Security |
| **Authentication** | JWT, BCrypt, OAuth2 *(Planned)* |
| **Persistence** | Hibernate ORM (JPA), Spring Data JPA, JDBC |
| **Database** | MySQL, MongoDB |
| **Testing** | JUnit, Mockito |
| **Documentation** | Swagger / OpenAPI |
| **Tools** | Maven, Git, Postman, IntelliJ IDEA, MySQL Workbench |

---

## Project Structure

```
hospital-management/
│
├── src/
│   └── main/
│       └── java/
│           └── com/priyanshu/hospitalmanagement/
│               ├── config/               # App & security configuration
│               ├── controller/           # REST controllers (HTTP layer)
│               ├── dto/                  # Data Transfer Objects
│               ├── entity/               # JPA entity models
│               ├── repository/           # Spring Data JPA repositories
│               ├── security/             # JWT filters, auth logic
│               ├── service/              # Business logic layer
│               └── HospitalManagementApplication.java
│
├── screenshots/
│   ├── swagger-auth.png
│   └── swagger-patient.png
│
├── pom.xml
└── README.md
```

---

## Architecture

The project follows a clean **layered architecture**:

```
HTTP Request
     │
     ▼
Controller Layer       →  Handles incoming REST requests, input validation
     │
     ▼
Service Layer          →  Contains all business logic
     │
     ▼
Repository Layer       →  Database interaction via Spring Data JPA
     │
     ▼
Database (MySQL)
```

The **Security Layer** sits horizontally across all layers, intercepting every request for JWT validation and role-based authorization before it reaches the controller.

---

## Security

Spring Security with **stateless JWT authentication**.

| Feature | Details |
|---------|---------|
| Authentication | JWT token issued on login |
| Password Storage | BCrypt hashing |
| Token Validation | Custom JWT filter on every request |
| Authorization | Method-level via `@PreAuthorize` |
| Session Policy | Stateless (no server-side sessions) |

**User Roles:**

| Role | Access |
|------|--------|
| `ADMIN` | Full system access |
| `DOCTOR` | Own profile, appointments, prescriptions |
| `PATIENT` | Own records, booking, billing, see all doctors, see availablity slots |

---

## Core Features

### Authentication
- User registration with role assignment
- Login returns signed JWT token
- Token-based stateless authorization on all protected routes

### Patient Management
- Register new patients
- View and update patient records

### Doctor Management
- Manage doctor profiles
- Department-based doctor listing and filtering

### Appointment System
- Book appointments based on doctor slot availability
- Cancel existing appointments
- Real-time slot management

### Prescription System
- Generate prescriptions post-appointment
- Download prescription as a PDF file

### Billing System
- Auto-generate invoices after consultation
- Track payment status per appointment

### Pagination
- All list endpoints support cursor-based pagination for efficient large dataset retrieval

---

## API Documentation

Swagger UI is integrated for interactive API exploration and testing.

Once the application is running, visit:

```
http://localhost:8080/swagger-ui/index.html
```

Screenshots:

| Swagger Auth | Swagger Patient |
|---|---|
| ![Swagger Auth](screenshots/swagger-auth.png) | ![Swagger Patient](screenshots/swagger-patient.png) |

---

## Testing

| Layer | Tool | Coverage |
|-------|------|----------|
| Service Layer | JUnit + Mockito | Business logic validation |
| Controller Layer | JUnit + Mockito | Request/response behaviour |
| Integration | JUnit | End-to-end flow validation |

Run all tests:

```bash
mvn test
```

---

## Getting Started

### Prerequisites
- Java 17+
- MySQL 8+
- Maven 3.8+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Priyanshujaiswal1024/hospital-management.git
cd hospital-management

# 2. Configure database
# Edit src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# 3. Build and run
mvn spring-boot:run
```

---

## Author

**Priyanshu Jaiswal**
- GitHub: [@Priyanshujaiswal1024](https://github.com/Priyanshujaiswal1024)
- LinkedIn: [priyanshujava](https://www.linkedin.com/in/priyanshujava/)
