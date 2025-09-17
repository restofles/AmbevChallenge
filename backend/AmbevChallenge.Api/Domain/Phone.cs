namespace AmbevChallenge.Api.Domain;

public class Phone
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
}
