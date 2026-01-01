import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Persona, Message } from "@/lib/personaPrompts";
import { memoryStore } from "@/lib/memoryStore";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function POST(request: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error("OpenAI API key is missing");
            return NextResponse.json(
                {
                    error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.",
                },
                { status: 500 }
            );
        }

        const { persona, messages }: { persona: Persona; messages: Message[] } =
            await request.json();

        if (!persona || !messages) {
            return NextResponse.json(
                { error: "Missing persona or messages" },
                { status: 400 }
            );
        }

        // Derive a stable personaId (slug) from the persona name
        const personaId = persona.name.toLowerCase().replace(/\s+/g, "-");

        const currentMessage = messages[messages.length - 1]?.content || "";
        const relevantMemories = memoryStore.getRelevantMemories(
            personaId,
            currentMessage,
            3
        );
        const conversationSummary = memoryStore.getSummary(personaId);

        let systemPrompt =
            persona.systemPrompt ||
            `You are role-playing as ${persona.name}. ${persona.description} Always stay in character and respond in this style.`;

        // Leverage tweet examples to guide tone/style for short-form content
        if (persona.tweetExamples && persona.tweetExamples.length > 0) {
            const tweetSamples = persona.tweetExamples
                .slice(0, 6)
                .map((t, i) => `${i + 1}. ${t}`)
                .join("\n");
            systemPrompt += `\n\nTweet style examples (use as style reference when writing short social posts or when explicitly asked for tweets/replies/threads):\n${tweetSamples}\nGuidelines: Keep tweets concise (<=280 chars unless asked otherwise), natural tone matching the samples, minimal hashtags, and avoid generic AI phrasing.`;
        }

        // Include YouTube timestamp snippets as domain/context references
        if (persona.youtubeTimestamps && persona.youtubeTimestamps.length > 0) {
            const ytSnippets = persona.youtubeTimestamps
                .slice(0, 6)
                .map((t, i) => `${i + 1}. ${t}`)
                .join("\n");
            systemPrompt += `\n\nReference snippets from video transcripts (use for factual grounding or citing examples when relevant, but do not invent timestamps):\n${ytSnippets}\nIf the user asks about these topics, you can reference that this comes from prior content in your style.`;
        }

        // Add memory context to system prompt
        if (conversationSummary) {
            systemPrompt += `\n\nPrevious conversation context: ${conversationSummary.summary}`;
            if (conversationSummary.keyFacts.length > 0) {
                systemPrompt += `\nKey facts you remember: ${conversationSummary.keyFacts.join(
                    ", "
                )}`;
            }
        }

        if (relevantMemories.length > 0) {
            systemPrompt += `\n\nRelevant memories from past conversations:`;
            relevantMemories.forEach((memory, index) => {
                systemPrompt += `\n${index + 1}. ${memory.content} (Context: ${
                    memory.context
                })`;
            });
        }

        // Tailor prompt based on user intent (tweet/thread/video) to maximize persona assets
        const isTweetRequest =
            /\b(tweet|thread|reply|x\.com|post on twitter|compose on twitter)\b/i.test(
                currentMessage
            );
        const isVideoGrounding =
            /\b(video|youtube|timestamp|transcript|clip|episode)\b/i.test(
                currentMessage
            );

        if (isTweetRequest && persona.tweetExamples?.length) {
            systemPrompt += `\n\nWhen the user asks for a tweet/thread/reply:\n- Match the voice from the tweet examples above.\n- Single tweet: keep <= 280 characters.\n- Thread: output numbered lines (1/, 2/, 3/) with each line <= 280 characters.\n- Reply: keep conversational, concise, avoid overuse of emojis/hashtags.\n- No generic AI disclaimers; keep it natural.`;
        }

        if (isVideoGrounding && persona.youtubeTimestamps?.length) {
            systemPrompt += `\n\nWhen the user references videos/transcripts: Ground your answer in the provided transcript snippets above. Do not fabricate timestamps. If relevant, you may say this is based on your previous videos.`;
        }

        // Prepare messages for OpenAI
        const openaiMessages = [
            { role: "system" as const, content: systemPrompt },
            ...messages.map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
        ];

        console.log(
            "Sending request to OpenAI with",
            openaiMessages.length,
            "messages and",
            relevantMemories.length,
            "memories"
        );

        const completion = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: openaiMessages,
        });

        const aiMessage = completion.choices[0]?.message?.content;

        if (!aiMessage) {
            throw new Error("No response from OpenAI");
        }

        if (messages.length >= 2) {
            const userMessage = messages[messages.length - 1];
            const context = `User asked: "${userMessage.content}"`;

            // Extract key information to remember
            const importantInfo = extractImportantInfo(
                userMessage.content,
                aiMessage
            );
            if (importantInfo) {
                memoryStore.addMemory(personaId, importantInfo, context, 6);
            }

            // Update conversation summary every few messages
            if (messages.length % 6 === 0) {
                const recentMessages = messages.slice(-6);
                const summary = await generateConversationSummary(
                    recentMessages,
                    persona.name
                );
                const keyFacts = extractKeyFacts(recentMessages);
                memoryStore.updateSummary(personaId, summary, keyFacts);
            }
        }

        console.log("Successfully received response from OpenAI");
        return NextResponse.json({ message: aiMessage });
    } catch (error) {
        console.error("Chat API error:", error);

        if (error instanceof Error) {
            if (error.message.includes("API key")) {
                return NextResponse.json(
                    {
                        error: "Invalid OpenAI API key. Please check your configuration.",
                    },
                    { status: 401 }
                );
            }
            if (error.message.includes("quota")) {
                return NextResponse.json(
                    {
                        error: "OpenAI API quota exceeded. Please check your usage limits.",
                    },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to process chat request. Please try again." },
            { status: 500 }
        );
    }
}

function extractImportantInfo(
    userMessage: string,
    aiResponse: string
): string | null {
    const importantKeywords = [
        "my name is",
        "i am",
        "i work",
        "i like",
        "i don't like",
        "i prefer",
        "my favorite",
        "i live",
        "i study",
        "my job",
        "my hobby",
        "i enjoy",
        "remember that",
        "important:",
        "note:",
        "by the way",
    ];

    const lowerUser = userMessage.toLowerCase();
    const hasImportantInfo = importantKeywords.some((keyword) =>
        lowerUser.includes(keyword)
    );

    if (hasImportantInfo) {
        return `User shared: ${userMessage.substring(0, 200)}${
            userMessage.length > 200 ? "..." : ""
        }`;
    }

    // Also check if AI mentioned remembering something
    if (
        aiResponse.toLowerCase().includes("remember") ||
        aiResponse.toLowerCase().includes("note")
    ) {
        return `AI noted: ${aiResponse.substring(0, 200)}${
            aiResponse.length > 200 ? "..." : ""
        }`;
    }

    return null;
}

async function generateConversationSummary(
    messages: Message[],
    personaName: string
): Promise<string> {
    const conversation = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
    return `Recent conversation with ${personaName} covered: ${conversation.substring(
        0,
        300
    )}...`;
}

function extractKeyFacts(messages: Message[]): string[] {
    const facts: string[] = [];

    messages.forEach((message) => {
        if (message.role === "user") {
            const content = message.content.toLowerCase();
            if (content.includes("my name is")) {
                const nameMatch = content.match(/my name is (\w+)/);
                if (nameMatch) facts.push(`User's name: ${nameMatch[1]}`);
            }
            if (content.includes("i work") || content.includes("my job")) {
                facts.push(
                    `Work/Job mentioned: ${message.content.substring(0, 100)}`
                );
            }
            if (content.includes("i live")) {
                facts.push(
                    `Location mentioned: ${message.content.substring(0, 100)}`
                );
            }
        }
    });

    return facts.slice(0, 5); // Limit to 5 key facts
}
