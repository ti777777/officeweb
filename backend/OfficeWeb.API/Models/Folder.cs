namespace OfficeWeb.API.Models;

public class Folder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    public ICollection<Document> Documents { get; set; } = [];
}
