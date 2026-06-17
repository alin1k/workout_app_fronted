import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import UserMenu from '../components/UserMenu.jsx';
import ProgressChart from '../components/ProgressChart.jsx';

const unitLabel = (unit) => (unit === 'kg' ? 'kg' : 'reps');
const fmtNum = (v) => v.toLocaleString();
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Header() {
  return (
    <header className="appbar">
      <div className="grow row gap10">
        <span className="appbar-mark">
          <Icon name="activity" size={21} />
        </span>
        <div>
          <div className="display-lg" style={{ fontSize: 21, lineHeight: 1 }}>Progress</div>
          <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Track your lifts over time
          </div>
        </div>
      </div>
      <UserMenu />
    </header>
  );
}

function ProgressSection({ status, progress, onRetry }) {
  if (status === 'loading') {
    return <div className="chart-card skeleton" style={{ minHeight: 220 }} aria-busy="true" />;
  }
  if (status === 'error') {
    return (
      <div className="chart-card" style={{ textAlign: 'center' }}>
        <div className="muted" style={{ fontSize: 14, marginBottom: 10 }}>
          Couldn’t load this exercise.
        </div>
        <Button onClick={onRetry}>
          <Icon name="repeat" size={16} /> Retry
        </Button>
      </div>
    );
  }
  if (status !== 'ready' || !progress) return null;

  const { series, unit, pr } = progress;
  if (series.length === 0) {
    return (
      <div className="chart-card" style={{ textAlign: 'center' }}>
        <div className="muted" style={{ fontSize: 14, padding: '8px 0' }}>
          No sets logged for this exercise yet.
        </div>
      </div>
    );
  }

  const latest = series[series.length - 1].value;
  const heaviest = Math.max(...series.map((s) => s.value));
  const suffix = unit === 'kg' ? 'kg' : ' reps';

  let delta = null;
  if (series.length >= 2) {
    const diff = latest - series[series.length - 2].value;
    if (diff === 0) {
      delta = { cls: 'flat', icon: null, text: 'No change' };
    } else {
      const up = diff > 0;
      delta = {
        cls: up ? 'up' : 'down',
        icon: <Icon name={up ? 'chevronUp' : 'chevronDown'} size={14} />,
        text: `${up ? '+' : '-'}${fmtNum(Math.abs(diff))}${suffix}`,
      };
    }
  }

  return (
    <>
      <div className="chart-card chart-card-hero">
        <div className="chart-head">
          <div>
            <div className="chart-head-label">Heaviest set</div>
            <div className="chart-head-val">
              {fmtNum(heaviest)}
              <span className="chart-head-unit">{unitLabel(unit)}</span>
            </div>
          </div>
          {delta && (
            <div className={`chart-delta ${delta.cls}`}>
              {delta.icon}
              {delta.text}
              <span className="chart-delta-tag">vs last</span>
            </div>
          )}
        </div>
        <ProgressChart series={series} pr={pr} />
      </div>

      {pr && (
        <div className="pr-callout pr-callout-wide">
          <div className="pr-medal">
            <Icon name="award" size={22} />
          </div>
          <div className="pr-body">
            <div className="pr-label">Personal best</div>
            <div className="pr-value">
              {fmtNum(pr.value)}
              <span className="pr-unit">{unitLabel(unit)}</span>
            </div>
          </div>
          <div className="pr-date">
            <div className="pr-date-label">Set on</div>
            <div className="pr-date-val">{fmtDate(pr.date)}</div>
          </div>
        </div>
      )}
    </>
  );
}

function Dashboard() {
  const [summaryStatus, setSummaryStatus] = useState('loading'); // loading | error | ready
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [progressStatus, setProgressStatus] = useState('idle'); // idle | loading | error | ready
  const [progress, setProgress] = useState(null);

  const fetchProgress = useCallback(async (typeId) => {
    setProgressStatus('loading');
    const { data, error } = await api.get(`/dashboard/progress/${typeId}`);
    if (error) {
      setProgress(null);
      setProgressStatus('error');
      return;
    }
    setProgress(data);
    setProgressStatus('ready');
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryStatus('loading');
    const { data, error } = await api.get('/dashboard/summary');
    if (error) {
      setSummaryError(error);
      setSummaryStatus('error');
      return;
    }
    setSummary(data);
    setSummaryStatus('ready');
    const first = data.exercise_types?.[0];
    if (first) {
      setSelectedId(first.id);
      fetchProgress(first.id);
    }
  }, [fetchProgress]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary();
  }, [fetchSummary]);

  const onSelect = (typeId) => {
    if (typeId === selectedId) return;
    setSelectedId(typeId);
    fetchProgress(typeId);
  };

  const isInitialLoading = summaryStatus === 'loading';
  const isError = summaryStatus === 'error';
  const isEmpty = summaryStatus === 'ready' && (summary?.exercise_types?.length ?? 0) === 0;

  let body;
  if (isInitialLoading) {
    body = (
      <div className="col gap12" aria-busy="true" aria-label="Loading progress">
        <div className="chart-card skeleton" style={{ minHeight: 220 }} />
        <div className="stat-grid-2">
          <div className="stat-tile skeleton" style={{ minHeight: 92 }} />
          <div className="stat-tile skeleton" style={{ minHeight: 92 }} />
        </div>
      </div>
    );
  } else if (isError) {
    body = (
      <div className="empty fade-in" style={{ marginTop: 40 }}>
        <div className="empty-orb" style={{ width: 76, height: 76 }}>
          <Icon name="alert" size={32} stroke={1.7} />
        </div>
        <div>
          <div className="display-lg" style={{ marginBottom: 6 }}>Couldn’t load progress</div>
          <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 280 }}>
            {summaryError?.message || 'Try again in a moment.'}
          </div>
        </div>
        <Button size="lg" onClick={fetchSummary} style={{ marginTop: 4 }}>
          <Icon name="repeat" size={18} /> Retry
        </Button>
      </div>
    );
  } else if (isEmpty) {
    body = (
      <div className="empty fade-in" style={{ marginTop: 40 }}>
        <div className="empty-orb">
          <Icon name="activity" size={40} stroke={1.6} />
        </div>
        <div>
          <div className="display-lg" style={{ marginBottom: 6 }}>No data yet</div>
          <div className="muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 280 }}>
            Log a few sessions and your progress will grow into a chart here.
          </div>
        </div>
      </div>
    );
  } else {
    const types = summary.exercise_types;
    const week = summary.week;
    body = (
      <div className="dash-stack">
        <div className="ex-picker">
          <div className="ex-picker-row">
            {types.map((t) => (
              <button
                key={t.id}
                className={'ex-chip' + (t.id === selectedId ? ' is-on' : '')}
                onClick={() => onSelect(t.id)}
                aria-pressed={t.id === selectedId}
              >
                <span className="ex-chip-name">{t.name}</span>
                {t.muscle_group && <span className="ex-chip-muscle">{t.muscle_group}</span>}
              </button>
            ))}
          </div>
        </div>

        <ProgressSection
          status={progressStatus}
          progress={progress}
          onRetry={() => selectedId != null && fetchProgress(selectedId)}
        />

        <div className="stat-grid-2">
          <div className="stat-tile">
            <div className="stat-tile-icon"><Icon name="layers" size={18} /></div>
            <div className="stat-tile-val">{week.volume_kg.toLocaleString()}</div>
            <div className="stat-tile-label">Volume this week</div>
            <div className="stat-tile-sub">kg lifted</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon"><Icon name="calendar" size={18} /></div>
            <div className="stat-tile-val">{week.sessions.toLocaleString()}</div>
            <div className="stat-tile-label">Sessions</div>
            <div className="stat-tile-sub">this week</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="scroll">
        <div className={'page' + (isInitialLoading || isError || isEmpty ? '' : ' page-dash')}>
          {body}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
