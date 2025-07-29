
using RST.Model;


namespace VC4
{
    public static class VCardHtmlRenderer
    {
        public static string RenderTemplate(string htmlTemplate, VisitingCardDetail data)
        {
            string builder = htmlTemplate;
            if (string.IsNullOrEmpty(data.Company))
                builder = builder.Replace("{{Company}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Company}}", data.Company, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.TagLine))
                builder = builder.Replace("{{TagLine}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{TagLine}}", data.TagLine, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.PersonName))
                builder = builder.Replace("{{PersonName}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{PersonName}}", data.PersonName, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Phone1))
                builder = builder.Replace("{{Phone1}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Phone1}}", data.Phone1, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Phone2))
                builder = builder.Replace("{{Phone2}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Phone2}}", data.Phone2, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Phone3))
                builder = builder.Replace("{{Phone3}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Phone3}}", data.Phone3, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Email))
                builder = builder.Replace("{{Email}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Email}}", data.Email, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Logo))
                builder = builder.Replace("{{Logo}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Logo}}", data.Logo, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.WhatsApp))
                builder = builder.Replace("{{WhatsApp}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{WhatsApp}}", data.WhatsApp, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Telegram))
                builder = builder.Replace("{{Telegram}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Telegram}}", data.Telegram, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Youtube))
                builder = builder.Replace("{{Youtube}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Youtube}}", data.Youtube, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Instagram))
                builder = builder.Replace("{{Instagram}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Instagram}}", data.Instagram, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.LinkedIn))
                builder = builder.Replace("{{LinkedIn}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{LinkedIn}}", data.LinkedIn, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Twitter))
                builder = builder.Replace("{{Twitter}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Twitter}}", data.Twitter, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Address))
                builder = builder.Replace("{{Address}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Address}}", data.Address, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.Designation))
                builder = builder.Replace("{{Designation}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{Designation}}", data.Designation, StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(data.AboutInfo))
                builder = builder.Replace("{{AboutInfo}}", string.Empty, StringComparison.OrdinalIgnoreCase);
            else
                builder = builder.Replace("{{AboutInfo}}", data.AboutInfo, StringComparison.OrdinalIgnoreCase);

            return builder;
        }
    }

}
