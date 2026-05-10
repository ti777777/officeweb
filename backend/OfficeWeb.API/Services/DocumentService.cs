using Microsoft.EntityFrameworkCore;
using OfficeWeb.API.Data;
using OfficeWeb.API.Models;

namespace OfficeWeb.API.Services;

public class DocumentService(AppDbContext db, IConfiguration config) : IDocumentService
{
    private readonly string _uploadPath = config["Storage:UploadPath"] ?? "uploads";

    public async Task<IEnumerable<Document>> GetAllAsync() =>
        await db.Documents.OrderByDescending(d => d.UpdatedAt).ToListAsync();

    public async Task<Document?> GetByIdAsync(Guid id) =>
        await db.Documents.FindAsync(id);

    public async Task<Document> UploadAsync(IFormFile file)
    {
        var id = Guid.NewGuid();
        var ext = Path.GetExtension(file.FileName);
        var storagePath = Path.Combine(_uploadPath, $"{id}{ext}");

        await using var fs = File.Create(storagePath);
        await file.CopyToAsync(fs);

        var doc = new Document
        {
            Id = id,
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            StoragePath = storagePath,
        };

        db.Documents.Add(doc);
        await db.SaveChangesAsync();
        return doc;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;

        if (File.Exists(doc.StoragePath))
            File.Delete(doc.StoragePath);

        db.Documents.Remove(doc);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<(Stream stream, Document document)?> GetFileStreamAsync(Guid id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null || !File.Exists(doc.StoragePath)) return null;
        return (File.OpenRead(doc.StoragePath), doc);
    }

    public async Task UpdateFileAsync(Guid id, Stream content)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return;

        await using (var fs = File.Create(doc.StoragePath))
        {
            await content.CopyToAsync(fs);
            doc.Size = fs.Length;
        }

        doc.Version = Guid.NewGuid().ToString("N");
        doc.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
}
