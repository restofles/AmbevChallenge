using System.Security.Cryptography;

namespace AmbevChallenge.Api.Security;

public static class PasswordHasher
{
    public static void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        using var hmac = new HMACSHA512();
        salt = hmac.Key;
        hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
    }

    public static bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
    {
        if (storedHash is null || storedHash.Length == 0) return false;
        if (storedSalt is null || storedSalt.Length == 0) return false;
        using var hmac = new HMACSHA512(storedSalt);
        var computed = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return CryptographicOperations.FixedTimeEquals(computed, storedHash);
    }
}
