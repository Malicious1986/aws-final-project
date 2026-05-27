import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [result, setResult] = useState<string>('')

  const onClickHndler = async () => {
    const res = await fetch(`${API_URL}/test`)
    const data = await res.json()
    setResult(data)
  }

  return (
    <>
      <div>Hello Vite + React!</div>
      <div>{result}</div>
      <button onClick={onClickHndler}>Click me</button>
    </>
  )
}

export default App
