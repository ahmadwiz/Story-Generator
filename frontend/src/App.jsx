import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Prompt from './Prompt'
import Lights from './Lights'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Lights />
    <div className='header'>
        <div>
          <h1 className='title'>Once Upon A Hack, </h1>   
          <h4 id='subtitle'>Tells a tale of epic proportions with but a single word🪄</h4>
        </div>
        
        
       <img id="dog" src="dog.png" width={200}></img>
    </div>
     <hr />
     <br />
     <Prompt />

    </>
  )
}

export default App
