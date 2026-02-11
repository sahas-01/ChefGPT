# Cooking Planner

An AI-powered web application that helps you discover authentic Indian recipes using the ingredients you already have at home. It features voice interaction for a hands-free cooking experience.

## Features

- **Smart Ingredient Input**: Type or simply speak your ingredients. The app understands English, Hindi, and mixed language input.
- **AI Recipe Generation**: Creates personalized recipes based on your specific ingredients and preferences.
- **Voice Interaction**: 
  - **Speech-to-Text**: Dictate your ingredients using advanced voice recognition.
  - **Text-to-Speech**: Listen to recipes and instructions read aloud by the AI Chef.
- **Translation**: Translate recipes and instructions between English and Indian languages.
- **Favorites**: Save your favorite recipes directly to your browser for quick access.
- **Mobile Responsive**: Works seamlessly on both desktop and mobile devices.

## How It Works

1. **Add Ingredients**: Enter what you have in your fridge manually or by clicking the microphone button to speak.
2. **Get Suggestions**: The AI Chef analyzes your ingredients and suggests authentic Indian dishes you can cook.
3. **Cook & Listen**: detailed recipes are generated. You can read them or have the AI read them out to you while you cook.

## Architecture

This application uses a modern web stack integrated with Sarvam AI services for intelligence.

[User Interface] <-> [Next.js Server API] <-> [Sarvam AI Services]
      |                                              |
      v                                              v
[Local Storage]                             [LLM / STT / TTS Models]

- **User Interface**: Handles input and displays recipes.
- **Next.js Server**: Securely manages API keys and communicates with AI services.
- **Sarvam AI**: Provides the core intelligence (Speech recognition, Language generation, Text-to-Speech).
- **Local Storage**: Persists your favorite recipes on your device.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **AI Integration**:
  - **Chat/Generation**: Sarvam-M (OpenAI compatible)
  - **Speech-to-Text**: Sarvam Saaras (v3)
  - **Text-to-Speech**: Sarvam Bulbul
  - **Translation**: Sarvam Translate
- **Icons**: Lucide React

## Getting Started

Follow these steps to run the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sahas-01/ChefGPT.git
   cd ChefGPT
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   - Create a file named `.env.local` in the root directory.
   - Get your Sarvam AI API Key from <a href="dashboard.sarvam.ai">here</a> and add it to your environment variables:
     ```env
     SARVAM_API_KEY=your_api_key_here
     ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser.
