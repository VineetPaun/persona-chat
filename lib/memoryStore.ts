// Memory storage utilities for persona conversations
export interface Memory {
  id: string
  personaId: string
  content: string
  context: string
  timestamp: number
  importance: number // 1-10 scale
}

export interface ConversationSummary {
  personaId: string
  summary: string
  keyFacts: string[]
  lastUpdated: number
}

class MemoryStore {
  private static instance: MemoryStore
  private memories: Memory[] = []
  private summaries: Map<string, ConversationSummary> = new Map()

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore()
    }
    return MemoryStore.instance
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      const memoriesData = localStorage.getItem("persona-memories")
      const summariesData = localStorage.getItem("persona-summaries")

      if (memoriesData) {
        this.memories = JSON.parse(memoriesData)
      }

      if (summariesData) {
        const summariesArray = JSON.parse(summariesData)
        this.summaries = new Map(summariesArray)
      }
    } catch (error) {
      console.error("Error loading memories from storage:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("persona-memories", JSON.stringify(this.memories))
      localStorage.setItem("persona-summaries", JSON.stringify(Array.from(this.summaries.entries())))
    } catch (error) {
      console.error("Error saving memories to storage:", error)
    }
  }

  addMemory(personaId: string, content: string, context: string, importance = 5): void {
    const memory: Memory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      personaId,
      content,
      context,
      timestamp: Date.now(),
      importance,
    }

    this.memories.push(memory)
    this.saveToStorage()
  }

  getRelevantMemories(personaId: string, query: string, limit = 5): Memory[] {
    const personaMemories = this.memories.filter((m) => m.personaId === personaId)

    // Simple text similarity scoring
    const scoredMemories = personaMemories.map((memory) => {
      const score =
        this.calculateSimilarity(query.toLowerCase(), memory.content.toLowerCase()) +
        this.calculateSimilarity(query.toLowerCase(), memory.context.toLowerCase()) +
        memory.importance / 10 // Boost by importance

      return { memory, score }
    })

    // Sort by score and return top results
    return scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.memory)
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)

    let matches = 0
    for (const word1 of words1) {
      if (word1.length > 3 && words2.some((word2) => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    }

    return matches / Math.max(words1.length, words2.length)
  }

  updateSummary(personaId: string, summary: string, keyFacts: string[]): void {
    this.summaries.set(personaId, {
      personaId,
      summary,
      keyFacts,
      lastUpdated: Date.now(),
    })
    this.saveToStorage()
  }

  getSummary(personaId: string): ConversationSummary | undefined {
    return this.summaries.get(personaId)
  }

  getAllMemories(personaId: string): Memory[] {
    return this.memories.filter((m) => m.personaId === personaId)
  }

  clearMemories(personaId: string): void {
    this.memories = this.memories.filter((m) => m.personaId !== personaId)
    this.summaries.delete(personaId)
    this.saveToStorage()
  }

  getMemoryStats(personaId: string): { totalMemories: number; lastInteraction: number | null } {
    const personaMemories = this.memories.filter((m) => m.personaId === personaId)
    const lastInteraction = personaMemories.length > 0 ? Math.max(...personaMemories.map((m) => m.timestamp)) : null

    return {
      totalMemories: personaMemories.length,
      lastInteraction,
    }
  }
}

export const memoryStore = MemoryStore.getInstance()
