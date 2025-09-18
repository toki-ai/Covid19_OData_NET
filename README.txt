# COVID-19 Data Visualization Project

## Mô tả dự án
Dự án visualization dữ liệu COVID-19 với:
- **Backend**: ASP.NET Core 8.0 với OData API
- **Frontend**: React 19.1.1 với Vite
- **Database**: SQL Server
- **Visualization**: World Map (react-simple-maps) và Treemap (recharts)

## Cấu trúc thư mục
```
OData/
├── CovidServer/                    # ASP.NET Core API Server
│   ├── CovidServer/               # Main API project
│   │   ├── Controllers/           # API Controllers
│   │   ├── Models/               # Data models và DbContext
│   │   ├── Services/             # Business logic services
│   │   ├── data/                 # CSV files để import
│   │   └── appsettings.json      # Configuration chính
│   └── DataImporter/             # Console app import data
│       ├── Program.cs            # Import logic
│       └── RunImport.bat         # Batch file chạy import
├── CovidClient/                  # React frontend
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── CovidTreemap.jsx     # Treemap visualization
│   │   └── assets/              # Static assets
│   └── package.json             # Dependencies
└── DBScript.sql                 # Database setup script
```

## Cài đặt và chạy dự án

### 1. Chuẩn bị Database
- Chạy SQL Server
- Tạo database `PRN3_COVID` 
- Import dữ liệu bằng DataImporter (xem phần Import Data)

### 2. Cấu hình Connection String

#### Cho API Server (CovidServer/CovidServer/appsettings.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Uid=sa;Pwd=YOUR_PASSWORD;Database=PRN3_COVID;TrustServerCertificate=True"
  }
}
```

#### Cho DataImporter (CovidServer/DataImporter/Program.cs):
Thay đổi connection string trong file Program.cs dòng 13-15:
```csharp
private static readonly string ConnectionStringMaster = "Server=YOUR_SERVER;Uid=sa;Pwd=YOUR_PASSWORD;Database=master;TrustServerCertificate=True";
private static readonly string DatabaseName = "PRN3_COVID";
private static readonly string ConnectionStringDb = $"Server=YOUR_SERVER;Uid=sa;Pwd=YOUR_PASSWORD;Database={DatabaseName};TrustServerCertificate=True";
```

**Ví dụ thay thế:**
- `YOUR_SERVER`: `DESKTOP-TOKI\\TOKI` hoặc `MSI\\MSSQLSERVER2019`
- `YOUR_PASSWORD`: mật khẩu SQL Server của bạn

### 3. Import Data từ CSV
```bash
cd CovidServer/DataImporter
dotnet run
```
Hoặc double-click file `RunImport.bat`

**Lưu ý**: Đảm bảo các file CSV có trong thư mục `CovidServer/data/`:
- time_series_covid19_confirmed_global_2.csv
- time_series_covid19_deaths_global_2.csv
- time_series_covid19_recovered_global_2.csv
- 02-21-2022.csv

### 4. Chạy Backend API
```bash
cd CovidServer/CovidServer
dotnet run
```
API sẽ chạy tại: http://localhost:5022

### 5. Chạy Frontend
```bash
cd CovidClient
npm install
npm run dev
```
Frontend sẽ chạy tại: http://localhost:5173

## API Endpoints

### OData Endpoints:
- `GET /odata/CovidSummaryOData?type=Confirmed` - Dữ liệu confirmed cases
- `GET /odata/CovidSummaryOData?type=Deaths` - Dữ liệu deaths
- `GET /odata/CovidSummaryOData?type=Recovered` - Dữ liệu recovered
- `GET /odata/CovidSummaryOData?type=Active` - Dữ liệu active cases
- `GET /odata/CovidSummaryOData?type=DailyIncrease` - Dữ liệu daily increase

### Daily Increase API:
- `GET /odata/CovidDailyIncrease?type=Confirmed&date=2023-12-02` - Daily increase cho ngày cụ thể
- `GET /odata/CovidDailyIncrease/dates` - Danh sách dates có sẵn

## Tính năng chính

### 1. World Map Visualization
- Hiển thị dữ liệu COVID-19 trên bản đồ thế giới
- Color coding theo số liệu (màu đậm = số liệu cao)
- Tooltip hiển thị chi tiết khi hover
- Support cho Daily Increase với date picker

### 2. Treemap Visualization  
- Hiển thị dữ liệu dưới dạng treemap
- Kích thước tỷ lệ với số liệu
- Color coding khác nhau cho từng loại data
- Daily Increase: Đỏ = tăng, Xanh = giảm

### 3. Data Types
- **Confirmed**: Tổng số ca xác nhận
- **Deaths**: Tổng số ca tử vong  
- **Recovered**: Tổng số ca hồi phục
- **Active**: Số ca đang hoạt động (Confirmed - Deaths - Recovered)
- **Daily Increase**: Sự thay đổi hàng ngày (có thể âm/dương)

## Troubleshooting

### Connection String Issues:
1. Kiểm tra SQL Server đang chạy
2. Xác nhận server name đúng (`DESKTOP-TOKI\\TOKI` vs `localhost`)
3. Kiểm tra username/password SQL Server
4. Đảm bảo có `TrustServerCertificate=True` nếu dùng SSL

### Import Data Issues:
1. Kiểm tra file CSV có trong thư mục `data/`
2. Xác nhận database đã được tạo
3. Kiểm tra connection string trong DataImporter

### Frontend Issues:
1. Kiểm tra backend API đang chạy (http://localhost:5022)
2. Xem console log trong browser (F12)
3. Kiểm tra CORS configuration trong backend

### API không trả về data:
1. Kiểm tra database có data không
2. Test API endpoint trực tiếp trong browser
3. Xem console log trong backend

## Dependencies

### Backend:
- Microsoft.AspNetCore.OData 9.4.0
- Microsoft.EntityFrameworkCore.SqlServer 9.0.9
- CsvHelper 33.1.0

### Frontend:
- React 19.1.1
- Vite 7.1.6
- react-simple-maps (World Map)
- recharts 3.2.1 (Treemap)

