# 🤖 Persona AI Chat

An AI-powered chat application that lets you converse with customizable AI personas. Chat with personalities that mimic different speaking styles, from popular tech educators to your own custom-created characters.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎭 Predefined Personas

-   **Hitesh Choudhary** - Popular coding instructor known for practical tutorials and Hindi-English (Hinglish) explanations. Expert in JavaScript, React, Node.js, and web development.
-   **Piyush Garg** - Tech entrepreneur and educator specializing in system design, backend development, and scalable architecture.

### 🛠️ Custom Persona Creation

-   Create your own AI personas with custom names, descriptions, and avatars
-   Upload training data via `.txt` files to teach your persona specific knowledge
-   Add tweet examples to define the persona's social media voice
-   Include YouTube transcript snippets for factual grounding
-   Custom personas are saved locally and persist across sessions

### 🧠 Memory System

-   Intelligent memory storage that remembers context from previous conversations
-   Key facts extraction for improved conversation continuity
-   Relevance-based memory retrieval using text similarity scoring
-   Per-persona memory isolation

### 🎤 Voice Features

-   **Speech-to-Text**: Click the microphone to speak your messages
-   **Text-to-Speech**: Listen to AI responses with voice output
-   Automatic retry with exponential backoff for network issues
-   Secure connection (HTTPS/localhost) required for voice features

### 💾 Export Conversations

-   Export chat history as **JSON** for data portability
-   Export as **Text** for easy reading and sharing
-   Download conversation logs with timestamps and persona information

### 🌙 Dark Mode

-   Full dark/light theme support
-   Smooth theme transitions
-   System preference detection

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   npm, yarn, pnpm, or bun
-   An API key from [NVIDIA AI](https://build.nvidia.com/) or OpenAI-compatible endpoint

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/VineetPaun/persona-chat.git
    cd persona-chat
    ```

2. **Install dependencies**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3. **Set up environment variables**

    Create a `.env.local` file in the root directory:

    ```env
    OPENAI_API_KEY=your_nvidia_or_openai_api_key_here
    ```

4. **Run the development server**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

5. **Open your browser**

    Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
persona-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # API endpoint for AI chat
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx        # Dynamic chat page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (persona selection)
├── components/
│   ├── ui/                     # Shadcn UI components
│   ├── ChatMessage.tsx         # Chat message component
│   ├── CustomPersonaModal.tsx  # Modal for creating personas
│   ├── PersonaCard.tsx         # Persona selection card
│   └── theme-provider.tsx      # Theme context provider
├── lib/
│   ├── memoryStore.ts          # Memory management system
│   ├── personaPrompts.ts       # Persona definitions & prompts
│   └── utils.ts                # Utility functions
├── types/
│   └── web-speech.d.ts         # TypeScript types for Web Speech API
└── public/                     # Static assets
```

## 🔧 Configuration

### API Configuration

The app uses NVIDIA's AI API by default. To switch to OpenAI:

```typescript
// app/api/chat/route.ts
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1", // Change from NVIDIA to OpenAI
});
```

### Adding New Predefined Personas

Edit `lib/personaPrompts.ts` to add new personas:

```typescript
export const predefinedPersonas: Persona[] = [
    {
        name: "Your Persona Name",
        description: "Brief description of the persona",
        avatar: "🎭", // Emoji avatar
        specialties: ["Topic 1", "Topic 2"],
        systemPrompt: `Detailed system prompt defining personality...`,
        tweetExamples: ["Example tweet 1", "Example tweet 2"],
        youtubeTimestamps: ["Transcript snippet 1", "Transcript snippet 2"],
    },
    // ... more personas
];
```

## 🎯 Usage

1. **Select a Persona**: Choose from predefined personas or create your own
2. **Start Chatting**: Type or speak your message
3. **Use Voice**: Toggle voice mode for speech input/output
4. **Export**: Download your conversation history
5. **Manage Memory**: Clear persona memories when needed

## 🛡️ Technologies Used

| Technology                                                | Purpose                         |
| --------------------------------------------------------- | ------------------------------- |
| [Next.js 15](https://nextjs.org/)                         | React framework with App Router |
| [React 19](https://react.dev/)                            | UI library                      |
| [TypeScript](https://www.typescriptlang.org/)             | Type safety                     |
| [Tailwind CSS 4](https://tailwindcss.com/)                | Styling                         |
| [Radix UI](https://www.radix-ui.com/)                     | Headless UI components          |
| [Lucide React](https://lucide.dev/)                       | Icons                           |
| [OpenAI SDK](https://github.com/openai/openai-node)       | AI API integration              |
| [next-themes](https://github.com/pacocoursey/next-themes) | Theme management                |

## 📝 Scripts

| Script          | Description                             |
| --------------- | --------------------------------------- |
| `npm run dev`   | Start development server with Turbopack |
| `npm run build` | Build for production                    |
| `npm run start` | Start production server                 |
| `npm run lint`  | Run ESLint                              |

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/)
3. Add your `OPENAI_API_KEY` in Environment Variables
4. Deploy!

### Other Platforms

The app can be deployed on any platform that supports Next.js:

-   Netlify
-   Railway
-   Render
-   Self-hosted with Node.js

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

-   Inspired by the teaching styles of [Hitesh Choudhary](https://www.youtube.com/@HiteshChoudharydotcom) and [Piyush Garg](https://www.youtube.com/@paborprogramminglabs)
-   Built with [Shadcn UI](https://ui.shadcn.com/) components
-   Powered by [NVIDIA AI](https://build.nvidia.com/) / OpenAI APIs

---

<p align="center">Made with ❤️ and ☕</p>
