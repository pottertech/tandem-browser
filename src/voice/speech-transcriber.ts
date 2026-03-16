import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createLogger } from '../utils/logger';

const log = createLogger('SpeechTranscriber');

type TranscriberBackend = 'apple' | 'whisper' | 'none';

function getAppleSpeechBinary(): string {
  // Check bundled binary first, then dev location
  const bundled = path.join(process.resourcesPath || '', 'native', 'tandem-speech');
  const dev = path.join(__dirname, '..', '..', 'native', 'speech', 'tandem-speech');
  if (fs.existsSync(bundled)) return bundled;
  if (fs.existsSync(dev)) return dev;
  return '';
}

function getWhisperBinary(): string {
  // Common locations
  const locations = [
    '/opt/homebrew/bin/whisper',
    '/usr/local/bin/whisper',
    '/usr/bin/whisper',
  ];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  return '';
}

export function detectBackend(): TranscriberBackend {
  if (process.platform === 'darwin' && getAppleSpeechBinary()) return 'apple';
  if (getWhisperBinary()) return 'whisper';
  return 'none';
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  language = 'nl-BE'
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const backend = detectBackend();

  if (backend === 'none') {
    return { ok: false, error: 'No speech transcription backend available. Install whisper: pip install openai-whisper' };
  }

  // Write audio buffer to temp file
  const tmpFile = path.join(os.tmpdir(), `tandem-audio-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpFile, audioBuffer);
  } catch (e) {
    return { ok: false, error: `Failed to write temp audio file: ${e}` };
  }

  try {
    if (backend === 'apple') {
      return await transcribeWithApple(tmpFile, language);
    } else {
      return await transcribeWithWhisper(tmpFile, language);
    }
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

function transcribeWithApple(audioFile: string, language: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  return new Promise((resolve) => {
    const binary = getAppleSpeechBinary();
    // Map nl-BE to nl-NL for Apple (nl-BE not always supported)
    const appleLanguage = language === 'nl-BE' ? 'nl-NL' : language;

    execFile(binary, [audioFile, appleLanguage], { timeout: 30_000 }, (err, stdout, stderr) => {
      if (err) {
        log.warn('Apple Speech error:', stderr || err.message);
        resolve({ ok: false, error: stderr || err.message });
      } else {
        const text = stdout.trim();
        if (text) {
          log.info(`Apple Speech: "${text.substring(0, 60)}"`);
          resolve({ ok: true, text });
        } else {
          resolve({ ok: false, error: 'No transcription result' });
        }
      }
    });
  });
}

function transcribeWithWhisper(audioFile: string, language: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  return new Promise((resolve) => {
    const binary = getWhisperBinary();
    // Map language code: nl-BE → nl
    const whisperLang = language.split('-')[0];

    const outDir = path.dirname(audioFile);
    const args = [
      audioFile,
      '--model', 'base',
      '--language', whisperLang,
      '--output_format', 'txt',
      '--output_dir', outDir,
    ];

    execFile(binary, args, { timeout: 60_000 }, (err, _stdout, stderr) => {
      if (err) {
        log.warn('Whisper error:', stderr || err.message);
        resolve({ ok: false, error: stderr || err.message });
        return;
      }

      // Whisper writes <filename>.txt
      const base = path.basename(audioFile, path.extname(audioFile));
      const txtFile = path.join(outDir, `${base}.txt`);
      try {
        const text = fs.readFileSync(txtFile, 'utf-8').trim();
        try { fs.unlinkSync(txtFile); } catch { /* ignore */ }
        if (text) {
          log.info(`Whisper: "${text.substring(0, 60)}"`);
          resolve({ ok: true, text });
        } else {
          resolve({ ok: false, error: 'No transcription result' });
        }
      } catch {
        resolve({ ok: false, error: 'Whisper output file not found' });
      }
    });
  });
}
