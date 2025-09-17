using AmbevChallenge.Api.Domain;
using AmbevChallenge.Api.Dtos;

namespace AmbevChallenge.Api.Mappers;

public static class EmployeeMapper
{
    public static EmployeeDto ToDto(this Employee e)
    {;
        return new EmployeeDto(
            e.Id,
            e.FirstName,
            e.LastName,
            e.Email,
            e.DocNumber,
            e.DateOfBirth,
            e.Role,
            e.ManagerId,
            e.Manager?.FirstName + " " + e.Manager?.LastName,
            e.Phones.Select(p => new PhoneDto(p.Number)).ToList()
        );
    }
}
