import * as turf from '@turf/turf'
import { BANGKOK_BOUNDS, sanctuaryZones } from '../data/bangkokData.js'
import { bangkokBoundary } from '../data/bangkokBoundary.js'

function coordKey(station) {
  return `${Number(station.lat).toFixed(6)},${Number(station.lng).toFixed(6)}`
}

export function mergeExactCoordinateStations(stations) {
  const groups = new Map()
  stations.forEach((station) => {
    const key = coordKey(station)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(station)
  })

  return Array.from(groups.values()).map((group) => {
    if (group.length === 1) return { ...group[0], mergedCount: 1, mergedNames: [group[0].name] }
    const avg = group.reduce((sum, s) => sum + Number(s.pm25 || 0), 0) / group.length
    const first = group[0]
    return {
      ...first,
      id: `merged-${coordKey(first).replace(/[^0-9]/g, '')}`,
      name: group.length === 2 ? `${first.name} +1 more` : `${first.name} +${group.length - 1} more`,
      pm25: Math.round(avg),
      mergedCount: group.length,
      mergedNames: group.map((s) => s.name),
      mergedIds: group.map((s) => s.id),
    }
  })
}

export function spreadDuplicateStations(stations) {
  const groups = new Map()
  stations.forEach((station) => {
    const key = coordKey(station)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(station)
  })

  const spread = []
  groups.forEach((group) => {
    const sorted = [...group].sort((a, b) => String(a.id || a.name).localeCompare(String(b.id || b.name)))
    if (sorted.length === 1) {
      const station = sorted[0]
      spread.push({ ...station, displayLat: station.lat, displayLng: station.lng })
      return
    }

    sorted.forEach((station, index) => {
      const ringIndex = Math.floor(index / 8)
      const indexInRing = index % 8
      const countInRing = Math.min(8, sorted.length - ringIndex * 8)
      const angle = (Math.PI * 2 * indexInRing) / countInRing
      const radius = 0.0012 + ringIndex * 0.0009
      const latScale = radius
      const lngScale = radius / Math.max(0.25, Math.cos((station.lat * Math.PI) / 180))
      spread.push({
        ...station,
        displayLat: station.lat + Math.sin(angle) * latScale,
        displayLng: station.lng + Math.cos(angle) * lngScale,
        originalLat: station.lat,
        originalLng: station.lng,
      })
    })
  })

  return spread
}

export function normalizeRenderableFeature(feature) {
  if (!feature || !feature.geometry) return null
  const { geometry, properties } = feature

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return feature
  }

  if (geometry.type === 'GeometryCollection') {
    const polys = geometry.geometries.filter((g) => g.type === 'Polygon' || g.type === 'MultiPolygon')
    if (!polys.length) return null
    const coords = []
    polys.forEach((g) => {
      if (g.type === 'Polygon') coords.push(g.coordinates)
      else coords.push(...g.coordinates)
    })
    return turf.multiPolygon(coords, properties)
  }

  return null
}

export function buildBangkokSegments(stations) {
  const mergedStations = mergeExactCoordinateStations(stations)
  const points = turf.featureCollection(
    mergedStations.map((station) =>
      turf.point([station.lng, station.lat], {
        type: 'sensor_zone',
        stationId: station.id,
        name: station.name,
        rawName: station.mergedNames?.[0] || station.name,
        pm25: station.pm25,
        mergedCount: station.mergedCount || 1,
        mergedNames: station.mergedNames || [station.name],
        originalLat: station.lat,
        originalLng: station.lng,
      })
    )
  )

  const bbox = [
    BANGKOK_BOUNDS.minLng,
    BANGKOK_BOUNDS.minLat,
    BANGKOK_BOUNDS.maxLng,
    BANGKOK_BOUNDS.maxLat,
  ]

  const voronoi = turf.voronoi(points, { bbox })

  const cells = (voronoi?.features || []).map((cell) => {
    const centroid = turf.centroid(cell)
    const nearest = turf.nearestPoint(centroid, points)
    const rawClipped = turf.intersect(turf.featureCollection([bangkokBoundary, cell]))
    const clipped = normalizeRenderableFeature(rawClipped)
    if (!clipped) return null

    return {
      ...clipped,
      properties: {
        ...nearest.properties,
      },
    }
  }).filter(Boolean)

  return turf.featureCollection([...cells, ...sanctuaryZones])
}

export function clampToBangkok(position) {
  const bboxClamped = {
    lng: Math.min(BANGKOK_BOUNDS.maxLng, Math.max(BANGKOK_BOUNDS.minLng, position.lng)),
    lat: Math.min(BANGKOK_BOUNDS.maxLat, Math.max(BANGKOK_BOUNDS.minLat, position.lat)),
  }
  const point = turf.point([bboxClamped.lng, bboxClamped.lat])
  if (turf.booleanPointInPolygon(point, bangkokBoundary)) return bboxClamped

  const center = turf.centerOfMass(bangkokBoundary).geometry.coordinates
  let candidate = [...center]
  const start = [bboxClamped.lng, bboxClamped.lat]
  for (let i = 1; i <= 40; i += 1) {
    const t = i / 40
    candidate = [
      start[0] + (center[0] - start[0]) * t,
      start[1] + (center[1] - start[1]) * t,
    ]
    if (turf.booleanPointInPolygon(turf.point(candidate), bangkokBoundary)) {
      return { lng: candidate[0], lat: candidate[1] }
    }
  }

  return { lng: center[0], lat: center[1] }
}
