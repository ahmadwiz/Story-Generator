import React, { useState, useRef } from "react";
import { useTypewriter } from "./TypeWriter";
import List from "./List";

const IMAGE_POLL_INTERVAL_MS = 1500;
const IMAGE_POLL_MAX_ATTEMPTS = 45; // ~67s max wait
let playingAudio = false;

const SIMPLE_WORDS = [
  "big", "red", "sun", "dog", "cat", "hat", "run", "sit", "ball", "box", "car",
  "day", "egg", "fun", "hot", "ice", "jump", "kid", "leg", "mom", "net", "pet",
  "toy", "wet", "yes", "zoo", "bed", "cup", "fish", "book", "tree", "moon",
  "star", "rain", "wind", "bird", "cake", "door", "house", "water", "fire",
];

function getRandomSimpleWord() {
  return SIMPLE_WORDS[Math.floor(Math.random() * SIMPLE_WORDS.length)];
}

const Prompt = () => {
  const [word, setWord] = useState("");
  const [story, setStory] = useState({
    oldStory: "",
    newStory: "",
    fullStory: "",
    audio: null,
    fullAudio: null,
  });
  const [showInput, setShowInput] = useState(true);
  const [wordsUsed, setWordsUsed] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [voiceType, setVoiceType] = useState("man")
  const pollAttemptsRef = useRef(0);


  const playCurrentAudio = async () => {
      if (playingAudio) return;


      try {
         playingAudio = true;
        const response = await fetch(
        `http://localhost:5000/audio?text=${encodeURIComponent(story.fullStory || "")}&voice=${voiceType}`
      );
      const data = await response.json();

      

        const audio = new Audio(data.audio);
        audio.play().catch(() => {});
        audio.onended = () => {
          playingAudio = false;
        }
      } catch (_) {playingAudio = false;}
    
  };

  const addWordToList = (wordToAdd) => {
    setWordsUsed((prev) => {
      if (prev.includes(wordToAdd)) return prev;
      return [...prev, wordToAdd];
    });
  };

  const playChime = async () => {
    try {
      const chime = new Audio("/chime.mp3");
      chime.currentTime = 0.2;
      chime.playbackRate = 2;
      await chime.play();
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  const textBoxVisible = (state) => {
    if (state === false) {
      setWord("");
    }
    setShowInput(state);
    if (state === true && story.audio) {
      playCurrentAudio(story.audio)
    }
  };

  const handleDropdown = (e) => {
    setVoiceType(e.target.value)
  }

  const fetchStory = async (wordToAdd) => {
    try {
      const response = await fetch(
        `http://localhost:5000/story?story=${encodeURIComponent(story.fullStory || "")}&word=${encodeURIComponent(wordToAdd)}&voice=${voiceType}`
      );
      const data = await response.json();

      playChime();
      setStory({
        oldStory: data.oldStory,
        newStory: data.newStory,
        fullStory: data.fullStory,
        audio: data.audio,
        fullAudio: data.fullAudio
      });

      if (data.sentenceForImage) {
        pollAttemptsRef.current = 0;
        pollForImage(data.sentenceForImage);
      }
    } catch (error) {
      console.error("Error fetching story:", error);
    }
  };

  const pollForImage = (sentence) => {
    const attempt = () => {
      if (pollAttemptsRef.current >= IMAGE_POLL_MAX_ATTEMPTS) return;
      pollAttemptsRef.current += 1;
      fetch(
        `http://localhost:5000/image?sentence=${encodeURIComponent(sentence)}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.image) {
            setImages((prev) => {
              const next = [...prev, data.image];
              setCurrentImageIndex(next.length - 1);
              return next;
            });
            return;
          }
          setTimeout(attempt, IMAGE_POLL_INTERVAL_MS);
        })
        .catch(() => setTimeout(attempt, IMAGE_POLL_INTERVAL_MS));
    };
    attempt();
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((i) => (i > 0 ? i - 1 : i));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((i) =>
      i < images.length - 1 ? i + 1 : i
    );
  };

  const fetchWord = async () => {
    setWord("Loading");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(
        "https://random-word-api.herokuapp.com/word?number=1",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      if (Array.isArray(data) && data[0]) {
        setWord(data[0]);
        return;
      }
      throw new Error("No word in response");
    } catch (error) {
      clearTimeout(timeoutId);
      setWord(getRandomSimpleWord());
      textBoxVisible(true);
      if (error.name !== "AbortError") {
        console.error("Error fetching random word, using fallback:", error);
      }
    }
  };

  const handleEnter = (event) => {
    if (event.key === "Enter") {
      fetchStory(word);
      addWordToList(word);
      textBoxVisible(false);
    }
  };



  const typewriter = useTypewriter(story.newStory + " ", textBoxVisible);
  const hasImages = images.length > 0;
  const canGoPrev = hasImages && currentImageIndex > 0;
  const canGoNext = hasImages && currentImageIndex < images.length - 1;

  return (
    <>
      <div className="textBox">
        <p
          style={{ display: "inline" }}
          dangerouslySetInnerHTML={{ __html: story.oldStory + " " }}
        />
        <span className={`typewriter-sparkle-wrap ${typewriter.isTyping ? "typing" : ""}`}>
          <p
            style={{
              display: "inline",
              paddingRight: story.oldStory === "" ? 0 : 10,
            }}
            dangerouslySetInnerHTML={{
              __html: typewriter.text,
            }}
          />
          {typewriter.isTyping && (
            <span className="sparkle-cursor" aria-hidden>
              <span className="sparkle-char">✦</span>
              <span className="sparkle-char">✧</span>
              <span className="sparkle-char">✦</span>
            </span>
          )}
        </span>
        {showInput && (
          <span className="input-inline">
            <input
              value={word}
              onChange={(e) => setWord(e.target.value.replace(/\s/g, ""))}
              onKeyDown={handleEnter}
              maxLength={15}
              size={10}
              placeholder="Enter word"
              disabled={word === "Loading"}
            />
            {showInput && word !== "Loading" && (
              <button
                type="button"
                onClick={fetchWord}
                className="dice-btn-inline"
                aria-label="Random word"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  color="white"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zM3 0a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3z" />
                  <path d="M5.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-8 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                </svg>
              </button>
            )}
          </span>
        )}
      </div>

      {story.fullAudio && (
        <div className="audio-control">
          <button
            type="button"
            onClick={() => {playCurrentAudio(story.fullAudio)}}
            className="play-audio-btn"
            aria-label="Play sentence"
          >
            🔊 Play Full
          </button>
        </div>
      )}

      {showInput && (
        <div className="dropdown-control">
        <select id="voice-selector" onChange={handleDropdown}>
            <option value="man">Man</option>
            <option value="woman">Woman</option>
            <option value="passionate">Passionate</option>
            <option value="witch">Witch</option>
        </select>
      </div>
      )}

      
       

      <div className="story-image-section">
        {hasImages && (
          <>
            <button
              type="button"
              className="image-arrow image-arrow-left"
              onClick={goToPrevImage}
              disabled={!canGoPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <div className="story-image-container">
              <img
                src={images[currentImageIndex]}
                alt={`Story illustration ${currentImageIndex + 1}`}
                className="story-illustration"
              />
            </div>
            <button
              type="button"
              className="image-arrow image-arrow-right"
              onClick={goToNextImage}
              disabled={!canGoNext}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
        {!hasImages && (
          <div className="story-image-placeholder">
            Illustration will appear here when ready.
          </div>
        )}
      </div>

      <List wordsUsed={wordsUsed} />
    </>
  );
};

export default Prompt;
