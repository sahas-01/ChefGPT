# Cooking Planner 🍛

An intelligent, AI-powered recipe assistant for authentic Indian cuisine. Uses your leftover ingredients to suggest delicious meals, complete with voice interaction and Hindi audio guidance.

![Cooking Planner](https://img.shields.io/badge/Next.js-14-black) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue) ![Sarvam AI](https://img.shields.io/badge/Sarvam-AI-orange)

## Features

- **Fridge-First Design**: Input your leftover ingredients manually or via **Voice**.
- **Authentic Recipes**: Database of 40+ authentic Indian recipes (North, South, East, West).
- **Smart Matching**: Prioritizes recipes using your ingredients, especially those expiring soon.
- **AI Chef (Sarvam-M)**: Ask the AI for personalized suggestions and hear the response in Hindi!
- **Read Aloud**: Listen to any recipe's instructions using high-quality Indian TTS (Sarvam Bulbul v3).
- **Favorites**: Save your best finds for later (Local interactions only, no login required).
- **Responsive**: Beautiful mobile-first UI with Indian aesthetics.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix)
- **AI & TTS**: Sarvam AI (Sarvam-M for chat, Bulbul:v3 for speech)
- **Icons**: Lucide React
- **Voice Input**: Web Speech API

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd cooking-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *Note: Using legacy peer deps might be needed if conflicts arise.*

3. **Configure Environment**:
   - Create a `.env.local` file in the root.
   - Add your Sarvam AI API Key:
     ```env
     SARVAM_API_KEY=your_actual_api_key_here
     ```
   - Get your key from [Sarvam Dashboard](https://dashboard.sarvam.ai).

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Voice Input Note
Voice recognition relies on the browser's Web Speech API. For the best experience, use **Google Chrome** or **Edge** on desktop or Android. Safari has limited support.

## Future Plans
- [ ] User accounts for cross-device sync.
- [ ] Grocery list generation.
- [ ] Image recognition for ingredients (snap a photo of your fridge!).
- [ ] Regional language UI translation.
