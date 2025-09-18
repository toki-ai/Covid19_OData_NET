using System;
using System.Collections.Generic;

namespace CovidServer.Models;

public partial class MetricsType
{
    public int TypeId { get; set; }

    public string MetricName { get; set; } = null!;
}
