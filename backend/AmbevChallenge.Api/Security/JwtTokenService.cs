using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AmbevChallenge.Api.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AmbevChallenge.Api.Security;

public class JwtTokenService(IConfiguration cfg)
{
    public string CreateToken(Guid userId, string email, Role role, string name)
    {
        var jwt = cfg.GetSection("Jwt");
        var issuer = jwt["Issuer"]!;
        var audience = jwt["Audience"]!;
        var secret = jwt["Secret"]!;
        var roleValue = role.ToString().ToLowerInvariant();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("role", roleValue),
            new Claim(ClaimTypes.Role, roleValue),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
