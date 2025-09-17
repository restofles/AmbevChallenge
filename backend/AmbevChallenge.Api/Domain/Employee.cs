namespace AmbevChallenge.Api.Domain;

public enum Role { Employee = 1, Leader = 2, Director = 3 }

public class Employee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = null!;
    public string LastName  { get; set; } = null!;
    public string Email     { get; set; } = null!;
    public string DocNumber { get; set; } = null!;
    public DateOnly DateOfBirth { get; set; }
    public Role Role { get; set; } = Role.Employee;

    public Guid? ManagerId { get; set; }
    public Employee? Manager { get; set; }

    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    public List<Phone> Phones { get; set; } = new();
}
