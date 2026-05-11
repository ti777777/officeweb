using Microsoft.EntityFrameworkCore;
using OfficeWeb.API.Models;

namespace OfficeWeb.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<User> Users => Set<User>();
    public DbSet<WopiLock> WopiLocks => Set<WopiLock>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceUser> WorkspaceUsers => Set<WorkspaceUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkspaceUser>()
            .HasKey(wu => new { wu.WorkspaceId, wu.UserId });

        modelBuilder.Entity<WorkspaceUser>()
            .HasOne(wu => wu.Workspace)
            .WithMany(w => w.Members)
            .HasForeignKey(wu => wu.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkspaceUser>()
            .HasOne(wu => wu.User)
            .WithMany(u => u.WorkspaceMemberships)
            .HasForeignKey(wu => wu.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Folder>()
            .HasOne(f => f.Workspace)
            .WithMany(w => w.Folders)
            .HasForeignKey(f => f.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Document>()
            .HasOne(d => d.Workspace)
            .WithMany(w => w.Documents)
            .HasForeignKey(d => d.WorkspaceId)
            .IsRequired(false);

        modelBuilder.Entity<Document>()
            .HasOne(d => d.Folder)
            .WithMany(f => f.Documents)
            .HasForeignKey(d => d.FolderId)
            .IsRequired(false);

        modelBuilder.Entity<Document>()
            .HasOne(d => d.Owner)
            .WithMany()
            .HasForeignKey(d => d.OwnerId)
            .IsRequired(false);
    }
}
