using System.Text.RegularExpressions;

namespace VC4
{
    public interface ITemplateResolver
    {
        string Resolve(string key, object context);
    }

    public class DotNotationTemplateResolver : ITemplateResolver
    {
        public string Resolve(string key, object context)
        {
            try
            {
                var parts = key.Split('.');
                object current = context;

                foreach (var part in parts)
                {
                    if (current == null) return InlineComment($"Missing: {key}");

                    var prop = current.GetType().GetProperty(part);
                    if (prop == null) return InlineComment($"Unknown field: {key}");

                    current = prop.GetValue(current);
                }

                return current?.ToString() ?? InlineComment($"Null value for: {key}");
            }
            catch
            {
                return InlineComment($"Error resolving: {key}");
            }
        }

        private string InlineComment(string msg)
        {
            return $"<!-- UX Hint: {msg} -->";
        }

    }

    public class HtmlTemplateEngine(ITemplateResolver resolver)
    {
        private readonly ITemplateResolver _resolver = resolver;
        private static readonly Regex PlaceholderRegex = new(@"{{(.*?)}}", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public string Render(string html, object context)
        {
            return PlaceholderRegex.Replace(html, match =>
            {
                var key = match.Groups[1].Value.Trim();
                var resolved = _resolver.Resolve(key, context);
                return resolved ?? match.Value;
            });
        }
    }
}
