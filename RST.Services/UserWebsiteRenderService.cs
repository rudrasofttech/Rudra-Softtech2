using RazorLight;
using RST.Model;

namespace RST.Services
{
    public interface IUserWebsiteRenderService
    {
        public Task<string> GetRenderedHtmlAsync<T>(string htmlTemplate, T data);
    }
    public class UserWebsiteRenderService : IUserWebsiteRenderService
    {
        public async Task<string> GetRenderedHtmlAsync<T>(string htmlTemplate, T data)
        {
            var engine = new RazorLightEngineBuilder()
                .UseMemoryCachingProvider()
                .Build();

            string result = await engine.CompileRenderStringAsync("templateKey", htmlTemplate, data);
            return result;
        }
    }
}
