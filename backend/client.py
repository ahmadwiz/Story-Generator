import os
import re
import base64
import requests
from typing import Optional

# OpenRouter config
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
IMAGE_MODEL = "google/gemini-2.5-flash-image"

# ElevenLabs TTS config
ELEVENLABS_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


def generate_response(story: str, word: str) -> tuple[str, str]:
    """
    Generate a one-sentence story continuation using OpenRouter.
    Returns (full_story, new_sentence).
    """
    try:
        if not OPENROUTER_KEY:
            raise ValueError("OPENROUTER_API_KEY not set")

        prompt = (
            f"Start a short story with exactly one sentence that relates to the word: {word}. "
            f"Do not begin with 'Once upon a time' or similar."
            if not story else
            f"Given the following story snippet: {story}, respond with exactly one sentence "
            f"following the story that relates to the word: {word}."
        )

        resp = requests.post(
            f"{OPENROUTER_BASE}/responses",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": "openai/gpt-4o-mini", "input": prompt},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        # OpenRouter returns output_text inside the response
        new_sentence = data.get("output_text", "").strip()
        full_story = (story + " " + new_sentence).strip() if story else new_sentence
        return full_story, new_sentence

    except Exception as e:
        print("Error generating response:", e)
        return story or "", "Sorry, I couldn't generate a sentence."


def highlight_word_in_sentence(sentence: str, word: str) -> str:
    """Wrap the given word in <span><h1>word</h1></span> for frontend display."""
    if not word or not sentence:
        return sentence
    match = re.search(re.escape(word), sentence, re.IGNORECASE)
    if match:
        return sentence.replace(match.group(), f"<span><h1>{match.group()}</h1></span>") + "<br/><br/>"
    return sentence + "<br/><br/>"


def generate_image_for_sentence(sentence: str) -> Optional[str]:
    """Generate an image for a story sentence using OpenRouter. Returns image URL or None."""
    if not OPENROUTER_KEY or not sentence.strip():
        return None

    try:
        prompt = (
            f"Generate a single illustration for this moment in a story. "
            f"Style: storybook or digital art, clear and readable. Scene: {sentence}"
        )

        resp = requests.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": IMAGE_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "modalities": ["image", "text"],
                "stream": False,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        choices = data.get("choices", [])
        if not choices:
            return None
        images = choices[0].get("message", {}).get("images", [])
        if not images:
            return None

        # Return the URL of the first image
        return images[0].get("image_url") or images[0].get("imageUrl")

    except Exception as e:
        print("Error generating image:", e)
        return None


def text_to_speech(sentence: str) -> Optional[str]:
    """Convert sentence to speech via ElevenLabs. Returns base64 data URL (audio/mpeg) or None."""
    if not ELEVENLABS_KEY or not sentence.strip():
        return None

    try:
        resp = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={"text": sentence.strip(), "model_id": "eleven_multilingual_v2"},
            timeout=30,
        )
        resp.raise_for_status()
        b64_audio = base64.b64encode(resp.content).decode("utf-8")
        return f"data:audio/mpeg;base64,{b64_audio}"

    except Exception as e:
        print("Error generating TTS:", e)
        return None
