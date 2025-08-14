"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"
import type { Persona } from "@/lib/personaPrompts"

interface CustomPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (persona: Persona) => void
}

const emojiOptions = [
  "👨‍💻",
  "👩‍💻",
  "🧑‍🎓",
  "👨‍🏫",
  "👩‍🏫",
  "🧑‍💼",
  "👨‍⚕️",
  "👩‍⚕️",
  "🧑‍🎨",
  "👨‍🍳",
  "👩‍🍳",
  "🤖",
  "🎭",
  "🎪",
  "🌟",
  "💡",
]

export function CustomPersonaModal({ isOpen, onClose, onSubmit }: CustomPersonaModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🤖")
  const [trainingData, setTrainingData] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setTrainingData(content)
        setUploadedFileName(file.name)
      }
      reader.readAsText(file)
    } else {
      alert("Please upload a .txt file only")
    }
  }

  const clearTrainingData = () => {
    setTrainingData("")
    setUploadedFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !description.trim()) {
      return
    }

    let systemPrompt = `You are role-playing as ${name.trim()}. Speak in this tone/style: ${description.trim()}.`

    if (trainingData.trim()) {
      systemPrompt += `\n\nIMPORTANT: Analyze and mimic the writing style, tone, vocabulary, and communication patterns from this training text:\n\n${trainingData.trim()}\n\nAdopt the same voice, sentence structure, and personality traits evident in this text. Stay consistent with this learned style throughout our conversation.`
    }

    systemPrompt += ` Always stay in character and respond authentically as this persona.`

    const customPersona: Persona = {
      name: name.trim(),
      description: description.trim(),
      avatar: selectedEmoji,
      systemPrompt,
    }

    onSubmit(customPersona)

    // Reset form
    setName("")
    setDescription("")
    setSelectedEmoji("🤖")
    setTrainingData("")
    setUploadedFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setSelectedEmoji("🤖")
    setTrainingData("")
    setUploadedFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Persona</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Persona Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Friendly Teacher, Wise Mentor, Creative Writer"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Tone & Style Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this persona should speak and behave. Be specific about their personality, communication style, and expertise..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Train with Writing Style (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Upload a .txt file or paste text to train the persona to mimic a specific writing style
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload .txt File
              </Button>

              {uploadedFileName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md border">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">{uploadedFileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearTrainingData}
                    className="h-auto p-1 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />

            <div>
              <Label htmlFor="training-text">Or paste training text:</Label>
              <Textarea
                id="training-text"
                value={trainingData}
                onChange={(e) => setTrainingData(e.target.value)}
                placeholder="Paste blog posts, writing samples, or any text that represents the style you want the persona to learn from..."
                rows={6}
                className="mt-1"
              />
              {trainingData && (
                <p className="text-xs text-muted-foreground mt-1">Training data: {trainingData.length} characters</p>
              )}
            </div>
          </div>

          <div>
            <Label>Choose Avatar</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                    selectedEmoji === emoji
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim() || !description.trim()}>
              Create & Chat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
