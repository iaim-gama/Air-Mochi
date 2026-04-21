import React, { useEffect, useMemo, useRef } from 'react'

const S = 4
const WIDTH = 140
const HEIGHT = 140

function hsl(h, s, l) {
  return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function getColors(theme, mask) {
  const palette = {
    good: { hue: 145, sick: false, crit: false },
    moderate: { hue: 55, sick: false, crit: false },
    bad: { hue: 12, sick: true, crit: false },
    sanctuary: { hue: 185, sick: false, crit: false },
  }[theme] || { hue: 145, sick: false, crit: false }

  const s = palette.sick ? 0.35 : 0.75
  const l = palette.crit ? 0.28 : 0.46

  return {
    b: hsl(palette.hue, s, l),
    bL: hsl(palette.hue, s, l + 0.15),
    bD: hsl(palette.hue, s, l - 0.12),
    ck: hsl(palette.hue, s, l + 0.22),
    ey: '#060610',
    sh: 'rgba(255,255,255,.65)',
    mk: '#b8b8b8',
    mkL: '#d8d8d8',
    mkD: '#888',
    mask,
  }
}

function drawEgg(ctx, frame) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S) }
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }
  const b = frame % 60 < 30 ? 0 : 1
  const ox = frame % 80 < 15 ? -1 : frame % 80 > 65 ? 1 : 0
  pr(5 + ox, 14, 7, 1, 'rgba(0,0,0,.2)')
  const eC = hsl(220, 0.4, 0.76)
  const eCL = hsl(220, 0.3, 0.9)
  pr(4 + ox, 3 + b, 8, 11, eC)
  pr(3 + ox, 5 + b, 10, 8, eC)
  pr(5 + ox, 2 + b, 6, 1, eCL)
  pr(3 + ox, 4 + b, 1, 2, eCL)
  pr(12 + ox, 4 + b, 1, 2, eCL)
  pr(5 + ox, 3 + b, 2, 3, eCL)
  px(4 + ox, 4 + b, eCL)
  if (frame > 40) {
    px(7 + ox, 8 + b, '#223')
    px(8 + ox, 7 + b, '#223')
    px(9 + ox, 9 + b, '#223')
  }
  if (frame > 80) {
    px(5 + ox, 9 + b, '#223')
    px(6 + ox, 10 + b, '#223')
    px(7 + ox, 11 + b, '#223')
  }
}

function drawDead(ctx, frame) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S) }
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }
  const gy = Math.min(14, frame * 0.18)
  const g = Math.floor(gy)
  const gc = hsl(0, 0.05, 0.7)
  pr(4, 2 - g, 8, 10, gc)
  pr(3, 4 - g, 10, 7, gc)
  pr(5, 1 - g, 6, 2, gc)
  pr(3, 11 - g, 2, 2, gc)
  pr(7, 12 - g, 2, 2, gc)
  pr(11, 11 - g, 2, 2, gc)
  ;[[5, 5 - g], [6, 6 - g], [5, 6 - g], [6, 5 - g], [9, 5 - g], [10, 6 - g], [9, 6 - g], [10, 5 - g]].forEach(([x, y]) => px(x, y, '#334'))
  pr(5, 11, 6, 3, hsl(0, 0, 0.38))
  pr(4, 10, 8, 2, hsl(0, 0, 0.44))
  pr(7, 9, 2, 2, hsl(0, 0, 0.44))
}

function drawFace(ctx, eyeMode, colors) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S) }
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }

  if (eyeMode === 'sleep') {
    pr(5, 6, 2, 1, colors.ey)
    pr(9, 6, 2, 1, colors.ey)
    pr(6, 9, 4, 1, colors.ey)
    return
  }

  if (eyeMode === 'sad') {
    px(5, 6, colors.ey)
    px(6, 7, colors.ey)
    px(9, 7, colors.ey)
    px(10, 6, colors.ey)
    pr(6, 10, 4, 1, colors.ey)
    return
  }

  if (eyeMode === 'look') {
    pr(5, 6, 1, 2, colors.ey)
    pr(10, 6, 1, 2, colors.ey)
    pr(6, 9, 4, 1, colors.ey)
    return
  }

  pr(5, 6, 1, 2, colors.ey)
  pr(10, 6, 1, 2, colors.ey)
  pr(6, 9, 4, 1, colors.ey)
}

function drawVariantRound(ctx, colors, eyeMode, b) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S) }
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }

  pr(4, 4 + b, 8, 8, colors.b)
  pr(3, 5 + b, 10, 6, colors.b)
  pr(5, 3 + b, 6, 1, colors.bL)
  pr(4, 4 + b, 2, 2, colors.sh)
  pr(3, 11 + b, 2, 2, colors.bD)
  pr(11, 11 + b, 2, 2, colors.bD)

  drawFace(ctx, eyeMode, colors)

  if (colors.mask) {
    pr(3, 9 + b, 10, 3, colors.mk)
    pr(3, 9 + b, 10, 1, colors.mkL)
    pr(3, 11 + b, 10, 1, colors.mkD)
  }
}

function drawVariantCat(ctx, colors, eyeMode, b) {
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }

  pr(4, 5 + b, 8, 7, colors.b)
  pr(3, 6 + b, 10, 5, colors.b)
  pr(4, 3 + b, 2, 2, colors.b)
  pr(10, 3 + b, 2, 2, colors.b)
  pr(5, 4 + b, 1, 1, colors.bL)
  pr(10, 4 + b, 1, 1, colors.bL)
  pr(5, 3 + b, 1, 1, colors.sh)
  pr(10, 3 + b, 1, 1, colors.sh)
  pr(4, 11 + b, 2, 2, colors.bD)
  pr(10, 11 + b, 2, 2, colors.bD)

  drawFace(ctx, eyeMode, colors)

  if (colors.mask) {
    pr(3, 9 + b, 10, 3, colors.mk)
    pr(3, 9 + b, 10, 1, colors.mkL)
    pr(3, 11 + b, 10, 1, colors.mkD)
  }
}

function drawVariantBlob(ctx, colors, eyeMode, b) {
  const pr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S) }

  pr(5, 3 + b, 6, 1, colors.bL)
  pr(4, 4 + b, 8, 1, colors.b)
  pr(3, 5 + b, 10, 6, colors.b)
  pr(4, 11 + b, 8, 1, colors.bD)
  pr(5, 12 + b, 1, 1, colors.bD)
  pr(10, 12 + b, 1, 1, colors.bD)
  pr(4, 5 + b, 2, 2, colors.sh)

  drawFace(ctx, eyeMode, colors)

  if (colors.mask) {
    pr(3, 9 + b, 10, 3, colors.mk)
    pr(3, 9 + b, 10, 1, colors.mkL)
    pr(3, 11 + b, 10, 1, colors.mkD)
  }
}

function drawMonster(ctx, frame, colors, opts = {}) {
  const {
    action = 'idle',
    actionTick = 0,
    phase = 'baby',
    fedPulse = 0,
    moodPulse = 0,
    variant = 'round',
  } = opts

  if (phase === 'egg') {
    drawEgg(ctx, frame)
    return
  }

  if (phase === 'dead') {
    drawDead(ctx, frame)
    return
  }

  const b = Math.sin(frame / 6) > 0 ? 1 : 0
  const scale = phase === 'baby' ? 0.84 : phase === 'teen' ? 0.94 : phase === 'adult' ? 1 : 1.04

  const t = frame / 420
  let dx = 0
  let dy = 0
  let rot = 0
  let squishX = 1
  let squishY = 1
  let eyeMode = 'normal'
  let hearts = false
  let notes = false
  let sweat = false

  if (action === 'sleep') {
    dy = 2
    squishY = 0.9
    eyeMode = 'sleep'
  } else if (action === 'look') {
    dx = t < 0.33 ? -2 : t < 0.66 ? 2 : 0
    eyeMode = 'look'
  } else if (action === 'bounce') {
    dy = -Math.abs(Math.sin(t * Math.PI * 4) * 3)
  } else if (action === 'hungry') {
    dx = Math.sin(t * Math.PI * 8) * 2
    eyeMode = 'sad'
    sweat = true
  } else if (action === 'sad') {
    dy = 1
    eyeMode = 'sad'
    squishY = 0.93
  } else if (action === 'dance') {
    dy = -Math.abs(Math.sin(t * Math.PI * 6) * 3)
    rot = Math.sin(t * Math.PI * 6) * 0.15
    notes = true
  }else if (action === 'panic') {
  dx = Math.sin(t * Math.PI * 4) * 2.5   // slower horizontal sway
dy = Math.sin(t * Math.PI * 2) * 1.5   // gentle vertical movement
rot = Math.sin(t * Math.PI * 3) * 0.1 // small tilt only

squishX = 1 + Math.sin(t * 2) * 0.08
squishY = 1 - Math.sin(t * 2) * 0.06
  eyeMode = 'sad'
  sweat = true
} else if (action === 'wave') {
    dy = Math.sin(t * Math.PI * 3) * -2
    rot = Math.sin(t * Math.PI * 6) * 0.2
  } else if (action === 'jump') {
    dy = -(Math.sin(t * Math.PI) * 9)
    if (t > 0.88) squishY = 0.82
  } else if (action === 'wiggle') {
    squishX = 1 + Math.sin(t * Math.PI * 8) * 0.18
    squishY = 1 - Math.sin(t * Math.PI * 8) * 0.12
  } else if (action === 'pet') {
    hearts = true
    dy = -Math.abs(Math.sin(t * Math.PI * 2) * 2)
  } else if (action === 'feed') {
    hearts = fedPulse > 0
  }

  ctx.save()
  const centerX = WIDTH / 2
  const centerY = HEIGHT / 2 + 4
  ctx.translate(centerX, centerY)
  ctx.scale(scale * squishX, scale * squishY)
  ctx.rotate(rot)
  ctx.translate(-48 + dx * S, -52 + dy * S)

  ctx.fillStyle = 'rgba(0,0,0,.2)'
  ctx.fillRect(3 * S, (14 + b) * S, 10 * S, 1 * S)

  if (variant === 'cat') {
    drawVariantCat(ctx, colors, eyeMode, b)
  } else if (variant === 'blob') {
    drawVariantBlob(ctx, colors, eyeMode, b)
  } else {
    drawVariantRound(ctx, colors, eyeMode, b)
  }

  ctx.restore()

  if (hearts || moodPulse > 0) {
    ctx.save()
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#ffd6ea'
    ctx.font = `${S * 3}px serif`
    ctx.fillText('♥', 24, 34 - (frame % 6))
    ctx.fillText('♥', 92, 28 - ((frame + 2) % 6))
    ctx.restore()
  }

  if (fedPulse > 0) {
    ctx.save()
    ctx.globalAlpha = 0.95
    ctx.font = `${S * 3}px serif`
    ctx.fillText('🍃', 10, 26 + (frame % 4))
    ctx.restore()
  }

  if (notes) {
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#c3c4ff'
    ctx.font = `${S * 2.2}px serif`
    ctx.fillText('♪', 16, 24)
    ctx.fillText('♫', 98, 20)
    ctx.restore()
  }

  if (sweat) {
    ctx.save()
    ctx.globalAlpha = 0.8
    ctx.fillStyle = '#65a7ff'
    ctx.fillRect(94, 30, 4, 6)
    ctx.restore()
  }
}

export default function PetCanvas({ theme, stats, variant = 'round', actionState, onPet }) {
  const ref = useRef(null)

  const mask = theme === 'bad'
  const colors = useMemo(() => getColors(theme, mask), [theme, mask])

  useEffect(() => {
    let raf = 0
    let frame = 0

    const loop = () => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, WIDTH, HEIGHT)

      drawMonster(ctx, frame, colors, {
        action: actionState.name,
        actionTick: actionState.tick,
        phase: stats.phase,
        variant,
        fedPulse: actionState.name === 'feed' ? actionState.tick : 0,
        moodPulse: actionState.name === 'pet' ? actionState.tick : 0,
      })

      frame += 1
      raf = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(raf)
  }, [colors, stats.phase, variant, actionState])

  return (
    <button className="pet-center pet-button" onClick={onPet} aria-label="Pet Air Mochi">
      <canvas ref={ref} width={WIDTH} height={HEIGHT} className="pet-canvas" />
    </button>
  )
}