import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'
import 'leaflet/dist/leaflet.css'

// Stop Icon 
const stopIcon = new L.Icon({
  iconUrl: 'https://cdn2.iconfinder.com/data/icons/IconsLandVistaMapMarkersIconsDemo/256/MapMarker_Marker_Outside_Chartreuse.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
})

const MapComponent = () => {

  const [busStops, setBusStops] = useState([])
  const [routes, setRoutes] = useState([])
  const [stopTimes, setStopTimes] = useState([])
  const [trips, setTrips] = useState([])
  const [selectedStopId, setSelectedStopId] = useState(null)
  const [selectedRoutes, setSelectedRoutes] = useState([])

  useEffect(() => {
    // Fonction qui charge un fichier CSV
    const loadCsvData = (url) => {
      return new Promise((resolve, reject) => {
        Papa.parse(url, {
          download: true,
          header: true,
          complete: (result) => resolve(result.data),
          error: reject
        });
      });
    };
  
    // Charger les 4 fichiers en parallèle
    Promise.all([
      loadCsvData('/stops.csv'),
      loadCsvData('/stop_times.csv'),
      loadCsvData('/trips.csv'),
      loadCsvData('/routes.csv')
    ]).then(([stopsData, stopTimesData, tripsData, routesData]) => {
      // Traiter les données après chargement
      const parsedStops = stopsData.map((stop) => ({
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        latitude: parseFloat(stop.stop_lat),
        longitude: parseFloat(stop.stop_lon)
      })).filter(stop => !isNaN(stop.latitude) && !isNaN(stop.longitude));
  
      const filteredStopTimes = stopTimesData.map((stopTime) => ({
        stop_id: stopTime.stop_id,
        trip_id: stopTime.trip_id
      }));
  
      const filteredTrips = tripsData.map((trip) => ({
        trip_id: trip.trip_id,
        route_id: trip.route_id,
      }));
  
      const filteredRoutes = routesData.map((route) => ({
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_color: route.route_color, 
        route_type: route.route_type, 
      }));
  
      // Mettre à jour les états
      setBusStops(parsedStops);
      setStopTimes(filteredStopTimes);
      setTrips(filteredTrips);
      setRoutes(filteredRoutes);
    }).catch(error => {
      console.error('Error loading data:', error);
    });
  }, []);
  

  // Obtenir les lignes de bus desservant un arrêt
  const getRoutesForStop = (stopId) => {

    const tripIds = [...new Set(stopTimes.filter(stopTime => stopTime.stop_id === stopId).map(stopTime => stopTime.trip_id))];

    const routeIds = [...new Set(tripIds.map(tripId => {
      const trip = trips.find(trip => trip.trip_id === tripId);
      return trip ? trip.route_id : null;
    }).filter(routeId => routeId !== null))];

    const routeNames = [...new Set(routeIds.map(routeId => {
      const route = routes.find(route => route.route_id === routeId);
      return route ? { name: route.route_short_name, color: route.route_color, type: route.route_type } : null;
    }).filter(routeName => routeName !== null))];

    const uniqueRouteNames = [...new Set(routeNames)];

    return uniqueRouteNames
  }

  // Gérer le clic sur un arrêt
  const handleStopClick = (stopId) => {
    setSelectedStopId(stopId);
    const routesForStop = getRoutesForStop(stopId);
    setSelectedRoutes(routesForStop);
  }

  return (
    <div className='flex flex-row gap-5 justify-between  p-5 w-full mt-16'>

      {/*Filter*/}
      <div>
      Filtre
      </div>

      {/*Map*/}
      <MapContainer center={[47.218371, -1.553621]} zoom={13} style={{ height: '70vh', width: '50%' }}>

        {/*Openstreetmap*/}
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/*Stop*/}
        {busStops.map((stop, idx) => (
          <Marker
            key={idx}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
            eventHandlers={{
              click: () => handleStopClick(stop.stop_id) 
            }}
          >
              <Popup>
              {/*stop name*/}
              <strong>{stop.stop_name}</strong>
               <br />
              {/*stop routes*/}
              <div>
                {
                  selectedRoutes.length > 0 ? (
                    <ul
                    style={{
                      display: 'flex',        
                      flexWrap: 'wrap',       
                      gap: '2px',            
                      padding: 0,
                      marging : 0,            
                    }}
                    >
                    {selectedRoutes.map((route, index) => (
                      <li
                        key={index}
                        style={{
                          display: 'flex',           
                          alignItems: 'center',      
                          backgroundColor: `#${route.color}`,
                          color: 'white',
                          padding: '5px',
                          borderRadius: '5px',
                          marginBottom: '5px',
                          width: 'max-content',
                        }}
                      >
                        {route.name}

                        <img 
                            src={
                                route.type === '3' 
                                    ? 'https://img.icons8.com/?size=100&id=241&format=png&color=ffffff' // Icône de bus
                                    : route.type === '0' 
                                    ? 'https://img.icons8.com/?size=100&id=248&format=png&color=ffffff' // Icône de tram
                                    : null
                            }
                            style={{
                              marginLeft: '5px',   
                              height: '20px',      
                              width: 'auto',       
                            }}                        
                          />
                      </li>
                    ))}
                  </ul>
                  ) : (
                    <p>Aucune ligne desservie.</p>
                  )
                }
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

    </div>
  )
}

export default MapComponent
