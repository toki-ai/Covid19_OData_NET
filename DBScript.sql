CREATE DATABASE PRN3_COVID 
GO 
USE PRN3_COVID
-- Bảng 1: Locations (Lưu thông tin quốc gia/vùng, Lat/Long cho bản đồ)
CREATE TABLE Locations (
    LocationID INT IDENTITY(1,1) PRIMARY KEY, -- Sử dụng IDENTITY thay SERIAL
    Province_State NVARCHAR(255), -- Sử dụng NVARCHAR để hỗ trợ Unicode
    Country_Region NVARCHAR(255) NOT NULL, -- Tên quốc gia/vùng (e.g., US, China)
    Lat FLOAT, -- Vĩ độ cho bản đồ
    Long FLOAT, -- Kinh độ cho bản đồ
    ISO3 NVARCHAR(3), -- Mã ISO3 (e.g., USA) từ file US
    CONSTRAINT UQ_Locations_Province_Country UNIQUE (Province_State, Country_Region) -- Đảm bảo unique location
);

-- Bảng 2: DailyMetrics (Lưu dữ liệu time-series: Confirmed, Deaths, Recovered theo ngày)
CREATE TABLE DailyMetrics (
    MetricID INT IDENTITY(1,1) PRIMARY KEY, -- Sử dụng IDENTITY thay SERIAL
    LocationID INT NOT NULL FOREIGN KEY REFERENCES Locations(LocationID), -- FK đến Locations
    Date DATE NOT NULL, -- Ngày dữ liệu (e.g., '2022-02-21')
    Confirmed BIGINT DEFAULT 0, -- Số ca Confirmed (tích lũy)
    Deaths BIGINT DEFAULT 0, -- Số ca Deaths (tích lũy)
    Recovered BIGINT DEFAULT 0, -- Số ca Recovered (tích lũy)
    -- Active sẽ được tính bằng computed column (SQL Server không hỗ trợ generated column như PostgreSQL)
    Active AS (Confirmed - Deaths - Recovered) PERSISTED, -- Computed column, lưu trữ kết quả
    CONSTRAINT UQ_DailyMetrics_Location_Date UNIQUE (LocationID, Date) -- Đảm bảo unique per location per day
);

-- Indexes cho performance (query nhanh theo ngày/quốc gia)
CREATE INDEX idx_daily_metrics_date ON DailyMetrics(Date);
CREATE INDEX idx_daily_metrics_location_date ON DailyMetrics(LocationID, Date);

-- Bảng 3: MetricsTypes (Optional, nếu muốn mở rộng metrics như Testing_Rate từ file US)
CREATE TABLE MetricsTypes (
    TypeID INT IDENTITY(1,1) PRIMARY KEY, -- Sử dụng IDENTITY thay SERIAL
    MetricName NVARCHAR(50) NOT NULL UNIQUE -- e.g., 'Confirmed', 'Deaths', 'DailyIncrease'
);