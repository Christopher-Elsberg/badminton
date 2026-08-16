function Statistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [season, setSeason] = useState("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "badminton-stats"
      );

      if (error) {
        console.error("Edge Function error:", error);

        if (error instanceof FunctionsHttpError) {
          try {
            const errorBody = await error.context.json();

            console.error(
              "Backend response:",
              errorBody
            );

            setError(
              errorBody?.error
                ? `Kunne ikke hente statistik: ${errorBody.error}`
                : `Kunne ikke hente statistik: ${JSON.stringify(
                    errorBody
                  )}`
            );
          } catch {
            setError(
              `Kunne ikke hente statistik: ${error.message}`
            );
          }
        } else if (
          error instanceof FunctionsRelayError
        ) {
          setError(
            `Supabase relay fejl: ${error.message}`
          );
        } else if (
          error instanceof FunctionsFetchError
        ) {
          setError(
            `Kunne ikke kontakte Edge Function: ${error.message}`
          );
        } else {
          setError(
            `Kunne ikke hente statistik: ${error.message}`
          );
        }

        return;
      }

      console.log(
        "Statistics response:",
        data
      );

      setStats(data as StatsResponse);
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

  if (loading) {
    return (
      <section>
        <div className="section-title">
          <h2>Statistik</h2>
          <p>Henter statistik…</p>
        </div>

        <div className="panel">
          Henter statistik…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="section-title">
          <h2>Statistik</h2>
          <p>Der opstod en fejl.</p>
        </div>

        <div className="alert alert-error">
          {error}
        </div>

        <button
          className="btn btn-primary"
          onClick={loadStats}
          style={{ marginTop: 16 }}
        >
          Prøv igen
        </button>
      </section>
    );
  }

  if (!stats) {
    return (
      <section>
        <div className="alert alert-error">
          Der blev ikke returneret statistik.
        </div>
      </section>
    );
  }

  const selectedStats =
    season === "overall"
      ? stats.overall
      : stats.seasons[season];

  if (!selectedStats) {
    return (
      <section>
        <div className="alert alert-error">
          Statistikken for den valgte sæson findes ikke.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="section-title">
        <h2>Statistik</h2>
        <p>
          Se samlet statistik eller vælg en bestemt sæson.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <select
          className="select"
          value={season}
          onChange={(event) =>
            setSeason(event.target.value)
          }
          style={{ maxWidth: 220 }}
        >
          <option value="overall">
            Alle sæsoner
          </option>

          {stats.available_seasons.map(
            (year) => (
              <option
                key={year}
                value={String(year)}
              >
                {year}
              </option>
            )
          )}
        </select>

        <button
          className="btn"
          onClick={loadStats}
        >
          Opdater
        </button>
      </div>

      <div className="summary-grid">
        <SummaryCard
          label="Kampe"
          value={selectedStats.matches}
        />

        <SummaryCard
          label="Færdige kampe"
          value={
            selectedStats.completed_matches
          }
        />

        <SummaryCard
          label="Sæt"
          value={selectedStats.sets}
        />

        <SummaryCard
          label="Sæson"
          value={
            season === "overall"
              ? "Alle"
              : season
          }
        />
      </div>

      <div className="player-grid">
        {Object.entries(
          selectedStats.players
        ).map(([name, playerStats]) => (
          <PlayerStatsCard
            key={name}
            name={name}
            stats={playerStats}
          />
        ))}
      </div>

      <div
        className="panel"
        style={{ marginTop: 24 }}
      >
        <h3>Seneste kampe</h3>

        {selectedStats.match_results.length ===
        0 ? (
          <p className="muted">
            Ingen kampe fundet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 16,
            }}
          >
            {[
              ...selectedStats.match_results,
            ]
              .reverse()
              .slice(0, 10)
              .map((match) => (
                <div
                  key={`${match.match_id}-${match.date}`}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: 14,
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <strong>
                      Kamp #{match.match_id}
                    </strong>

                    <div className="muted">
                      {match.date}
                    </div>
                  </div>

                  <div>
                    {match.winner ? (
                      <strong>
                        🏆 {match.winner}
                      </strong>
                    ) : (
                      <span className="muted">
                        Ingen vinder
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
