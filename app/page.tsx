'use client';
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PersonaCard } from "@/components/PersonaCard"
import { CustomPersonaModal } from "@/components/CustomPersonaModal"
import { predefinedPersonas } from "@/lib/personaPrompts"
import type { Persona } from "@/lib/personaPrompts"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const router = useRouter()

  useEffect(() => {
    const savedPersonas = localStorage.getItem("customPersonas")
    if (savedPersonas) {
      try {
        setCustomPersonas(JSON.parse(savedPersonas))
      } catch (error) {
        console.error("Error loading custom personas:", error)
      }
    }
  }, [])

  const handlePersonaSelect = (persona: Persona) => {
    // Store selected persona in localStorage
    localStorage.setItem("selectedPersona", JSON.stringify(persona))
    // Navigate to chat page
    router.push(`/chat/${encodeURIComponent(persona.name.toLowerCase().replace(/\s+/g, "-"))}`)
  }

  const handleCustomPersonaCreate = (persona: Persona) => {
    const updatedCustomPersonas = [...customPersonas, persona]
    setCustomPersonas(updatedCustomPersonas)

    // Save to localStorage
    localStorage.setItem("customPersonas", JSON.stringify(updatedCustomPersonas))

    handlePersonaSelect(persona)
    setIsModalOpen(false)
  }

  const handleDeleteCustomPersona = (personaToDelete: Persona) => {
    const updatedCustomPersonas = customPersonas.filter((p) => p.name !== personaToDelete.name)
    setCustomPersonas(updatedCustomPersonas)
    localStorage.setItem("customPersonas", JSON.stringify(updatedCustomPersonas))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Persona AI Chat</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Chat with AI personas that mimic different personalities and speaking styles. Choose from predefined
            personas or create your own custom character.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Choose Your AI Persona
          </h2>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Predefined Personas</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {predefinedPersonas.map((persona) => (
                <PersonaCard key={persona.name} persona={persona} onClick={() => handlePersonaSelect(persona)} />
              ))}
            </div>
          </div>

          {customPersonas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Your Custom Personas</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {customPersonas.map((persona) => (
                  <PersonaCard
                    key={persona.name}
                    persona={persona}
                    onClick={() => handlePersonaSelect(persona)}
                    onDelete={() => handleDeleteCustomPersona(persona)}
                    isCustom={true}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-medium"
            >
              ✨ Create Custom Persona
            </Button>
          </div>
        </div>
      </div>

      <CustomPersonaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCustomPersonaCreate}
      />
    </div>
  )
}
