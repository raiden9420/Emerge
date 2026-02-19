# Emerge

Emerge is a comprehensive career development platform designed to guide users through their professional journey. It features personalized goal tracking, AI-powered career coaching, and tailored resource recommendations to help users achieve their career aspirations.

## 🚀 Features

- **Personalized Dashboard**: A central hub to track your career progress, ongoing goals, and recent activities.
- **AI Career Coach**: Interact with an intelligent AI coach (powered by Google Gemini) for personalized career advice, resume tips, and interview preparation.
- **Goal Management**: Set, track, and complete actionable career-oriented goals.
- **Interactive Onboarding**: A comprehensive survey to understand your skills, interests, thinking style, and career objectives.
- **Resource Recommendations**: Receive curated video and course recommendations based on your specific interests and field of study.
- **Progress Tracking**: Visualize your growth with streak counters, level progression, and activity logs.
- **Responsive Design**: A modern, mobile-friendly interface built with Shadcn UI and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: 
  - React
  - Vite
  - Tailwind CSS
  - Shadcn UI
  - Lucide React (Icons)
  - Recharts (Data Visualization)

- **Backend**: 
  - Node.js
  - Express.js
  - Drizzle ORM
  - PostgreSQL

- **AI Integration**: 
  - Google Gemini AI

- **Language**: 
  - TypeScript

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/raiden9420/Emerge.git
   cd Emerge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Connection
   DATABASE_URL=postgresql://username:password@localhost:5432/emerge_db

   # AI Integration (Get key from Google AI Studio)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Database Setup**
   Push the database schema to your PostgreSQL instance:
   ```bash
   npm run db:push
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## 📁 Project Structure

```
Emerge/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages (Dashboard, Survey, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express server
│   ├── routes.ts           # API Routes
│   ├── storage.ts          # Database storage interface
│   └── lib/                # Backend utilities (Gemini, Trends, etc.)
├── shared/                 # Shared types and schema definitions
├── migrations/             # Database migrations
└── drizzle.config.ts       # Drizzle ORM configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
