import { useState, useEffect } from "react";

export function useTypewriter(text, callback, speed = 25) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;

      if (index === text.length) {
        clearInterval(interval);
        callback(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayText;
}
