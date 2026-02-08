from openai import OpenAI
import os
import re
import base64
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# OpenRouter image model (Gemini 2.5 Flash Image)
IMAGE_MODEL = "google/gemini-2.5-flash-image"


VoiceKeys = {
    "man": os.getenv("ELEVENLABS_VOICE_ID_man"),
    "woman": os.getenv("ELEVENLABS_VOICE_ID_woman"),
    "passionate": os.getenv("ELEVENLABS_VOICE_ID_passionate"),
    "witch": os.getenv("ELEVENLABS_VOICE_ID_witch"),
}

def generate_response(story, word):
    """Returns (full_story, new_sentence) for continuation."""
    if story == "" or story is None:
        response = client.responses.create(
            model="openai/gpt-4o-mini",
            input=f"Start a short story with exactly one sentence that relates to the word: {word}, and the theme of magic. Do not begin with 'Once upon a time' or similar."
        )
        new_sentence = response.output_text.strip()
        full_story = highlight_word_in_sentence(new_sentence, word).strip()
    else:
        response = client.responses.create(
            model="openai/gpt-4o-mini",
            input=f"Given the following story snippet: {story}, respond with exactly one sentence following the story that relates to the word: {word}, and the theme of magic."
        )
        new_sentence = response.output_text.strip()
        # Highlight the new sentence and append it to the existing HTML story
        full_story = (story + " " + highlight_word_in_sentence(new_sentence, word)).strip()

    return full_story, new_sentence


def highlight_word_in_sentence(sentence: str, word: str) -> str:
    """Wrap the given word in <span><h1>word</h1></span> for frontend display."""
    if not word or not sentence:
        return sentence
    match = re.search(re.escape(word), sentence, re.IGNORECASE)
    if match:
        return sentence.replace(match.group(), f"<span><h1>{match.group()}</h1></span>") + "<br/><br/>"
    return sentence + "<br/><br/>"


def generate_image_for_sentence(sentence: str) -> Optional[str]:
    """Generate an image for a story sentence using OpenRouter. Returns base64 data URL or None."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None

    prompt = (
        f"Generate a single illustration for this moment in a story. "
        f"Style: storybook or digital art, clear and readable. Scene: {sentence}"
    )

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
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

        choices = data.get("choices") or []
        if not choices:
            return None
        message = choices[0].get("message") or {}
        images = message.get("images") or []
        if not images:
            return None

        first = images[0]
        url_obj = first.get("image_url") or first.get("imageUrl") or {}
        return url_obj.get("url")
    except Exception:
        return None


# ElevenLabs TTS: default voice Rachel; set ELEVENLABS_VOICE_ID to override
# ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


def text_to_speech(sentence: str, voiceType) -> Optional[str]:
    """Convert sentence to speech via ElevenLabs. Returns base64 data URL (audio/mpeg) or None."""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key or not sentence.strip():
        return None
    voiceId = VoiceKeys.get(voiceType)
    
    try:
        resp = requests.post(
           
            "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": sentence.strip(),
                "model_id": "eleven_multilingual_v2",
            },
            timeout=30,
        )
        resp.raise_for_status()
        b64 = base64.b64encode(resp.content).decode("utf-8")
        return f"data:audio/mpeg;base64,{b64}"
    except Exception:
        return None
