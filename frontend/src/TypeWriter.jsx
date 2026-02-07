import { useState, useEffect } from "react";

export function useTypewriter(text, callback, speed = 25) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let index = 0;
    setIsTyping(true);

    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;

      if (index === text.length) {
        clearInterval(interval);
        setIsTyping(false);
        callback(true);
      }
    }, speed);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [text, speed]);

  return { text: displayText, isTyping };
}
