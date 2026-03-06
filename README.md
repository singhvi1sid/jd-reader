# AssessAI — AI-Powered Assessment Generator

Paste a job description and instantly generate a tailored, role-specific assessment with MCQs, short-answer questions, scenario-based cases, and mini-tasks.

## Setup

### 1. Get a Gemini API Key (free)
1. Go to [https://ai.google.dev](https://ai.google.dev)
2. Click "Get API key in Google AI Studio"
3. Create a new API key
4. Copy the key

### 2. Set up MongoDB Atlas (free)
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a free cluster (M0 tier — totally free)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string (it looks like `mongodb+srv://...`)
7. Replace `<password>` in the string with your actual password

### 3. Configure Environment
Edit the `.env.local` file and replace the placeholder values:
```
GEMINI_API_KEY=your_actual_api_key
MONGODB_URI=your_actual_connection_string
```

### 4. Run the App
```bash
cd jd-reader
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Google Gemini** for JD analysis and question generation
- **MongoDB Atlas** for persistence
- **Mongoose** for database modeling
