using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;

namespace RST.Web.Service
{
    public class RSTAuthenticationService(RSTContext ctx)
    {
        private readonly RSTContext dc = ctx;

        public int CoolOffTimeImMinutes = 15;
        public int MaxInvalidLoginAttemptCount = 5;

        public Tuple<Member?, bool> ValidateUser(string username, string password)
        {
            var m = dc.Members.FirstOrDefault(t => t.Email == username &&
            (t.Status == RecordStatus.Active || t.Status == RecordStatus.Unverified));

            if(m != null && m.EncryptedPassword != null)
            {
                if(m.EncryptedPassword.SequenceEqual(EncryptionHelper.CalculateSHA256($"{password}-{password}")))
                {
                    m.LastLogon = DateTime.UtcNow;
                    m.LastLoginAttempt = null;
                    m.InvalidAttemptCount = 0;
                    dc.SaveChanges();
                    return new Tuple<Member?, bool>(m, true);
                }
                else
                {
                    m.LastLoginAttempt = DateTime.UtcNow;
                    m.InvalidAttemptCount = m.InvalidAttemptCount + 1;
                    dc.SaveChanges();
                    return new Tuple<Member?, bool>(m, false);
                }
            }

            return new Tuple<Member?, bool>(null, false);
        }


        public Member? Update(int id,
            string name, bool newsletter,
            Member? modifiedby,
            string gender, MemberTypeType mtype )
        {
            var m = dc.Members.First(t => t.ID == id);
            if (m != null)
            {
                m.FirstName = name;
                m.Newsletter = newsletter;
                m.ModifiedBy = modifiedby;
                m.ModifyDate = DateTime.UtcNow;
                m.UserType = mtype;
                dc.SaveChanges();
            }
            return m;
        }

        public void Delete(int id)
        {
            var m = dc.Members.FirstOrDefault(t => t.ID == id);
            if (m != null)
            {
                try
                {
                    dc.Members.Remove(m);
                    dc.SaveChanges();
                }
                catch (Exception)
                {
                    m.Status = RecordStatus.Deleted;
                    dc.SaveChanges();
                }
            }
        }


        public Member? GetUser(string username)
        {
            return dc.Members.SingleOrDefault(t => (t.Email == username ) && t.Status != RecordStatus.Deleted);
        }

        public bool AnyLoginAttempteRemain(string email)
        {
            var m = dc.Members.FirstOrDefault(t => (t.Email == email) && t.Status != RecordStatus.Deleted);
            if (m == null)
                return true;
            else
            {
                if (m.InvalidAttemptCount >= MaxInvalidLoginAttemptCount)
                {
                    if (m.LastLoginAttempt.HasValue && DateTime.UtcNow.Subtract(m.LastLoginAttempt.Value).TotalMinutes < CoolOffTimeImMinutes)
                        return false;
                    else
                    {
                        m.InvalidAttemptCount = 0;
                        m.LastLoginAttempt = null;
                        dc.SaveChanges();
                        return true;
                    }
                }
                else
                    return true;
                    
            }
        }

        public ResetPasswordLink GenerateResetPasswordLink(Member m)
        {
            var obj = new ResetPasswordLink()
            {
                Member = m
            };
            dc.ResetPasswordLinks.Add(obj);
            dc.SaveChanges();
            return obj;
        }

        public AccountVerificationLink GenerateAccountVerificationLink(Member m)
        {
            var obj = new AccountVerificationLink()
            {
                Member = m
            };
            dc.AccountVerificationLinks.Add(obj);
            dc.SaveChanges();
            return obj;
        }

        public ResetPasswordLink? GetResetPasswordLink(Guid id)
        {
            return dc.ResetPasswordLinks.Include(t => t.Member).SingleOrDefault(t => t.ID == id);
        }

        public void RemoveResetPasswordLink(Guid id)
        {
            var obj = dc.ResetPasswordLinks.SingleOrDefault(t => t.ID == id);
            if (obj != null)
            {
                dc.ResetPasswordLinks.Remove(obj);
                dc.SaveChanges();
            }
        }

        public Member GetUser(int id)
        {
            return dc.Members.First(t => t.ID == id);
        }

        public bool ActivateUser(Guid accountVerificationLinkId)
        {
            var link = dc.AccountVerificationLinks.Where(u => u.ID == accountVerificationLinkId).SingleOrDefault();
            if (link != null)
            {
                if (link.CreateDate.AddHours(12) > DateTime.UtcNow)
                {
                    link.VerifyDate = DateTime.UtcNow;
                    var m = dc.Members.First(t => t.ID == link.Member.ID);
                    m.Status = (byte)RecordStatus.Active;
                    m.ModifyDate = DateTime.UtcNow;
                    m.ModifiedBy = link.Member;
                    dc.SaveChanges();
                    return true;
                }
            }

            return false;
        }

        public bool ChangePassword(int id, string password, string oldPassword)
        {
            var m = (from u in dc.Members where u.ID == id && u.EncryptedPassword == EncryptionHelper.CalculateSHA256($"{oldPassword}-{oldPassword}") select u).SingleOrDefault();
            if (m != null)
            {
                //m.Password = password;
                m.EncryptedPassword = EncryptionHelper.CalculateSHA256($"{password}-{password}");
                dc.SaveChanges();
                return true;
            }
            else
                return false;
        }

        public void ResetPassword(int id, string password)
        {
            var m = dc.Members.Single(t => t.ID == id);
            m.EncryptedPassword = EncryptionHelper.CalculateSHA256($"{password}-{password}");
            m.ModifyDate = DateTime.UtcNow;
            dc.SaveChanges();
        }

        public bool CreateUser(string username, string password, bool newsletter, string memberName, MemberTypeType mType)
        {

            if (username.Trim() == string.Empty)
            {
                return false;
            }
            if (password.Trim() == string.Empty)
            {
                return false;
            }

            if (EmailExist(username))
            {
                return false;
            }


            var m = new Member
            {
                CreateDate = DateTime.UtcNow,
                Email = username,
                FirstName = memberName,
                Newsletter = newsletter,
                Password = string.Empty, //password,
                EncryptedPassword = EncryptionHelper.CalculateSHA256($"{password}-{password}"),
                Status = RecordStatus.Unverified,
                UserType = mType,
            };

            dc.Members.Add(m);
            dc.SaveChanges();
            return true;
        }

        public bool EmailExist(string email)
        {
            return (from t in dc.Members where t.Email == email select t).Any();
        }

        public void UpdateEncryptedPassword()
        {
            foreach (var m in dc.Members)
            {
                m.EncryptedPassword = EncryptionHelper.CalculateSHA256($"{m.Password}-{m.Password}");
            }
            dc.SaveChanges();
        }
    }
}
