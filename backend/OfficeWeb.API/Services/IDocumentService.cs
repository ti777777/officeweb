using OfficeWeb.API.Models;

namespace OfficeWeb.API.Services;

public interface IDocumentService
{
    Task<IEnumerable<Document>> GetAllAsync();
    Task<Document?> GetByIdAsync(Guid id);
    Task<Document> UploadAsync(IFormFile file);
    Task<Document> UploadAsync(IFormFile file, Guid workspaceId, Guid ownerId, Guid? folderId = null);
    Task<IEnumerable<Document>> GetByWorkspaceAsync(Guid workspaceId);
    Task<IEnumerable<Document>> GetByFolderAsync(Guid folderId);
    Task<bool> DeleteAsync(Guid id);
    Task<(Stream stream, Document document)?> GetFileStreamAsync(Guid id);
    Task UpdateFileAsync(Guid id, Stream content);
    Task<Document?> MoveAsync(Guid id, Guid? folderId);
}
