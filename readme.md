# Cognition Project

## Overview

The **Cognition Project** is a web-based application designed to track and analyze motor performance through touch interactions. It features user authentication, role-based access (participants and caregivers), and a RESTful API for handling measurements and results. The data is stored in a PostgreSQL database and the system uses Node.js with Express as the back-end framework.

---

## Features

- **Motor Performance Metrics**: Capture and calculate various touch event metrics such as drag speed, distance, acceleration, and tap duration.
- **User Roles**: Two distinct roles—participants and caregivers—each with specific permissions and functionality.
- **API Integration**: RESTful API for creating, retrieving, and updating users, measurements, and results.
- **Database Storage**: Persistent storage using PostgreSQL for all user and measurement data.

---

## Project Structure

```plaintext
Cognition
│
├── config/              # Configuration files
│   └── uploadConfig.js  # Configuration for file uploads
│
├── controllers/         # Controllers handling logic for routes
│   ├── authController.js        # Handles user login and registration
│   ├── fileController.js        # Handles file uploads
│   ├── measures.controller.js   # Handles measures creation and retrieval
│   └── resultsController.js     # Handles result calculations
│
├── database/            # SQL scripts for setting up database tables
│   ├── measures.sql     # Table definition for measures
│   ├── users.sql        # Table definition for users
│   └── query.sql        # Common database queries
│
├── public/              # Front-end files served to users
│   ├── script/
│   │   ├── deviation.js         # Script for deviation calculations
│   │   ├── measures.js          # Script for managing measures
│   │   ├── test1.js             # Additional test logic
│   │   └── test2.js             # Additional test logic
│   ├── styles/
│   │   ├── style1.css           # General styles
│   │   └── style2.css           # Additional styles
│   ├── uploads/                 # Directory for file uploads
│   └── *.html                   # HTML files (index, login, participant, etc.)
│
├── routes/              # Route definitions
│   ├── api.js           # API routes
│   ├── bind.js          # Bind routes and controllers
│   └── index.js         # Main route handler
│
├── views/               # Templates for rendering views (if used)
│   └── html/
│
├── app.js               # Main Express application
├── db.js                # PostgreSQL connection setup
├── package.json         # Project dependencies and scripts
└── socket.js            # WebSocket integration (if needed)

```

## How to run this project

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- PostgreSQL database set up

### Setup

1. **Clone the repository:**
2. **Install the dependencies:**
   、、、
   npm install
   、、、
3. **Set up the PostgreSQL database:**
4. **Set up the PostgreSQL database:**
5. **Run on the server:**
   、、、
   npm start
   、、、

- Open your browser and navigate to http://localhost:8080.

## API EndPoint

### Authentication

- POST /auth/login
- POST /auth/logout

### Measures

- POST /measures/save
- GET /measures/:id
- PUT /measures/:id
- DELETE /measures/:id

### Results

- GET /results/calculateResult
- POST /results/submitdata
