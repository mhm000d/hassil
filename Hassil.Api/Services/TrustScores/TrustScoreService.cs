using Hassil.Api.Database;
using Hassil.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.TrustScores;

public class TrustScoreService(HassilDbContext dbContext) : ITrustScoreService
{
    public async Task<TrustScoreHistory> GetHistoryAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var currentScore = await dbContext.Users
            .Where(u => u.Id == userId)
            .Select(u => (int?)u.TrustScore)
            .FirstOrDefaultAsync(ct);

        if (currentScore is null)
            throw new NotFoundException("User not found.", "USER_NOT_FOUND");

        var events = await dbContext.TrustScoreEvents
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

        return new TrustScoreHistory(
            CurrentScore: currentScore.Value,
            Events:       events);
    }
}
