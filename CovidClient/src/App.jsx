import { useState } from 'react'
import CovidTreemap from './CovidTreemap'
import WorldMapComponent from './WorldMapComponent'

function App() {
  const [view, setView] = useState('map')

  return (
    <>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <button
          onClick={() => setView('map')}
          style={{
            padding: '10px 20px',
            background: view === 'map' ? '#1890ff' : '#fff',
            color: view === 'map' ? '#fff' : '#333',
            border: '1px solid #1890ff',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Bản đồ COVID-19
        </button>
        <button
          onClick={() => setView('treemap')}
          style={{
            padding: '10px 20px',
            background: view === 'treemap' ? '#1890ff' : '#fff',
            color: view === 'treemap' ? '#fff' : '#333',
            border: '1px solid #1890ff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Treemap COVID-19
        </button>
      </div>

      {view === 'map' ? <WorldMapComponent /> : <CovidTreemap />}
    </>
  )
}

export default App
