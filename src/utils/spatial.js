import * as turf from '@turf/turf'
import { getAqiBand } from './aqiScale'

export function analyzeLocation(position, geojson) {
  const point = turf.point([position.lng, position.lat])
  const sanctuaries = geojson.features.filter((f) => f.properties.type === 'sanctuary')
  const segments = geojson.features.filter((f) => f.properties.type === 'sensor_zone')

  for (const zone of sanctuaries) {
    if (turf.booleanPointInPolygon(point, zone)) {
      const band = getAqiBand(zone.properties.pm25, zone.properties.type)
      return {
        zoneType: 'sanctuary',
        zoneName: zone.properties.name,
        pm25: zone.properties.pm25,
        mood: band.mood,
        theme: band.theme,
        aqiLabel: band.label,
      }
    }
  }

  for (const zone of segments) {
    if (turf.booleanPointInPolygon(point, zone)) {
      const pm25 = zone.properties.pm25
      const band = getAqiBand(pm25, 'sensor_zone')

      return {
        zoneType: 'sensor_zone',
        zoneName: zone.properties.rawName || zone.properties.name,
        pm25,
        mood: band.mood,
        theme: band.theme,
        aqiLabel: band.label,
        stationId: zone.properties.stationId,
        mergedCount: zone.properties.mergedCount || 1,
        mergedNames: zone.properties.mergedNames || [zone.properties.name],
      }
    }
  }

  const edgeBand = getAqiBand(40, 'sensor_zone')

  return {
    zoneType: 'outside',
    zoneName: 'Bangkok Edge',
    pm25: 40,
    mood: edgeBand.mood,
    theme: edgeBand.theme,
    aqiLabel: 'EDGE',
  }
}