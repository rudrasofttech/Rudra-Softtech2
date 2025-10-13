using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using System.Net.Http.Json;
using System.Text.Json;

namespace RST.Services
{
    public interface IUserWebsiteService
    {
        public string Token { get; set; }
        Task<PagedData<UserWebsiteListItemDTO>> GetPagedAsync(int page, int psize, Member member);
        Task<List<UserWebsiteListItemDTO>> GetMyWebsitesAsync(Member m);
        Task<UserWebsite?> GetByIdAsync(Guid id);
        Task<bool> IsUniqueNameAsync(string name);
        Task<UserWebsite?> CreateAsync(CreateUserWebsiteDTO model, Member member);
        Task<UserWebsite?> CreateVCardAsync(CreateVCardWebsiteDTO model, Member member, HttpRequest request);

        Task<UserWebsite?> CreateLinkListAsync(CreateLinkListWebsiteDTO model, Member member, HttpRequest request);
        Task<bool> DeleteAsync(Guid id, Member member);
        Task<UserWebsite?> UpdateVCardAsync(UpdateVCardModel model, Member member, HttpRequest request, ILogger logger);
        Task<UserWebsite?> UpdateLinkListAsync(UpdateLinkListModel model, Member member, HttpRequest request, ILogger logger);
        Task<UserWebsite?> UpdateThemeAsync(UpdateThemeModel model, Member member);
        Task<UserWebsite?> UpdateStatusAsync(Guid id, RecordStatus status, Member member);

        Task<UserWebsite?> UpdateWebstats(Guid id, string webstats, Member member);
        Task<string?> GetHtmlAsync(Guid id, Member member, IUserWebsiteRenderService userWebsiteRenderService);
        string? SaveBase64ImageToFile(string base64Image, string folderRelativePath, string fileNameNoExt, int maxSize, out string? fileExt, ILogger logger);
    }

    public class UserWebsiteService(RSTContext db, ILogger<UserWebsiteService> logger) : IUserWebsiteService
    {
        private readonly RSTContext _db = db;
        private readonly ILogger<UserWebsiteService> _logger = logger;


        public string Token { get; set; }

        public async Task<PagedData<UserWebsiteListItemDTO>> GetPagedAsync(int page, int psize, Member member)
        {
            var isAdmin = member != null && member.IsAdmin;
            var query = _db.UserWebsites.Include(t => t.Owner).AsQueryable();
            if (!isAdmin && member != null)
            {
                query = query.Where(t => t.Owner.ID == member.ID);
            }

            int count = await query.CountAsync();
            var result = new PagedData<UserWebsiteListItemDTO>
            {
                PageIndex = page,
                PageSize = psize,
                TotalRecords = count
            };

            var paged = await query.OrderBy(t => t.Created)
                .Skip((page - 1) * psize)
                .Take(psize)
                .ToListAsync();

            foreach (var m in paged)
            {
                result.Items.Add(new UserWebsiteListItemDTO
                {
                    Id = m.Id,
                    Name = m.Name,
                    Domain = m.Domain,
                    Created = m.Created,
                    Modified = m.Modified,
                    Status = m.Status,
                    WSType = m.WSType,
                    OwnerName = m.Owner.FirstName
                });
            }
            return result;
        }

        public async Task<List<UserWebsiteListItemDTO>> GetMyWebsitesAsync(Member m)
        {
            if (m == null) return new List<UserWebsiteListItemDTO>();

            return await _db.UserWebsites
                .Include(t => t.Owner)
                .Where(t => t.Owner.ID == m.ID)
                .Select(t => new UserWebsiteListItemDTO
                {
                    Id = t.Id,
                    Name = t.Name,
                    Domain = t.Domain,
                    Created = t.Created,
                    Modified = t.Modified,
                    Status = t.Status,
                    WSType = t.WSType,
                    OwnerName = t.Owner.FirstName
                })
                .ToListAsync();
        }

        public async Task<UserWebsite?> GetByIdAsync(Guid id)
        {
            return await _db.UserWebsites.FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<bool> IsUniqueNameAsync(string name)
        {
            return !await _db.UserWebsites.AnyAsync(t => t.Name == name);
        }

        public async Task<UserWebsite?> CreateAsync(CreateUserWebsiteDTO model, Member member)
        {
            if (!await IsUniqueNameAsync(model.Name))
                return null;

            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == model.ThemeId);
            if (theme == null)
                return null;

            if (member == null)
                return null;

            var uw = new UserWebsite
            {
                Created = DateTime.UtcNow,
                Name = model.Name,
                Owner = member,
                Status = RecordStatus.Inactive,
                WSType = model.WSType,
                Html = theme.Html,
                ThemeId = theme.Id
            };
            if (uw.WSType == WebsiteType.VCard)
                uw.VisitingCardDetail = new VisitingCardDetail();

            uw.JsonData = JsonSerializer.Serialize(uw.JsonData);
            _db.UserWebsites.Add(uw);
            await _db.SaveChangesAsync();
            return uw;
        }

        public async Task<UserWebsite?> CreateVCardAsync(CreateVCardWebsiteDTO model, Member member, HttpRequest request)
        {
            if (!await IsUniqueNameAsync(model.WebsiteName))
                return null;

            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == model.ThemeId);
            if (theme == null)
                return null;

            if (member == null)
                return null;

            var websiteId = Guid.NewGuid();
            var hostUrl = $"{request.Scheme}://{request.Host.Value}";

            string logoPath = string.Empty;
            if (!string.IsNullOrWhiteSpace(model.Logo) && model.Logo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                string? fileExt;
                var relativePath = SaveBase64ImageToFile(model.Logo, $"drive/uwpics/{websiteId}", "logo", 300, out fileExt, _logger);
                if (relativePath != null)
                    logoPath = $"{hostUrl}{relativePath}";
            }
            else if (!string.IsNullOrWhiteSpace(model.Logo))
            {
                logoPath = model.Logo;
            }

            var vcardDetail = new VisitingCardDetail
            {
                Company = model.Company,
                Logo = logoPath,
                TagLine = model.TagLine,
                Keywords = model.Keywords,
                PersonName = model.PersonName,
                Designation = model.Designation,
                WhatsApp = model.WhatsApp,
                Telegram = model.Telegram,
                Youtube = model.Youtube,
                Instagram = model.Instagram,
                LinkedIn = model.LinkedIn,
                Twitter = model.Twitter,
                Facebook = model.Facebook,
                Email = model.Email,
                Phone1 = model.Phone1,
                Phone2 = model.Phone2,
                Phone3 = model.Phone3,
                Address = model.Address,
                AboutInfo = model.AboutInfo,
                Photos = model.Photos ?? []
            };

            
            var userWebsite = new UserWebsite
            {
                Id = websiteId,
                Created = DateTime.UtcNow,
                Name = model.WebsiteName,
                Owner = member,
                WSType = WebsiteType.VCard,
                Status = RecordStatus.Inactive,
                ThemeId = theme.Id,
                Html = theme.Html,
                VisitingCardDetail = vcardDetail,
                JsonData = JsonSerializer.Serialize(vcardDetail)
            };
            
            _db.UserWebsites.Add(userWebsite);
            await _db.SaveChangesAsync();
            try
            {
                var res = await AddWebsiteToWebstatsAsync(new AddWebsiteModel() { Name = $"{model.WebsiteName}.vc4.in" });
                userWebsite.WebstatsScript = res?.Script ?? string.Empty;
                await _db.SaveChangesAsync();
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Failed to add website to webstats");
            }
            return userWebsite;
        }

        public async Task<UserWebsite?> CreateLinkListAsync(CreateLinkListWebsiteDTO model, Member member, HttpRequest request)
        {
            if (!await IsUniqueNameAsync(model.WebsiteName))
                return null;

            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == model.ThemeId);
            if (theme == null)
                return null;

            if (member == null)
                return null;

            var websiteId = Guid.NewGuid();
            var hostUrl = $"{request.Scheme}://{request.Host.Value}";

            string photoPath = string.Empty;
            if (!string.IsNullOrWhiteSpace(model.Photo) && model.Photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                string? fileExt;
                var relativePath = SaveBase64ImageToFile(model.Photo, $"drive/uwpics/{websiteId}", "photo", 300, out fileExt, _logger);
                if (relativePath != null)
                    photoPath = $"{hostUrl}{relativePath}";
            }
            else if (!string.IsNullOrWhiteSpace(model.Photo))
            {
                photoPath = model.Photo;
            }

            var linkListDetail = new LinkListDetail
            {
                Name = model.Name,
                Line = model.Line,
                Photo = photoPath,
                Links = model.Links ?? [],
                Youtube = model.Youtube,
                Instagram = model.Instagram,
                LinkedIn = model.LinkedIn,
                Twitter = model.Twitter,
                Facebook = model.Facebook,
                Telegram = model.Telegram,
                WhatsApp = model.WhatsApp
            };

            var userWebsite = new UserWebsite
            {
                Id = websiteId,
                Created = DateTime.UtcNow,
                Name = model.WebsiteName,
                Owner = member,
                WSType = WebsiteType.LinkList,
                Status = RecordStatus.Inactive,
                ThemeId = theme.Id,
                Html = theme.Html,
                LinkListDetail = linkListDetail,
                JsonData = JsonSerializer.Serialize(linkListDetail)
            };

            _db.UserWebsites.Add(userWebsite);
            await _db.SaveChangesAsync();
            try
            {
                var res = await AddWebsiteToWebstatsAsync(new AddWebsiteModel() { Name = $"{model.WebsiteName}.vc4.in" });
                userWebsite.WebstatsScript = res?.Script ?? string.Empty;
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add website to webstats");
            }
            return userWebsite;
        }

        public async Task<bool> DeleteAsync(Guid id, Member member)
        {
            if (member == null)
                return false;

            var uw = await _db.UserWebsites.Include(t => t.Owner).FirstOrDefaultAsync(t => t.Id == id && t.Owner.ID == member.ID);
            if (uw == null)
                return false;

            try
            {
                var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var folderPath = Path.Combine(webRootPath, "drive", "uwpics", uw.Id.ToString());
                if (Directory.Exists(folderPath))
                    Directory.Delete(folderPath, true);
            }
            catch (Exception dirEx)
            {
                _logger.LogWarning(dirEx, "Failed to delete folder for website {WebsiteId}", uw.Id);
            }

            _db.UserWebsites.Remove(uw);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<UserWebsite?> UpdateVCardAsync(UpdateVCardModel model, Member member, HttpRequest request, ILogger logger)
        {
            if (member == null)
                return null;

            var uw = await _db.UserWebsites.Include(t => t.Owner).FirstOrDefaultAsync(t => t.Id == model.Id && t.Owner.ID == member.ID);

            if (uw == null || uw.WSType != WebsiteType.VCard)
                return null;

            if (!string.IsNullOrWhiteSpace(uw.JsonData))
            {
                try
                {
                    uw.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(uw.JsonData) ?? new VisitingCardDetail();
                }
                catch
                {
                    uw.VisitingCardDetail = new VisitingCardDetail();
                }
            }
            else
            {
                uw.VisitingCardDetail = new VisitingCardDetail();
            }

            var hostUrl = $"{request.Scheme}://{request.Host.Value}";
            var folderRelativePath = $"drive/uwpics/{uw.Id}";
            var galleryFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderRelativePath);

            var logoPngPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderRelativePath, "logo.png");
            var logoJpgPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderRelativePath, "logo.jpg");

            if (string.IsNullOrWhiteSpace(model.Logo) && !string.IsNullOrWhiteSpace(uw.VisitingCardDetail.Logo))
            {
                try
                {
                    if (System.IO.File.Exists(logoPngPath))
                        System.IO.File.Delete(logoPngPath);
                    if (System.IO.File.Exists(logoJpgPath))
                        System.IO.File.Delete(logoJpgPath);
                }
                catch (Exception fileEx)
                {
                    logger.LogWarning(fileEx, "Failed to delete logo file for website {WebsiteId}", uw.Id);
                }
                uw.VisitingCardDetail.Logo = string.Empty;
            }
            else if (!string.IsNullOrWhiteSpace(model.Logo) && model.Logo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                string? fileExt;
                var relativePath = SaveBase64ImageToFile(model.Logo, folderRelativePath, "logo", 300, out fileExt, logger);
                if (relativePath != null)
                {
                    try
                    {
                        if (fileExt == ".png" && System.IO.File.Exists(logoJpgPath))
                            System.IO.File.Delete(logoJpgPath);
                        if (fileExt == ".jpg" && System.IO.File.Exists(logoPngPath))
                            System.IO.File.Delete(logoPngPath);
                    }
                    catch (Exception fileEx)
                    {
                        logger.LogWarning(fileEx, "Failed to delete alternate logo file for website {WebsiteId}", uw.Id);
                    }
                    uw.VisitingCardDetail.Logo = $"{hostUrl}{relativePath}";
                }
            }
            else if (!string.IsNullOrWhiteSpace(model.Logo))
            {
                uw.VisitingCardDetail.Logo = model.Logo;
            }

            // Update other fields as before
            uw.VisitingCardDetail.Company = model.Company ?? string.Empty;
            uw.VisitingCardDetail.TagLine = model.TagLine ?? string.Empty;
            uw.VisitingCardDetail.Keywords = model.Keywords ?? string.Empty;
            uw.VisitingCardDetail.PersonName = model.PersonName ?? string.Empty;
            uw.VisitingCardDetail.Designation = model.Designation ?? string.Empty;
            uw.VisitingCardDetail.WhatsApp = model.WhatsApp ?? string.Empty;
            uw.VisitingCardDetail.Telegram = model.Telegram ?? string.Empty;
            uw.VisitingCardDetail.Youtube = model.Youtube ?? string.Empty;
            uw.VisitingCardDetail.Instagram = model.Instagram ?? string.Empty;
            uw.VisitingCardDetail.LinkedIn = model.LinkedIn ?? string.Empty;
            uw.VisitingCardDetail.Twitter = model.Twitter ?? string.Empty;
            uw.VisitingCardDetail.Facebook = model.Facebook ?? string.Empty;
            uw.VisitingCardDetail.Email = model.Email ?? string.Empty;
            uw.VisitingCardDetail.Phone1 = model.Phone1 ?? string.Empty;
            uw.VisitingCardDetail.Phone2 = model.Phone2 ?? string.Empty;
            uw.VisitingCardDetail.Phone3 = model.Phone3 ?? string.Empty;
            uw.VisitingCardDetail.Address = model.Address ?? string.Empty;
            uw.VisitingCardDetail.AboutInfo = model.AboutInfo ?? string.Empty;
            uw.VisitingCardDetail.Photos = [];

            // Handle gallery photos (VCardPhoto)
            var newPhotos = new List<VCardPhoto>();
            var sentPhotoUrls = new HashSet<string>();

            if (model.Photos != null && model.Photos.Count > 0)
            {
                for (int i = 0; i < model.Photos.Count; i++)
                {
                    var photoObj = model.Photos[i];
                    var photoUrl = photoObj.Photo;
                    var title = photoObj.Title ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(photoUrl) && photoUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                    {
                        string? fileExt;
                        var relativePath = SaveBase64ImageToFile(photoUrl, folderRelativePath, $"gallery-{i}", 800, out fileExt, logger);
                        if (relativePath != null)
                        {
                            var url = $"{hostUrl}{relativePath}";
                            newPhotos.Add(new VCardPhoto { Title = title, Photo = url });
                            sentPhotoUrls.Add(url);
                        }
                    }
                    else if (!string.IsNullOrWhiteSpace(photoUrl))
                    {
                        newPhotos.Add(new VCardPhoto { Title = title, Photo = photoUrl });
                        sentPhotoUrls.Add(photoUrl);
                    }
                }
            }

            // Remove any existing gallery images not present in sentPhotoUrls
            try
            {
                if (Directory.Exists(galleryFolderPath))
                {
                    var files = Directory.GetFiles(galleryFolderPath, "gallery-*.*");
                    foreach (var file in files)
                    {
                        var fileName = Path.GetFileName(file);
                        var url = $"{hostUrl}/{folderRelativePath.Replace("\\", "/")}/{fileName}";
                        if (!sentPhotoUrls.Contains(url))
                        {
                            System.IO.File.Delete(file);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to clean up gallery images for website {WebsiteId}", uw.Id);
            }
            uw.VisitingCardDetail.Photos.AddRange(newPhotos);

            uw.Modified = DateTime.UtcNow;
            uw.JsonData = JsonSerializer.Serialize(uw.VisitingCardDetail);
            try
            {
                if (string.IsNullOrWhiteSpace(uw.WebstatsScript))
                {
                    var res = await AddWebsiteToWebstatsAsync(new AddWebsiteModel() { Name = $"{uw.Name}.vc4.in" });
                    uw.WebstatsScript = res?.Script ?? string.Empty;
                    await _db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add website to webstats");
            }
            _db.UserWebsites.Update(uw);
            await _db.SaveChangesAsync();

            return uw;
        }

        public async Task<UserWebsite?> UpdateLinkListAsync(UpdateLinkListModel model, Member member, HttpRequest request, ILogger logger)
        {
            if (member == null)
                return null;

            var uw = await _db.UserWebsites
                .Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == model.Id && t.Owner.ID == member.ID);

            if (uw == null || uw.WSType != WebsiteType.LinkList)
                return null;

            if (!string.IsNullOrWhiteSpace(uw.JsonData))
            {
                try
                {
                    uw.LinkListDetail = JsonSerializer.Deserialize<LinkListDetail>(uw.JsonData) ?? new LinkListDetail();
                }
                catch
                {
                    uw.LinkListDetail = new LinkListDetail();
                }
            }
            else
            {
                uw.LinkListDetail = new LinkListDetail();
            }

            var hostUrl = $"{request.Scheme}://{request.Host.Value}";
            var folderRelativePath = $"drive/uwpics/{uw.Id}";
            var photoPngPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderRelativePath, "photo.png");
            var photoJpgPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderRelativePath, "photo.jpg");

            string photoPath = uw.LinkListDetail.Photo ?? string.Empty;

            if (string.IsNullOrWhiteSpace(model.Photo))
            {
                try
                {
                    if (System.IO.File.Exists(photoPngPath))
                        System.IO.File.Delete(photoPngPath);
                    if (System.IO.File.Exists(photoJpgPath))
                        System.IO.File.Delete(photoJpgPath);
                }
                catch (Exception fileEx)
                {
                    logger.LogWarning(fileEx, "Failed to delete photo file for website {WebsiteId}", uw.Id);
                }
                photoPath = string.Empty;
            }
            else if (model.Photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                string? fileExt;
                var relativePath = SaveBase64ImageToFile(model.Photo, folderRelativePath, "photo", 300, out fileExt, logger);
                if (relativePath != null)
                {
                    try
                    {
                        if (fileExt == ".png" && System.IO.File.Exists(photoJpgPath))
                            System.IO.File.Delete(photoJpgPath);
                        if (fileExt == ".jpg" && System.IO.File.Exists(photoPngPath))
                            System.IO.File.Delete(photoPngPath);
                    }
                    catch (Exception fileEx)
                    {
                        logger.LogWarning(fileEx, "Failed to delete alternate photo file for website {WebsiteId}", uw.Id);
                    }
                    photoPath = $"{hostUrl}{relativePath}";
                }
            }
            else
            {
                photoPath = model.Photo;
            }

            uw.LinkListDetail.Name = model.Name ?? string.Empty;
            uw.LinkListDetail.Line = model.Line ?? string.Empty;
            uw.LinkListDetail.Photo = photoPath;
            uw.LinkListDetail.Links = model.Links ?? [];
            uw.LinkListDetail.Youtube = model.Youtube ?? string.Empty;
            uw.LinkListDetail.Instagram = model.Instagram ?? string.Empty;
            uw.LinkListDetail.LinkedIn = model.LinkedIn ?? string.Empty;
            uw.LinkListDetail.Twitter = model.Twitter ?? string.Empty;
            uw.LinkListDetail.Facebook = model.Facebook ?? string.Empty;
            uw.LinkListDetail.Telegram = model.Telegram ?? string.Empty;
            uw.LinkListDetail.WhatsApp = model.WhatsApp ?? string.Empty;

            uw.Modified = DateTime.UtcNow;
            uw.JsonData = JsonSerializer.Serialize(uw.LinkListDetail);
            try
            {
                if (string.IsNullOrWhiteSpace(uw.WebstatsScript))
                {
                    var res = await AddWebsiteToWebstatsAsync(new AddWebsiteModel() { Name = $"{uw.Name}.vc4.in" });
                    uw.WebstatsScript = res?.Script ?? string.Empty;
                    await _db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add website to webstats");
            }
            _db.UserWebsites.Update(uw);
            await _db.SaveChangesAsync();

            return uw;
        }

        public async Task<UserWebsite?> UpdateThemeAsync(UpdateThemeModel model, Member member)
        {
            if (member == null)
                return null;

            var website = await _db.UserWebsites.Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == model.WebsiteId && t.Owner.ID == member.ID);

            if (website == null)
                return null;

            var theme = await _db.UserWebsiteThemes.FirstOrDefaultAsync(t => t.Id == model.ThemeId);
            if (theme == null)
                return null;

            website.ThemeId = theme.Id;
            website.Html = theme.Html;
            website.Modified = DateTime.UtcNow;

            _db.UserWebsites.Update(website);
            await _db.SaveChangesAsync();

            return website;
        }

        public async Task<UserWebsite?> UpdateStatusAsync(Guid id, RecordStatus status, Member member)
        {
            if (member == null)
                return null;

            var website = await _db.UserWebsites.Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == id && t.Owner.ID == member.ID);

            if (website == null)
                return null;

            website.Status = status;
            website.Modified = DateTime.UtcNow;

            _db.UserWebsites.Update(website);
            await _db.SaveChangesAsync();

            return website;
        }

        public async Task<string?> GetHtmlAsync(Guid id, Member member, IUserWebsiteRenderService userWebsiteRenderService)
        {
            if (member == null)
                return null;

            var website = await _db.UserWebsites.Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (website == null)
                return null;

            if (website.WSType == WebsiteType.VCard && !string.IsNullOrWhiteSpace(website.JsonData))
            {
                website.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(website.JsonData) ?? new VisitingCardDetail();
                return await userWebsiteRenderService.GetRenderedHtmlAsync(website.Html, website.VisitingCardDetail);
            }
            else if (website.WSType == WebsiteType.LinkList && !string.IsNullOrWhiteSpace(website.JsonData))
            {
                website.LinkListDetail = JsonSerializer.Deserialize<LinkListDetail>(website.JsonData) ?? new LinkListDetail();
                return await userWebsiteRenderService.GetRenderedHtmlAsync(website.Html, website.LinkListDetail);
            }
            return null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public string? SaveBase64ImageToFile(string base64Image, string folderRelativePath, string fileNameNoExt, int maxSize, out string? fileExt, ILogger logger)
        {
            fileExt = null;
            if (string.IsNullOrWhiteSpace(base64Image) || !base64Image.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return null;

            try
            {
                fileExt = ".png";
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

                var fileName = $"{fileNameNoExt}{fileExt}";
                var filePath = Path.Combine(folderPath, fileName);

                // Resize image to maxSize x maxSize maintaining aspect ratio
                using (var inputStream = new MemoryStream(bytes))
                using (var image = System.Drawing.Image.FromStream(inputStream))
                {
                    int width = image.Width;
                    int height = image.Height;
                    if (width > maxSize || height > maxSize)
                    {
                        double ratio = Math.Min(maxSize / (double)width, maxSize / (double)height);
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

                return $"/{folderRelativePath.Replace("\\", "/")}/{fileName}";
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to save or resize image for {Folder}", folderRelativePath);
                return null;
            }
        }

        public async Task<UserWebsite?> UpdateWebstats(Guid id, string webstats, Member member)
        {
            if (member == null)
                return null;

            var website = await _db.UserWebsites.Include(t => t.Owner)
                .FirstOrDefaultAsync(t => t.Id == id && t.Owner.ID == member.ID);

            if (website == null)
                return null;

            var res = AddWebsiteToWebstatsAsync(new AddWebsiteModel() { Name = $"{website.Name}.vc4.in" });

            website.WebstatsScript = webstats;
            website.Modified = DateTime.UtcNow;
            
            _db.UserWebsites.Update(website);
            await _db.SaveChangesAsync();

            return website;
        }

        private async Task<AddWebsiteResponse?> AddWebsiteToWebstatsAsync(AddWebsiteModel model)
        {
            using var httpClient = new HttpClient();

            // Example: Retrieve token from configuration, environment, or a secure store
            // Replace "your_token_here" with your actual token retrieval logic
            if (!string.IsNullOrWhiteSpace(Token))
            {
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", Token);
            }

            try
            {
                var response = await httpClient.PostAsJsonAsync("https://www.webstats.co.in/data/AddWebsite", model);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<AddWebsiteResponse>(json);
                    return result;
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Webstats AddWebsite failed: {Status} {Error}", response.StatusCode, error);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Webstats AddWebsite");
                return null;
            }
        }
    }
}