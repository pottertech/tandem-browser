import Foundation
import Speech
import AVFoundation

// tandem-speech — Apple Speech Framework CLI for Tandem Browser
// Usage: tandem-speech <audio-file-path> [language]
// Output: transcribed text on stdout, errors on stderr
// Exit: 0 on success, 1 on failure

func transcribe(fileURL: URL, language: String, completion: @escaping (String?, Error?) -> Void) {
    let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language))
    guard let recognizer = recognizer, recognizer.isAvailable else {
        completion(nil, NSError(domain: "SpeechError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Speech recognizer not available for locale: \(language)"]))
        return
    }

    let request = SFSpeechURLRecognitionRequest(url: fileURL)
    request.shouldReportPartialResults = false
    request.requiresOnDeviceRecognition = false // allow server if needed for accuracy

    recognizer.recognitionTask(with: request) { result, error in
        if let error = error {
            completion(nil, error)
            return
        }
        if let result = result, result.isFinal {
            completion(result.bestTranscription.formattedString, nil)
        }
    }
}

// Request microphone + speech permission
func requestPermissions(completion: @escaping (Bool) -> Void) {
    SFSpeechRecognizer.requestAuthorization { status in
        guard status == .authorized else {
            fputs("Speech recognition permission denied\n", stderr)
            completion(false)
            return
        }
        completion(true)
    }
}

// Main
let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("Usage: tandem-speech <audio-file> [language]\n", stderr)
    fputs("  language: nl-BE (default), en-US, fr-FR, etc.\n", stderr)
    exit(1)
}

let filePath = args[1]
let language = args.count >= 3 ? args[2] : "nl-BE"
let fileURL = URL(fileURLWithPath: filePath)

guard FileManager.default.fileExists(atPath: filePath) else {
    fputs("File not found: \(filePath)\n", stderr)
    exit(1)
}

let sema = DispatchSemaphore(value: 0)
var exitCode: Int32 = 0

requestPermissions { granted in
    guard granted else {
        exitCode = 1
        sema.signal()
        return
    }

    transcribe(fileURL: fileURL, language: language) { text, error in
        if let error = error {
            fputs("Transcription error: \(error.localizedDescription)\n", stderr)
            exitCode = 1
        } else if let text = text {
            print(text)
        } else {
            fputs("No transcription result\n", stderr)
            exitCode = 1
        }
        sema.signal()
    }
}

sema.wait()
exit(exitCode)
