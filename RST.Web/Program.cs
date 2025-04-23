using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RST.Context;
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"].ToString()))
    };
}).AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.LoginPath = new PathString("/account/login");
    options.AccessDeniedPath = new PathString("/account/login");
    options.ReturnUrlParameter = "returnUrl";
    options.LogoutPath = new PathString("/account/logout");
    options.ExpireTimeSpan = TimeSpan.FromDays(180);
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

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});
//Add support to logging request with SERILOG
app.UseSerilogRequestLogging();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();

app.Run();
