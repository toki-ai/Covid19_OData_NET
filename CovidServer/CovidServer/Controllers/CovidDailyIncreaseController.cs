using CovidServer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CovidServer.Controllers;

[Route("odata/CovidDailyIncrease")]
public class CovidDailyIncreaseController : ODataController
{
    private readonly Prn3CovidContext _context;
    public CovidDailyIncreaseController(Prn3CovidContext context)
    {
        _context = context;
    }

    [EnableQuery]
    [HttpGet]
    public IQueryable<object> Get([FromQuery] string? type, [FromQuery] DateTime? date)
    {
        var query = _context.DailyMetrics.Include(dm => dm.Location).AsQueryable();
        
        // Nếu có ngày cụ thể, lọc theo ngày đó và ngày trước đó
        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            var previousDate = targetDate.AddDays(-1);
            
            var currentDayData = query.Where(dm => dm.Date.Date == targetDate);
            var previousDayData = query.Where(dm => dm.Date.Date == previousDate);
            
            var result = from current in currentDayData
                        from previous in previousDayData.Where(p => p.LocationId == current.LocationId).DefaultIfEmpty()
                        group new { current, previous } by current.Location.CountryRegion into g
                        select new {
                            Country = g.Key,
                            Date = targetDate,
                            CurrentValue = type == "Confirmed" ? g.Sum(x => x.current.Confirmed ?? 0)
                                : type == "Active" ? g.Sum(x => x.current.Active ?? 0)
                                : type == "Recovered" ? g.Sum(x => x.current.Recovered ?? 0)
                                : type == "Deaths" ? g.Sum(x => x.current.Deaths ?? 0)
                                : 0,
                            PreviousValue = type == "Confirmed" ? g.Sum(x => x.previous != null ? x.previous.Confirmed ?? 0 : 0)
                                : type == "Active" ? g.Sum(x => x.previous != null ? x.previous.Active ?? 0 : 0)
                                : type == "Recovered" ? g.Sum(x => x.previous != null ? x.previous.Recovered ?? 0 : 0)
                                : type == "Deaths" ? g.Sum(x => x.previous != null ? x.previous.Deaths ?? 0 : 0)
                                : 0,
                            DailyIncrease = (type == "Confirmed" ? g.Sum(x => x.current.Confirmed ?? 0) - g.Sum(x => x.previous != null ? x.previous.Confirmed ?? 0 : 0)
                                : type == "Active" ? g.Sum(x => x.current.Active ?? 0) - g.Sum(x => x.previous != null ? x.previous.Active ?? 0 : 0)
                                : type == "Recovered" ? g.Sum(x => x.current.Recovered ?? 0) - g.Sum(x => x.previous != null ? x.previous.Recovered ?? 0 : 0)
                                : type == "Deaths" ? g.Sum(x => x.current.Deaths ?? 0) - g.Sum(x => x.previous != null ? x.previous.Deaths ?? 0 : 0)
                                : 0),
                            Lat = g.Select(x => x.current.Location.Lat).FirstOrDefault(),
                            Long = g.Select(x => x.current.Location.Long).FirstOrDefault()
                        };
            
            return result.AsQueryable();
        }
        else
        {
            // Nếu không có ngày cụ thể, trả về dữ liệu của ngày gần nhất
            var latestDate = query.Max(dm => dm.Date);
            var previousDate = latestDate.AddDays(-1);
            
            var currentDayData = query.Where(dm => dm.Date.Date == latestDate.Date);
            var previousDayData = query.Where(dm => dm.Date.Date == previousDate.Date);
            
            var result = from current in currentDayData
                        from previous in previousDayData.Where(p => p.LocationId == current.LocationId).DefaultIfEmpty()
                        group new { current, previous } by current.Location.CountryRegion into g
                        select new {
                            Country = g.Key,
                            Date = latestDate,
                            CurrentValue = type == "Confirmed" ? g.Sum(x => x.current.Confirmed ?? 0)
                                : type == "Active" ? g.Sum(x => x.current.Active ?? 0)
                                : type == "Recovered" ? g.Sum(x => x.current.Recovered ?? 0)
                                : type == "Deaths" ? g.Sum(x => x.current.Deaths ?? 0)
                                : 0,
                            PreviousValue = type == "Confirmed" ? g.Sum(x => x.previous != null ? x.previous.Confirmed ?? 0 : 0)
                                : type == "Active" ? g.Sum(x => x.previous != null ? x.previous.Active ?? 0 : 0)
                                : type == "Recovered" ? g.Sum(x => x.previous != null ? x.previous.Recovered ?? 0 : 0)
                                : type == "Deaths" ? g.Sum(x => x.previous != null ? x.previous.Deaths ?? 0 : 0)
                                : 0,
                            DailyIncrease = (type == "Confirmed" ? g.Sum(x => x.current.Confirmed ?? 0) - g.Sum(x => x.previous != null ? x.previous.Confirmed ?? 0 : 0)
                                : type == "Active" ? g.Sum(x => x.current.Active ?? 0) - g.Sum(x => x.previous != null ? x.previous.Active ?? 0 : 0)
                                : type == "Recovered" ? g.Sum(x => x.current.Recovered ?? 0) - g.Sum(x => x.previous != null ? x.previous.Recovered ?? 0 : 0)
                                : type == "Deaths" ? g.Sum(x => x.current.Deaths ?? 0) - g.Sum(x => x.previous != null ? x.previous.Deaths ?? 0 : 0)
                                : 0),
                            Lat = g.Select(x => x.current.Location.Lat).FirstOrDefault(),
                            Long = g.Select(x => x.current.Location.Long).FirstOrDefault()
                        };
            
            return result.AsQueryable();
        }
    }

    [EnableQuery]
    [HttpGet("dates")]
    public IQueryable<object> GetAvailableDates()
    {
        return _context.DailyMetrics
            .Select(dm => dm.Date.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .Take(30) 
            .Select(d => new { date = d }); 
    }
}