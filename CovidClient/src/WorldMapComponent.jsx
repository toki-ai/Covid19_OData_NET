import React, { useEffect, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
} from 'react-simple-maps'

const TYPE_OPTIONS = [
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Active', value: 'Active' },
  { label: 'Recovered', value: 'Recovered' },
  { label: 'Deaths', value: 'Deaths' },
  { label: 'Daily Increase', value: 'DailyIncrease' },
]

// URL đến file TopoJSON thế giới (110m resolution)
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Mapping tên quốc gia để khớp với dữ liệu API
const countryNameMapping = {
  'United States': ['United States of America', 'USA', 'US'],
  'United Kingdom': ['United Kingdom', 'UK'],
  'South Korea': ['Korea', 'Republic of Korea'],
  'North Korea': ["Democratic People's Republic of Korea"],
  Russia: ['Russian Federation'],
  Iran: ['Iran (Islamic Republic of)'],
  Venezuela: ['Venezuela (Bolivarian Republic of)'],
  Bolivia: ['Bolivia (Plurinational State of)'],
  Tanzania: ['United Republic of Tanzania'],
  Syria: ['Syrian Arab Republic'],
  Moldova: ['Republic of Moldova'],
  Macedonia: ['North Macedonia'],
  Congo: ['Democratic Republic of the Congo'],
  'Ivory Coast': ["Côte d'Ivoire"],
  'Cape Verde': ['Cabo Verde'],
  'East Timor': ['Timor-Leste'],
  Swaziland: ['Eswatini'],
  'Czech Republic': ['Czechia'],
  Burma: ['Myanmar'],
  Laos: ["Lao People's Democratic Republic"],
  Brunei: ['Brunei Darussalam'],
  'Vatican City': ['Holy See'],
}

function WorldMapComponent() {
  const [type, setType] = useState('Confirmed')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState({
    show: false,
    content: '',
    x: 0,
    y: 0,
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    setLoading(true)

    // Load available dates for Daily Increase
    if (type === 'DailyIncrease') {
      fetch('http://localhost:5022/odata/CovidDailyIncrease/dates')
        .then((res) => res.json())
        .then((json) => {
          const dates = json.value || json || []
          console.log('Raw dates from API:', dates) // Debug log
          setAvailableDates(dates)
          if (dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0].date) // Sửa từ Date thành date
          }
        })
        .catch((error) => {
          console.error('Error fetching dates:', error)
          // Mock dates for testing
          const mockDates = [
            { date: '2022-02-21T00:00:00' }, // Sửa từ Date thành date
            { date: '2022-02-20T00:00:00' },
            { date: '2022-02-19T00:00:00' },
            { date: '2022-02-18T00:00:00' },
            { date: '2022-02-17T00:00:00' },
          ]
          setAvailableDates(mockDates)
          setSelectedDate(mockDates[0].date) // Sửa từ Date thành date
        })
    }

    // Load main data
    let apiUrl = `http://localhost:5022/odata/CovidSummaryOData?type=${type}`
    if (type === 'DailyIncrease') {
      if (selectedDate) {
        apiUrl = `http://localhost:5022/odata/CovidDailyIncrease?type=Confirmed&date=${selectedDate}`
      } else {
        // Nếu chưa có selectedDate, gọi API không có date để lấy dữ liệu ngày gần nhất
        apiUrl = `http://localhost:5022/odata/CovidDailyIncrease?type=Confirmed`
      }
    }

    console.log('Fetching from URL:', apiUrl) // Debug log

    fetch(apiUrl)
      .then((res) => res.json())
      .then((json) => {
        const result = json.value || json || []
        console.log('API data for type', type, ':', result)

        // Xử lý dữ liệu cho Daily Increase
        if (type === 'DailyIncrease') {
          const processedData = result.map((item) => ({
            country: item.Country || item.country,
            value: item.DailyIncrease || item.dailyIncrease || 0,
            currentValue: item.CurrentValue || item.currentValue || 0,
            previousValue: item.PreviousValue || item.previousValue || 0,
            date: item.Date || item.date,
          }))
          console.log('Processed DailyIncrease data:', processedData) // Debug log
          setData(processedData)
        } else {
          setData(result)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
        setLoading(false)

        // Mock data khi API lỗi
        if (type === 'DailyIncrease') {
          const mockDailyData = [
            {
              country: 'United States',
              value: 50000,
              currentValue: 103436829,
              previousValue: 103386829,
            },
            {
              country: 'China',
              value: -5000,
              currentValue: 99244266,
              previousValue: 99249266,
            },
            {
              country: 'India',
              value: 15000,
              currentValue: 44690738,
              previousValue: 44675738,
            },
            {
              country: 'France',
              value: 8000,
              currentValue: 38997490,
              previousValue: 38989490,
            },
            {
              country: 'Germany',
              value: -2000,
              currentValue: 38437756,
              previousValue: 38439756,
            },
            {
              country: 'Brazil',
              value: 12000,
              currentValue: 37076053,
              previousValue: 37064053,
            },
            {
              country: 'Japan',
              value: 3000,
              currentValue: 33320438,
              previousValue: 33317438,
            },
            {
              country: 'South Korea',
              value: -1000,
              currentValue: 30614266,
              previousValue: 30615266,
            },
            {
              country: 'Italy',
              value: 6000,
              currentValue: 25603510,
              previousValue: 25597510,
            },
            {
              country: 'United Kingdom',
              value: 4000,
              currentValue: 24664536,
              previousValue: 24660536,
            },
          ]
          setData(mockDailyData)
        } else {
          const mockRegularData = [
            { country: 'United States', value: 103436829 },
            { country: 'China', value: 99244266 },
            { country: 'India', value: 44690738 },
            { country: 'France', value: 38997490 },
            { country: 'Germany', value: 38437756 },
            { country: 'Brazil', value: 37076053 },
            { country: 'Japan', value: 33320438 },
            { country: 'South Korea', value: 30614266 },
            { country: 'Italy', value: 25603510 },
            { country: 'United Kingdom', value: 24664536 },
          ]
          setData(mockRegularData)
        }
      })
  }, [type, selectedDate])

  const maxValue = data.length
    ? Math.max(...data.map((d) => d.value))
    : 100000000

  // Hàm tìm dữ liệu cho quốc gia
  const getCountryData = (geoProperties) => {
    const geoName =
      geoProperties.NAME || geoProperties.name || geoProperties.NAME_EN

    // Tìm trực tiếp theo tên
    let countryData = data.find((d) => d.country === geoName)

    // Nếu không tìm thấy, thử với mapping
    if (!countryData) {
      for (const [apiName, geoNames] of Object.entries(countryNameMapping)) {
        if (geoNames.includes(geoName)) {
          countryData = data.find((d) => d.country === apiName)
          break
        }
      }
    }

    // Nếu vẫn không tìm thấy, thử tìm ngược
    if (!countryData) {
      const foundMapping = Object.entries(countryNameMapping).find(
        ([apiName]) => data.some((d) => d.country === apiName)
      )
      if (foundMapping) {
        const [apiName] = foundMapping
        if (data.find((d) => d.country === apiName)) {
          countryData = data.find((d) => d.country === apiName)
        }
      }
    }

    return countryData || { value: 0 }
  }

  // Hàm tính màu dựa trên giá trị
  const getColor = (value) => {
    if (type === 'DailyIncrease') {
      console.log(
        'getColor for DailyIncrease - value:',
        value,
        'type:',
        typeof value
      )
    }

    if (!value || value === 0) return '#f5f5f5'

    if (type === 'DailyIncrease') {
      // Xử lý màu cho Daily Increase (có thể âm hoặc dương)
      const absValue = Math.abs(value)
      const maxAbsValue = Math.max(...data.map((d) => Math.abs(d.value || 0)))

      console.log('DailyIncrease color calculation:', {
        value,
        absValue,
        maxAbsValue,
        dataLength: data.length,
        sampleData: data.slice(0, 3),
      })

      if (maxAbsValue === 0) return '#f5f5f5'

      const intensity = absValue / maxAbsValue

      if (value > 0) {
        // Màu đỏ cho tăng
        const color =
          intensity < 0.2
            ? '#ffebee'
            : intensity < 0.4
            ? '#ffcdd2'
            : intensity < 0.6
            ? '#ef5350'
            : intensity < 0.8
            ? '#f44336'
            : '#d32f2f'
        console.log('Positive value color:', color, 'intensity:', intensity)
        return color
      } else if (value < 0) {
        // Màu xanh cho giảm
        const color =
          intensity < 0.2
            ? '#e8f5e8'
            : intensity < 0.4
            ? '#c8e6c9'
            : intensity < 0.6
            ? '#66bb6a'
            : intensity < 0.8
            ? '#4caf50'
            : '#388e3c'
        console.log('Negative value color:', color, 'intensity:', intensity)
        return color
      }
      return '#f5f5f5'
    } else {
      // Màu cho các loại khác
      const normalizedValue = Math.log(value + 1) / Math.log(maxValue + 1)

      // Gradient từ xanh nhạt đến đỏ đậm
      if (normalizedValue < 0.2) return '#fff3e0' // Rất nhạt
      if (normalizedValue < 0.4) return '#ffcc80' // Nhạt
      if (normalizedValue < 0.6) return '#ff9800' // Trung bình
      if (normalizedValue < 0.8) return '#f57c00' // Đậm
      return '#e65100' // Rất đậm
    }
  }

  const handleMouseEnter = (geo, event) => {
    const countryData = getCountryData(geo.properties)
    const countryName =
      geo.properties.NAME || geo.properties.name || geo.properties.NAME_EN

    let tooltipContent = `${countryName}: ${countryData.value.toLocaleString()}`

    if (type === 'DailyIncrease') {
      const sign = countryData.value >= 0 ? '+' : ''
      tooltipContent += ` ${sign}${countryData.value.toLocaleString()} daily change`
      if (countryData.currentValue) {
        tooltipContent += `\nCurrent: ${countryData.currentValue.toLocaleString()}`
        tooltipContent += `\nPrevious: ${countryData.previousValue.toLocaleString()}`
      }
    } else {
      tooltipContent += ` ${type} cases`
    }

    setTooltip({
      show: true,
      content: tooltipContent,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 })
  }

  const handleMouseMove = (event) => {
    setTooltip((prev) => ({
      ...prev,
      x: event.clientX,
      y: event.clientY,
    }))
  }

  return (
    <div style={{ width: '70%', padding: 40 }}>
      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            style={{
              border: '1px solid #b5d1e8',
              background: type === opt.value ? '#e6f7ff' : '#fff',
              color: type === opt.value ? '#1890ff' : '#333',
              borderRadius: 6,
              padding: '8px 18px',
              fontWeight: 500,
              marginBottom: 6,
              minWidth: 120,
              cursor: 'pointer',
              marginRight: '10px',
            }}
            onClick={() => {
              setType(opt.value)
              if (opt.value === 'DailyIncrease') {
                setShowDatePicker(true)
              } else {
                setShowDatePicker(false)
                setSelectedDate(null)
              }
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date Picker for Daily Increase */}
      {showDatePicker && type === 'DailyIncrease' && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#495057',
            }}
          >
            Select Date for Daily Increase Analysis:
          </label>
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              minWidth: '200px',
              backgroundColor: 'white',
            }}
          >
            <option value=''>Select a date...</option>
            {availableDates
              .map((dateObj, index) => {
                // Parse date properly
                const dateValue = dateObj.date // Sửa từ Date thành date
                const parsedDate = new Date(dateValue)

                // Check if date is valid
                if (isNaN(parsedDate.getTime())) {
                  console.warn('Invalid date:', dateValue)
                  return null
                }

                return (
                  <option key={index} value={dateValue}>
                    {parsedDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </option>
                )
              })
              .filter(Boolean)}
          </select>
          {selectedDate && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#6c757d',
              }}
            >
              {(() => {
                const currentDate = new Date(selectedDate)
                const previousDate = new Date(currentDate)
                previousDate.setDate(currentDate.getDate() - 1)

                if (isNaN(currentDate.getTime())) {
                  return 'Invalid date selected'
                }

                return `Showing daily changes from ${previousDate.toLocaleDateString()} to ${currentDate.toLocaleDateString()}`
              })()}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#333' }}
        >
          COVID-19 World Map
        </h3>
        <p style={{ textAlign: 'center', marginTop: 0, color: '#666' }}>
          Map showing {type} cases across countries
          <br />
          (Darker colors indicate higher numbers)
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '18px' }}>Loading...</div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <ComposableMap
              projectionConfig={{
                rotate: [-10, 0, 0],
                scale: 147,
              }}
              width={800}
              height={400}
              style={{
                width: '100%',
                height: 'auto',
              }}
            >
              <ZoomableGroup>
                <Sphere stroke='#E4E5E6' strokeWidth={0.5} fill='#E4E5E6' />
                <Graticule stroke='#E4E5E6' strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryData = getCountryData(geo.properties)
                      const fillColor = getColor(countryData.value)

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke='#FFFFFF'
                          strokeWidth={0.5}
                          style={{
                            default: {
                              outline: 'none',
                            },
                            hover: {
                              fill: '#F53',
                              outline: 'none',
                            },
                            pressed: {
                              outline: 'none',
                            },
                          }}
                          onMouseEnter={(event) => handleMouseEnter(geo, event)}
                          onMouseLeave={handleMouseLeave}
                          onMouseMove={handleMouseMove}
                        />
                      )
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip */}
            {tooltip.show && (
              <div
                style={{
                  position: 'fixed',
                  left: tooltip.x + 10,
                  top: tooltip.y - 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  whiteSpace: 'pre-line',
                }}
              >
                {tooltip.content}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
            gap: '10px',
          }}
        >
          {type === 'DailyIncrease' ? (
            <>
              <span style={{ fontSize: '14px', color: '#388e3c' }}>
                Decrease
              </span>
              <div
                style={{
                  display: 'flex',
                  height: '20px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                }}
              >
                <div
                  style={{ width: '30px', backgroundColor: '#388e3c' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#4caf50' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#66bb6a' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#c8e6c9' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#f5f5f5' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#ffebee' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#ffcdd2' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#ef5350' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#f44336' }}
                ></div>
                <div
                  style={{ width: '30px', backgroundColor: '#d32f2f' }}
                ></div>
              </div>
              <span style={{ fontSize: '14px', color: '#d32f2f' }}>
                Increase
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>Low</span>
              <div
                style={{
                  display: 'flex',
                  height: '20px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                }}
              >
                <div
                  style={{ width: '40px', backgroundColor: '#fff3e0' }}
                ></div>
                <div
                  style={{ width: '40px', backgroundColor: '#ffcc80' }}
                ></div>
                <div
                  style={{ width: '40px', backgroundColor: '#ff9800' }}
                ></div>
                <div
                  style={{ width: '40px', backgroundColor: '#f57c00' }}
                ></div>
                <div
                  style={{ width: '40px', backgroundColor: '#e65100' }}
                ></div>
              </div>
              <span style={{ fontSize: '14px' }}>High</span>
            </>
          )}
        </div>

        {/* Statistics */}
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>
            Top 10 Countries
          </h4>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <table
              style={{
                width: '80%',
                borderCollapse: 'collapse',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    Country
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    {type} Cases
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    Intensity
                  </th>
                </tr>
              </thead>
              <tbody>
                {data
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 10)
                  .map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <strong>{item.country}</strong>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'right',
                          borderBottom: '1px solid #dee2e6',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.value.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #dee2e6',
                        }}
                      >
                        <div
                          style={{
                            width: '60px',
                            height: '20px',
                            backgroundColor: getColor(item.value),
                            margin: '0 auto',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorldMapComponent
