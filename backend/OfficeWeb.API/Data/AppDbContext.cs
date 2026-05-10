using Microsoft.EntityFrameworkCore;
using OfficeWeb.API.Models;

namespace OfficeWeb.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<User> Users => Set<User>();
    public DbSet<WopiLock> WopiLocks => Set<WopiLock>();
}
