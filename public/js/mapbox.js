

export function displayMap (locations) {
    mapboxgl.accessToken = 'pk.eyJ1IjoicHN5Y2hlc3MiLCJhIjoiY2tzaDUzdmJpMXFxeDJub2R0a3M1Mnd6biJ9.gTUOrFnxxRXJ9NLslEyIqg';

    var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/psychess/ckshek1554i4517nuz1i07omb',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    
    locations.forEach(loc => {
        //Create marker
        const el = document.createElement('div');
        el.className = 'marker'
        //Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        //Add popup
    
    
        new mapboxgl.Popup({ offset: 30}).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);
        //Extends map bounds to include current location
        bounds.extend(loc.coordinates)
    })
    
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}

