import { Style, Fill, Stroke, Text } from 'ol/style'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

export function useHighlight(mapRef, regionsLayerRef) {
  let highlightLayer = null
  let highlightedFeature = null

  const getHighlightLayer = () => {
    if (!highlightLayer && mapRef.value) {
      highlightLayer = new VectorLayer({
        source: new VectorSource(),
        properties: { title: 'Выделение' },
        renderBuffer: 300,
      })
      mapRef.value.addLayer(highlightLayer)
    }
    return highlightLayer
  }

  const highlightFeature = (feature) => {
    if (!feature) return

    const name = feature.get('region') || ''

    feature.set('_hideText', true)
    feature.set('_hideFill', true)
    regionsLayerRef.value?.changed()

    const layer = getHighlightLayer()
    const clone = feature.clone()
    layer.getSource().clear()
    layer.getSource().addFeature(clone)

    const geometry = feature.getGeometry()
    if (!geometry) return

    const type = geometry.getType()

    const baseStyle = new Style({
      stroke: new Stroke({ color: '#d97706', width: 3 }),
      fill: new Fill({ color: 'rgba(245, 158, 11, 0.12)' }),
    })

    const textStyle = new Style({
      text: new Text({
        text: name,
        font: '600 14px Inter, Roboto, sans-serif',
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', width: 2 }),
        overflow: true,
      }),
    })

    if (type === 'Polygon') {
      textStyle.setGeometry(geometry.getInteriorPoint())
    } else if (type === 'MultiPolygon') {
      const polygons = geometry.getPolygons()
      let largest = null
      let maxArea = 0
      polygons.forEach((p) => {
        const area = p.getArea()
        if (area > maxArea) {
          maxArea = area
          largest = p
        }
      })
      if (largest) textStyle.setGeometry(largest.getInteriorPoint())
    }

    layer.setStyle([baseStyle, textStyle])
    highlightedFeature = feature
  }

  const clearHighlight = () => {
    highlightLayer?.getSource().clear()
    if (highlightedFeature) {
      highlightedFeature.set('_hideText', false)
      highlightedFeature.set('_hideFill', false)
      highlightedFeature = null
      regionsLayerRef.value?.changed()
    }
  }

  return { highlightFeature, clearHighlight }
}
