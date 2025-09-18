using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace CovidServer.Models;

public partial class Prn3CovidContext : DbContext
{
    public Prn3CovidContext()
    {
    }

    public Prn3CovidContext(DbContextOptions<Prn3CovidContext> options)
        : base(options)
    {
    }

    public virtual DbSet<DailyMetric> DailyMetrics { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<MetricsType> MetricsTypes { get; set; }

    public static string GetConnectionString(string connectionStringName)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json")
            .Build();

        string connectionString = config.GetConnectionString(connectionStringName);
        return connectionString;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer(GetConnectionString("DefaultConnection")).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailyMetric>(entity =>
        {
            entity.HasKey(e => e.MetricId).HasName("PK__DailyMet__56105645F5EA67FA");

            entity.HasIndex(e => new { e.LocationId, e.Date }, "UQ_DailyMetrics_Location_Date").IsUnique();

            entity.Property(e => e.MetricId).HasColumnName("MetricID");
            entity.Property(e => e.Active).HasComputedColumnSql("(([Confirmed]-[Deaths])-[Recovered])", true);
            entity.Property(e => e.Confirmed).HasDefaultValue(0L);
            entity.Property(e => e.Date).HasColumnType("datetime");
            entity.Property(e => e.Deaths).HasDefaultValue(0L);
            entity.Property(e => e.LocationId).HasColumnName("LocationID");
            entity.Property(e => e.Recovered).HasDefaultValue(0L);

            entity.HasOne(d => d.Location).WithMany(p => p.DailyMetrics)
                .HasForeignKey(d => d.LocationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DailyMetr__Locat__31EC6D26");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.LocationId).HasName("PK__Location__E7FEA4774296CAB6");

            entity.HasIndex(e => new { e.ProvinceState, e.CountryRegion }, "UQ_Locations_Province_Country").IsUnique();

            entity.Property(e => e.LocationId).HasColumnName("LocationID");
            entity.Property(e => e.CountryRegion)
                .HasMaxLength(255)
                .HasColumnName("Country_Region");
            entity.Property(e => e.Iso3)
                .HasMaxLength(3)
                .HasColumnName("ISO3");
            entity.Property(e => e.ProvinceState)
                .HasMaxLength(255)
                .HasColumnName("Province_State");
        });

        modelBuilder.Entity<MetricsType>(entity =>
        {
            entity.HasKey(e => e.TypeId).HasName("PK__MetricsT__516F03951CEEFF02");

            entity.HasIndex(e => e.MetricName, "UQ__MetricsT__D86DCBE7FA5A83F9").IsUnique();

            entity.Property(e => e.TypeId).HasColumnName("TypeID");
            entity.Property(e => e.MetricName).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
