"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  GAMES_TABLE,
  MATCH_ID_COLUMN,
  PLAYER_STORAGE_MODE,
  USERS_TABLE,
} from "@/lib/app-config";

type Tab = "home" | "match" | "stats";

type Player = {
  id: string | number;
  name: string;
};

type SetScore = {
  player1: string;
  player2: string;
};

type BiggestSetWin = {
  margin: number;
  match_id: string | number;
  set_number: number;
  date: string;
  opponent: string;
  player_1: string;
  player_1_score: number;
  player_2: string;
  player_2_score: number;
};

type PlayerStats = {
  matches_played: number;
  match_wins: number;
  match_win_rate: number;
  sets_played: number;
  set_wins: number;
  set_win_rate: number;
  total_points: number;
  average_points_per_match: number;
  average_set_win_margin: number;
  biggest_set_win: BiggestSetWin | null;
  longest_match_win_streak: {
    length: number;
    start_match: string | number | null;
    end_match: string | number | null;
  };
};

type MatchResult = {
  match_id: string | number;
  date: string;
  season: number;
  winner: string | null;
  set_wins: Record<string, number>;
};

type StatsBlock = {
  matches: number;
  completed_matches: number;
  sets: number;
  players: Record<string, PlayerStats>;
  match_results: MatchResult[];
};

type StatsResponse = {
  available_seasons: number[];
  overall: StatsBlock;
  seasons: Record<string, StatsBlock>;
};

function localDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (checkingSession) {
    return <div className="center-status">Henter session…</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="shell">
      <header className="header">
        <div className="page header-inner">
          <div className="brand">
            <div className="brand-icon">🏸</div>
            <div>
              <h1>Badminton Stats</h1>
              <p>Match logger & statistik</p>
            </div>
          </div>

          <div className="header-actions">
            <span className="user-email">{session.user.email}</span>
            <button className="btn" onClick={() => supabase.auth.signOut()}>
              Log ud
            </button>
          </div>
        </div>
      </header>

      <div className="page nav-wrap">
        <nav className="tabs" aria-label="Navigation">
          <TabButton current={tab} tab="home" onClick={setTab}>
            Hjem
          </TabButton>
          <TabButton current={tab} tab="match" onClick={setTab}>
            Indtast kamp
          </TabButton>
          <TabButton current={tab} tab="stats" onClick={setTab}>
            Statistik
          </TabButton>
        </nav>
      </div>

      <main className="page content">
        {tab === "home" && <HomeScreen onNavigate={setTab} />}
        {tab === "match" && <MatchEntry onSaved={() => setTab("stats")} />}
        {tab === "stats" && <Statistics />}
      </main>
    </div>
  );
}

function TabButton({
  current,
  tab,
  onClick,
  children,
}: {
  current: Tab;
  tab: Tab;
  onClick: (tab: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`tab ${current === tab ? "active" : ""}`}
      onClick={() => onClick(tab)}
    >
      {children}
    </button>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Login mislykkedes. Kontrollér email og adgangskode.");
    }

    setLoading(false);
  }

  return (
    <main className="login-page">
      <div className="login-box">
        <div className="login-heading">
          <div className="login-icon">🏸</div>
          <h1>Badminton Stats</h1>
          <p>Log ind for at registrere kampe og se statistikken.</p>
        </div>

        <div className="panel">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Adgangskode</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary btn-wide" disabled={loading}>
              {loading ? "Logger ind…" : "Log ind"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <section>
      <div className="section-title">
        <h2>Badminton dashboard</h2>
        <p>Vælg hvad du vil gøre.</p>
      </div>

      <div className="home-grid">
        <button className="home-card" onClick={() => onNavigate("match")}>
          <div className="icon">✍️</div>
          <h3>Indtast en kamp</h3>
          <p>
            Vælg spillerne, skriv sætscorerne ind og gem kampen direkte i
            Supabase.
          </p>
        </button>

        <button className="home-card" onClick={() => onNavigate("stats")}>
          <div className="icon">📊</div>
          <h3>Se statistik</h3>
          <p>
            Se win rates, sætscore, største sejre, streaks og skift mellem
            sæsoner.
          </p>
        </button>
      </div>
    </section>
  );
}

function MatchEntry({ onSaved }: { onSaved: () => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [date, setDate] = useState(localDateString());
  const [sets, setSets] = useState<SetScore[]>([
    { player1: "", player2: "" },
    { player1: "", player2: "" },
    { player1: "", player2: "" },
  ]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      setLoadingPlayers(true);
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .select("id, name")
        .order("name");

      if (error) {
        setError(`Kunne ikke hente spillere: ${error.message}`);
      } else {
        setPlayers((data ?? []) as Player[]);
      }
      setLoadingPlayers(false);
    }

    loadPlayers();
  }, []);

  const player1 = useMemo(
    () => players.find((player) => String(player.id) === player1Id),
    [players, player1Id]
  );

  const player2 = useMemo(
    () => players.find((player) => String(player.id) === player2Id),
    [players, player2Id]
  );

  function updateSet(index: number, side: keyof SetScore, value: string) {
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index ? { ...set, [side]: value } : set
      )
    );
  }

  function validateAndGetSets() {
    const completed = sets
      .map((set, index) => ({
        setNumber: index + 1,
        p1: set.player1 === "" ? null : Number(set.player1),
        p2: set.player2 === "" ? null : Number(set.player2),
      }))
      .filter((set) => set.p1 !== null || set.p2 !== null);

    if (completed.length < 2) {
      throw new Error("Indtast mindst to komplette sæt.");
    }

    for (const set of completed) {
      if (set.p1 === null || set.p2 === null) {
        throw new Error(`Sæt ${set.setNumber} mangler en score.`);
      }
      if (!Number.isInteger(set.p1) || !Number.isInteger(set.p2)) {
        throw new Error(`Sæt ${set.setNumber} skal have hele pointtal.`);
      }
      if (set.p1 < 0 || set.p2 < 0) {
        throw new Error(`Sæt ${set.setNumber} kan ikke have negative point.`);
      }
      if (set.p1 === set.p2) {
        throw new Error(`Sæt ${set.setNumber} kan ikke ende uafgjort.`);
      }
    }

    const p1Wins = completed.filter((set) => (set.p1 ?? 0) > (set.p2 ?? 0)).length;
    const p2Wins = completed.filter((set) => (set.p2 ?? 0) > (set.p1 ?? 0)).length;

    if (Math.max(p1Wins, p2Wins) < 2) {
      throw new Error("Kampen skal have en vinder med mindst 2 vundne sæt.");
    }

    if (completed.length === 3) {
      const firstTwo = completed.slice(0, 2);
      const firstTwoP1Wins = firstTwo.filter((set) => (set.p1 ?? 0) > (set.p2 ?? 0)).length;
      const firstTwoP2Wins = firstTwo.filter((set) => (set.p2 ?? 0) > (set.p1 ?? 0)).length;
      if (firstTwoP1Wins === 2 || firstTwoP2Wins === 2) {
        throw new Error("Sæt 3 skal være tomt, når en spiller allerede har vundet de første 2 sæt.");
      }
    }

    return completed as Array<{ setNumber: number; p1: number; p2: number }>;
  }

  async function saveMatch() {
    setError("");
    setSuccess("");

    if (!player1 || !player2) {
      setError("Vælg begge spillere.");
      return;
    }

    if (String(player1.id) === String(player2.id)) {
      setError("En spiller kan ikke spille mod sig selv.");
      return;
    }

    let completedSets: Array<{ setNumber: number; p1: number; p2: number }>;
    try {
      completedSets = validateAndGetSets();
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : String(validationError));
      return;
    }

    setSaving(true);

    const selectMatchId = MATCH_ID_COLUMN.includes(" ")
      ? `\"${MATCH_ID_COLUMN}\"`
      : MATCH_ID_COLUMN;

    const { data: latest, error: latestError } = await supabase
      .from(GAMES_TABLE)
      .select(selectMatchId)
      .order(MATCH_ID_COLUMN, { ascending: false })
      .limit(1);

    if (latestError) {
      setError(`Kunne ikke finde næste match-id: ${latestError.message}`);
      setSaving(false);
      return;
    }

    const latestRow = latest?.[0] as Record<string, unknown> | undefined;
    const latestId = latestRow ? Number(latestRow[MATCH_ID_COLUMN]) : 0;
    const newMatchId = Number.isFinite(latestId) ? latestId + 1 : 1;

    const storedPlayer1 = PLAYER_STORAGE_MODE === "id" ? player1.id : player1.name;
    const storedPlayer2 = PLAYER_STORAGE_MODE === "id" ? player2.id : player2.name;

    const rows = completedSets.map((set) => ({
      [MATCH_ID_COLUMN]: newMatchId,
      set_number: set.setNumber,
      player_1: storedPlayer1,
      player_1_score: set.p1,
      player_2: storedPlayer2,
      player_2_score: set.p2,
      date,
    }));

    const { error: insertError } = await supabase.from(GAMES_TABLE).insert(rows);

    if (insertError) {
      setError(`Kampen kunne ikke gemmes: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setSuccess(`Kamp #${newMatchId} blev gemt.`);
    setSets([
      { player1: "", player2: "" },
      { player1: "", player2: "" },
      { player1: "", player2: "" },
    ]);
    setSaving(false);

    window.setTimeout(onSaved, 800);
  }

  return (
    <section>
      <div className="section-title">
        <h2>Indtast kamp</h2>
        <p>Gem en ny kamp direkte i {GAMES_TABLE}.</p>
      </div>

      <div className="panel">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="player1">Spiller 1</label>
            <select
              id="player1"
              className="select"
              disabled={loadingPlayers}
              value={player1Id}
              onChange={(event) => setPlayer1Id(event.target.value)}
            >
              <option value="">Vælg spiller</option>
              {players.map((player) => (
                <option key={player.id} value={String(player.id)}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="player2">Spiller 2</label>
            <select
              id="player2"
              className="select"
              disabled={loadingPlayers}
              value={player2Id}
              onChange={(event) => setPlayer2Id(event.target.value)}
            >
              <option value="">Vælg spiller</option>
              {players.map((player) => (
                <option key={player.id} value={String(player.id)}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 18, maxWidth: 260 }}>
          <label htmlFor="date">Dato</label>
          <input
            id="date"
            className="input"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="set-list">
          {sets.map((set, index) => (
            <div className="set-row" key={index}>
              <div className="score-wrap">
                <strong>{player1?.name ?? "Spiller 1"}</strong>
                <input
                  aria-label={`${player1?.name ?? "Spiller 1"} score i sæt ${index + 1}`}
                  className="input score-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={set.player1}
                  onChange={(event) => updateSet(index, "player1", event.target.value)}
                />
              </div>

              <div className="set-number">
                Sæt {index + 1}
                {index === 2 && <div>(valgfrit)</div>}
              </div>

              <div className="score-wrap">
                <strong>{player2?.name ?? "Spiller 2"}</strong>
                <input
                  aria-label={`${player2?.name ?? "Spiller 2"} score i sæt ${index + 1}`}
                  className="input score-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={set.player2}
                  onChange={(event) => updateSet(index, "player2", event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button className="btn btn-primary btn-wide" disabled={saving} onClick={saveMatch}>
          {saving ? "Gemmer kamp…" : "Gem kamp"}
        </button>
      </div>
    </section>
  );
}

function Statistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [season, setSeason] = useState("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 async function loadStats() {

  setLoading(true);
  setError("");

  try {

    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "badminton-stats"
    );


    if (error) {

      console.error(
        "Edge Function error:",
        error
      );


      // ---------------------------------------------
      // Functionen svarede, men med 4xx / 5xx
      // ---------------------------------------------

      if (
        error instanceof FunctionsHttpError
      ) {

        try {

          const errorBody =
            await error.context.json();


          console.error(
            "Backend response:",
            errorBody
          );


          setError(
            errorBody?.error
              ? `Kunne ikke hente statistik: ${errorBody.error}`
              : `Kunne ikke hente statistik: ${JSON.stringify(errorBody)}`
          );

        } catch {

          setError(
            `Kunne ikke hente statistik: ${error.message}`
          );

        }

      }

      // ---------------------------------------------
      // Problem mellem Supabase relay og function
      // ---------------------------------------------

      else if (
        error instanceof FunctionsRelayError
      ) {

        setError(
          `Supabase relay fejl: ${error.message}`
        );

      }

      // ---------------------------------------------
      // Browseren kunne slet ikke nå functionen
      // ---------------------------------------------

      else if (
        error instanceof FunctionsFetchError
      ) {

        setError(
          `Kunne ikke kontakte Edge Function: ${error.message}`
        );

      }

      else {

        setError(
          `Kunne ikke hente statistik: ${error.message}`
        );

      }


      setLoading(false);

      return;

    }


    console.log(
      "Statistics response:",
      data
    );


    setStats(
      data as StatsResponse
    );


  } catch (err) {

    console.error(
      "Unexpected stats error:",
      err
    );


    setError(
      err instanceof Error
        ? err.message
        : String(err)
    );

  } finally {

    setLoading(false);

  }

}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlayerStatsCard({ name, stats }: { name: string; stats: PlayerStats }) {
  const width = Math.max(0, Math.min(100, stats.match_win_rate || 0));

  return (
    <article className="player-card">
      <div className="player-card-header">
        <h3>{name}</h3>
      </div>
      <div className="player-card-body">
        <div className="muted" style={{ fontSize: 12 }}>
          Match win rate
        </div>
        <div className="big-rate">{stats.match_win_rate}%</div>
        <div className="rate-bar" aria-label={`${name} match win rate ${stats.match_win_rate}%`}>
          <div style={{ width: `${width}%` }} />
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          {stats.match_wins} sejre i {stats.matches_played} kampe
        </div>

        <div className="stat-grid">
          <StatItem label="Set win rate" value={`${stats.set_win_rate}%`} />
          <StatItem label="Set wins" value={stats.set_wins} />
          <StatItem label="Avg. point/kamp" value={stats.average_points_per_match} />
          <StatItem label="Avg. sejrsmargin" value={stats.average_set_win_margin} />
          <StatItem label="Længste streak" value={stats.longest_match_win_streak.length} />
          <StatItem
            label="Største sætsejr"
            value={stats.biggest_set_win ? `+${stats.biggest_set_win.margin}` : "-"}
          />
        </div>

        {stats.biggest_set_win && (
          <div className="biggest-win">
            <span>Største sætsejr</span>
            <p>
              <strong>
                {stats.biggest_set_win.player_1} {stats.biggest_set_win.player_1_score} – {stats.biggest_set_win.player_2_score} {stats.biggest_set_win.player_2}
              </strong>
              <br />
              <span style={{ textTransform: "none", letterSpacing: 0 }}>
                Kamp #{stats.biggest_set_win.match_id}, sæt {stats.biggest_set_win.set_number}
              </span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
