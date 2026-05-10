using OfficeWeb.API.Models;

namespace OfficeWeb.API.Services;

public interface IDocumentService
{
    Task<IEnumerable<Document>> GetAllAsync();
    Task<Document?> GetByIdAsync(Guid id);
    Task<Document> UploadAsync(IFormFile file);
    Task<Document> UploadAsync(IFormFile file, Guid workspaceId, Guid ownerId);
    Task<IEnumerable<Document>> GetByWorkspaceAsync(Guid workspaceId);
    Task<bool> DeleteAsync(Guid id);
    Task<(Stream stream, Document document)?> GetFileStreamAsync(Guid id);
    Task UpdateFileAsync(Guid id, Stream content);
}
