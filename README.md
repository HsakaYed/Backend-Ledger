Bank Transaction System

A Node.js/Express backend for managing bank transactions, with JWT-based authentication, MongoDB (via Mongoose) for data storage, and email notifications powered by Nodemailer with Google OAuth2.

Tech Stack


Runtime: Node.js
Framework: Express 5
Database: MongoDB with Mongoose
Authentication: JSON Web Tokens (JWT) + bcryptjs for password hashing
Cookies: cookie-parser
Email: Nodemailer (Google OAuth2)
Environment Config: dotenv
Dev Tooling: nodemon


Prerequisites



Node.js (v18 or later recommended)
A MongoDB instance (local or MongoDB Atlas)
A Google Cloud project with OAuth2 credentials (for sending email via Nodemailer)



Getting Started


1. Clone the repository

bashgit clone <your-repo-url>
cd bank-transaction-system


2. Install dependencies

bashnpm install


3. Configure environment variables

Create a .env file in the project root (this file is git-ignored and should never be committed). Use the template below:


env# Server
PORT=3000


# MongoDB
MONGO_URI=your_mongodb_connection_string


# JWT Auth
JWT_SECRET=your_jwt_secret 

JWT_EXPIRES_IN=3d

# Google OAuth2 (for Nodemailer)

CLIENT_ID=your_google_oauth_client_id

CLIENT_SECRET=your_google_oauth_client_secret

REFRESH_TOKEN=your_google_oauth_refresh_token

EMAIL_USER=your_gmail_address


⚠️ Security note: Never commit real secrets to version control. If credentials are ever accidentally exposed (e.g. shared, pushed to a public repo, or pasted somewhere insecure), rotate them immediately — regenerate the MongoDB password, JWT secret, and Google OAuth client secret/refresh token.



4. Run the server

Development (with auto-restart via nodemon):

bashnpm run dev

Production:

bashnpm start

The server will start on the port defined in your .env file (default: 3000).

Project Structure

bank-transaction-system/
├── server.js              # Entry point — loads env vars, connects DB, starts server

├── src/

│   ├── app.js              # Express app configuration

│   ├── config/

│   │   └── db.js           # MongoDB connection logic

│   ├── models/              # Mongoose schemas/models

│   ├── routes/               # API route definitions

│   ├── controllers/          # Route handler logic

│   └── middleware/            # Custom middleware (auth, error handling, etc.)

├── package.json

├── .env                    # Environment variables (not committed)

└── .gitignore


Note: The exact folder layout under src/ may differ slightly depending on your implementation — update this section to match your actual codebase.



Environment Variables Reference

VariableDescription
PORT=Port the server listens on
MONGO_URI=MongoDB connection string
JWT_SECRET=Secret key used to sign JWTs
JWT_EXPIRES_IN=JWT token expiry duration (e.g. 3d)
CLIENT_ID=Google OAuth2 client ID (for Nodemailer)
CLIENT_SECRET=Google OAuth2 client secret
REFRESH_TOKEN=Google OAuth2 refresh token
EMAIL_USER=Gmail address used to send emails

Features


User authentication with JWT and hashed passwords (bcryptjs)

Secure cookie-based session handling

MongoDB-backed transaction and account data

Email notifications via Gmail (OAuth2-authenticated Nodemailer)


Scripts

CommandDescriptionnpm startStart the server in production modenpm run devStart the server with nodemon for development

License

ISC
