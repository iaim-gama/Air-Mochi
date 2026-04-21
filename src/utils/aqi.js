const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN
const IQAIR_KEY = import.meta.env.VITE_IQAIR_API_KEY
const AIR_PROVIDER = (import.meta.env.VITE_AIR_PROVIDER || '').toLowerCase()

function clampPm25(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? Math.max(0, Math.min(500, Math.round(num))) : fallback
}

function normalizeWaqiStation(station, index = 0) {
  const lat = Number(station?.lat)
  const lng = Number(station?.lon)
  const aqi = clampPm25(station?.aqi, NaN)
  const uid = station?.uid ?? station?.station?.uid ?? `waqi-${index}`
  const name = station?.station?.name || station?.name || `Station ${index + 1}`

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(aqi)) return null

  return {
    id: String(uid),
    name,
    lat,
    lng,
    pm25: aqi,
    source: 'WAQI',
  }
}

async function fetchWaqiStations(bounds) {
  if (!WAQI_TOKEN) {
    return { stations: null, provider: 'mock', note: 'Missing VITE_WAQI_TOKEN' }
  }

  const latlng = [bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng].join(',')
  const url = `https://api.waqi.info/map/bounds/?latlng=${latlng}&token=${WAQI_TOKEN}`
  const res = await fetch(url)
  const json = await res.json()

  if (json?.status !== 'ok' || !Array.isArray(json?.data)) {
    throw new Error('WAQI map bounds request failed')
  }

  const stations = json.data.map(normalizeWaqiStation).filter(Boolean)
  if (!stations.length) {
    throw new Error('WAQI returned no valid Bangkok stations')
  }

  return {
    stations,
    provider: 'waqi-live',
    note: `Loaded ${stations.length} live stations from WAQI`,
  }
}

async function fetchIqAirNearestCity(stations) {
  if (!IQAIR_KEY) {
    return { stations: null, provider: 'mock', note: 'Missing VITE_IQAIR_API_KEY' }
  }

  const updated = await Promise.all(
    stations.map(async (station) => {
      const url = `https://api.airvisual.com/v2/nearest_city?lat=${station.lat}&lon=${station.lng}&key=${IQAIR_KEY}`
      const res = await fetch(url)
      const json = await res.json()
      const pm25 = clampPm25(json?.data?.current?.pollution?.aqius, station.pm25)
      return {
        ...station,
        pm25,
        source: 'IQAir',
      }
    })
  )

  return {
    stations: updated,
    provider: 'iqair-live',
    note: `Updated ${updated.length} seeded Bangkok points from IQAir`,
  }
}

export async function fetchStationPm25(stations, bounds) {
  const preferred = AIR_PROVIDER || (WAQI_TOKEN ? 'waqi' : IQAIR_KEY ? 'iqair' : 'mock')

  try {
    if (preferred === 'waqi') {
      return await fetchWaqiStations(bounds)
    }
    if (preferred === 'iqair') {
      return await fetchIqAirNearestCity(stations)
    }
  } catch (error) {
    // try the other provider automatically if configured
    if (preferred !== 'waqi' && WAQI_TOKEN) {
      try {
        return await fetchWaqiStations(bounds)
      } catch {}
    }
    if (preferred !== 'iqair' && IQAIR_KEY) {
      try {
        return await fetchIqAirNearestCity(stations)
      } catch {}
    }
  }

  return {
    stations,
    provider: 'mock',
    note: 'Using fallback seeded Bangkok data',
  }
}
