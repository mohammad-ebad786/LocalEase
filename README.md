# LocalEase

**LocalEase** is a full-stack local service booking web application designed to connect customers with service providers through a simple, organized, and user-friendly platform.

The platform allows customers to discover local services, create bookings, track booking status, submit reviews, and manage their profiles. Service providers can manage their services and bookings, while administrators can manage users, services, bookings, and reviews through a dedicated admin panel.

---

## 📌 Project Overview

LocalEase is developed as a college project to demonstrate the practical implementation of a modern service-booking platform using frontend and backend web technologies.

The application follows a role-based system with three primary user roles:

* **Customer**
* **Service Provider**
* **Administrator**

Each role has its own functionality and dashboard according to its responsibilities.

---

## 🎯 Objectives

The main objectives of LocalEase are:

* Provide a platform for discovering local services.
* Allow customers to book services online.
* Allow service providers to manage their services.
* Provide booking status tracking.
* Provide separate dashboards for customers, providers, and administrators.
* Implement secure authentication and role-based authorization.
* Allow customers to submit reviews after completing services.
* Provide notifications related to booking activities.
* Provide administrators with tools to manage the platform.
* Create a responsive and user-friendly web interface.

---

## ✨ Key Features

### 👤 Customer Features

Customers can:

* Create an account.
* Log in securely.
* View their profile.
* Browse available local services.
* View service details.
* Select a service and create a booking.
* Provide booking date, time, address, phone number, and additional notes.
* View booking details.
* Track booking status.
* View previous bookings.
* Cancel applicable bookings.
* Receive booking-related notifications.
* Submit reviews for completed services.
* Manage their account information.

---

### 🧑‍🔧 Service Provider Features

Service providers can:

* Log in through the provider account.
* Access a dedicated provider dashboard.
* View booking requests.
* Accept booking requests.
* Reject booking requests.
* Start a service.
* Mark a service as completed.
* View booking history.
* Create new services.
* Edit existing services.
* Manage service prices and descriptions.
* Activate or deactivate services.
* View customer reviews.
* Manage provider profile information.

---

### 🛡️ Administrator Features

Administrators have access to a dedicated admin panel for platform management.

Admin functionality includes:

* View platform statistics.
* Manage registered users.
* View customers and service providers.
* View booking information.
* Manage services.
* Create services.
* Edit services.
* Activate or deactivate services.
* View customer reviews.
* View review details.
* Manage different sections of the platform through dedicated admin pages.

---

## 🔐 Authentication & Authorization

LocalEase implements authentication using **JSON Web Tokens (JWT)**.

The system supports role-based access for:

```text
Customer
Provider
Admin
```

Authentication information is maintained on the client side, and protected backend routes require a valid authentication token.

Role-based middleware is used to restrict access to resources according to the user's role.

For example:

* Customers can manage their own bookings.
* Providers can manage their own services and assigned bookings.
* Administrators can access platform-level management functionality.

---

## 📅 Booking System

The booking system is one of the core features of LocalEase.

A customer can select a service and provide the required booking information.

### Booking Information

A booking can contain:

* Service
* Booking date
* Preferred time
* Address
* Phone number
* Additional notes
* Total price
* Booking status

### Booking Status Flow

The booking system supports different stages of a service booking:

```text
Pending
   ↓
Confirmed
   ↓
In Progress
   ↓
Completed
```

Bookings may also be cancelled or rejected where applicable.

The booking status is updated according to actions performed by the customer, provider, or administrator.

---

## ⭐ Review System

LocalEase provides a review system for completed services.

Customers can submit reviews after their service has been completed.

The review system helps maintain feedback between customers and service providers.

Reviews can include:

* Rating
* Review/comment
* Customer information
* Service information

Administrators can view and manage review information through the admin panel.

---

## 🔔 Notification System

LocalEase includes a notification system for important booking-related activities.

Notifications can be generated when booking-related actions take place, such as:

* Booking creation
* Booking acceptance
* Booking status updates
* Booking completion
* Other important booking events

The notification system helps users stay informed about their service activity.

---

## 🧰 Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JSON Web Token (JWT)

### Development Tools

* Visual Studio Code
* Git
* GitHub
* GitHub Desktop
* Browser Developer Tools

---

## 🗂️ Main Pages

### Customer Pages

```text
index.html
services.html
service-details.html
booking.html
booking-status.html
my-bookings.html
dashboard.html
profile.html
notifications.html
reviews.html
login.html
signup.html
about.html
contact.html
404.html
```

### Provider Pages

```text
provider.html
provider-dashboard.html
provider-services.html
provider-booking-history.html
```

### Admin Pages

```text
admin-dashboard.html
admin-users.html
admin-bookings.html
admin-services.html
admin-reviews.html
```

---

## 🏗️ Application Structure

The LocalEase application is divided into two major parts:

```text
LocalEase
│
├── Frontend
│   ├── HTML Pages
│   ├── CSS
│   └── JavaScript
│
└── Backend
    ├── Express Server
    ├── MongoDB / Mongoose
    ├── Authentication
    ├── Role-Based Authorization
    ├── Service Management
    ├── Booking Management
    ├── Notification System
    └── Review System
```

The frontend communicates with the backend through API requests.

---

## 🔄 Basic Application Flow

### Customer Flow

```text
Register / Login
       ↓
Browse Services
       ↓
View Service Details
       ↓
Select Service
       ↓
Create Booking
       ↓
Booking Pending
       ↓
Provider Accepts
       ↓
Booking Confirmed
       ↓
Service In Progress
       ↓
Service Completed
       ↓
Submit Review
```

### Provider Flow

```text
Login
  ↓
Provider Dashboard
  ↓
Manage Services
  ↓
Receive Booking Request
  ↓
Accept / Reject
  ↓
Start Service
  ↓
Complete Service
  ↓
Booking History
```

### Admin Flow

```text
Admin Login
     ↓
Admin Dashboard
     ↓
Manage Users
Manage Bookings
Manage Services
Manage Reviews
     ↓
Platform Management
```

---

## 🔌 API Integration

The frontend communicates with the backend using HTTP requests.

The backend provides APIs for major application operations, including:

* Authentication
* User management
* Service management
* Booking management
* Notifications
* Reviews
* Provider operations
* Admin operations

Protected API requests use JWT authentication.

The local development backend runs on:

```text
http://localhost:5000
```

API endpoints are accessed under:

```text
http://localhost:5000/api/
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mohammad-ebad786/LocalEase.git
```

Move into the project directory:

```bash
cd LocalEase
```

---

### 2. Install Backend Dependencies

Open the backend project directory in the terminal and install the required dependencies:

```bash
npm install
```

---

### 3. Configure Environment Variables

Create the required environment configuration file for the backend.

Typical configuration includes:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Use the environment variables required by the backend configuration.

---

### 4. Start the Backend Server

Run the backend using the configured npm command.

For a typical development setup:

```bash
npm run dev
```

or:

```bash
npm start
```

The backend should then be available at:

```text
http://localhost:5000
```

---

### 5. Run the Frontend

Open the frontend using a local development server.

For example, the project can be opened through:

* Visual Studio Code Live Server
* Another local static server
* A suitable development environment

The frontend should then communicate with the backend running on port `5000`.

---

## 🧪 Testing

LocalEase has been tested through the major application workflows, including:

### Customer Testing

* Registration
* Login
* Service browsing
* Service selection
* Booking creation
* Booking tracking
* Booking history
* Review submission
* Profile functionality

### Provider Testing

* Provider login
* Provider dashboard
* Service creation
* Service editing
* Service management
* Booking request handling
* Booking status updates
* Booking history
* Review viewing

### Admin Testing

* Admin dashboard
* User management
* Booking management
* Service management
* Review management
* Admin statistics
* Admin navigation

Testing was performed to verify the application's major user flows and interactions.

---

## 🔒 Security Considerations

LocalEase uses several mechanisms to protect application functionality:

* JWT-based authentication
* Protected backend routes
* Role-based authorization
* Password-based account authentication
* Separate customer, provider, and admin permissions
* Authentication token validation for protected requests

Sensitive configuration values such as database credentials and JWT secrets should be stored in environment variables rather than directly in source code.

---

## 📱 Responsive Design

The LocalEase frontend is designed to provide a responsive experience across different screen sizes.

The interface includes responsive layouts for:

* Desktop
* Laptop
* Tablet
* Mobile devices

CSS media queries are used to adapt layouts and components for smaller screens.

---

## 🎨 User Interface

The LocalEase interface focuses on:

* Clean layouts
* Consistent navigation
* Responsive cards
* Service-focused presentation
* Clear booking information
* Role-specific dashboards
* Simple forms
* Status indicators
* Accessible action buttons
* Consistent visual styling

---

## 📊 Admin Management

The administrator has access to platform-level information and management tools.

The admin panel provides dedicated sections for:

### Users

Administrators can view and manage registered users.

### Bookings

Administrators can view booking information and monitor booking activity.

### Services

Administrators can create and manage services available on the platform.

### Reviews

Administrators can view customer reviews and related review information.

---

## 🧑‍💻 Development Approach

LocalEase was developed incrementally by implementing and testing individual modules before integrating them into the complete application.

The development process included:

1. Frontend page development
2. Responsive UI development
3. Authentication implementation
4. Backend API development
5. Database integration
6. Role-based authorization
7. Service management
8. Booking management
9. Notification implementation
10. Review implementation
11. Customer/provider/admin dashboards
12. End-to-end testing
13. UI and code cleanup

---

## 🚀 Future Enhancements

Possible future improvements for LocalEase include:

* AI-powered customer assistance
* Improved service recommendations
* Advanced search and filtering
* Location-based service discovery
* Online payment integration
* Real-time notifications
* Provider availability scheduling
* Advanced analytics for administrators
* Improved notification center
* More detailed service provider profiles
* Deployment to a production environment
* Cloud-based database and hosting

---

## 📚 Learning Outcomes

This project provides practical experience in:

* Frontend web development
* HTML and semantic page structure
* CSS and responsive design
* JavaScript DOM manipulation
* API integration
* REST-style backend development
* Node.js and Express.js
* MongoDB and Mongoose
* JWT authentication
* Role-based authorization
* CRUD operations
* Form handling
* Booking workflow design
* Database relationships
* Error handling
* Debugging
* End-to-end application testing
* Git and GitHub project management

---

## 👨‍💻 Developers

**Mohammad Ebad**
**Ashish Singh**

BCA Students
Ewing Christian College, Prayagraj

### Profiles

* GitHub: https://github.com/mohammad-ebad786
* LinkedIn: https://www.linkedin.com/in/mohammad-ebad-295302377/

---

## 📌 Project Information

| Information      | Details                               |
| ---------------- | ------------------------------------- |
| Project Name     | LocalEase                             |
| Project Type     | Local Service Booking Web Application |
| Development Type | Full-Stack Web Application            |
| Frontend         | HTML, CSS, JavaScript                 |
| Backend          | Node.js, Express.js                   |
| Database         | MongoDB                               |
| ODM              | Mongoose                              |
| Authentication   | JWT                                   |
| User Roles       | Customer, Provider, Admin             |
| Status           | College Project                       |

---

## 📄 Conclusion

LocalEase demonstrates the development of a complete local service booking platform with separate workflows for customers, service providers, and administrators.

The project combines a responsive frontend with a Node.js/Express backend, MongoDB database integration, JWT authentication, role-based authorization, service management, booking workflows, notifications, and customer reviews.

The project was developed with a focus on practical implementation, usability, modular functionality, and real-world application workflow.
