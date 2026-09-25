export const CARD_WIDTH = 280
export const CARD_HEIGHT = 200
export const CARD_TITLE_HEIGHT = 32
export const CARD_MIN_WIDTH = 160
export const CARD_MIN_HEIGHT = 120
export const CARD_CANVAS_WIDTH = 2400
export const CARD_CANVAS_HEIGHT = 1600
export const CARD_ZOOM_MIN = 0.4
export const CARD_ZOOM_MAX = 2
export const CARD_ZOOM_STEP = 0.1

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

export const boxesOverlap = (a: CardBox, b: CardBox) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

export const normalizeRect = (x1: number, y1: number, x2: number, y2: number): CardBox => {
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  return { x, y, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }
}

export const clampZoom = (value: number) =>
  Math.min(CARD_ZOOM_MAX, Math.max(CARD_ZOOM_MIN, Math.round(value * 100) / 100))

export const SLOT_TITLE_HEIGHT = 28
export const SLOT_TEXT_MIN = 96
export const SLOT_PAD = 12
export const SLOT_GAP = 12
export const SLOT_MIN_WIDTH = 220
export const SLOT_MIN_HEIGHT = 180
export const LABEL_WIDTH = 160

export type SlotFrame = { id: number; x: number; y: number; width: number; height: number }

export const clampSlotBox = (box: CardBox): CardBox => {
  const width = Math.min(Math.max(SLOT_MIN_WIDTH, box.width), CARD_CANVAS_WIDTH)
  const height = Math.min(Math.max(SLOT_MIN_HEIGHT, box.height), CARD_CANVAS_HEIGHT)
  const pos = clampCardPos(box.x, box.y, width, height)
  return { x: pos.x, y: pos.y, width, height }
}

export const cardCenter = (chapter: {
  pos?: { x: number; y: number }
  size?: { width: number; height: number }
  collapsed?: boolean
}) => {
  const box = cardBox(chapter)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export const nearestSlotAtCenter = <T extends SlotFrame>(
  slots: T[],
  center: { x: number; y: number },
): T | null => {
  let best: T | null = null
  let bestDist = Infinity
  for (const slot of slots) {
    if (!pointInBox(center.x, center.y, slot)) continue
    const dx = center.x - (slot.x + slot.width / 2)
    const dy = center.y - (slot.y + slot.height / 2)
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      best = slot
      bestDist = dist
    }
  }
  return best
}

export const slotWrapSize = (
  slot: { width: number; height: number },
  cards: { width: number; height: number }[],
) => {
  const cardsWidth = cards.reduce((max, card) => Math.max(max, card.width), 0)
  let cardsHeight = 0
  cards.forEach((card, index) => {
    if (index > 0) cardsHeight += SLOT_GAP
    cardsHeight += card.height
  })
  const stack = cards.length ? SLOT_PAD + cardsHeight + SLOT_PAD : SLOT_PAD
  const minWidth = Math.max(SLOT_MIN_WIDTH, cardsWidth + SLOT_PAD * 2)
  const minHeight = Math.max(SLOT_MIN_HEIGHT, SLOT_TEXT_MIN + stack)
  const width = Math.max(slot.width, minWidth)
  const height = Math.max(slot.height, minHeight)
  return { width, height, textHeight: height - stack }
}

export const gridInSlot = (
  slot: { x: number; y: number; width: number },
  cards: { id: number; width: number; height: number; x: number; y: number }[],
  textHeight: number,
) => {
  const innerRight = slot.x + slot.width - SLOT_PAD
  let x = slot.x + SLOT_PAD
  let y = slot.y + textHeight + SLOT_PAD
  let rowHeight = 0
  return cards.map((card) => {
    if (x > slot.x + SLOT_PAD && x + card.width > innerRight) {
      x = slot.x + SLOT_PAD
      y += rowHeight + SLOT_GAP
      rowHeight = 0
    }
    const pos = { id: card.id, x, y }
    x += card.width + SLOT_GAP
    rowHeight = Math.max(rowHeight, card.height)
    return pos
  })
}
