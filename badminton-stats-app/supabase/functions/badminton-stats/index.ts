import { withSupabase } from "npm:@supabase/server@^1";

type RawGame = {
  match_id?: string | number;
  "match id"?: string | number;
  set_number: string | number;
  player_1: string | number;
  player_1_score: string | number;
  player_2: string | number;
  player_2_score: string | number;
  date: string;
};

type BadmintonSet = {
  set_number: number;
  player_1: string;
  player_1_score: number;
  player_2: string;
  player_2_score: number;
};

type Match = {
  match_id: string | number;
  date: string;
  season: number;
  sets: BadmintonSet[];
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getMatchId(row: RawGame) {
  const id = row.match_id ?? row["match id"];
  if (id === undefined || id === null) throw new Error("A row is missing match_id");
  return id;
}

function getSeason(date: string) {
  const parsedDate = new Date(date.includes("T") ? date : `${date}T00:00:00Z`);
  const year = parsedDate.getUTCFullYear();
  if (!Number.isFinite(year)) throw new Error(`Invalid date: ${date}`);
  return year;
}

function resolvePlayer(value: string | number, usersById: Map<string, string>) {
  return usersById.get(String(value)) ?? String(value);
}

function getSetWinner(set: BadmintonSet) {
  if (set.player_1_score > set.player_2_score) return set.player_1;
  if (set.player_2_score > set.player_1_score) return set.player_2;
  return null;
}

function getMatchWinner(match: Match) {
  const wins: Record<string, number> = {};
  for (const set of match.sets) {
    const winner = getSetWinner(set);
    if (winner) wins[winner] = (wins[winner] ?? 0) + 1;
  }

  const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;

  const [bestPlayer, bestWins] = sorted[0];
  const secondBestWins = sorted[1]?.[1] ?? 0;
  return bestWins >= 2 && bestWins > secondBestWins ? bestPlayer : null;
}

function buildMatches(rows: RawGame[], usersById: Map<string, string>) {
  const map = new Map<string, Match>();

  for (const row of rows) {
    const matchId = getMatchId(row);
    const p1Score = Number(row.player_1_score);
    const p2Score = Number(row.player_2_score);
    const setNumber = Number(row.set_number);

    if (![p1Score, p2Score, setNumber].every(Number.isFinite)) continue;

    const p1 = resolvePlayer(row.player_1, usersById);
    const p2 = resolvePlayer(row.player_2, usersById);
    const key = String(matchId);

    if (!map.has(key)) {
      map.set(key, {
        match_id: matchId,
        date: row.date,
        season: getSeason(row.date),
        sets: [],
      });
    }

    map.get(key)!.sets.push({
      set_number: setNumber,
      player_1: p1,
      player_1_score: p1Score,
      player_2: p2,
      player_2_score: p2Score,
    });
  }

  const matches = [...map.values()];
  matches.forEach((match) => match.sets.sort((a, b) => a.set_number - b.set_number));
  matches.sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dateDiff || String(a.match_id).localeCompare(String(b.match_id), undefined, { numeric: true });
  });
  return matches;
}

function calculateStats(matches: Match[]) {
  const playerStats: Record<string, any> = {};
  const marginSum: Record<string, number> = {};
  const marginCount: Record<string, number> = {};

  function ensurePlayer(player: string) {
    if (playerStats[player]) return;
    playerStats[player] = {
      matches_played: 0,
      match_wins: 0,
      match_win_rate: 0,
      sets_played: 0,
      set_wins: 0,
      set_win_rate: 0,
      total_points: 0,
      average_points_per_match: 0,
      average_set_win_margin: 0,
      biggest_set_win: null,
      longest_match_win_streak: { length: 0, start_match: null, end_match: null },
    };
    marginSum[player] = 0;
    marginCount[player] = 0;
  }

  let totalSets = 0;
  let completedMatches = 0;
  const matchResults: Array<{
    match_id: string | number;
    date: string;
    season: number;
    winner: string | null;
    set_wins: Record<string, number>;
  }> = [];

  for (const match of matches) {
    const participants = new Set<string>();
    const setWins: Record<string, number> = {};

    for (const set of match.sets) {
      ensurePlayer(set.player_1);
      ensurePlayer(set.player_2);
      participants.add(set.player_1);
      participants.add(set.player_2);
      totalSets++;
      playerStats[set.player_1].sets_played++;
      playerStats[set.player_2].sets_played++;
      playerStats[set.player_1].total_points += set.player_1_score;
      playerStats[set.player_2].total_points += set.player_2_score;

      const winner = getSetWinner(set);
      if (!winner) continue;

      const loser = winner === set.player_1 ? set.player_2 : set.player_1;
      const winnerScore = winner === set.player_1 ? set.player_1_score : set.player_2_score;
      const loserScore = winner === set.player_1 ? set.player_2_score : set.player_1_score;
      const margin = winnerScore - loserScore;

      playerStats[winner].set_wins++;
      setWins[winner] = (setWins[winner] ?? 0) + 1;
      marginSum[winner] += margin;
      marginCount[winner]++;

      const biggest = playerStats[winner].biggest_set_win;
      if (!biggest || margin > biggest.margin) {
        playerStats[winner].biggest_set_win = {
          margin,
          match_id: match.match_id,
          set_number: set.set_number,
          date: match.date,
          opponent: loser,
          player_1: set.player_1,
          player_1_score: set.player_1_score,
          player_2: set.player_2,
          player_2_score: set.player_2_score,
        };
      }
    }

    participants.forEach((player) => playerStats[player].matches_played++);

    const matchWinner = getMatchWinner(match);
    if (matchWinner) {
      ensurePlayer(matchWinner);
      playerStats[matchWinner].match_wins++;
      completedMatches++;
    }

    matchResults.push({
      match_id: match.match_id,
      date: match.date,
      season: match.season,
      winner: matchWinner,
      set_wins: setWins,
    });
  }

  let currentWinner: string | null = null;
  let currentLength = 0;
  let streakStart: string | number | null = null;
  let streakEnd: string | number | null = null;

  function saveStreak() {
    if (!currentWinner || !currentLength) return;
    const old = playerStats[currentWinner].longest_match_win_streak;
    if (currentLength > old.length) {
      playerStats[currentWinner].longest_match_win_streak = {
        length: currentLength,
        start_match: streakStart,
        end_match: streakEnd,
      };
    }
  }

  for (const result of matchResults) {
    if (result.winner && result.winner === currentWinner) {
      currentLength++;
      streakEnd = result.match_id;
      continue;
    }

    saveStreak();
    if (result.winner) {
      currentWinner = result.winner;
      currentLength = 1;
      streakStart = result.match_id;
      streakEnd = result.match_id;
    } else {
      currentWinner = null;
      currentLength = 0;
      streakStart = null;
      streakEnd = null;
    }
  }
  saveStreak();

  for (const player of Object.keys(playerStats)) {
    const s = playerStats[player];
    s.match_win_rate = s.matches_played ? round1((s.match_wins / s.matches_played) * 100) : 0;
    s.set_win_rate = s.sets_played ? round1((s.set_wins / s.sets_played) * 100) : 0;
    s.average_points_per_match = s.matches_played ? round1(s.total_points / s.matches_played) : 0;
    s.average_set_win_margin = marginCount[player] ? round1(marginSum[player] / marginCount[player]) : 0;
  }

  return {
    matches: matches.length,
    completed_matches: completedMatches,
    sets: totalSets,
    players: playerStats,
    match_results: matchResults,
  };
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (_req, ctx) => {
      try {
        const { data: users, error: usersError } = await ctx.supabase
          .from("users")
          .select("id, name");
        if (usersError) throw usersError;

        const usersById = new Map<string, string>();
        for (const user of users ?? []) usersById.set(String(user.id), user.name);

        const { data: games, error: gamesError } = await ctx.supabase
          .from("games_database")
          .select("*");
        if (gamesError) throw gamesError;

        const matches = buildMatches((games ?? []) as RawGame[], usersById);
        const overall = calculateStats(matches);
        const availableSeasons = [...new Set(matches.map((match) => match.season))].sort((a, b) => b - a);
        const seasons: Record<string, ReturnType<typeof calculateStats>> = {};

        for (const season of availableSeasons) {
          seasons[String(season)] = calculateStats(matches.filter((match) => match.season === season));
        }

        return Response.json({
          available_seasons: availableSeasons,
          overall,
          seasons,
        });
      } catch (error) {
        console.error(error);
        return Response.json(
          { error: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }
  ),
};
