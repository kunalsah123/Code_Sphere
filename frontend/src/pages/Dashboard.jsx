import { createElement, useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Check, ChevronDown, Code2, Flame, LayoutDashboard, LogOut, UserRound, TrendingUp } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const difficultyColors = { easy: '#00d68f', medium: '#f5b700', hard: '#ff3158' };

const dayKey = (date) => date.toISOString().slice(0, 10);
const makeUtcDate = (year, month, day) => new Date(Date.UTC(year, month, day));

function MetricCard({ icon, label, value, detail, color }) {
    return (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ color, backgroundColor: `${color}20` }}>{createElement(icon, { size: 21 })}</span>
                <span className="text-right text-sm text-zinc-400">{label}</span>
            </div>
            <p className="text-4xl font-bold text-white">{value}</p>
            <p className="mt-2 text-sm text-zinc-500">{detail}</p>
        </article>
    );
}

function Dashboard() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('year');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getUTCMonth());

    useEffect(() => {
        let active = true;
        axiosClient.get('/dashboard/me')
            .then(({ data: dashboard }) => { if (active) setData(dashboard); })
            .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'Could not load your dashboard.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const activityMap = useMemo(() => new Map((data?.activity || []).map((day) => [day.date, day])), [data]);
    const calendar = useMemo(() => {
        const today = new Date();
        const end = makeUtcDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        let start;
        if (view === 'month') {
            start = makeUtcDate(today.getUTCFullYear(), selectedMonth, 1);
            const monthEnd = makeUtcDate(today.getUTCFullYear(), selectedMonth + 1, 0);
            if (monthEnd > end) end.setTime(monthEnd.getTime());
        } else {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 364);
        }
        start.setUTCDate(start.getUTCDate() - start.getUTCDay());
        const days = [];
        for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
            const date = new Date(cursor);
            days.push({ date, activity: activityMap.get(dayKey(date)) });
        }
        const weeks = [];
        for (let offset = 0; offset < days.length; offset += 7) weeks.push(days.slice(offset, offset + 7));
        return weeks;
    }, [view, selectedMonth, activityMap]);

    const activitySummary = useMemo(() => {
        const visibleDays = calendar.flat();
        return {
            submissions: visibleDays.reduce((sum, day) => sum + (day.activity?.submissions || 0), 0),
            accepted: visibleDays.reduce((sum, day) => sum + (day.activity?.accepted || 0), 0),
            activeDays: visibleDays.filter((day) => (day.activity?.submissions || 0) > 0).length
        };
    }, [calendar]);

    const logout = async () => { await dispatch(logoutUser()); };
    const summary = data?.summary || {};

    return (
        <div className="min-h-screen overflow-x-hidden bg-black text-zinc-100">
            <div className="mx-auto flex min-h-screen max-w-[1700px]">
                <aside className="hidden w-64 shrink-0 border-r border-zinc-900 bg-[#080808] p-5 lg:flex lg:flex-col">
                    <Link to="/" className="mb-10 text-2xl font-extrabold tracking-tight text-white">Code<span className="text-blue-500">Sphere</span></Link>
                    <div className="mb-6 flex items-center gap-3 border-b border-zinc-900 pb-6">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold">{user?.firstName?.[0]?.toUpperCase() || 'U'}</span>
                        <div className="min-w-0"><p className="truncate font-semibold">{user?.firstName}</p><p className="truncate text-xs text-zinc-500">{user?.emailId}</p></div>
                    </div>
                    <nav className="space-y-2">
                        <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}><LayoutDashboard size={18} />Dashboard</NavLink>
                        <a href="#activity" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"><TrendingUp size={18} />My Progress</a>
                        <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}><UserRound size={18} />Profile</NavLink>
                    </nav>
                    <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-xl border-t border-zinc-900 px-4 py-4 text-left text-sm text-zinc-400 hover:text-rose-400"><LogOut size={18} />Sign out</button>
                </aside>

                <main className="min-w-0 flex-1">
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 px-5 py-6 md:px-10">
                        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Your learning overview</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-zinc-500">Track your coding progress and achievements</p></div>
                        <div className="flex items-center gap-2 lg:hidden"><Link className="btn btn-sm btn-ghost" to="/">Problems</Link><Link className="btn btn-sm btn-ghost" to="/profile">Profile</Link></div>
                        <div className="hidden items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 font-bold">{user?.firstName?.[0]?.toUpperCase() || 'U'}</span><div><p className="text-sm font-medium">{user?.firstName}</p><p className="text-xs text-zinc-500">Coding progress</p></div><ChevronDown size={15} className="text-zinc-500" /></div>
                    </header>

                    <div className="space-y-7 p-5 md:p-10">
                        {error && <div className="alert alert-error">{error}</div>}
                        {loading ? <div className="grid min-h-64 place-items-center"><span className="loading loading-spinner loading-lg text-blue-500" /></div> : data && <>
                            <section className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
                                <MetricCard icon={Code2} label="Problems Solved" value={summary.problemsSolved || 0} detail={`of ${summary.totalProblems || 0} total`} color="#3b82f6" />
                                <MetricCard icon={Check} label="Acceptance Rate" value={`${summary.acceptanceRate || 0}%`} detail={`${summary.acceptedSubmissions || 0} accepted submissions`} color="#00d68f" />
                                <MetricCard icon={Flame} label="Current Streak" value={summary.currentStreak || 0} detail="consecutive active days" color="#ffc400" />
                                <MetricCard icon={TrendingUp} label="Total Submissions" value={summary.totalSubmissions || 0} detail="all time" color="#ff3158" />
                            </section>

                            <section className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))' }}>
                                <article id="activity" className="min-w-0 rounded-2xl border border-zinc-800 bg-[#080808] p-5 md:p-7">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div><h2 className="flex items-center gap-3 text-2xl font-bold"><CalendarDays className="text-emerald-400" />Activity</h2><p className="mt-2 text-sm text-zinc-400">{activitySummary.accepted} accepted submissions · {activitySummary.submissions} total submissions · {activitySummary.activeDays} active days</p></div>
                                        <div className="join border border-zinc-800 bg-zinc-900 p-1"><button className={`btn btn-sm join-item border-0 ${view === 'year' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-transparent text-zinc-400'}`} onClick={() => setView('year')}>Year View</button><button className={`btn btn-sm join-item border-0 ${view === 'month' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-transparent text-zinc-400'}`} onClick={() => setView('month')}>Month View</button></div>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <button className={`btn btn-xs ${view === 'year' ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' : 'btn-ghost'}`} onClick={() => setView('year')}>Past year</button>
                                        {months.map((month, index) => <button key={month} className={`btn btn-xs ${view === 'month' && selectedMonth === index ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' : 'btn-ghost text-zinc-400'}`} onClick={() => { setSelectedMonth(index); setView('month'); }}>{month}</button>)}
                                    </div>
                                    <div className="mt-5 overflow-x-auto pb-3">
                                        <div className="min-w-max">
                                            <div className="mb-2 grid grid-rows-1 gap-1 text-[10px] text-zinc-500" style={{ gridAutoFlow: 'column', gridAutoColumns: '13px' }}>
                                                {calendar.map((week, index) => {
                                                    const firstDate = week[0]?.date;
                                                    const previousMonth = index > 0 ? calendar[index - 1]?.[0]?.date.getUTCMonth() : -1;
                                                    const changed = firstDate && firstDate.getUTCMonth() !== previousMonth;
                                                    return <span key={index} className="overflow-visible whitespace-nowrap">{changed ? months[firstDate.getUTCMonth()] : ''}</span>;
                                                })}
                                            </div>
                                            <div className="grid grid-rows-7 gap-1" style={{ gridAutoFlow: 'column', gridAutoColumns: '13px' }}>
                                                {calendar.flatMap((week, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => {
                                                    const day = week[dayIndex];
                                                    if (!day) return <span key={`${weekIndex}-${dayIndex}`} />;
                                                    const count = day.activity?.submissions || 0;
                                                    const intensity = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
                                                    const backgrounds = ['#18181b', '#172554', '#1e40af', '#2563eb', '#60a5fa'];
                                                    const tooltip = `${day.date.toLocaleDateString()}: ${count} submission${count === 1 ? '' : 's'}, ${day.activity?.accepted || 0} accepted`;
                                                    return <span key={`${weekIndex}-${dayIndex}`} title={tooltip} aria-label={tooltip} className="h-[13px] w-[13px] rounded-[3px] outline outline-1 outline-white/[0.04]" style={{ backgroundColor: backgrounds[intensity] }} />;
                                                }))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-xs text-zinc-500"><span>Hover a square to see that day's submissions</span><span>Less <span className="mx-1 inline-flex gap-1 align-middle">{['#18181b', '#172554', '#1e40af', '#2563eb', '#60a5fa'].map((color) => <i key={color} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />)}</span>More</span></div>
                                </article>

                                <article className="rounded-2xl border border-zinc-800 bg-[#080808] p-5 md:p-7">
                                    <h2 className="text-xl font-semibold">Difficulty</h2>
                                    <p className="mt-1 text-sm text-zinc-500">Problems solved by level</p>
                                    <div className="mt-8 grid grid-cols-3 gap-2">
                                        {['easy', 'medium', 'hard'].map((level) => {
                                            const stat = data.difficulty?.[level] || { solved: 0, total: 0 };
                                            const percentage = stat.total ? Math.min(100, stat.solved / stat.total * 100) : 0;
                                            return <div key={level} className="text-center">
                                                <div className="mx-auto grid h-[76px] w-[76px] place-items-center rounded-full p-[7px]" style={{ background: `conic-gradient(${difficultyColors[level]} ${percentage}%, #18181b 0)` }}><span className="grid h-full w-full place-items-center rounded-full bg-[#080808] text-lg font-bold">{stat.solved}</span></div>
                                                <p className="mt-3 font-medium capitalize" style={{ color: difficultyColors[level] }}>{level}</p>
                                                <p className="mt-1 text-xs text-zinc-500">{stat.solved}/{stat.total}</p>
                                            </div>;
                                        })}
                                    </div>
                                    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-sm text-zinc-400">Keep your streak going</p><p className="mt-1 text-2xl font-bold text-amber-400">{summary.currentStreak || 0} day{summary.currentStreak === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-zinc-600">Submit a solution today to stay active.</p></div>
                                </article>
                            </section>

                            <section className="rounded-2xl border border-zinc-800 bg-[#080808] p-5 md:p-7">
                                <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Recent submissions</h2><p className="mt-1 text-sm text-zinc-500">Your latest code attempts</p></div><Link to="/" className="btn btn-sm btn-ghost text-blue-400">Browse problems</Link></div>
                                {data.recentSubmissions?.length ? <div className="overflow-x-auto"><table className="table"><thead><tr className="text-zinc-500"><th>Problem</th><th>Difficulty</th><th>Status</th><th>Tests passed</th><th>Submitted</th></tr></thead><tbody>{data.recentSubmissions.map((submission) => <tr key={submission._id} className="border-zinc-900"><td><Link className="font-medium text-zinc-200 hover:text-blue-400" to={`/problem/${submission.problemId}`}>{submission.problem?.title || 'Problem'}</Link></td><td className="capitalize text-zinc-400">{submission.problem?.difficulty || '—'}</td><td><span className={`badge badge-sm ${submission.status === 'accepted' ? 'badge-success' : submission.status === 'wrong' ? 'badge-error' : 'badge-warning'}`}>{submission.status}</span></td><td className="text-zinc-400">{submission.testCasesPassed}/{submission.testCasesTotal}</td><td className="text-zinc-500">{new Date(submission.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center"><p className="font-medium">No submissions yet</p><p className="mt-1 text-sm text-zinc-500">Solve a problem and submit your code to start building your activity.</p><Link to="/" className="btn btn-sm btn-primary mt-4">Find a problem</Link></div>}
                            </section>
                        </>}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;
