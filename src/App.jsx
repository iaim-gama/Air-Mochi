import Device from './components/Device.jsx'
import { useEffect } from "react"
import { useAirMochiStore } from "./store/useAirMochiStore"

export default function App() {
  const loadStations = useAirMochiStore((s) => s.loadStations)

  useEffect(() => {
    loadStations()
  }, [])
  return <Device />
}

