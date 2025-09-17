using AmbevChallenge.Api.Domain;
using AmbevChallenge.Api.Dtos;
using AmbevChallenge.Api.Infrastructure;
using AmbevChallenge.Api.Mappers;
using AmbevChallenge.Api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AmbevChallenge.Api.Endpoints;

public static class EmployeeEndpoints
{
    public static IEndpointRouteBuilder MapEmployees(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/employees")
                   .RequireAuthorization()
                   .WithTags("Employees");

        // List
        g.MapGet("/", async ([FromQuery] string? q, AppDbContext db) =>
        {
            var query = db.Employees
                .Include(e => e.Manager)
                .Include(e => e.Phones)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                query = query.Where(e =>
                    e.FirstName.Contains(q) ||
                    e.LastName.Contains(q) ||
                    e.Email.Contains(q) ||
                    e.DocNumber.Contains(q));
            }

            var list = await query.AsNoTracking().ToListAsync();
            return list.Select(e => e.ToDto());
        });

        // Get by id
        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var e = await db.Employees
                .Include(x => x.Manager)
                .Include(x => x.Phones)
                .FirstOrDefaultAsync(x => x.Id == id);

            return e is null ? Results.NotFound() : Results.Ok(e.ToDto());
        });

        // Create
        g.MapPost("/", async (
            [FromBody] EmployeeCreateDto dto,
            ClaimsPrincipal user,
            AppDbContext db) =>
        {
            // Age >= 18
            var age = DateTime.UtcNow.Year - dto.DateOfBirth.Year;
            if (dto.DateOfBirth.AddYears(age) > DateOnly.FromDateTime(DateTime.UtcNow)) age--;
            if (age < 18) return Results.BadRequest("Employee must be at least 18 years old.");

            // Unique DocNumber
            if (await db.Employees.AnyAsync(x => x.DocNumber == dto.DocNumber))
                return Results.BadRequest("DocNumber already exists.");

            // Phones >= 2
            if (dto.Phones == null || dto.Phones.Count < 2)
                return Results.BadRequest("Employee must have at least 2 phone numbers.");

            // Role hierarchy (creator cannot create above their own role)
            if (!TryGetUserRole(user, out var currentRole) || !CanCreate(dto.Role, currentRole))
                return Results.Forbid();

            // Normalize ManagerId (Guid.Empty -> null)
            Guid? managerIdCreate = dto.ManagerId is Guid m && m == Guid.Empty ? null : dto.ManagerId;

            PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);

            var e = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                DocNumber = dto.DocNumber,
                DateOfBirth = dto.DateOfBirth,
                Role = dto.Role,
                ManagerId = managerIdCreate,
                PasswordHash = hash,
                PasswordSalt = salt,
                Phones = dto.Phones.Select(p => new Phone { Number = p }).ToList()
            };

            db.Employees.Add(e);
            await db.SaveChangesAsync();
            return Results.Created($"/employees/{e.Id}", e.ToDto());
        });

        // Update
        g.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] EmployeeUpdateDto dto,
            ClaimsPrincipal user,
            AppDbContext db) =>
        {
            var e = await db.Employees.FirstOrDefaultAsync(x => x.Id == id);
            if (e is null) return Results.NotFound();

            // Age >= 18
            var age = DateTime.UtcNow.Year - dto.DateOfBirth.Year;
            if (dto.DateOfBirth.AddYears(age) > DateOnly.FromDateTime(DateTime.UtcNow)) age--;
            if (age < 18) return Results.BadRequest("Employee must be at least 18 years old.");

            // Phones >= 2
            if (dto.Phones == null || dto.Phones.Count < 2)
                return Results.BadRequest("Employee must have at least 2 phone numbers.");

            // Unique DocNumber (excluding self)
            var docExists = await db.Employees
                .AnyAsync(x => x.DocNumber == dto.DocNumber && x.Id != id);
            if (docExists) return Results.BadRequest("DocNumber already exists for another employee.");

            // Role hierarchy validations
            if (!TryGetUserRole(user, out var currentRole))
                return Results.Forbid();

            // (A) Can the caller edit someone with the employee's current role?
            if (!CanCreate(e.Role, currentRole))
                return Results.Forbid();

            // (B) Can the caller change to the requested new role?
            if (!CanCreate(dto.Role, currentRole))
                return Results.Forbid();

            // Manager cannot be self
            if (dto.ManagerId is Guid mg && mg == id)
                return Results.BadRequest("An employee cannot be their own manager.");

            // Normalize ManagerId (Guid.Empty -> null)
            Guid? managerIdUpdate = dto.ManagerId is Guid m2 && m2 == Guid.Empty ? null : dto.ManagerId;

            // Apply scalar props
            e.FirstName = dto.FirstName;
            e.LastName = dto.LastName;
            e.Email = dto.Email;
            e.DocNumber = dto.DocNumber;
            e.DateOfBirth = dto.DateOfBirth;
            e.Role = dto.Role;
            e.ManagerId = managerIdUpdate;

            // Phones: set-based delete + insert to avoid concurrency issues
            using var tx = await db.Database.BeginTransactionAsync();
            try
            {
                await db.Phones.Where(p => p.EmployeeId == id).ExecuteDeleteAsync();

                var newPhones = dto.Phones
                    .Distinct()
                    .Select(p => new Phone { EmployeeId = id, Number = p })
                    .ToList();

                await db.Phones.AddRangeAsync(newPhones);

                await db.SaveChangesAsync();
                await tx.CommitAsync();

                await db.Entry(e).Collection(x => x.Phones).LoadAsync();

                return Results.Ok(e.ToDto());
            }
            catch (DbUpdateConcurrencyException)
            {
                await tx.RollbackAsync();
                return Results.Conflict("The employee was modified or deleted by another process. Reload and try again.");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return Results.Problem($"Error updating employee: {ex.Message}");
            }
        });

        // Delete (with role hierarchy validation)
        g.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var e = await db.Employees.FirstOrDefaultAsync(x => x.Id == id);
            if (e is null) return Results.NotFound();

            if (!TryGetUserRole(user, out var currentRole))
                return Results.Forbid();

            // Can the caller delete someone with this current role?
            if (!CanCreate(e.Role, currentRole))
                return Results.Forbid();

            using var tx = await db.Database.BeginTransactionAsync();
            try
            {
                await db.Phones.Where(p => p.EmployeeId == id).ExecuteDeleteAsync();
                db.Employees.Remove(e);
                await db.SaveChangesAsync();
                await tx.CommitAsync();
                return Results.NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                await tx.RollbackAsync();
                return Results.Conflict("The employee was already removed by another process.");
            }
        });

        return app;
    }

    private static bool TryGetUserRole(ClaimsPrincipal user, out string role)
    {
        role = user.FindFirst(ClaimTypes.Role)?.Value
             ?? user.FindFirst("role")?.Value
             ?? string.Empty;
        role = role.ToLowerInvariant();
        return !string.IsNullOrWhiteSpace(role);
    }

    private static bool CanCreate(Role targetRole, string current)
    {
        var rank = new Dictionary<string, int>
        {
            ["employee"] = 1,
            ["leader"] = 2,
            ["director"] = 3
        };

        var target = targetRole.ToString().ToLowerInvariant();
        return rank.TryGetValue(current, out var curRank)
            && rank.TryGetValue(target, out var tgtRank)
            && curRank >= tgtRank;
    }
}
