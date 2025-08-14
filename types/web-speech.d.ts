// Ambient types for the Web Speech API (SpeechRecognition) and vendor-prefixed variants
// This helps TypeScript understand window.SpeechRecognition and related events.

export {};

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
    }

    interface SpeechRecognitionEvent extends Event {
        resultIndex: number;
        results: SpeechRecognitionResultList;
    }

    type SpeechRecognitionErrorCode =
        | "no-speech"
        | "aborted"
        | "audio-capture"
        | "network"
        | "not-allowed"
        | "service-not-allowed"
        | "bad-grammar"
        | "language-not-supported";

    interface SpeechRecognitionErrorEvent extends Event {
        error: SpeechRecognitionErrorCode;
        message?: string;
    }

    interface SpeechRecognitionAlternative {
        transcript: string;
        confidence: number;
    }

    interface SpeechRecognitionResult {
        isFinal: boolean;
        length: number;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionResultList {
        length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        maxAlternatives: number;

        start(): void;
        stop(): void;
        abort(): void;

        onaudiostart?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onsoundstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechend?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onsoundend?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onaudioend?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onresult?:
            | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
            | null;
        onnomatch?:
            | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
            | null;
        onerror?:
            | ((
                  this: SpeechRecognition,
                  ev: SpeechRecognitionErrorEvent
              ) => any)
            | null;
        onstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
        onend?: ((this: SpeechRecognition, ev: Event) => any) | null;
    }
}
