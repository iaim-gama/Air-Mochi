import React from 'react'

const px = (x, y, c, size = 4) => (
  <rect key={`${x}-${y}-${c}`} x={x * size} y={y * size} width={size} height={size} fill={c} />
)

const palettes = {
  good: { body: '#8df0a5', dark: '#4ecf74', eye: '#07110b', accent: '#d9ffe4' },
  moderate: { body: '#ffd86f', dark: '#e4b93f', eye: '#1b1404', accent: '#fff0ae' },
  bad: { body: '#ff9c7c', dark: '#ef6d4c', eye: '#210808', accent: '#ffd1bf' },
  sanctuary: { body: '#7de9f2', dark: '#35c6cf', eye: '#071115', accent: '#d7fbff' },
}

function buildMonster(theme = 'good', sick = false) {
  const p = palettes[theme] || palettes.good
  const cells = []
  const body = [
    [4,1],[5,1],[6,1],[7,1],
    [3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
    [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],
    [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],
    [2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],
    [3,6],[4,6],[5,6],[6,6],[7,6],[8,6],
    [4,7],[5,7],[6,7],[7,7]
  ]
  body.forEach(([x,y]) => cells.push(px(x,y,p.body)))
  ;[[4,1],[7,1],[3,2],[8,2],[2,3],[9,3]].forEach(([x,y]) => cells.push(px(x,y,p.dark)))
  ;[[4,2],[5,2],[3,3],[4,3]].forEach(([x,y]) => cells.push(px(x,y,p.accent)))
  if (sick) {
    cells.push(px(4,4,p.eye), px(7,4,p.eye), px(3,5,p.eye), px(8,5,p.eye))
    ;[[3,6],[4,6],[5,6],[6,6],[7,6],[8,6]].forEach(([x,y]) => cells.push(px(x,y,'#c8c8c8')))
  } else {
    cells.push(px(4,4,p.eye), px(7,4,p.eye), px(4,5,p.eye), px(7,5,p.eye))
    ;[[4,6],[5,6],[6,6],[7,6]].forEach(([x,y]) => cells.push(px(x,y,p.eye)))
  }
  return cells
}

export default function PixelPet({ theme, phase }) {
  const sick = theme === 'bad'
  const scale = phase === 'egg' ? 0.8 : phase === 'baby' ? 0.9 : phase === 'teen' ? 1 : phase === 'adult' ? 1.04 : 1.08
  return (
    <div className="pet-center">
      <svg viewBox="0 0 48 36" width={92 * scale} height={70 * scale} className="pet-svg">
        {buildMonster(theme, sick)}
      </svg>
    </div>
  )
}
