import { Style, Fill, Stroke, Text } from 'ol/style'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

export function useHighlight(mapRef, regionsLayerRef) {
  let highlightLayer = null
  let highlightedFeature = null

  function initHighlightLayer() {
    if (!highlightLayer && mapRef.value) {
      highlightLayer = new VectorLayer({
        source: new VectorSource(),
        style: null,
        properties: { title: 'Выделение' },
        renderBuffer: 300,
      })
      mapRef.value.addLayer(highlightLayer)
    }
  }

  function highlightFeature(feature) {
    if (!feature) return

    const name = feature.get('region') || ''

    feature.set('_hideText', true)
    feature.set('_hideFill', true)

    if (regionsLayerRef.value) {
      regionsLayerRef.value.changed()
    }

    initHighlightLayer()

    const clone = feature.clone()
    highlightLayer.getSource().clear()
    highlightLayer.getSource().addFeature(clone)

    const geometry = feature.getGeometry()
    if (!geometry) return

    const geometryType = geometry.getType()

    const baseHighlightStyle = new Style({
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

    if (geometryType === 'Polygon') {
      textStyle.setGeometry(geometry.getInteriorPoint())
    }

    if (geometryType === 'MultiPolygon') {
      const polygons = geometry.getPolygons()
      let largestPolygon = null
      let largestArea = 0

      polygons.forEach((polygon) => {
        const area = polygon.getArea()
        if (area > largestArea) {
          largestArea = area
          largestPolygon = polygon
        }
      })

      if (largestPolygon) {
        textStyle.setGeometry(largestPolygon.getInteriorPoint())
      }
    }

    highlightLayer.setStyle([baseHighlightStyle, textStyle])
    highlightedFeature = feature
  }

  function clearHighlight() {
    if (highlightLayer) {
      highlightLayer.getSource().clear()
    }
    if (highlightedFeature) {
      highlightedFeature.set('_hideText', false)
      highlightedFeature.set('_hideFill', false)
      highlightedFeature = null
      if (regionsLayerRef.value) {
        regionsLayerRef.value.changed()
      }
    }
  }

  return {
    highlightFeature,
    clearHighlight,
  }
}
