import threading
from flask import request, jsonify
from config import app
from client import (
    generate_response,
    generate_image_for_sentence,
    text_to_speech,
    highlight_word_in_sentence,
)

# In-memory cache: sentence -> image URL (filled by background thread)
image_cache = {}
image_cache_lock = threading.Lock()


def _generate_image_background(sentence: str) -> None:
    url = generate_image_for_sentence(sentence)
    with image_cache_lock:
        image_cache[sentence] = url


@app.route("/story", methods=["GET"])
def get_story_snippet():
    word = request.args.get("word") or ""
    story = request.args.get("story") or ""
    voice = request.args.get("voice") or ""

    # Text first (don't wait for image)
    full_story, new_sentence = generate_response(story, word)
    new_story_html = highlight_word_in_sentence(new_sentence, word)
    old_story = story
    audio_data_url = text_to_speech(new_sentence, voice)
    full_audio_data_url = text_to_speech(full_story, voice)

    # Start image generation in background; return immediately without image
    thread = threading.Thread(target=_generate_image_background, args=(new_sentence,))
    thread.daemon = True
    thread.start()

    return jsonify({
        "oldStory": old_story,
        "newStory": new_story_html,
        "fullStory": full_story,
        "audio": audio_data_url,
        "fullAudio": full_audio_data_url,
        "sentenceForImage": new_sentence,
    })


@app.route("/image", methods=["GET"])
def get_image():
    """Return image for a sentence when ready (frontend polls until available)."""
    sentence = request.args.get("sentence") or ""
    with image_cache_lock:
        url = image_cache.get(sentence)
    return jsonify({"image": url})

@app.route("/audio", methods=["GET"])
def get_audio():
    text = request.args.get("text") or ""
    voiceType = request.args.get("voice") or ""
    return jsonify({"audio": text_to_speech(text, voiceType)})

if __name__ == "__main__":
    app.run(debug=True)
