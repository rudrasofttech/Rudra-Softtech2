using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    // Suggested base class
    public abstract class RSTBaseController(RSTContext context) : ControllerBase
    {
        protected readonly RSTContext db = context;

        protected Member? GetCurrentMember()
        {
            var email = User.Claims.FirstOrDefault(t => t.Type == ClaimTypes.Email)?.Value;
            return string.IsNullOrWhiteSpace(email) ? null : db.Members.FirstOrDefault(d => d.Email == email);
        }

        protected bool CheckRole(string roles)
        {
            if (string.IsNullOrWhiteSpace(roles))
                return false;

            var allowedRoles = roles
                .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => !string.IsNullOrEmpty(r))
                .ToList();

            var userRoles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            return allowedRoles.Any(ar => userRoles.Any(ur => string.Equals(ar, ur, StringComparison.OrdinalIgnoreCase)));
        }
    }
}
