export function getColorByValue(value, min, max) {
  if (max === min) return 'rgba(255, 200, 0, 0.6)'

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const r = Math.round(255 * (1 - ratio))
  const g = Math.round(200 * ratio)
  return `rgba(${r}, ${g}, 50, 0.6)`
}
