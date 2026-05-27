import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL;

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

function App() {
  const [result, setResult] = useState<User[]>([]);

  const onClickHndler = async () => {
    const res = await fetch(`${API_URL}`)
    const data = await res.json()
    setResult(data)
  }

  return (
    <>
      <ul>{result.map((r: User) => (
        <li key={r.id}>{r.first_name} {r.last_name} {r.email}</li>
      ))}</ul>
      <button onClick={onClickHndler}>Click me</button>
    </>
  )
}

export default App
