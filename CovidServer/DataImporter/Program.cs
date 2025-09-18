using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using System.Linq;

class Program
{
    private static readonly string ConnectionStringMaster = "Server=DESKTOP-TOKI\\TOKI;Uid=sa;Pwd=12345;Database=master;TrustServerCertificate=True";
    private static readonly string DatabaseName = "PRN3_COVID";
    private static readonly string ConnectionStringDb = $"Server=DESKTOP-TOKI\\TOKI;Uid=sa;Pwd=12345;Database={DatabaseName};TrustServerCertificate=True";

    // Đường dẫn đến các file CSV local
    private static readonly string[] GlobalCsvFiles = {
        @"..\CovidServer\data\time_series_covid19_confirmed_global_2.csv",
        @"..\CovidServer\data\time_series_covid19_deaths_global_2.csv", 
        @"..\CovidServer\data\time_series_covid19_recovered_global_2.csv"
    };

    private static readonly string UsCsvFile = @"..\CovidServer\data\02-21-2022.csv";

    static async Task Main(string[] args)
    {
        try
        {
            Console.WriteLine("=== COVID-19 Data Import Tool ===");
            Console.WriteLine("This tool will import data from local CSV files into the database.");
            Console.WriteLine();

            // Kiểm tra file tồn tại
            Console.WriteLine("Checking for required CSV files...");

            bool allFilesExist = true;
            var allFiles = GlobalCsvFiles.Concat(new[] { UsCsvFile }).ToArray();
            
            foreach (string file in allFiles)
            {
                if (File.Exists(file))
                {
                    Console.WriteLine($"✓ Found: {file}");
                }
                else
                {
                    Console.WriteLine($"✗ Missing: {file}");
                    allFilesExist = false;
                }
            }

            if (!allFilesExist)
            {
                Console.WriteLine();
                Console.WriteLine("Error: Some required CSV files are missing.");
                Console.WriteLine("Please ensure all CSV files are placed in the CovidServer/data folder.");
                Console.WriteLine("Press any key to exit...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine();
            Console.WriteLine("All required files found. Starting import...");
            Console.WriteLine();

            // Database and tables already exist, skip creation
            Console.WriteLine("Using existing database and tables...");

            // Step 1: Process Global Time Series CSVs
            await ProcessGlobalTimeSeries();

            // Step 2: Process US Sample CSV (single date)
            await ProcessUsSampleCsv();

            Console.WriteLine();
            Console.WriteLine("Import completed successfully!");
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine($"Import failed with error: {ex.Message}");
            Console.WriteLine($"Details: {ex.StackTrace}");
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
    }

    /*
    private static async Task CreateDatabaseAndTables()
    {
        // Database and tables already exist - skipping creation
        Console.WriteLine("✓ Using existing database and tables.");
    }
    */

    private static async Task ProcessGlobalTimeSeries()
    {
        try
        {
            Console.WriteLine("Processing global time series data...");
            
            var data = new Dictionary<string, Dictionary<DateTime, (long Confirmed, long Deaths, long Recovered)>>();

            foreach (var filePath in GlobalCsvFiles)
            {
                try
                {
                    if (!File.Exists(filePath))
                    {
                        Console.WriteLine($"File not found: {filePath}. Skipping...");
                        continue;
                    }

                    Console.WriteLine($"  Processing: {Path.GetFileName(filePath)}");
                    
                    using var fileReader = new StreamReader(filePath);
                    using var csv = new CsvReader(fileReader, new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true });

                    var headers = new List<string>();
                    await csv.ReadAsync();
                    csv.ReadHeader();
                    headers = csv.HeaderRecord.ToList();

                    var dateColumns = headers.GetRange(4, headers.Count - 4);
                    int recordCount = 0;

                    while (await csv.ReadAsync())
                    {
                        try
                        {
                            var province = csv.GetField<string>(0) ?? string.Empty;
                            var country = csv.GetField<string>(1);
                            if (string.IsNullOrEmpty(country))
                            {
                                continue;
                            }

                            var locationKey = $"{province}|{country}";

                            if (!data.ContainsKey(locationKey))
                            {
                                data[locationKey] = new Dictionary<DateTime, (long, long, long)>();
                            }

                            for (int i = 0; i < dateColumns.Count; i++)
                            {
                                var dateStr = dateColumns[i];
                                if (!DateTime.TryParseExact(dateStr, "M/d/yy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                                {
                                    continue;
                                }

                                long value = 0;
                                csv.TryGetField<long>(i + 4, out value);

                                if (!data[locationKey].ContainsKey(date))
                                {
                                    data[locationKey][date] = (0, 0, 0);
                                }

                                var (conf, deaths, rec) = data[locationKey][date];

                                if (filePath.Contains("confirmed"))
                                    conf = value;
                                else if (filePath.Contains("deaths"))
                                    deaths = value;
                                else if (filePath.Contains("recovered"))
                                    rec = value;

                                data[locationKey][date] = (conf, deaths, rec);
                            }
                            recordCount++;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"    Error processing row {csv.Context.Parser.Row}: {ex.Message}");
                            continue;
                        }
                    }
                    Console.WriteLine($"    Processed {recordCount} records");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  Error processing file {filePath}: {ex.Message}");
                    continue;
                }
            }

            // Insert data into database
            Console.WriteLine("  Inserting data into database...");
            using var conn = new SqlConnection(ConnectionStringDb);
            await conn.OpenAsync();

            int totalInserted = 0;
            foreach (var kvp in data)
            {
                var parts = kvp.Key.Split('|');
                var province = parts[0];
                var country = parts[1];

                try
                {
                    int locationId = await GetOrInsertLocation(conn, province, country, null, null, null);

                    using var transaction = conn.BeginTransaction();
                    try
                    {
                        foreach (var dateKvp in kvp.Value)
                        {
                            var date = dateKvp.Key;
                            var (confirmed, deaths, recovered) = dateKvp.Value;

                            using var cmd = new SqlCommand(
                                @"IF NOT EXISTS (SELECT 1 FROM DailyMetrics WHERE LocationID = @LocationID AND Date = @Date)
                                  INSERT INTO DailyMetrics (LocationID, Date, Confirmed, Deaths, Recovered) 
                                  VALUES (@LocationID, @Date, @Confirmed, @Deaths, @Recovered)", conn, transaction);
                            cmd.Parameters.AddWithValue("@LocationID", locationId);
                            cmd.Parameters.AddWithValue("@Date", date);
                            cmd.Parameters.AddWithValue("@Confirmed", confirmed);
                            cmd.Parameters.AddWithValue("@Deaths", deaths);
                            cmd.Parameters.AddWithValue("@Recovered", recovered);
                            await cmd.ExecuteNonQueryAsync();
                            totalInserted++;
                        }
                        transaction.Commit();
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  Error inserting data for {province}|{country}: {ex.Message}");
                    continue;
                }
            }

            Console.WriteLine($"✓ Global time series data imported successfully. Total records: {totalInserted}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ProcessGlobalTimeSeries: {ex.Message}");
            throw;
        }
    }

    private static async Task ProcessUsSampleCsv()
    {
        try
        {
            if (!File.Exists(UsCsvFile))
            {
                Console.WriteLine($"US CSV file not found: {UsCsvFile}. Skipping...");
                return;
            }

            Console.WriteLine($"Processing US file: {Path.GetFileName(UsCsvFile)}");

            using var fileReader = new StreamReader(UsCsvFile);
            using var csv = new CsvReader(fileReader, new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true });

            using var conn = new SqlConnection(ConnectionStringDb);
            await conn.OpenAsync();

            await csv.ReadAsync();
            csv.ReadHeader();

            int recordCount = 0;
            while (await csv.ReadAsync())
            {
                try
                {
                    var province = csv.GetField<string>("Province_State") ?? string.Empty;
                    var country = csv.GetField<string>("Country_Region");
                    if (string.IsNullOrEmpty(country))
                    {
                        continue;
                    }

                    var lat = csv.GetField<double?>("Lat");
                    var lon = csv.GetField<double?>("Long_");
                    var iso3 = csv.GetField<string>("ISO3");

                    long confirmed = 0;
                    csv.TryGetField<long>("Confirmed", out confirmed);

                    long deaths = 0;
                    csv.TryGetField<long>("Deaths", out deaths);

                    long recovered = 0;
                    csv.TryGetField<long>("Recovered", out recovered);

                    var dateStr = csv.GetField<string>("Date");
                    if (!DateTime.TryParse(dateStr, out var date))
                    {
                        continue;
                    }

                    int locationId = await GetOrInsertLocation(conn, province, country, lat, lon, iso3);

                    using var cmd = new SqlCommand(
                        @"IF NOT EXISTS (SELECT 1 FROM DailyMetrics WHERE LocationID = @LocationID AND Date = @Date)
                          INSERT INTO DailyMetrics (LocationID, Date, Confirmed, Deaths, Recovered) 
                          VALUES (@LocationID, @Date, @Confirmed, @Deaths, @Recovered)", conn);
                    cmd.Parameters.AddWithValue("@LocationID", locationId);
                    cmd.Parameters.AddWithValue("@Date", date);
                    cmd.Parameters.AddWithValue("@Confirmed", confirmed);
                    cmd.Parameters.AddWithValue("@Deaths", deaths);
                    cmd.Parameters.AddWithValue("@Recovered", recovered);
                    await cmd.ExecuteNonQueryAsync();
                    recordCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  Error processing US CSV row {csv.Context.Parser.Row}: {ex.Message}");
                    continue;
                }
            }

            Console.WriteLine($"✓ US sample data imported successfully. Records: {recordCount}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ProcessUsSampleCsv: {ex.Message}");
            throw;
        }
    }

    private static async Task<int> GetOrInsertLocation(SqlConnection conn, string province, string country, double? lat, double? lon, string iso3)
    {
        try
        {
            if (string.IsNullOrEmpty(country))
            {
                throw new ArgumentException("Country_Region cannot be null or empty.");
            }

            using var checkCmd = new SqlConnection(ConnectionStringDb);
            await checkCmd.OpenAsync();
            using var selectCmd = new SqlCommand(
                "SELECT LocationID FROM Locations WHERE Province_State = @Province AND Country_Region = @Country", checkCmd);
            selectCmd.Parameters.AddWithValue("@Province", (object)province ?? DBNull.Value);
            selectCmd.Parameters.AddWithValue("@Country", country);

            var id = await selectCmd.ExecuteScalarAsync();
            if (id != null)
            {
                return (int)id;
            }

            using var insertCmd = new SqlCommand(
                "INSERT INTO Locations (Province_State, Country_Region, Lat, Long, ISO3) OUTPUT INSERTED.LocationID " +
                "VALUES (@Province, @Country, @Lat, @Long, @ISO3)", checkCmd);
            insertCmd.Parameters.AddWithValue("@Province", (object)province ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@Country", country);
            insertCmd.Parameters.AddWithValue("@Lat", (object)lat ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@Long", (object)lon ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@ISO3", (object)iso3 ?? DBNull.Value);

            return (int)await insertCmd.ExecuteScalarAsync();
        }
        catch (SqlException ex)
        {
            Console.WriteLine($"SQL Error in GetOrInsertLocation for {province}|{country}: {ex.Message}");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetOrInsertLocation for {province}|{country}: {ex.Message}");
            throw;
        }
    }
}
