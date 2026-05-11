using Microsoft.EntityFrameworkCore;
using OfficeWeb.API.Data;
using OfficeWeb.API.Models;

namespace OfficeWeb.API.Services;

public class FolderService(AppDbContext db) : IFolderService
{
    public async Task<IEnumerable<Folder>> GetByWorkspaceAsync(Guid workspaceId) =>
        await db.Folders
            .Where(f => f.WorkspaceId == workspaceId)
            .OrderBy(f => f.Name)
            .ToListAsync();

    public async Task<Folder?> GetByIdAsync(Guid folderId, Guid workspaceId) =>
        await db.Folders.FirstOrDefaultAsync(f => f.Id == folderId && f.WorkspaceId == workspaceId);

    public async Task<Folder> CreateAsync(string name, Guid workspaceId)
    {
        var folder = new Folder { Name = name, WorkspaceId = workspaceId };
        db.Folders.Add(folder);
        await db.SaveChangesAsync();
        return folder;
    }

    public async Task<Folder?> RenameAsync(Guid folderId, Guid workspaceId, string name)
    {
        var folder = await GetByIdAsync(folderId, workspaceId);
        if (folder is null) return null;
        folder.Name = name;
        await db.SaveChangesAsync();
        return folder;
    }

    public async Task<bool> DeleteAsync(Guid folderId, Guid workspaceId)
    {
        var folder = await db.Folders
            .Include(f => f.Documents)
            .FirstOrDefaultAsync(f => f.Id == folderId && f.WorkspaceId == workspaceId);
        if (folder is null) return false;
        foreach (var doc in folder.Documents)
            doc.FolderId = null;
        db.Folders.Remove(folder);
        await db.SaveChangesAsync();
        return true;
    }
}
