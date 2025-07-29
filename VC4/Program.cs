using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
         policy => policy.AllowAnyOrigin()
                         .AllowAnyMethod()
                         .AllowAnyHeader());

});
// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddDbContext<RSTContext>(options =>
  options.UseSqlServer(builder.Configuration.GetConnectionString("RSTContext")));

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
app.UseCors("AllowAll");
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();

app.Run();
