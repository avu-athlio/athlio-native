import { POST_CREATED, emit } from '@/lib/events';

// After publishing: tell the feed / my profile to refresh, then close every
// composer screen and land on Home (web navigated to /home).
export function finishCompose(router, { posted = true } = {}) {
  if (posted) emit(POST_CREATED);
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/home');
}

// Card props for a `matches` row (MatchCard / MatchPostEditor).
export function cardFromMatch(m, myClub) {
  return {
    yourTeam: m.your_team || myClub?.name || '—',
    yourTeamLogoUrl: myClub?.logo_url,
    yourScore: Number(m.your_score) || 0,
    opponent: m.opponent || '—',
    opponentLogoUrl: m.opponent_club?.logo_url,
    opponentScore: Number(m.opponent_score) || 0,
    league: m.league ?? '',
    goalsCount: Number(m.goals) || 0,
    assistsCount: Number(m.assists) || 0,
    minCount: Number(m.minutes_played) || 0,
    yellowCards: Number(m.yellow_cards) || 0,
    redCards: Number(m.red_cards) || 0,
  };
}
