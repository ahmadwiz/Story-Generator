import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Prompt from './Prompt'
import Lights from './Lights'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className='header'>
      
        <h1 id='title'>Once Upon A Hack,</h1>
       
      
      <div className='header2'>
        <Lights />
         <img src="dog.png" width={200}></img>
      </div>
    
    </div>
     <hr />
     <br />
     <Prompt />

    </>
  )
}

export default App
