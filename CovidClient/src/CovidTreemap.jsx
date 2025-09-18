import React, { useEffect, useState } from 'react'
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts'

const TYPE_OPTIONS = [
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Active', value: 'Active' },
  { label: 'Recovered', value: 'Recovered' },
  { label: 'Deaths', value: 'Deaths' },
  { label: 'Daily Increase', value: 'DailyIncrease' },
]

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEEAD',
  '#D4A5A5',
  '#9B59B6',
  '#3498DB',
  '#E74C3C',
  '#2ECC71',
  '#F1C40F',
  '#E67E22',
  '#1ABC9C',
  '#8E44AD',
  '#D35400',
]

function CovidTreemap() {
  const [type, setType] = useState('Confirmed')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
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
          console.log('Raw dates from API (Treemap):', dates)
          setAvailableDates(dates)
          if (dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0].date)
          }
        })
        .catch((error) => {
          console.error('Error fetching dates:', error)
          // Mock dates for testing
          const mockDates = [
            { date: '2022-02-21T00:00:00' },
            { date: '2022-02-20T00:00:00' },
            { date: '2022-02-19T00:00:00' },
            { date: '2022-02-18T00:00:00' },
            { date: '2022-02-17T00:00:00' },
          ]
          setAvailableDates(mockDates)
          setSelectedDate(mockDates[0].date)
        })
    }

    // Load main data
    let apiUrl = `http://localhost:5022/odata/CovidSummaryOData?type=${type}`
    if (type === 'DailyIncrease') {
      if (selectedDate) {
        apiUrl = `http://localhost:5022/odata/CovidDailyIncrease?type=Confirmed&date=${selectedDate}`
      } else {
        // Nếu chưa có selectedDate, sử dụng API mặc định với DailyIncrease
        apiUrl = `http://localhost:5022/odata/CovidSummaryOData?type=DailyIncrease`
      }
    }

    fetch(apiUrl)
      .then((res) => res.json())
      .then((json) => {
        const result = json.value || json || []
        console.log('API URL:', apiUrl)
        console.log('API response (raw):', json)
        console.log('API data (processed):', result)
        console.log('Data length:', result.length)

        // Xử lý dữ liệu cho Daily Increase
        if (type === 'DailyIncrease') {
          const processedData = result.map((item) => ({
            country: item.Country || item.country || item.CountryRegion,
            value: item.DailyIncrease || item.dailyIncrease || item.value || 0,
            currentValue: item.CurrentValue || item.currentValue || 0,
            previousValue: item.PreviousValue || item.previousValue || 0,
            date: item.Date || item.date,
          }))
          console.log('Processed Daily Increase data:', processedData)
          console.log('Sample item:', processedData[0])
          setData(processedData)
        } else {
          setData(result)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
        setLoading(false)
        setData([]) // Đặt data rỗng khi có lỗi
      })
  }, [type, selectedDate])

  const totalValue = data.reduce((sum, item) => sum + Math.abs(item.value), 0)

  console.log('Data for treemap processing:', data)
  console.log('Total value:', totalValue)

  const treemapData = data
    .filter((item) => item.value !== 0) // Loại bỏ các country có giá trị 0
    .map((item) => ({
      name: item.country,
      size: Math.abs(item.value), // Sử dụng giá trị tuyệt đối cho kích thước
      value: item.value, // Giữ nguyên giá trị gốc để hiển thị
      percentage: ((Math.abs(item.value) / totalValue) * 100).toFixed(1),
      lat: item.lat,
      long: item.long,
    }))
    .sort((a, b) => b.size - a.size) // Sắp xếp giảm dần theo size

  console.log('TreemapData after processing:', treemapData)
  console.log('TreemapData length:', treemapData.length)

  return (
    <div style={{ padding: 40 }}>
      <div>
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
                const dateValue = dateObj.date
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

      <div
        style={{
          background: '#ffffffff',
          borderRadius: 20,
          padding: 20,
        }}
      >
        <h3 style={{ textAlign: 'center', margin: 0 }}>Treemap of Countries</h3>
        <p style={{ textAlign: 'center', marginTop: 0 }}>
          The Treemap shows the number of{' '}
          {type === 'DailyIncrease' ? 'Daily Changes' : 'Cases'} in Different
          countries
          <br />
          and their percent of total{' '}
          {type === 'DailyIncrease' ? 'daily changes' : 'cases'} worldwide
        </p>
        {type === 'DailyIncrease' && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <span
              style={{
                backgroundColor: '#ff6b6b',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                marginRight: '10px',
              }}
            >
              🔴 Red = Increase
            </span>
            <span
              style={{
                backgroundColor: '#51cf66',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              🟢 Green = Decrease
            </span>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center' }}>Loading...</div>
        ) : treemapData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            <p>No data available for the selected criteria</p>
            <p>
              API URL:{' '}
              {type === 'DailyIncrease'
                ? selectedDate
                  ? `http://localhost:5022/odata/CovidDailyIncrease?type=Confirmed&date=${selectedDate}`
                  : `http://localhost:5022/odata/CovidSummaryOData?type=DailyIncrease`
                : `http://localhost:5022/odata/CovidSummaryOData?type=${type}`}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <Treemap
              width={730}
              height={350}
              data={treemapData.map((item, index) => ({
                ...item,
                fill:
                  type === 'DailyIncrease'
                    ? item.value >= 0
                      ? '#ff6b6b'
                      : '#51cf66' // Red for increase, green for decrease
                    : COLORS[index % COLORS.length],
              }))}
              dataKey='size'
              ratio={4 / 3}
              content={({ x, y, width, height, index }) => {
                const item = treemapData[index]
                if (!item) return null

                const fillColor =
                  type === 'DailyIncrease'
                    ? item.value >= 0
                      ? '#ff6b6b'
                      : '#51cf66'
                    : COLORS[index % COLORS.length]

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: fillColor,
                        stroke: '#ffffff',
                        strokeWidth: 3,
                      }}
                    />
                    {width > 60 && height > 30 && (
                      <text
                        x={x + 8}
                        y={y + 20}
                        fontSize={Math.min(width / 8, height / 6, 14)}
                        fontWeight='bold'
                        fill='#ffffff'
                      >
                        {item.name}
                      </text>
                    )}
                    {width > 80 && height > 50 && (
                      <text
                        x={x + 8}
                        y={y + 40}
                        fontSize={Math.min(width / 10, height / 8, 12)}
                        fill='#ffffff'
                      >
                        {type === 'DailyIncrease'
                          ? (item.value >= 0 ? '+' : '') +
                            item.value.toLocaleString()
                          : item.value.toLocaleString()}
                      </text>
                    )}
                    {width > 80 && height > 65 && (
                      <text
                        x={x + 8}
                        y={y + 56}
                        fontSize={Math.min(width / 12, height / 10, 11)}
                        fill='#ffffff'
                      >
                        {item.percentage}%
                      </text>
                    )}
                  </g>
                )
              }}
            >
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload[0]) return null
                  const d = payload[0].payload
                  return (
                    <div
                      style={{
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #ccc',
                        padding: 8,
                        borderRadius: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <b>{d.name}</b>
                      <br />
                      {type === 'DailyIncrease' ? 'Daily Change' : type}:{' '}
                      {type === 'DailyIncrease'
                        ? (d.value >= 0 ? '+' : '') + d.value.toLocaleString()
                        : d.value.toLocaleString()}
                      {type === 'DailyIncrease' && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: d.value >= 0 ? '#dc3545' : '#28a745',
                            marginTop: '2px',
                          }}
                        >
                          {d.value >= 0 ? 'Increase' : 'Decrease'}
                        </div>
                      )}
                    </div>
                  )
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default CovidTreemap
