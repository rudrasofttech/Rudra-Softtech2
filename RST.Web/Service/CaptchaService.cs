using Microsoft.Data.SqlClient;
using RST.Model;
using System.Text;
using System.Xml.Xsl;
using System.Xml;
using RST.Context;
using Microsoft.EntityFrameworkCore;
using System.Drawing.Drawing2D;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Text;
namespace RST.Web.Service
{
    public class CaptchaService(RSTContext ctx)
    {
        private readonly int iHeight = 70;
        private readonly int iWidth = 210;
        private readonly Random oRandom = new();
        private readonly int[] aBackgroundNoiseColor = [150, 150, 150];
        private readonly int[] aTextColor = [0, 0, 0];
        private readonly int[] aFontEmSizes = [27, 15, 23, 20, 30];
        private readonly string[] aFontNames =
[
 "Comic Sans MS",
 "Arial",
 "Times New Roman",
 "Georgia",
 "Verdana",
 "Geneva"
];
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        readonly FontStyle[] aFontStyles =
        [
 FontStyle.Bold,
 FontStyle.Italic,
 FontStyle.Regular,
 FontStyle.Strikeout,
 FontStyle.Underline
        ];
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        readonly HatchStyle[] aHatchStyles =
        [
 HatchStyle.BackwardDiagonal, HatchStyle.Cross,
    HatchStyle.DashedDownwardDiagonal, HatchStyle.DashedHorizontal,
 HatchStyle.DashedUpwardDiagonal, HatchStyle.DashedVertical,
    HatchStyle.DiagonalBrick, HatchStyle.DiagonalCross,
 HatchStyle.Divot, HatchStyle.DottedDiamond, HatchStyle.DottedGrid,
    HatchStyle.ForwardDiagonal, HatchStyle.Horizontal,
 HatchStyle.HorizontalBrick, HatchStyle.LargeCheckerBoard,
    HatchStyle.LargeConfetti, HatchStyle.LargeGrid,
 HatchStyle.LightDownwardDiagonal, HatchStyle.LightHorizontal,
    HatchStyle.LightUpwardDiagonal, HatchStyle.LightVertical,
 HatchStyle.Max, HatchStyle.Min, HatchStyle.NarrowHorizontal,
    HatchStyle.NarrowVertical, HatchStyle.OutlinedDiamond,
 HatchStyle.Plaid, HatchStyle.Shingle, HatchStyle.SmallCheckerBoard,
    HatchStyle.SmallConfetti, HatchStyle.SmallGrid,
 HatchStyle.SolidDiamond, HatchStyle.Sphere, HatchStyle.Trellis,
    HatchStyle.Vertical, HatchStyle.Wave, HatchStyle.Weave,
 HatchStyle.WideDownwardDiagonal, HatchStyle.WideUpwardDiagonal, HatchStyle.ZigZag
        ];

        private string sCaptchaText = "";
        //private string answer = "";

        private readonly RSTContext _context = ctx;

        public string CaptchaImage { get; set; } = string.Empty;

        public Captcha GenerateCaptcha()
        {
            string val = Guid.NewGuid().ToString().Replace("-", "")[..8];
            var captcha = new Captcha() { Value = val };
            sCaptchaText = val;
            Draw();
            _context.Captchas.Add(captcha);
            _context.SaveChanges();
            return captcha;
        }

        public bool IsValid(Guid id, string value)
        {
            return _context.Captchas.Any(t => t.Id == id && t.Value == value);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        private void Draw()
        {

            //Creates an output Bitmap
            var oOutputBitmap = new Bitmap(iWidth, iHeight, PixelFormat.Format24bppRgb);
            var oGraphics = Graphics.FromImage(oOutputBitmap);
            oGraphics.TextRenderingHint = TextRenderingHint.AntiAlias;

            //Create a Drawing area
            var oRectangleF = new RectangleF(0, 0, iWidth, iHeight);
            //Draw background (Lighter colors RGB 100 to 255)
            var oBrush = new HatchBrush(aHatchStyles[oRandom.Next
                (aHatchStyles.Length - 1)], Color.FromArgb((oRandom.Next(100, 255)),
                (oRandom.Next(100, 255)), (oRandom.Next(100, 255))), Color.White);
            oGraphics.FillRectangle(oBrush, oRectangleF);

            var oMatrix = new System.Drawing.Drawing2D.Matrix();

            for (int i = 0; i <= sCaptchaText.Length - 1; i++)
            {
                oMatrix.Reset();
                int iChars = sCaptchaText.Length;
                int x = iWidth / (iChars + 1) * i;
                int y = iHeight / 2;

                //Rotate text Random
                oMatrix.RotateAt(oRandom.Next(-20, 20), new PointF(x, y));
                oGraphics.Transform = oMatrix;

                //Draw the letters with Random Font Type, Size and Color
                oGraphics.DrawString
                (
                //Text
                sCaptchaText.Substring(i, 1),
                //Random Font Name and Style
                new Font(aFontNames[oRandom.Next(aFontNames.Length - 1)],
                   aFontEmSizes[oRandom.Next(aFontEmSizes.Length - 1)],
                   aFontStyles[oRandom.Next(aFontStyles.Length - 1)]),
                //Random Color (Darker colors RGB 0 to 100)
                new SolidBrush(Color.FromArgb(oRandom.Next(0, 100),
                   oRandom.Next(0, 100), oRandom.Next(0, 100))),
                x,
                oRandom.Next(0, iHeight / 2)
                );
                oGraphics.ResetTransform();
            }

            var oMemoryStream = new MemoryStream();
            oOutputBitmap.Save(oMemoryStream, System.Drawing.Imaging.ImageFormat.Png);
            byte[] oBytes = oMemoryStream.GetBuffer();
            CaptchaImage = "data:image/png;base64," + Convert.ToBase64String(oBytes, 0, oBytes.Length);
            oOutputBitmap.Dispose();
            oMemoryStream.Close();

        }

        public Captcha? Get(Guid id)
        {
            return _context.Captchas.FirstOrDefault(c => c.Id == id);
        }

        public void RemoveOld(int hours = 1)
        {
            var query = _context.Captchas.Where(c => c.CreateDate > DateTime.UtcNow.AddHours(hours * -1));
            _context.Captchas.RemoveRange(query);
            _context.SaveChanges();
        }
    }
}
