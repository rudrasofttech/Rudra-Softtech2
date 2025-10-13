namespace RST.Model.DTO
{
    public class JwtOptions
    {
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public List<string> Audience { get; set; } = [];
    }

}
