using AmbevChallenge.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace AmbevChallenge.Api.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Phone> Phones => Set<Phone>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Employee>(e =>
        {
            e.HasIndex(x => x.DocNumber).IsUnique();
            e.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
            e.Property(x => x.LastName).IsRequired().HasMaxLength(100);
            e.Property(x => x.Email).IsRequired().HasMaxLength(200);
            e.Property(x => x.DocNumber).IsRequired().HasMaxLength(50);

            e.HasOne(x => x.Manager)
             .WithMany()
             .HasForeignKey(x => x.ManagerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Phones)
             .WithOne(p => p.Employee)
             .HasForeignKey(p => p.EmployeeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Phone>(p =>
        {
            p.Property(x => x.Number).IsRequired().HasMaxLength(30);
        });
    }
}
