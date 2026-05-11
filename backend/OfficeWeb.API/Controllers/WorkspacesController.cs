using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeWeb.API.Services;

namespace OfficeWeb.API.Controllers;

[Authorize]
[ApiController]
[Route("api/workspaces")]
public class WorkspacesController(IWorkspaceService workspaces, IDocumentService docs) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    public record CreateWorkspaceRequest(string Name, string? Description);
    public record RenameWorkspaceRequest(string Name);
    public record AddMemberRequest(string UsernameOrEmail);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await workspaces.GetUserWorkspacesAsync(CurrentUserId);
        return Ok(list.Select(w => ToDto(w)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkspaceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Workspace name is required." });
        var workspace = await workspaces.CreateAsync(req.Name, req.Description, CurrentUserId);
        var dto = ToDto(workspace);
        return CreatedAtAction(nameof(GetById), new { id = workspace.Id }, dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var workspace = await workspaces.GetByIdAsync(id, CurrentUserId);
        return workspace is null ? NotFound() : Ok(ToDto(workspace));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Rename(Guid id, [FromBody] RenameWorkspaceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Workspace name is required." });
        var workspace = await workspaces.RenameAsync(id, CurrentUserId, req.Name);
        return workspace is null ? NotFound() : Ok(ToDto(workspace));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await workspaces.DeleteAsync(id, CurrentUserId) ? NoContent() : NotFound();

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid id)
    {
        var workspace = await workspaces.GetByIdAsync(id, CurrentUserId);
        if (workspace is null) return NotFound();
        return Ok(await docs.GetByWorkspaceAsync(id));
    }

    [HttpPost("{id:guid}/documents")]
    [RequestSizeLimit(104_857_600)]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file)
    {
        var workspace = await workspaces.GetByIdAsync(id, CurrentUserId);
        if (workspace is null) return NotFound();
        if (file.Length == 0) return BadRequest(new { error = "Empty file." });
        var doc = await docs.UploadAsync(file, id, CurrentUserId);
        return Created($"/api/documents/{doc.Id}", doc);
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest req)
    {
        var success = await workspaces.AddMemberAsync(id, CurrentUserId, req.UsernameOrEmail);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var success = await workspaces.RemoveMemberAsync(id, CurrentUserId, userId);
        return success ? NoContent() : NotFound();
    }

    private static object ToDto(OfficeWeb.API.Models.Workspace w) => new
    {
        w.Id,
        w.Name,
        w.Description,
        w.CreatedAt,
        Members = w.Members.Select(m => new
        {
            m.UserId,
            m.User.Username,
            m.User.Email,
            m.Role,
            m.JoinedAt,
        }),
    };
}
