using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using OfficeWeb.API.Data;
using OfficeWeb.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "OfficeWeb API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            []
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=officeweb.db"));

builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddSingleton<IWopiTokenService, WopiTokenService>();
builder.Services.AddHttpClient();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Idempotent: add Users table when upgrading an existing database.
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Users" (
            "Id"           TEXT NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY,
            "Username"     TEXT NOT NULL,
            "Email"        TEXT NOT NULL,
            "PasswordHash" TEXT NOT NULL,
            "CreatedAt"    TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email"     ON "Users" ("Email");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username"  ON "Users" ("Username");
        """);

    // Idempotent: add Workspace tables when upgrading an existing database.
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Workspaces" (
            "Id"          TEXT NOT NULL CONSTRAINT "PK_Workspaces" PRIMARY KEY,
            "Name"        TEXT NOT NULL,
            "Description" TEXT,
            "CreatedAt"   TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS "WorkspaceUsers" (
            "WorkspaceId" TEXT NOT NULL,
            "UserId"      TEXT NOT NULL,
            "Role"        TEXT NOT NULL DEFAULT 'Member',
            "JoinedAt"    TEXT NOT NULL,
            CONSTRAINT "PK_WorkspaceUsers" PRIMARY KEY ("WorkspaceId", "UserId")
        );
        """);

    // Idempotent: add Folders table when upgrading an existing database.
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Folders" (
            "Id"          TEXT NOT NULL CONSTRAINT "PK_Folders" PRIMARY KEY,
            "Name"        TEXT NOT NULL,
            "CreatedAt"   TEXT NOT NULL,
            "WorkspaceId" TEXT NOT NULL,
            CONSTRAINT "FK_Folders_Workspaces_WorkspaceId" FOREIGN KEY ("WorkspaceId") REFERENCES "Workspaces" ("Id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_Folders_WorkspaceId" ON "Folders" ("WorkspaceId");
        """);

    // Idempotent: add new columns to Documents (SQLite has no ADD COLUMN IF NOT EXISTS).
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Documents\" ADD COLUMN \"WorkspaceId\" TEXT"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Documents\" ADD COLUMN \"OwnerId\" TEXT"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Documents\" ADD COLUMN \"FolderId\" TEXT"); } catch { }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var uploadPath = builder.Configuration["Storage:UploadPath"] ?? "uploads";
Directory.CreateDirectory(uploadPath);

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
