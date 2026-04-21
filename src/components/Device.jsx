import React, { useEffect, useState } from 'react' 
import MonitorMap from './MonitorMap'
import { useAirMochiStore } from '../store/useAirMochiStore'

const AGE_STAGES = [
  { key: 'baby', icon: '🐣', label: 'BABY' },
  { key: 'teen', icon: '🐦', label: 'TEEN' },
  { key: 'adult', icon: '🦖', label: 'ADULT' },
  { key: 'elder', icon: '🐉', label: 'ELDER' },
]

function StatBar({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="bar-bg">
        <div className="bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function AgeRow({ phase, age }) {
  const currentIndex =
    phase === 'egg' ? -1 :
    phase === 'baby' ? 0 :
    phase === 'teen' ? 1 :
    phase === 'adult' ? 2 : 3

  const ageLabel =
    phase === 'egg' ? 'EGG' :
    phase === 'dead' ? 'RIP' :
    AGE_STAGES[Math.max(0, currentIndex)]?.label

  const dayLabel = phase === 'egg' ? 'DAY 0' : `DAY ${Math.floor(age)}`

  return (
    <div className="age-row">
      <div className="age-stages">
        {AGE_STAGES.map((stage, index) => (
          <div
            key={stage.key}
            className={`age-pip ${index === currentIndex ? 'active' : index < currentIndex ? 'done' : ''}`}
          >
            {stage.icon}
          </div>
        ))}
      </div>

      <div className="age-right">
        <div className="age-label">{ageLabel}</div>
        <div className="age-days">{dayLabel}</div>
      </div>
    </div>
  )
}

export default function Device() {
  const {
    analysis,
    stats,
    tracking,
    setTracking,
    setPosition,
    hatchPet,
    feedPet,
    jumpToCity,
    jumpToPark,
    actionState,
  } = useAirMochiStore()

   const MAX_FEED_STOCK = 3
  const FEED_RECHARGE_MS = 30000

  const [, forceUpdate] = useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  let feedTimerText = ''

  if (stats.feedStock < MAX_FEED_STOCK) {
    const now = Date.now()
    const elapsed = now - stats.lastFeedRechargeAt
    const remaining = FEED_RECHARGE_MS - (elapsed % FEED_RECHARGE_MS)

    const seconds = Math.ceil(remaining / 1000)
    feedTimerText = `${seconds}s`
  }

  useEffect(() => {
    if (!tracking || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition((pos) => {
      setPosition({ lng: pos.coords.longitude, lat: pos.coords.latitude })
    })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [tracking, setPosition])

  const emotion =
  stats.phase === 'egg'
    ? 'Tap HATCH to crack the egg'
    : stats.phase === 'dead'
      ? 'Air Mochi lost all energy...'
      : stats.food === 0
        ? 'Hungry...'
        : actionState.name === 'feed'
          ? 'Nom nom! Air Mochi is eating'
          : actionState.name === 'pet'
            ? 'Pet pet! ♥'
            : analysis.theme === 'sanctuary'
              ? 'Fresh air! Air Mochi is happy'
              : analysis.theme === 'good'
                ? 'Fresh air! Air Mochi is happy'
                : analysis.theme === 'moderate'
                  ? 'Air is okay today~'
                  : analysis.theme === 'bad'
                    ? 'Cough cough... bad air!'
                    : actionState.name === 'dance'
                      ? 'Fresh air! Air Mochi is happy'
                      : actionState.name === 'panic'
                        ? 'Cough cough... bad air!'
                        : 'Breathing easy ♥'

  return (
    <div className="page-shell">
      <div className="stars" />

      <main className="dashboard-shell">
        <section className="dashboard-panel retro-panel">
          <div className="screen">
            <div className="screen-glow" />

            <AgeRow phase={stats.phase} age={stats.age} />

            <div className="top-bar">
              <div>
                <div className="mini-label">PM2.5</div>
                <div className="aqi-num">{String(analysis.pm25).padStart(3, '0')}</div>
                <div className="aqi-sub">{analysis.zoneName.toUpperCase()}</div>
              </div>

              <div className="aqi-right">
                <span>{analysis.aqiLabel}</span>
              </div>
            </div>

            <MonitorMap />

            <div className="emotion">{emotion}</div>

            <div className="stats">
              <StatBar label="MOOD" value={stats.mood} />
              <StatBar label="FOOD" value={stats.food} />
            </div>
          </div>
      

<div className="device-actions">
  <div className="panel-title">ACTIONS</div>

  <div className="buttons">
    <button className="btn" onClick={() => setTracking(!tracking)}>
      <span className="bi">🗺️📍</span>
      {tracking ? 'STOP' : 'TRACK'}
    </button>

    <button className="btn" onClick={hatchPet}>
      <span className="bi">🥚🍳</span>
      HATCH
    </button>

    <button
      className="btn feed-btn"
      onClick={feedPet}
      disabled={stats.feedStock <= 0}
    >
      <span className="bi">🍣🍖</span>
      {`FEED ${stats.feedStock}/3`}
      {stats.feedStock < MAX_FEED_STOCK && (
        <span className="feed-timer">
  <span className="timer-emoji">⏳</span>
  <span className="timer-text">{feedTimerText}</span>
</span>
      )}
    </button>
  </div>
</div>
        </section>
      </main>
    </div>
  )
}