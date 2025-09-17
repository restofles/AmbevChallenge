using AmbevChallenge.Api.Domain;
using AmbevChallenge.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace AmbevChallenge.Api.Infrastructure;

public static class SeedData
{
    public static async Task EnsureSeedAsync(this IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();

        if (!await db.Employees.AnyAsync())
        {
            // Create three users with roles
            var users = new List<Employee>();

            void AddUser(string first, string last, string email, string doc, DateOnly dob, Role role)
            {
                PasswordHasher.CreatePasswordHash("P@ssw0rd!", out var hash, out var salt);
                users.Add(new Employee
                {
                    FirstName = first,
                    LastName = last,
                    Email = email,
                    DocNumber = doc,
                    DateOfBirth = dob,
                    Role = role,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    Phones = new List<Phone>
                    {
                        new Phone { Number = "+55 11 99999-0001" },
                        new Phone { Number = "+55 11 98888-0001" }
                    }
                });
            }

            AddUser("Erica", "Employee", "employee@demo.com", "EMP-001", new DateOnly(1995, 1, 10), Role.Employee);
            AddUser("Liam", "Leader", "leader@demo.com", "LED-001", new DateOnly(1990, 5, 20), Role.Leader);
            AddUser("Diana", "Director", "director@demo.com", "DIR-001", new DateOnly(1985, 8, 15), Role.Director);

            // manager chain: employee -> leader -> director
            var leader = users.First(u => u.Role == Role.Leader);
            var director = users.First(u => u.Role == Role.Director);
            foreach (var u in users)
            {
                if (u.Role == Role.Employee) u.Manager = leader;
                if (u.Role == Role.Leader) u.Manager = director;
            }

            db.Employees.AddRange(users);
            await db.SaveChangesAsync();
        }
    }
}
