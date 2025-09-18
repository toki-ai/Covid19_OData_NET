using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CovidServer.Models;

public partial class DailyMetric
{
    [Key]
    public int MetricId { get; set; }

    public int LocationId { get; set; }

    public DateTime Date { get; set; }

    public long? Confirmed { get; set; }

    public long? Deaths { get; set; }

    public long? Recovered { get; set; }

    public long? Active { get; set; }

    public virtual Location Location { get; set; } = null!;
}
