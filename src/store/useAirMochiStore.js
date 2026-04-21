import { create } from 'zustand'
import { buildBangkokSegments, clampToBangkok, mergeExactCoordinateStations } from '../utils/geo'
import { analyzeLocation } from '../utils/spatial'
import { stationSeeds } from '../data/bangkokData'

const initialPosition = { lng: 100.533, lat: 13.728 }
const initialStations = mergeExactCoordinateStations(stationSeeds)
const initialGeojson = buildBangkokSegments(initialStations)
const initialAnalysis = analyzeLocation(initialPosition, initialGeojson)

const PET_VARIANTS = ['round', 'cat', 'blob']

const randomPetVariant = () =>
  PET_VARIANTS[Math.floor(Math.random() * PET_VARIANTS.length)]

const actionDurations = {
  idle: 0,
  bounce: 26,
  wave: 40,
  dance: 46,
  panic: 46,
  hungry: 40,
  sad: 36,
  look: 28,
  sleep: 60,
  jump: 34,
  wiggle: 36,
  feed: 30,
  pet: 28,
}

const randomIdleAction = () => {
  const pool = ['look', 'bounce', 'sleep']
  return pool[Math.floor(Math.random() * pool.length)]
}

const clampStat = (value) => Math.max(0, Math.min(100, value))

const getMoodDelta = (analysis) => {
  if (analysis.zoneType === 'sanctuary') return 3
  if (analysis.pm25 <= 50) return 2
  if (analysis.pm25 <= 100) return -1
  if (analysis.pm25 <= 150) return -2
  if (analysis.pm25 <= 200) return -4
  return -6
}

const tickStats = (stats, analysis) => {
  const nextFood = clampStat(stats.food - 2)

  let moodDelta = getMoodDelta(analysis)
  if (nextFood === 0) {
    moodDelta -= 1
  }

  const nextMood = clampStat(stats.mood + moodDelta)
  const nextAge = stats.age + 1

  return {
    mood: nextMood,
    food: nextFood,
    age: nextAge,
    phase: nextMood <= 0 ? 'dead' : stats.phase,
  }
}

const MAX_FEED_STOCK = 3
const FEED_RECHARGE_MS = 30000

export const useAirMochiStore = create((set, get) => ({
  stations: initialStations,
  geojson: initialGeojson,
  position: initialPosition,
  analysis: initialAnalysis,

  stats: {
    mood: 100,
    food: 100,
    age: 0,
    phase: 'egg',
    variant: randomPetVariant(),
    feedStock: MAX_FEED_STOCK,
  lastFeedRechargeAt: Date.now(),
  },

  tracking: false,
  actionState: { name: 'idle', tick: 0 },

  triggerAction: (name) => set({ actionState: { name, tick: actionDurations[name] ?? 30 } }),

  setPosition: (position) => {
    const next = clampToBangkok(position)
    const prev = get().analysis
    const analysis = analyzeLocation(next, get().geojson)

    let nextAction = null

    if (analysis.theme !== prev.theme) {
      if (analysis.theme === 'sanctuary' || analysis.theme === 'good') {
        nextAction = 'dance'
      } else if (analysis.theme === 'moderate') {
        nextAction = 'look'
      } else if (analysis.theme === 'bad') {
        nextAction = 'panic'
      }
    }

    set({
      position: next,
      analysis,
      ...(nextAction ? { actionState: { name: nextAction, tick: actionDurations[nextAction] } } : {}),
    })
  },

  hatchPet: () => {
    const nextVariant = randomPetVariant()

    // step 1: show a fresh egg first
    set({
      stats: {
        mood: 100,
        food: 100,
        age: 0,
        phase: 'egg',
        variant: nextVariant,
        feedStock: MAX_FEED_STOCK,
  lastFeedRechargeAt: Date.now(),
      },
      actionState: { name: 'idle', tick: 0 },
    })

    // step 2: hatch after a short delay
    setTimeout(() => {
      const current = get().stats
      if (current.phase !== 'egg') return

      set((state) => {
        const analysis = get().analysis

        let nextAction = 'look'
        if (analysis.theme === 'sanctuary' || analysis.theme === 'good') {
          nextAction = 'dance'
        } else if (analysis.theme === 'bad') {
          nextAction = 'panic'
        }

        return {
          stats: {
            ...state.stats,
            phase: 'baby',
          },
          actionState: { name: nextAction, tick: actionDurations[nextAction] },
        }
      })
    }, 1200)
  },

  feedPet: () =>
  set((state) => {
    if (state.stats.feedStock <= 0 || state.stats.phase === 'egg' || state.stats.phase === 'dead') {
      return {}
    }

    const nextStock = state.stats.feedStock - 1

    return {
      stats: {
        ...state.stats,
        food: clampStat(state.stats.food + 1),
        mood: clampStat(state.stats.mood + 1),
        feedStock: nextStock,
        lastFeedRechargeAt:
          state.stats.feedStock === MAX_FEED_STOCK
            ? Date.now()
            : state.stats.lastFeedRechargeAt,
      },
      actionState: { name: 'feed', tick: actionDurations.feed },
    }
  }),

  healPet: () =>
    set((state) => ({
      stats: {
        ...state.stats,
        mood: clampStat(state.stats.mood + 12),
      },
      actionState: { name: 'dance', tick: actionDurations.dance },
    })),

  petPet: () =>
    set((state) => ({
      stats: {
        ...state.stats,
        mood: clampStat(state.stats.mood + 5),
      },
      actionState: { name: 'pet', tick: actionDurations.pet },
    })),

  jumpToCity: () => get().setPosition({ lng: 100.529, lat: 13.746 }),
  jumpToPark: () => get().setPosition({ lng: 100.5435, lat: 13.729 }),

  setTracking: (tracking) => set({ tracking }),
}))

setInterval(() => {
  const state = useAirMochiStore.getState()
  const currentAction = state.actionState

  if (currentAction.tick > 0) {
    useAirMochiStore.setState({
      actionState: { ...currentAction, tick: currentAction.tick - 1 },
    })
  }

  let updatedStats = { ...state.stats }
const now = Date.now()

if (updatedStats.feedStock < MAX_FEED_STOCK) {
  const elapsed = now - (updatedStats.lastFeedRechargeAt || now)
  const recovered = Math.floor(elapsed / FEED_RECHARGE_MS)

  if (recovered > 0) {
    updatedStats = {
      ...updatedStats,
      feedStock: Math.min(MAX_FEED_STOCK, updatedStats.feedStock + recovered),
      lastFeedRechargeAt: (updatedStats.lastFeedRechargeAt || now) + recovered * FEED_RECHARGE_MS,
    }
  }
}

  if (state.stats.phase === 'egg' || state.stats.phase === 'dead') return

  const stats = tickStats(updatedStats, state.analysis)

  let phase = stats.phase
  if (phase !== 'dead') {
    if (stats.age > 90) phase = 'elder'
    else if (stats.age > 60) phase = 'adult'
    else if (stats.age > 25) phase = 'teen'
    else phase = 'baby'
  }

  let nextAction = null
  if (state.actionState.tick <= 0) {
    if (state.stats.food === 0) nextAction = 'hungry'
    else if (state.analysis.theme === 'bad' && stats.mood < 45) nextAction = 'panic'
    else if (stats.mood < 28) nextAction = 'sad'
    else nextAction = randomIdleAction()
  }

  useAirMochiStore.setState({
    stats: { ...updatedStats, ...stats, phase },
    ...(nextAction ? { actionState: { name: nextAction, tick: actionDurations[nextAction] } } : {}),
  })
}, 3500)