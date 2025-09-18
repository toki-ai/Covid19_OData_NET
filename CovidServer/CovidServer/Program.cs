
using CovidServer.Models;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;


var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);


// Thêm CORS cho phép truy cập từ frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy  =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Thêm DbContext với IConfiguration
builder.Services.AddDbContext<Prn3CovidContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// Thêm OData
builder.Services.AddControllers().AddOData(opt =>
    opt.AddRouteComponents("odata", GetEdmModel())
       .EnableQueryFeatures()
);

var app = builder.Build();


// Cấu hình middleware
app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();
app.MapControllers();

app.Run();

static IEdmModel GetEdmModel()
{
    var odataBuilder = new ODataConventionModelBuilder();
    
    // Cấu hình Location entity với key rõ ràng
    var locationEntity = odataBuilder.EntitySet<Location>("Locations");
    locationEntity.EntityType.HasKey(l => l.LocationId);
    
    // Cấu hình DailyMetric entity với key rõ ràng
    var dailyMetricEntity = odataBuilder.EntitySet<DailyMetric>("DailyMetrics");
    dailyMetricEntity.EntityType.HasKey(d => d.MetricId);
    
    return odataBuilder.GetEdmModel();
}