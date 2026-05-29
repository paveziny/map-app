/**
 * Линейная интерполяция от красного к зелёному
 * @param {number} value - текущее значение
 * @param {number} min   - минимум выборки
 * @param {number} max   - максимум выборки
 * @returns {string} цвет в формате rgba
 */
export function getColorByValue(value, min, max) {
  if (max === min) return 'rgba(255, 200, 0, 0.6)'
  // clamp: не выходим за пределы 0..1
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const r = Math.round(255 * (1 - ratio))
  const g = Math.round(200 * ratio)
  return `rgba(${r}, ${g}, 50, 0.6)`
}
