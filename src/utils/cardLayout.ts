export const CARD_WIDTH = 280
export const CARD_HEIGHT = 200
export const CARD_TITLE_HEIGHT = 32
export const CARD_MIN_WIDTH = 160
export const CARD_MIN_HEIGHT = 120
export const CARD_CANVAS_WIDTH = 2400
export const CARD_CANVAS_HEIGHT = 1600

export const defaultCardPos = (index: number) => ({
  x: 40 + (index % 20) * 24,
  y: 40 + (index % 20) * 24,
})

export const defaultCardSize = () => ({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
})

export const clampCardSize = (
  width: number,
  height: number,
  pos: { x: number; y: number } = { x: 0, y: 0 },
) => {
  const maxW = CARD_CANVAS_WIDTH - Math.max(0, pos.x)
  const maxH = CARD_CANVAS_HEIGHT - Math.max(0, pos.y)
  return {
    width: Math.min(Math.max(CARD_MIN_WIDTH, width), maxW),
    height: Math.min(Math.max(CARD_MIN_HEIGHT, height), maxH),
  }
}

export const clampCardPos = (
  x: number,
  y: number,
  width = CARD_WIDTH,
  height = CARD_HEIGHT,
) => ({
  x: Math.min(Math.max(0, x), CARD_CANVAS_WIDTH - width),
  y: Math.min(Math.max(0, y), CARD_CANVAS_HEIGHT - height),
})

export type CardBox = { x: number; y: number; width: number; height: number }

export const cardBox = (chapter: {
  pos?: { x: number; y: number }
  size?: { width: number; height: number }
  collapsed?: boolean
}): CardBox => {
  const pos = chapter.pos ?? { x: 0, y: 0 }
  const size = chapter.size ?? defaultCardSize()
  return {
    x: pos.x,
    y: pos.y,
    width: size.width,
    height: chapter.collapsed ? CARD_TITLE_HEIGHT : size.height,
  }
}

export const boxCenter = (box: CardBox) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
})

export const boxAnchorToward = (from: CardBox, toward: CardBox) => {
  const a = boxCenter(from)
  const b = boxCenter(toward)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return a
  const hw = from.width / 2
  const hh = from.height / 2
  const sx = dx === 0 ? Infinity : hw / Math.abs(dx)
  const sy = dy === 0 ? Infinity : hh / Math.abs(dy)
  const t = Math.min(sx, sy)
  return { x: a.x + dx * t, y: a.y + dy * t }
}

export const pointInBox = (x: number, y: number, box: CardBox) =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
