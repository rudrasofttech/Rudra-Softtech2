using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;


namespace RST.Model.Attributes
{
    public class DomainSafeNameAttribute : ValidationAttribute
    {
        private static readonly Regex DomainRegex = new(@"^[a-zA-Z0-9\-\.]+$", RegexOptions.Compiled);

        protected override ValidationResult? IsValid(object? value, ValidationContext context)
        {
            if (value is string str && DomainRegex.IsMatch(str))
                return ValidationResult.Success;

            return new ValidationResult("Only letters, digits, hyphens, and dots are allowed in website names.");
        }
    }

}
