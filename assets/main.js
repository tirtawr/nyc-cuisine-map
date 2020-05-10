COLOR_PALLETE = {
  'N/A': '#A6CEE3',
  'Chinese': '#1F78B4',
  'Caribbean': '#B2DF8A',
  'Italian': '#33A02C',
  'Jewish/Kosher': '#FB9A99',
  'Mexican': '#E31A1C',
  'Latin': '#FDBF6F',
  'Japanese': '#FF7F00',
  'Pizza': '#CAB2D6',
}

mapboxgl.accessToken = 'pk.eyJ1IjoidGlydGF3ci1tYXBib3giLCJhIjoiY2thMDdja3NnMDZnczNqcXd3bXJ5Z2x6dyJ9.x-SaMGF_GPr6G-_YGt0uYw';
var map = new mapboxgl.Map({
container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10?optimize=true',
  center: [-73.98536682128906, 40.74829735476797],
  zoom: 10
});
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({
  maxWidth: 240,
  unit: 'metric'
}));

fetch('assets/uhf-boundaries-with-popular-cuisines.geojson')
  .then(response => response.json())
  .then(boundaries => {
    fetch('assets/uhf-neighborhood-centeroids.geojson')
      .then(response => response.json())
      .then(centeroids => loadMap(map, boundaries, centeroids));
  });

function loadMap(map, boundaries, centeroids) {
  map.on('load', function () {

    var popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'bottom',
      offset: [0, -40]
    });

    for (let i = 0; i < boundaries.features.length; i++) {
      const feature = boundaries.features[i];
      const uhfId = feature.properties.uhf_neighborhood_id
      const featureId = `neighborhood-boundary-${uhfId}`

      map.addSource(featureId, {
        'type': 'geojson',
        'data': {
          type: 'FeatureCollection',
          features: [feature]
        }
      });

      const colorHex = COLOR_PALLETE[feature.properties.most_popular_cuisine];

      map.addLayer({
        'id': featureId,
        'type': 'fill',
        'source': featureId,
        'layout': {},
        'paint': {
          'fill-antialias': true,
          'fill-outline-color': '#FFFFFF',
          'fill-color': `rgba(${hexToRgb(colorHex).r}, ${hexToRgb(colorHex).g}, ${hexToRgb(colorHex).b}, .4)`
        }
      });


      map.on('mouseenter', featureId, (e) => {
        setTimeout(() => {
          map.getCanvas().style.cursor = 'pointer';
          const coordinates = getCenteroidCoordinateByUhfId(centeroids, uhfId);

          const description = e.features[0].properties.description;
          if(description && description != 'null') {
            popup
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(map);
          }
        }, 50)
        

      });

      map.on('mouseleave', featureId, (e) => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    }


    
    map.addSource('neighborhood-label', {
      'type': 'geojson',
      'data': centeroids
    });

    map.addLayer({
      'id': 'neighborhood-label',
      'type': 'symbol',
      'source': 'neighborhood-label',
      'layout': {
        'text-field': ['get', 'cuisine'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, -1],
        'text-anchor': 'top'
      },
      'paint': {
        'text-color': '#FFFFFF',
        'text-halo-color': '#090F1D',
        'text-halo-width': 1
      }
    });
    

  });
}

function getCenteroidCoordinateByUhfId(centeroids, uhfId) {
  for (let i = 0; i < centeroids.features.length; i++) {
    const feature = centeroids.features[i];
    if (feature.properties.uhf_id == uhfId) {
      return feature.geometry.coordinates
    }
  }

  return [
            -74.07600402832031,
            40.91818248731055
          ]
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

