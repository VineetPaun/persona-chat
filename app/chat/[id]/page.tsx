"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "@/components/ChatMessage"
import { ArrowLeft, Send, Download, FileText, File, Brain, Trash2, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Persona, Message } from "@/lib/personaPrompts"
import { predefinedPersonas } from "@/lib/personaPrompts"
import { memoryStore } from "@/lib/memoryStore"

export default function ChatPage() {
    const params = useParams()
    const router = useRouter()
    const [persona, setPersona] = useState<Persona | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [memoryStats, setMemoryStats] = useState({ totalMemories: 0, lastInteraction: null as number | null })

    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voiceModeEnabled, setVoiceModeEnabled] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(false)
    const [voiceError, setVoiceError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [speechServiceAvailable, setSpeechServiceAvailable] = useState(true)
    const [lastNetworkError, setLastNetworkError] = useState<number | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const synthRef = useRef<SpeechSynthesis | null>(null)

    const getPersonaId = () =>
        persona ? persona.name.toLowerCase().replace(/\s+/g, "-") : ((params.id as string) || "")

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const speechSynthesis = window.speechSynthesis

            if (SpeechRecognition && speechSynthesis) {
                const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost"

                if (isSecure) {
                    setSpeechSupported(true)
                    synthRef.current = speechSynthesis

                    const recognition = new SpeechRecognition()
                    recognition.continuous = false
                    recognition.interimResults = false
                    recognition.lang = "en-US"
                    recognition.maxAlternatives = 1

                    recognition.onstart = () => {
                        setIsListening(true)
                        setVoiceError(null)
                    }

                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript
                        setInputValue(transcript)
                        setIsListening(false)
                        setRetryCount(0)
                        setSpeechServiceAvailable(true)
                        setLastNetworkError(null)
                    }

                    recognition.onerror = (event) => {
                        console.error("Speech recognition error:", event.error)
                        setIsListening(false)

                        let errorMessage = "Voice recognition failed"
                        let shouldRetry = false

                        switch (event.error) {
                            case "network":
                                const now = Date.now()
                                setLastNetworkError(now)

                                if (retryCount < 2) {
                                    errorMessage = `Connection issue (attempt ${retryCount + 1}/2) - retrying...`
                                    shouldRetry = true
                                } else {
                                    errorMessage = "Speech service temporarily unavailable. Please type your message or try again later."
                                    setSpeechServiceAvailable(false)
                                }
                                break
                            case "not-allowed":
                                errorMessage = "Microphone access denied. Please allow microphone permissions and refresh the page."
                                setSpeechServiceAvailable(false)
                                break
                            case "no-speech":
                                errorMessage = "No speech detected. Please try speaking more clearly."
                                shouldRetry = false
                                break
                            case "audio-capture":
                                errorMessage = "Microphone unavailable. Please check your audio settings."
                                setSpeechServiceAvailable(false)
                                break
                            case "service-not-allowed":
                                errorMessage = "Speech service blocked. Please use typing instead."
                                setSpeechServiceAvailable(false)
                                break
                            case "bad-grammar":
                            case "language-not-supported":
                                errorMessage = "Speech service error. Please type your message instead."
                                setSpeechServiceAvailable(false)
                                break
                            default:
                                errorMessage = "Voice input failed. Please type your message."
                                setSpeechServiceAvailable(false)
                        }

                        setVoiceError(errorMessage)

                        if (shouldRetry && event.error === "network" && speechServiceAvailable) {
                            const delay = Math.min(2000 * Math.pow(2, retryCount), 8000)
                            setTimeout(() => {
                                setRetryCount((prev) => prev + 1)
                                try {
                                    if (recognitionRef.current && speechServiceAvailable) {
                                        recognition.start()
                                    }
                                } catch (error) {
                                    console.error("Failed to restart recognition:", error)
                                    setVoiceError("Voice service unavailable. Please type your message.")
                                    setSpeechServiceAvailable(false)
                                }
                            }, delay)
                        }
                    }

                    recognition.onend = () => {
                        setIsListening(false)
                    }

                    recognitionRef.current = recognition
                } else {
                    console.warn("Speech recognition requires HTTPS or localhost")
                    setVoiceError("Voice recognition requires a secure connection (HTTPS)")
                    setSpeechServiceAvailable(false)
                }
            } else {
                console.warn("Speech recognition not supported in this browser")
                setVoiceError("Voice recognition is not supported in your browser")
                setSpeechServiceAvailable(false)
            }
        }
    }, [retryCount, speechServiceAvailable])

    useEffect(() => {
        const personaId = params.id as string

        const storedPersona = localStorage.getItem("selectedPersona")
        if (storedPersona) {
            const parsedPersona = JSON.parse(storedPersona)
            setPersona(parsedPersona)
            updateMemoryStats(personaId)
            return
        }

        const foundPersona = predefinedPersonas.find((p) => p.name.toLowerCase().replace(/\s+/g, "-") === personaId)

        if (foundPersona) {
            setPersona(foundPersona)
            localStorage.setItem("selectedPersona", JSON.stringify(foundPersona))
            updateMemoryStats(personaId)
            return
        }

        try {
            const customPersonas = JSON.parse(localStorage.getItem("customPersonas") || "[]")
            const customPersona = customPersonas.find((p: Persona) => p.name.toLowerCase().replace(/\s+/g, "-") === personaId)

            if (customPersona) {
                setPersona(customPersona)
                localStorage.setItem("selectedPersona", JSON.stringify(customPersona))
                updateMemoryStats(personaId)
                return
            }
        } catch (error) {
            console.error("Error loading custom personas:", error)
        }

        router.push("/")
    }, [params.id, router])

    const updateMemoryStats = (personaId: string) => {
        const stats = memoryStore.getMemoryStats(personaId)
        setMemoryStats(stats)
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const speakText = (text: string) => {
        if (!synthRef.current || !voiceModeEnabled) return

        synthRef.current.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 0.8

        const voices = synthRef.current.getVoices()
        const preferredVoice = voices.find(
            (voice) => voice.lang.startsWith("en") && (voice.name.includes("Google") || voice.name.includes("Microsoft")),
        )
        if (preferredVoice) {
            utterance.voice = preferredVoice
        }

        utterance.onstart = () => {
            setIsSpeaking(true)
        }

        utterance.onend = () => {
            setIsSpeaking(false)
        }

        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event.error)
            setIsSpeaking(false)
        }

        synthRef.current.speak(utterance)
    }

    const toggleListening = () => {
        if (!recognitionRef.current || !speechSupported) return

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            if (!speechServiceAvailable) {
                setVoiceError(
                    "Speech service is currently unavailable. Please type your message or refresh the page to try again.",
                )
                return
            }

            if (lastNetworkError && Date.now() - lastNetworkError < 30000) {
                setVoiceError("Speech service recently failed. Please wait a moment or type your message.")
                return
            }

            setVoiceError(null)
            setRetryCount(0)

            try {
                recognitionRef.current.start()
            } catch (error) {
                console.error("Failed to start speech recognition:", error)
                setVoiceError("Voice input unavailable. Please type your message.")
                setSpeechServiceAvailable(false)
            }
        }
    }

    const toggleVoiceMode = () => {
        setVoiceModeEnabled(!voiceModeEnabled)
        if (voiceModeEnabled && synthRef.current) {
            synthRef.current.cancel()
            setIsSpeaking(false)
        }
    }

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel()
            setIsSpeaking(false)
        }
    }

    const sendMessage = async () => {
        if (!inputValue.trim() || !persona || isLoading) return

        const userMessage: Message = {
            role: "user",
            content: inputValue.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    persona,
                    messages: [...messages, userMessage],
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            if (!data.message) {
                throw new Error("No message received from API")
            }

            const aiMessage: Message = {
                role: "assistant",
                content: data.message,
            }

            setMessages((prev) => [...prev, aiMessage])
            updateMemoryStats(getPersonaId())

            if (voiceModeEnabled) {
                speakText(data.message)
            }
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage: Message = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const clearMemories = () => {
        if (!persona) return

        if (confirm(`Are you sure you want to clear all memories for ${persona.name}? This action cannot be undone.`)) {
            memoryStore.clearMemories(getPersonaId())
            updateMemoryStats(getPersonaId())
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const exportAsMarkdown = () => {
        if (!persona || messages.length === 0) return

        const timestamp = new Date().toLocaleString()
        let markdown = `# Chat with ${persona.name}\n\n`
        markdown += `**Date:** ${timestamp}\n`
        markdown += `**Persona:** ${persona.name} ${persona.avatar}\n`
        markdown += `**Description:** ${persona.description}\n\n`
        markdown += `---\n\n`

        messages.forEach((message, index) => {
            const sender = message.role === "user" ? "You" : persona.name
            const avatar = message.role === "user" ? "👤" : persona.avatar
            markdown += `## ${avatar} ${sender}\n\n`
            markdown += `${message.content}\n\n`
        })

        const blob = new Blob([markdown], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `chat-${persona.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const exportAsPDF = async () => {
        if (!persona || messages.length === 0) return

        try {
            const timestamp = new Date().toLocaleString()
            let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Chat with ${persona.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .persona-info { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
            .avatar { font-size: 24px; }
            .message { margin-bottom: 24px; padding: 16px; border-radius: 8px; }
            .user-message { background-color: #f3f4f6; margin-left: 20%; }
            .assistant-message { background-color: #e0f2fe; margin-right: 20%; }
            .sender { font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
            .content { white-space: pre-wrap; }
            .timestamp { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="persona-info">
              <span class="avatar">${persona.avatar}</span>
              <div>
                <h1>Chat with ${persona.name}</h1>
                <p class="timestamp">${timestamp}</p>
              </div>
            </div>
            <p><strong>Description:</strong> ${persona.description}</p>
          </div>
          <div class="messages">
      `

            messages.forEach((message) => {
                const isUser = message.role === "user"
                const sender = isUser ? "You" : persona.name
                const avatar = isUser ? "👤" : persona.avatar
                const messageClass = isUser ? "user-message" : "assistant-message"

                htmlContent += `
          <div class="message ${messageClass}">
            <div class="sender">
              <span>${avatar}</span>
              <span>${sender}</span>
            </div>
            <div class="content">${message.content}</div>
          </div>
        `
            })

            htmlContent += `
          </div>
        </body>
        </html>
      `

            const printWindow = window.open("", "_blank")
            if (printWindow) {
                printWindow.document.write(htmlContent)
                printWindow.document.close()

                printWindow.onload = () => {
                    printWindow.print()
                    printWindow.close()
                }
            }
        } catch (error) {
            console.error("Error exporting PDF:", error)
            alert("Failed to export PDF. Please try again.")
        }
    }

    const retryVoiceRecognition = () => {
        setVoiceError(null)
        setRetryCount(0)
        setSpeechServiceAvailable(true)
        setLastNetworkError(null)

        setTimeout(() => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start()
                } catch (error) {
                    console.error("Failed to retry speech recognition:", error)
                    setVoiceError("Voice service unavailable. Please type your message.")
                    setSpeechServiceAvailable(false)
                }
            }
        }, 1000)
    }

    if (!persona) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading persona...</p>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{persona.avatar}</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{persona.name}</h1>
                                        {memoryStats.totalMemories > 0 && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                                        <Brain className="h-3 w-3" />
                                                        {memoryStats.totalMemories}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {memoryStats.totalMemories} memories stored
                                                        {memoryStats.lastInteraction && (
                                                            <>
                                                                <br />
                                                                Last interaction: {new Date(memoryStats.lastInteraction).toLocaleDateString()}
                                                            </>
                                                        )}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        {voiceModeEnabled && (
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                <Volume2 className="h-3 w-3" />
                                                Voice
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">AI Persona</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {speechSupported && (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={voiceModeEnabled ? "default" : "outline"}
                                                size="sm"
                                                onClick={toggleVoiceMode}
                                                className="flex items-center gap-2"
                                            >
                                                {voiceModeEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                                Voice Mode
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{voiceModeEnabled ? "Disable" : "Enable"} text-to-speech for AI responses</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {isSpeaking && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={stopSpeaking}
                                                    className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                                >
                                                    <VolumeX className="h-4 w-4" />
                                                    Stop
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Stop speaking</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            )}

                            {memoryStats.totalMemories > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearMemories}
                                            className="flex items-center gap-2 bg-transparent"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Clear Memory
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear all stored memories for this persona</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {messages.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                                            <Download className="h-4 w-4" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={exportAsMarkdown} className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Export as Markdown
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={exportAsPDF} className="flex items-center gap-2">
                                            <File className="h-4 w-4" />
                                            Export as PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">{persona.avatar}</div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Start chatting with {persona.name}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">{persona.description}</p>
                                {memoryStats.totalMemories > 0 && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                        <Brain className="h-4 w-4" />
                                        <span>I remember our previous conversations ({memoryStats.totalMemories} memories)</span>
                                    </div>
                                )}
                                {speechSupported && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                                        <Volume2 className="h-4 w-4" />
                                        <span>Voice mode available - enable to hear responses spoken aloud</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <ChatMessage key={index} message={message} persona={persona} />
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2 max-w-xs">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.1s" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.2s" }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
                    <div className="max-w-3xl mx-auto flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={`Message ${persona.name}...`}
                            disabled={isLoading}
                            className="flex-1"
                        />

                        {speechSupported && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isListening ? "default" : "outline"}
                                        size="icon"
                                        onClick={toggleListening}
                                        disabled={isLoading || (!speechServiceAvailable && !isListening)}
                                        className={isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}
                                    >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {isListening
                                            ? "Stop listening"
                                            : speechServiceAvailable
                                                ? "Start voice input"
                                                : "Voice service unavailable"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        <Button onClick={sendMessage} disabled={!inputValue.trim() || isLoading} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>

                    {isListening && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span>Listening... Speak now</span>
                            </div>
                        </div>
                    )}

                    {voiceError && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <div className="flex items-center justify-between gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2">
                                <span>⚠️ {voiceError}</span>
                                <div className="flex gap-2">
                                    {(voiceError.includes("Connection issue") ||
                                        voiceError.includes("temporarily unavailable") ||
                                        voiceError.includes("recently failed")) && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-orange-600 dark:text-orange-400 p-0 h-auto"
                                                onClick={retryVoiceRecognition}
                                            >
                                                Retry
                                            </Button>
                                        )}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-orange-600 dark:text-orange-400 p-0 h-auto"
                                        onClick={() => setVoiceError(null)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSpeaking && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <Volume2 className="h-4 w-4 animate-pulse" />
                                <span>{persona.name} is speaking...</span>
                            </div>
                        </div>
                    )}

                    {speechSupported && !voiceModeEnabled && messages.length === 0 && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                💡 Tip: Enable Voice Mode to hear {persona.name}'s responses spoken aloud
                                {!speechServiceAvailable && (
                                    <div className="mt-1 text-orange-500">
                                        Voice input is currently unavailable. You can still type messages normally.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
