using System.ComponentModel.DataAnnotations;
using AmbevChallenge.Api.Domain;
using AmbevChallenge.Api.Infrastructure;
using AmbevChallenge.Api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmbevChallenge.Api.Endpoints;

public static class AuthEndpoints
{
    public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
    public record LoginResponse(string Token);

    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/login", async (
            [FromBody] LoginRequest req,
            AppDbContext db,
            JwtTokenService tokens) =>
        {
            var user = await db.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Email == req.Email);

            if (user is null) return Results.Unauthorized();

            if (!PasswordHasher.VerifyPassword(req.Password, user.PasswordHash, user.PasswordSalt))
                return Results.Unauthorized();

            var token = tokens.CreateToken(user.Id, user.Email, user.Role, user.FirstName);
            return Results.Ok(new LoginResponse(token));
        })
        .WithName("AuthLogin")
        .WithTags("Auth")
        .Produces<LoginResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }
}
