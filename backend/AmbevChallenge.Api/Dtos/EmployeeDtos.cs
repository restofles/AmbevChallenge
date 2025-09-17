using System.ComponentModel.DataAnnotations;
using AmbevChallenge.Api.Domain;

namespace AmbevChallenge.Api.Dtos;

public record PhoneDto(string Number);

public record EmployeeDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string DocNumber,
    DateOnly DateOfBirth,
    Role Role,
    Guid? ManagerId,
    string? ManagerName,
    List<PhoneDto> Phones
);

public record EmployeeCreateDto(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required] string DocNumber,
    [Required] DateOnly DateOfBirth,
    [Required] Role Role,
    Guid? ManagerId,
    [Required, MinLength(2)] List<string> Phones,
    [Required] string Password
);

public record EmployeeUpdateDto(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required] string DocNumber,
    [Required] DateOnly DateOfBirth,
    [Required] Role Role,
    Guid? ManagerId,
    [Required, MinLength(2)] List<string> Phones
);
