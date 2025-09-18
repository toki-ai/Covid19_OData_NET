using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CovidServer.Models;

public partial class Location
{
    [Key]
    public int LocationId { get; set; }

    public string? ProvinceState { get; set; }

    public string CountryRegion { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Long { get; set; }

    public string? Iso3 { get; set; }

    public virtual ICollection<DailyMetric> DailyMetrics { get; set; } = new List<DailyMetric>();
}
