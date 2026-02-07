from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

def generate_response(story, word):
    print(story)
    response = client.responses.create(
        model="openai/gpt-4o-mini",
        input = f"""
        Given the following story snippet as context: {story == "" and "Once upon a time" or story}, 
        Continue the story with exactly one sentence following the story and relating to the word: {word},
        """
    )

    return {"oldStory": story, "newStory": response.output_text, "fullStory": story + " " + response.output_text}