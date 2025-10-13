using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RST.Context;
using RST.Model.DTO;
using RST.Services;
using RST.Web.Service;
using Serilog;
using System.Text;

var multiSchemePolicy = new AuthorizationPolicyBuilder(
    CookieAuthenticationDefaults.AuthenticationScheme,
    JwtBearerDefaults.AuthenticationScheme)
  .RequireAuthenticatedUser()
  .Build();

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthorization(o => o.DefaultPolicy = multiSchemePolicy);

var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.Configure<JwtOptions>(jwtSection);
var jwtOptions = jwtSection.Get<JwtOptions>();

builder.Services.AddAuthentication(options =>
{

    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
}).AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidAudiences = jwtOptions.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key ?? string.Empty))
    };
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.LoginPath = new PathString("/account/login");
    options.AccessDeniedPath = new PathString("/account/login");
    options.ReturnUrlParameter = "returnUrl";
    options.LogoutPath = new PathString("/account/logout");
    options.ExpireTimeSpan = TimeSpan.FromDays(180);
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
         policy => policy.AllowAnyOrigin()
                         .AllowAnyMethod()
                         .AllowAnyHeader());

});
// Add services to the container.
builder.Services.AddRazorPages(options => {
    options.Conventions.AddPageRoute("/Blog/Detail", "blog/{url}");
});
builder.Services.AddControllersWithViews();
builder.Services.AddServerSideBlazor();

builder.Services.AddDbContext<RSTContext>(options =>
  options.UseSqlServer(builder.Configuration.GetConnectionString("RSTContext")));
builder.Services.AddScoped<WebsiteSettingsService>();
builder.Services.AddScoped<DataSourceService>();
builder.Services.AddScoped<RSTAuthenticationService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<CaptchaService>();
builder.Services.AddScoped<IUserWebsiteRenderService, UserWebsiteRenderService>();
builder.Services.AddScoped<IUserWebsiteThemeService, UserWebsiteThemeService>();
builder.Services.AddScoped<IUserWebsiteService, UserWebsiteService>();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(ms => ms.Value.Errors.Any())
            .SelectMany(kvp => kvp.Value.Errors.Select(e => e.ErrorMessage))
            .ToList();

        var response = new
        {
            errors
        };

        return new BadRequestObjectResult(response);
    };
});

builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();


// Set up custom content types - associating file extension to MIME type
var provider = new FileExtensionContentTypeProvider();

// Add new mappings
provider.Mappings[".m3u8"] = "application/x-mpegURL";
provider.Mappings[".ts"] = "video/vnd.dlna.mpeg-tts";
provider.Mappings[".mpd"] = "application/dash+xml";
provider.Mappings[".m4s"] = "video/iso.segment";
provider.Mappings[".vtt"] = "text/vtt";
provider.Mappings[".ttf"] = "font/ttf";


app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});
//Add support to logging request with SERILOG
app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();
//app.MapBlazorHub();
//app.MapFallbackToPage("/_Host");

app.Run();
