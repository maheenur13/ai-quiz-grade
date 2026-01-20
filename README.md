# PromptGrade

An AI-powered quiz and assessment web application that allows teachers to create quizzes using natural language prompts. AI converts prompts into structured quizzes and evaluates student submissions automatically.

## Features

- **AI-Powered Quiz Generation**: Create quizzes from natural language descriptions
- **Flexible Question Types**: Single choice, multiple choice, and written answer questions
- **Anonymous Student Participation**: Students join quizzes using shareable links with self-chosen display names
- **Automatic Evaluation**: AI evaluates student answers and provides detailed feedback
- **Timer Support**: Quizzes can have time limits with auto-submit functionality
- **Light/Dark Theme**: Toggle between light and dark modes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **UI Library**: Ant Design (antd)
- **Routing**: React Router DOM
- **AI Integration**: Groq SDK (Text Chat API)

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Groq API key (get one at [console.groq.com](https://console.groq.com))

## Setup Instructions

1. **Install Dependencies**

```bash
pnpm install
```

2. **Configure Environment Variables**

Create a `.env` file in the root directory:

```env
# Frontend
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_API_URL=http://localhost:3001/api

# Backend
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

- Get a free Groq API key from [Groq Console](https://console.groq.com)
- Get a MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use a local MongoDB instance

3. **Run Development Server**

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

4. **Build for Production**

```bash
pnpm build
```

## Usage

### Teacher Flow

1. Navigate to the dashboard (`/`)
2. Click "Create New Quiz"
3. Enter a natural language prompt describing your quiz:
   - Topic
   - Difficulty level
   - Number of questions
   - Question types
   - Time limit (optional)
4. AI generates a quiz draft
5. Edit all fields (title, description, questions, options, correct answers, timer)
6. Save as draft or publish
7. Copy the shareable link for students

### Student Flow

1. Open the quiz using the shared link
2. Enter a display name (auto-generated default provided)
3. Complete the quiz within the time limit
4. Quiz auto-submits when time expires
5. View results with score and per-question feedback

## Example Prompts

- "Create a 5-question multiple-choice quiz about the American Civil War, difficulty: medium, 10 minutes"
- "Write a 3-question short answer quiz on photosynthesis process, 15 minutes"
- "Generate a 10-question mixed quiz (single and multiple choice) about JavaScript fundamentals, difficulty: easy, 20 minutes"

## Project Structure

```
src/
├── types/              # TypeScript interfaces
├── services/           # AI and storage services
├── contexts/          # React contexts (theme)
├── components/
│   ├── teacher/       # Teacher dashboard and quiz management
│   ├── student/       # Student quiz-taking and results
│   └── shared/        # Shared components (Layout, Timer, etc.)
├── utils/             # Utility functions
└── App.tsx            # Main router setup
```

## AI Configuration

- **Quiz Generation**: Temperature 0.2 (for consistent structure)
- **Answer Evaluation**: Temperature 0 (for objective grading)
- **Model**: Uses Groq's free models (llama-3.1-8b-instant)

## Data Persistence

All data is stored in MongoDB:
- Quizzes are stored in the `quizzes` collection
- Submissions are stored in the `submissions` collection
- Theme preference is still stored in browser localStorage (`promptgrade_theme`)

## Development Notes

- The application is frontend-only with no backend required
- All AI calls are made directly from the browser
- Quiz links are generated client-side and stored in localStorage
- Student names are session-scoped (stored in sessionStorage)

## License

MIT
