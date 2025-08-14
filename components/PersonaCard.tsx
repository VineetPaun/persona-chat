"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Persona } from "@/lib/personaPrompts"

interface PersonaCardProps {
  persona: Persona
  onClick: () => void
  onDelete?: () => void
  isCustom?: boolean
}

export function PersonaCard({ persona, onClick, onDelete, isCustom = false }: PersonaCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when deleting
    onDelete?.()
  }

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 relative group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {isCustom && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-start gap-4">
          <div className="text-4xl">{persona.avatar}</div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{persona.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{persona.description}</p>
            {persona.specialties && (
              <div className="mt-3 flex flex-wrap gap-2">
                {persona.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
