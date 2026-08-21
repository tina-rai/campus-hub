# CampusHub

A full-stack campus event management platform where students can discover upcoming events, view event details, register for events, and manage their registrations.

## Features

- View upcoming campus events
- Search events by title or description
- Filter events by category
- View detailed event information
- Register for events
- Prevent duplicate registrations using email
- Track event capacity and remaining seats
- View registered students for an event
- Search registrations by student email
- Cancel event registrations
- Persistent PostgreSQL database
- RESTful API built with Node.js and Express

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### Tools
- Git
- GitHub
- VS Code

## Project Structure

```text
campus-hub/
├── public/
│   ├── index.html
│   ├── event.html
│   ├── my-registrations.html
│   ├── app.js
│   ├── event.js
│   ├── my-registrations.js
│   └── style.css
│
├── validators/
│   └── eventValidator.js
│
├── database.js
├── postgres.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md