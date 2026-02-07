import React, { useState } from "react";
import { useTypewriter } from "./TypeWriter";

const Prompt = () => {
  const [word, setWord] = useState("");
  const [story, setStory] = useState({
    oldStory: "",
    newStory: "",
    fullStory: "",
  });
  const [showInput, setShowInput] = useState(true);

  const textBoxVisible = (state) => {
    if (state === false) {
        setWord("");
    }
    setShowInput(state);
  }

  const fetchStory = async () => {
    try {
        const response = await fetch(`http://localhost:5000/story?story=${story.fullStory}&word=${word}`);
        const data = await response.json();

        setStory(data);
    } catch (error) {
        console.error("Error fetching story:", error);
  }
};

  const handleEnter = (event) => {
    if (event.key === "Enter") {
      textBoxVisible(false);
      fetchStory();
    }
  };

  return (
   <>

    <p style={{display: "inline"}}>{story.oldStory + " "}</p>
    <p style={{display: "inline"}}>{useTypewriter(story.newStory + " ", textBoxVisible)}</p>

   {showInput && (<input
      value={word}
      onChange={(e) => setWord(e.target.value)}
      onKeyDown={handleEnter}
      style={{marginLeft: "0px"}}
      maxLength={12}
      size={10}
    />)}
   </>
  );
};

export default Prompt;