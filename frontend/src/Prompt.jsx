import React, { useState } from "react";
import { useTypewriter } from "./TypeWriter";

const Prompt = () => {
    // State that stores the current word being inputted by the user.
    const [word, setWord] = useState("");

    // State to manage the story in three sections:
    // oldStory: Previously generated text
    // newStory: Latest story addition
    // fullStory: Complete accumulated story
    const [story, setStory] = useState({
    oldStory: "",
    newStory: "",
    fullStory: "",
    });

  // State to control visibility of the input field  
  const [showInput, setShowInput] = useState(true);
  /**
   * Controls the visibility of the input text box
   * @param {boolean} state - true to show input, else false to hide input
   * When input is hidden, this clears the current word
   */
  const textBoxVisible = (state) => {
    if (state === false) {
        setWord("");
    }
    setShowInput(state);
  }
    
  /**
   * Gets the next story segment from the backend API,
   * sends the current fullStory and the new word as query parameters,
   * and updates the story's state with the server's response. 
   */
  const fetchStory = async () => {
    try {
        const response = await fetch(`http://localhost:5000/story?story=${story.fullStory}&word=${word}`);
        const data = await response.json();

        setStory(data);
    } catch (error) {
        console.error("Error fetching story:", error);
  }
};
  /**
   * Handles event when user presses the Enter key in the input field.
   * Afterwards this will trigger the story generation process.
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleEnter = (event) => {
    if (event.key === "Enter") {
      textBoxVisible(false); //Hiding input field during story generation
      fetchStory();
    }
  };

  return (
   <>
       {/* Display old story text*/}   
       <p style={{display: "inline"}}>{story.oldStory + " "}</p>

       {/* Display new story text with typewriter
	   useTypeWriter hook animates the text character by character
	   When animation is done, it textBoxVisible gets called to showcase input again */}
    <p style={{display: "inline"}}>{useTypewriter(story.newStory + " ", textBoxVisible)}</p>

       {/* Conditionally render the input field based on showInput state
	   Input is hidden during typewriter animation,
	   showcased when ready for user input */}
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
