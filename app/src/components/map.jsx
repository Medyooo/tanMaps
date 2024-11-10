import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'
import 'leaflet/dist/leaflet.css'
import { MdAccessible, MdNotAccessible } from 'react-icons/md'

// Icône pour les arrêts de bus
const busIcon = new L.Icon({
  iconUrl: 'https://cdn2.iconfinder.com/data/icons/IconsLandVistaMapMarkersIconsDemo/256/MapMarker_Marker_Outside_Chartreuse.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
})

const MapComponent = () => {
  const [busStops, setBusStops] = useState([])

  useEffect(() => {
    Papa.parse('/stops.csv', {
      download: true,
      header: true,
      complete: (result) => {
        const parsedData = result.data
          .map((stop) => ({
            stop_id: stop.stop_id,
            stop_name: stop.stop_name,
            stop_desc: stop.stop_desc,
            latitude: parseFloat(stop.stop_lat),
            longitude: parseFloat(stop.stop_lon),
            wheelchair_boarding: stop.wheelchair_boarding,
            location_type: stop.location_type
          }))
          .filter(
            stop =>
              !isNaN(stop.latitude) &&
              !isNaN(stop.longitude) &&
              stop.location_type === '0'
          )
        setBusStops(parsedData)
      }
    })
  }, [])

  return (
    <div className='flex flex-row gap-5 justify-between p-5 w-full mt-16'>
      <div>Filtre</div>
      <MapContainer center={[47.218371, -1.553621]} zoom={13} style={{ height: '70vh', width: '50%' }}>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {busStops.map((stop, idx) => (
          <Marker
            key={idx}
            position={[stop.latitude, stop.longitude]}
            icon={busIcon}
          >
            <Popup maxWidth={200} minWidth={150}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{stop.stop_name}</div>
              {stop.wheelchair_boarding === '1' ? <MdAccessible size={24} /> : <MdNotAccessible size={24} />}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapComponent
