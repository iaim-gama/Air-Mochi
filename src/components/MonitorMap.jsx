import React, { useMemo, useRef, useState } from 'react'
import { useAirMochiStore } from '../store/useAirMochiStore'
import { BANGKOK_BOUNDS } from '../data/bangkokData'
import { clampToBangkok } from '../utils/geo'
import { bangkokBoundary } from '../data/bangkokBoundary'
import PetCanvas from './PetCanvas'
import { getAqiBand } from '../utils/aqiScale'

const VIEW_ZOOM = 18
const BASE_ZOOM = 12
const VIEW_SCALE = Math.pow(1.5, VIEW_ZOOM - BASE_ZOOM)

function project([lng, lat], center) {
  const w = (BANGKOK_BOUNDS.maxLng - BANGKOK_BOUNDS.minLng) / VIEW_SCALE
  const h = (BANGKOK_BOUNDS.maxLat - BANGKOK_BOUNDS.minLat) / VIEW_SCALE
  const x = ((lng - center.lng) / w) * 100 + 50
  const y = 50 - ((lat - center.lat) / h) * 100
  return [x, y]
}

function geometryToPointStrings(geometry, center) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ring.map((coord) => project(coord, center).join(',')).join(' '))
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((poly) => poly.map((ring) => ring.map((coord) => project(coord, center).join(',')).join(' ')))
  }
  return []
}

function colorFor(feature) {
  const band = getAqiBand(feature.properties.pm25, feature.properties.type)
  return { fill: band.fill, stroke: band.stroke, label: band.label }
}

function nudgePositionFromPixels(position, dxPx, dyPx, widthPx, heightPx) {
  const lngRange = (BANGKOK_BOUNDS.maxLng - BANGKOK_BOUNDS.minLng) / VIEW_SCALE
  const latRange = (BANGKOK_BOUNDS.maxLat - BANGKOK_BOUNDS.minLat) / VIEW_SCALE
  const DRAG_SENSITIVITY = 0.55

return {
  lng: position.lng + (dxPx / widthPx) * lngRange * DRAG_SENSITIVITY,
  lat: position.lat - (dyPx / heightPx) * latRange * DRAG_SENSITIVITY,
}
}

function pointStringArea(pointsString) {
  const pts = pointsString.split(' ').map((pair) => pair.split(',').map(Number)).filter((p) => p.length === 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1]))
  if (pts.length < 3) return 0
  let area = 0
  for (let i = 0; i < pts.length; i += 1) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

export default function MonitorMap() {
  const { geojson, stations, position, analysis, stats, actionState, petPet, setPosition, tracking } = useAirMochiStore()
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const polygons = useMemo(() => geojson.features.flatMap((feature, index) => {
    const pointStrings = geometryToPointStrings(feature.geometry, position)
    const colors = colorFor(feature)
    return pointStrings.map((points, subIndex) => ({
      id: `${feature.properties.stationId || feature.properties.name}-${index}-${subIndex}`,
      points,
      ...colors,
      feature,
      type: feature.properties.type,
      active: feature.properties.stationId && feature.properties.stationId === analysis.stationId,
      area: pointStringArea(points),
    }))
  }), [geojson, position, analysis.stationId])

  const sanctuaryPolygons = polygons.filter((poly) => poly.type === 'sanctuary')
  const stationPolygons = polygons.filter((poly) => poly.type !== 'sanctuary')
  const activeSanctuaryPolys = sanctuaryPolygons.filter((poly) => poly.feature.properties.name === analysis.zoneName)

  const boundaryPaths = useMemo(() => geometryToPointStrings(bangkokBoundary.geometry, position), [position])

  const stationDots = useMemo(() =>
    stations.map((station) => {
      const [cx, cy] = project([station.lng, station.lat], position)
      const active = analysis.stationId === station.id
      const band = getAqiBand(station.pm25, 'sensor_zone')
      return { ...station, cx, cy, active, band }
    }),
    [stations, position, analysis.stationId])

  const activeBand = getAqiBand(analysis.pm25, analysis.zoneType)
  const activePolys = polygons.filter((p) => p.active)
  const activePolyArea = activePolys.reduce((sum, p) => sum + p.area, 0)
  const activeStation = stationDots.find((station) => station.active)
  const needsActiveFallback = analysis.zoneType === 'sensor_zone' && activeStation && activePolyArea < 10

  const handlePointerDown = (event) => {
    if (tracking) return
    const bounds = stageRef.current?.getBoundingClientRect()
    if (!bounds) return
    dragRef.current = { x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height }
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || tracking) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    if (dx === 0 && dy === 0) return

    const rawNext = nudgePositionFromPixels(
  useAirMochiStore.getState().position,
  dx,
  dy,
  dragRef.current.width,
  dragRef.current.height
)

const next = clampToBangkok(rawNext)
setPosition(next)
    dragRef.current.x = event.clientX
    dragRef.current.y = event.clientY
  }

  const endDrag = (event) => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    event.currentTarget?.releasePointerCapture?.(event.pointerId)
  }

  return (
    <div className="map-stage" ref={stageRef}>
      <div className={`map-theme map-theme-${analysis.theme}`} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="map-svg">        <rect x="0" y="0" width="100" height="100" fill="#090915" />
        {Array.from({ length: 8 }).map((_, i) => <line key={`h-${i}`} x1="0" x2="100" y1={i * 14} y2={i * 14} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />)}
        {Array.from({ length: 8 }).map((_, i) => <line key={`v-${i}`} y1="0" y2="100" x1={i * 14} x2={i * 14} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />)}
        {boundaryPaths.map((points, index) => (
          <polygon key={`boundary-${index}`} points={points} fill="rgba(124,126,255,0.05)" stroke="rgba(180,182,255,0.22)" strokeWidth="0.8" />
        ))}
        {stationPolygons.map((poly) => (
          <polygon key={poly.id} points={poly.points} fill={poly.fill} stroke={poly.stroke} strokeWidth={poly.active ? '0.9' : '0.45'} opacity={poly.active ? 0.9 : 0.68} />
        ))}
        {sanctuaryPolygons.map((poly) => (
          <g key={poly.id}>
            <polygon points={poly.points} fill={poly.fill} stroke={poly.stroke} strokeWidth="1.1" opacity={analysis.zoneType === 'sanctuary' && poly.feature.properties.name === analysis.zoneName ? 0.92 : 0.78} />
            <polygon points={poly.points} fill="none" stroke="rgba(178,255,245,0.55)" strokeWidth="2.2" opacity="0.32" />
          </g>
        ))}
        {activePolys.map((poly) => (
          <polygon key={`active-${poly.id}`} points={poly.points} fill={activeBand.fill} fillOpacity={0.22} stroke="#ffffff" strokeWidth="1.15" opacity="0.95" />
        ))}
        {activeSanctuaryPolys.map((poly) => (
          <polygon key={`active-sanctuary-${poly.id}`} points={poly.points} fill="rgba(170,255,246,0.18)" stroke="#ecfeff" strokeWidth="1.45" opacity="1" />
        ))}
        {needsActiveFallback && (
          <g>
            <circle cx={activeStation.cx} cy={activeStation.cy} r="6.5" fill={activeBand.fill} opacity="0.28" />
            <circle cx={activeStation.cx} cy={activeStation.cy} r="4.8" fill="none" stroke={activeBand.stroke} strokeWidth="1.1" opacity="0.9" />
          </g>
        )}
        {stationDots.map((station) => (
          <g key={station.id || station.name} opacity={station.active ? '0.95' : '0.55'}>
            {station.active && <circle cx={station.cx} cy={station.cy} r="2.8" fill={station.band.fill} opacity="0.52" />}
            <circle cx={station.cx} cy={station.cy} r={station.active ? '1.5' : '0.8'} fill={station.active ? station.band.fill : 'rgba(247,247,255,0.45)'} stroke={station.active ? '#ffffff' : 'none'} strokeWidth="0.35" />
            <circle cx={station.cx} cy={station.cy} r={station.active ? '2.2' : '1.2'} fill="none" stroke={station.active ? station.band.stroke : 'rgba(255,255,255,0.12)'} strokeWidth={station.active ? '0.6' : '0.25'} />
          </g>
        ))}
        <g transform="translate(50,44)">
  <ellipse cx="0" cy="5" rx="2.5" ry="1.2" fill="rgba(99,103,255,0.22)" />
  <path
    d="M0,-4 C2,-4 3,-2 3,0 C3,2 0,6 0,6 C0,6 -3,2 -3,0 C-3,-2 -2,-4 0,-4 Z"
    fill="#6367FF"
  />
  <circle cx="0" cy="0" r="1.2" fill="#FFDBFD" />
</g>
      </svg>
      <div
        className={`pet-drag-pad ${tracking ? 'is-tracking' : 'is-draggable'} ${dragging ? 'is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className={`pet-stage ${tracking ? 'is-tracking' : 'is-draggable'} ${dragging ? 'is-dragging' : ''}`}>
          <PetCanvas
            theme={analysis.theme}
            stats={stats}
            variant={stats.variant}
            actionState={actionState}
            onPet={petPet}
          />
        </div>
      </div>
      <div className="map-hint">{tracking ? 'LIVE TRACKING ON' : 'DRAG PET TO MOVE'}</div>
      <div className="zone-chip">
        {analysis.zoneName} · AQI {analysis.pm25}
        {analysis.mergedCount > 1 ? ` · AVG OF ${analysis.mergedCount}` : ''}
      </div>
      {analysis.mergedCount > 1 && <div className="zone-subchip">Merged same-coordinate area uses average AQI</div>}
    </div>
  )
}
