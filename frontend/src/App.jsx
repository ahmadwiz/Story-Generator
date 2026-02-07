import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Prompt from './Prompt'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <h1>Once upon a time,</h1>
     <Prompt />

    </>
  )
}

export default App
