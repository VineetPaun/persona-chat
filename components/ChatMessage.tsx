import type { Message, Persona } from "@/lib/personaPrompts"

interface ChatMessageProps {
  message: Message
  persona: Persona
}

export function ChatMessage({ message, persona }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-xs sm:max-w-md ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg">
              {persona.avatar}
            </div>
          )}
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
