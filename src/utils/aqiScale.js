export function getAqiBand(value, zoneType = 'sensor_zone') {
  if (zoneType === 'sanctuary') {
    return {
      theme: 'sanctuary',
      mood: 'Healing',
      label: 'SANCTUARY',
      fill: '#49d7d2',
      stroke: '#9df6f3',
    }
  }

  const aqi = Number(value)
  if (!Number.isFinite(aqi)) {
    return {
      theme: 'moderate',
      mood: 'Neutral',
      label: 'UNKNOWN',
      fill: '#a3a3a3',
      stroke: '#f5f5f5',
    }
  }

  // AQICN / WAQI-style AQI bands
  if (aqi <= 50) {
    return {
      theme: 'good',
      mood: 'Happy',
      label: 'GOOD',
      fill: '#00e400',
      stroke: '#b7ffb7',
    }
  }

  if (aqi <= 100) {
    return {
      theme: 'moderate',
      mood: 'Neutral',
      label: 'MODERATE',
      fill: '#ffff00',
      stroke: '#fff7b3',
    }
  }

  if (aqi <= 150) {
    return {
      theme: 'bad',
      mood: 'Sensitive',
      label: 'UNHEALTHY FOR SENSITIVE GROUPS',
      fill: '#ff7e00',
      stroke: '#ffd0a1',
    }
  }

  if (aqi <= 200) {
    return {
      theme: 'bad',
      mood: 'Sick',
      label: 'UNHEALTHY',
      fill: '#ff0000',
      stroke: '#ff9b9b',
    }
  }

  if (aqi <= 300) {
    return {
      theme: 'bad',
      mood: 'Very Sick',
      label: 'VERY UNHEALTHY',
      fill: '#8f3f97',
      stroke: '#d9afe0',
    }
  }

  return {
    theme: 'bad',
    mood: 'Hazardous',
    label: 'HAZARDOUS',
    fill: '#7e0023',
    stroke: '#e8a7ba',
  }
}
