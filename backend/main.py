from flask import request, jsonify
from config import app
from client import generate_response


@app.route("/story", methods=["GET"])
def get_story_snippet():
    word = request.args.get("word")
    story = request.args.get("story")
    return jsonify(generate_response(story, word))



if __name__ == '__main__':
    app.run(debug=True)

