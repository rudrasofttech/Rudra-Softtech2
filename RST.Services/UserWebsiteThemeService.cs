using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;

namespace RST.Services
{
    public interface IUserWebsiteThemeService
    {
        Task<PagedData<UserWebsiteTheme>> GetThemesAsync(string? keyword, int page, int pageSize, WebsiteType? wstype, HttpRequest? request = null);
        Task<UserWebsiteTheme?> GetThemeByIdAsync(Guid id, HttpRequest? request = null);
        Task<UserWebsiteTheme?> CreateThemeAsync(PostUserWebsiteThemeDTO model, int createdById, HttpRequest? request = null);
        Task<UserWebsiteTheme?> UpdateThemeAsync(Guid id, PostUserWebsiteThemeDTO model, int modifiedById, HttpRequest? request = null);
        Task<bool> DeleteThemeAsync(Guid id);
        Task<bool> IsDuplicateNameAsync(string name, Guid? excludeId = null);
        string? SaveImageFromBase64(string base64Image, Guid fileGuid, string folderRelativePath, int maxWidth, int maxHeight, ILogger logger);
    }

    public class UserWebsiteThemeService : IUserWebsiteThemeService
    {
        private readonly RSTContext _db;
        private readonly ILogger<UserWebsiteThemeService> _logger;

        public UserWebsiteThemeService(RSTContext db, ILogger<UserWebsiteThemeService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<PagedData<UserWebsiteTheme>> GetThemesAsync(string? keyword, int page, int pageSize, WebsiteType? wstype, HttpRequest? request = null)
        {
            var query = _db.UserWebsiteThemes.AsQueryable();

            if (wstype.HasValue)
                query = query.Where(t => t.WSType == wstype.Value);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var keywords = keyword.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var word in keywords)
                {
                    var temp = word;
                    query = query.Where(t =>
                        (t.Name != null && t.Name.Contains(temp)) ||
                        (t.Tags != null && t.Tags.Contains(temp))
                    );
                }
            }

            int count = await query.CountAsync();

            var pagedQuery = await query.OrderBy(t => t.CreateDate)
                                        .Skip((page - 1) * pageSize)
                                        .Take(pageSize)
                                        .ToListAsync();

            // Prepend host to thumbnail if needed
            if (request != null)
            {
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";
                foreach (var theme in pagedQuery)
                {
                    if (!string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
                    {
                        theme.Thumbnail = hostUrl + theme.Thumbnail;
                    }
                }
            }

            return new PagedData<UserWebsiteTheme>
            {
                PageIndex = page,
                PageSize = pageSize,
                TotalRecords = count,
                Items = pagedQuery
            };
        }

        public async Task<UserWebsiteTheme?> GetThemeByIdAsync(Guid id, HttpRequest? request = null)
        {
            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == id);
            if (theme == null)
                return null;

            if (request != null && !string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
            {
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";
                theme.Thumbnail = hostUrl + theme.Thumbnail;
            }
            return theme;
        }

        public async Task<UserWebsiteTheme?> CreateThemeAsync(PostUserWebsiteThemeDTO model, int createdById, HttpRequest? request = null)
        {
            if (await IsDuplicateNameAsync(model.Name))
                return null;

            var themeId = Guid.NewGuid();
            string? thumbnailPath = null;

            if (!string.IsNullOrWhiteSpace(model.Thumbnail) && model.Thumbnail.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                thumbnailPath = SaveImageFromBase64(model.Thumbnail, themeId, "drive/uwstheme", 500, 500, _logger);
                if (thumbnailPath == null)
                    return null;
            }
            else
            {
                thumbnailPath = model.Thumbnail;
            }

            var theme = new UserWebsiteTheme
            {
                Id = themeId,
                Name = model.Name,
                Tags = model.Tags,
                Html = model.Html,
                WSType = model.WSType,
                Thumbnail = thumbnailPath,
                CreateDate = DateTime.UtcNow,
                ModifyDate = null,
                CreatedById = createdById
            };
            _db.UserWebsiteThemes.Add(theme);
            await _db.SaveChangesAsync();

            // Prepend host if needed
            if (request != null && !string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
            {
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";
                theme.Thumbnail = hostUrl + theme.Thumbnail;
            }

            return theme;
        }

        public async Task<UserWebsiteTheme?> UpdateThemeAsync(Guid id, PostUserWebsiteThemeDTO model, int modifiedById, HttpRequest? request = null)
        {
            var existingTheme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == id);
            if (existingTheme == null)
                return null;

            // Check for duplicate name (excluding current theme)
            if (await IsDuplicateNameAsync(model.Name, id))
                return null;

            string? thumbnailPath = model.Thumbnail;
            if (!string.IsNullOrWhiteSpace(model.Thumbnail) && model.Thumbnail.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                thumbnailPath = SaveImageFromBase64(model.Thumbnail, id, "drive/uwstheme", 500, 500, _logger);
                if (thumbnailPath == null)
                    return null;
            }

            existingTheme.Name = model.Name;
            existingTheme.Tags = model.Tags;
            existingTheme.Html = model.Html;
            existingTheme.Thumbnail = thumbnailPath;
            existingTheme.ModifyDate = DateTime.UtcNow;
            existingTheme.WSType = model.WSType;
            existingTheme.ModifiedById = modifiedById;
            await _db.SaveChangesAsync();

            // Prepend host if needed
            if (request != null && !string.IsNullOrWhiteSpace(existingTheme.Thumbnail) && existingTheme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
            {
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";
                existingTheme.Thumbnail = hostUrl + existingTheme.Thumbnail;
            }

            return existingTheme;
        }

        public async Task<bool> DeleteThemeAsync(Guid id)
        {
            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == id);
            if (theme == null)
                return false;

            // Remove associated thumbnail file if it exists and is a local file
            if (!string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme/", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var thumbnailPath = Path.Combine(webRootPath, theme.Thumbnail.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(thumbnailPath))
                        System.IO.File.Delete(thumbnailPath);
                }
                catch (Exception fileEx)
                {
                    _logger.LogWarning(fileEx, "Failed to delete thumbnail file for theme {ThemeId}", theme.Id);
                }
            }

            _db.UserWebsiteThemes.Remove(theme);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsDuplicateNameAsync(string name, Guid? excludeId = null)
        {
            var query = _db.UserWebsiteThemes.AsQueryable();
            if (excludeId.HasValue)
                query = query.Where(t => t.Id != excludeId.Value);

            return await query.AnyAsync(t => t.Name.ToLower() == name.ToLower());
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public string? SaveImageFromBase64(string base64Image, Guid fileGuid, string folderRelativePath, int maxWidth, int maxHeight, ILogger logger)
        {
            if (string.IsNullOrWhiteSpace(base64Image) || !base64Image.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return null;

            try
            {
                string fileExt = ".png";
                if (base64Image.StartsWith("data:image/png"))
                    fileExt = ".png";
                else if (base64Image.StartsWith("data:image/jpeg") || base64Image.StartsWith("data:image/jpg"))
                    fileExt = ".jpg";

                var base64Parts = base64Image.Split(',');
                if (base64Parts.Length != 2)
                    return null;

                var bytes = Convert.FromBase64String(base64Parts[1]);
                var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var folderPath = Path.Combine(webRootPath, folderRelativePath);
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{fileGuid}{fileExt}";
                var filePath = Path.Combine(folderPath, fileName);

                // Resize image to maxWidth x maxHeight maintaining aspect ratio
                using (var inputStream = new MemoryStream(bytes))
                using (var image = System.Drawing.Image.FromStream(inputStream))
                {
                    int width = image.Width;
                    int height = image.Height;
                    if (width > maxWidth || height > maxHeight)
                    {
                        double ratio = Math.Min(maxWidth / (double)width, maxHeight / (double)height);
                        width = (int)(image.Width * ratio);
                        height = (int)(image.Height * ratio);
                    }

                    using (var bmp = new System.Drawing.Bitmap(width, height))
                    using (var graphics = System.Drawing.Graphics.FromImage(bmp))
                    {
                        graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                        graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                        graphics.Clear(System.Drawing.Color.Transparent);
                        graphics.DrawImage(image, 0, 0, width, height);

                        if (fileExt == ".png")
                            bmp.Save(filePath, System.Drawing.Imaging.ImageFormat.Png);
                        else
                            bmp.Save(filePath, System.Drawing.Imaging.ImageFormat.Jpeg);
                    }
                }

                // Return the relative path for use in the database
                return $"/{folderRelativePath.Replace("\\", "/")}/{fileName}";
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to save or resize image for {Folder}", folderRelativePath);
                return null;
            }
        }
    }
}