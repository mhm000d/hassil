using Hassil.Api.Contracts.Users;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Mappings;

public static class UserMappings
{
    public static UserResponse ToResponse(this User user) => new(
        Id:                   user.Id,
        AccountType:          user.AccountType.ToString(),
        Role:                 user.Role.ToString(),
        Email:                user.Email,
        Phone:                user.Phone,
        Country:              user.Country,
        TrustScore:           user.TrustScore,
        Status:               user.Status.ToString(),
        SmallBusinessProfile: user.SmallBusinessProfile?.ToResponse(),
        FreelancerProfile:    user.FreelancerProfile?.ToResponse(),
        CreatedAt:            user.CreatedAt);

    public static SmallBusinessProfileResponse ToResponse(this SmallBusinessProfile profile) => new(
        BusinessName:                 profile.BusinessName,
        RegistrationNumber:           profile.RegistrationNumber,
        BusinessBankAccountName:      profile.BusinessBankAccountName,
        BusinessBankAccountLast4:     profile.BusinessBankAccountLast4,
        VerificationStatus:           profile.VerificationStatus.ToString());

    public static FreelancerProfileResponse ToResponse(this FreelancerProfile profile) => new(
        FullName:                     profile.FullName,
        PersonalBankAccountName:      profile.PersonalBankAccountName,
        PersonalBankAccountLast4:     profile.PersonalBankAccountLast4,
        VerificationStatus:           profile.VerificationStatus.ToString());
}
