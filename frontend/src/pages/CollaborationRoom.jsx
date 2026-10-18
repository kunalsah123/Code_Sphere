import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useNavigate, useParams } from 'react-router';
import { io } from 'socket.io-client';
import { Copy, LogOut, MessageCircle, Send, Users } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import API_BASE_URL from '../config/api';

const languageNames = { javascript: 'JavaScript', java: 'Java', cpp: 'C++' };

export default function CollaborationRoom() {
    const { inviteToken } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const editorRef = useRef(null);
    const emitTimerRef = useRef(null);
    const remoteSnapshotRef = useRef(null);
    const [room, setRoom] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [members, setMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [runResult, setRunResult] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        let active = true;
        let socket;
        const connectToRoom = async () => {
            try {
                const { data } = await axiosClient.post(`/collaboration/rooms/invite/${inviteToken}/join`);
                if (!active) return;
                setRoom(data.room);
                setCode(data.state?.code || '');
                setLanguage(data.state?.language || 'javascript');
                setMessages(data.messages || []);
                setMembers(data.room.participants || []);

                // Start with Socket.IO's polling transport and let it upgrade to
                // WebSocket. This avoids getting stuck on "websocket error" in
                // browser networks/proxies that block a direct WS handshake.
                socket = io(API_BASE_URL, { withCredentials: true, reconnection: true });
                socketRef.current = socket;
                socket.on('connect', () => {
                    setConnectionStatus('Connected');
                    setError('');
                    socket.emit('room:join', { roomId: data.room.id }, (result) => {
                        if (result?.error) {
                            setError(result.error);
                            return;
                        }
                        if (result?.state) {
                            remoteSnapshotRef.current = `${result.state.language}\u0000${result.state.code}`;
                            setCode(result.state.code);
                            setLanguage(result.state.language);
                        }
                        if (result?.messages) setMessages(result.messages);
                    });
                });
                socket.on('disconnect', () => setConnectionStatus('Reconnecting'));
                socket.on('connect_error', (socketError) => {
                    setConnectionStatus('Reconnecting');
                    setError(socketError.message || 'Could not connect to collaboration server.');
                });
                socket.on('room:code-change', (update) => {
                    remoteSnapshotRef.current = `${update.language}\u0000${update.code}`;
                    setCode(update.code);
                    setLanguage(update.language);
                });
                socket.on('room:presence', setMembers);
                socket.on('room:chat', (message) => setMessages((current) => [...current.slice(-99), message]));
                socket.on('room:error', (socketError) => setError(socketError.message));
                socket.on('room:ended', ({ message }) => {
                    setError(message || 'This room has ended.');
                    setRoom((current) => current ? { ...current, status: 'ended' } : current);
                });
            } catch (joinError) {
                if (active) {
                    setError(joinError.response?.data?.error || 'Could not join this room. Sign in with a CodeSphere account and try again.');
                    setRoom(joinError.response?.status === 401 ? { requiresLogin: true } : null);
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        connectToRoom();
        return () => {
            active = false;
            clearTimeout(emitTimerRef.current);
            socket?.disconnect();
            socketRef.current = null;
        };
    }, [inviteToken]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket?.connected || !room || room.status !== 'active') return undefined;
        const snapshot = `${language}\u0000${code}`;
        if (remoteSnapshotRef.current === snapshot) {
            remoteSnapshotRef.current = null;
            return undefined;
        }
        clearTimeout(emitTimerRef.current);
        emitTimerRef.current = setTimeout(() => {
            socket.emit('room:code-change', { roomId: room.id, code, language });
        }, 120);
        return () => clearTimeout(emitTimerRef.current);
    }, [code, language, room]);

    const changeLanguage = useCallback((nextLanguage) => {
        setLanguage(nextLanguage);
    }, []);

    const runCode = async (submit = false) => {
        setBusy(true);
        setRunResult(null);
        try {
            const endpoint = submit ? `/submission/submit/${room.problemId}` : `/submission/run/${room.problemId}`;
            const { data } = await axiosClient.post(endpoint, { code, language });
            setRunResult(submit ? { ...data, isSubmit: true } : data);
        } catch (runError) {
            setRunResult({ error: runError.response?.data?.error || runError.response?.data?.message || runError.message });
        } finally {
            setBusy(false);
        }
    };

    const sendMessage = (event) => {
        event.preventDefault();
        const text = chatText.trim();
        if (!text || !socketRef.current?.connected || !room || room.status !== 'active') return;
        socketRef.current.emit('room:chat', { roomId: room.id, text });
        setChatText('');
    };

    const copyInvite = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setConnectionStatus('Invite link copied');
            setTimeout(() => setConnectionStatus(socketRef.current?.connected ? 'Connected' : 'Reconnecting'), 1800);
        } catch {
            setError('Clipboard access is unavailable. Copy the room URL from the address bar.');
        }
    };

    const endRoom = async () => {
        if (!room?.isOwner) return;
        try {
            await axiosClient.delete(`/collaboration/rooms/${room.id}`);
            navigate(`/problem/${room.problemId}`);
        } catch (endError) {
            setError(endError.response?.data?.error || 'Could not end the room.');
        }
    };

    if (loading) return <div className="min-h-screen grid place-items-center"><span className="loading loading-spinner loading-lg" /></div>;
    if (!room || room.requiresLogin) {
        return <main className="min-h-screen grid place-items-center bg-base-200 p-6"><section className="card w-full max-w-lg bg-base-100 shadow-xl"><div className="card-body"><h1 className="card-title">Join a CodeSphere team room</h1><p>{error || 'This invite link is invalid or has expired.'}</p><div className="card-actions"><Link className="btn btn-primary" to="/login">Sign in</Link><Link className="btn btn-ghost" to="/">Go home</Link></div></div></section></main>;
    }

    const ended = room.status !== 'active';
    return (
        <main className="h-screen min-h-[600px] flex flex-col bg-base-200">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
                <div>
                    <Link to={`/problem/${room.problemId}`} className="text-sm link link-hover">← Back to problem</Link>
                    <h1 className="text-lg font-bold">Team coding room</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${connectionStatus === 'Connected' ? 'badge-success' : 'badge-warning'}`}>{connectionStatus}</span>
                    <span className="badge badge-outline"><Users size={14} className="mr-1" />{members.length}/3 members</span>
                    <button className="btn btn-sm btn-outline" onClick={copyInvite}><Copy size={15} />Copy invite</button>
                    {room.isOwner && !ended && <button className="btn btn-sm btn-error btn-outline" onClick={endRoom}><LogOut size={15} />End room</button>}
                </div>
            </header>

            {error && <div className="alert alert-warning mx-4 mt-3">{error}</div>}
            {ended && <div className="alert alert-info mx-4 mt-3">This room has ended. Your code remains available until you leave this page.</div>}

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="flex min-h-0 flex-col border-r border-base-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-4 py-2">
                        <div className="flex gap-2">
                            {Object.entries(languageNames).map(([key, name]) => <button key={key} className={`btn btn-xs ${language === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => changeLanguage(key)} disabled={ended}>{name}</button>)}
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-outline" onClick={() => runCode(false)} disabled={busy || ended}>{busy ? 'Running…' : 'Run'}</button>
                            <button className="btn btn-sm btn-primary" onClick={() => runCode(true)} disabled={busy || ended}>{busy ? 'Submitting…' : 'Submit'}</button>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1"><Editor height="100%" language={language === 'cpp' ? 'cpp' : language} value={code} onChange={(value) => setCode(value || '')} onMount={(editor) => { editorRef.current = editor; }} theme="vs-dark" options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, readOnly: ended }} /></div>
                    <div className="max-h-36 overflow-auto border-t border-base-300 bg-base-100 p-3 text-sm">
                        <strong>{runResult?.isSubmit ? (runResult.accepted ? 'Accepted' : 'Submission result') : 'Run output'}</strong>
                        {runResult ? <pre className="mt-2 whitespace-pre-wrap break-words">{runResult.error || JSON.stringify(runResult, null, 2)}</pre> : <p className="mt-1 text-base-content/60">Run or submit the shared code. Both actions use the same Judge0 flow as the problem page.</p>}
                    </div>
                </section>

                <aside className="flex min-h-0 flex-col bg-base-100">
                    <section className="border-b border-base-300 p-4">
                        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Users size={17} />Members</h2>
                        <ul className="space-y-2">{members.map((member) => <li key={member.id} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-success" />{member.name}{member.id === room.ownerId && <span className="badge badge-xs">Host</span>}</li>)}</ul>
                        <p className="mt-3 text-xs text-base-content/60">Invite is available to signed-in users. Maximum 3 members including host. Room expires in 24 hours.</p>
                    </section>
                    <section className="flex min-h-0 flex-1 flex-col p-4">
                        <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageCircle size={17} />Team chat</h2>
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-box bg-base-200 p-3">
                            {messages.length === 0 && <p className="text-sm text-base-content/60">No messages yet. Say hi to your team.</p>}
                            {messages.map((message) => <article key={message.id} className="text-sm"><p className="font-semibold">{message.name}<span className="ml-2 text-xs font-normal text-base-content/50">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p><p className="whitespace-pre-wrap break-words">{message.text}</p></article>)}
                            <div ref={chatEndRef} />
                        </div>
                        <form className="mt-3 flex gap-2" onSubmit={sendMessage}><input className="input input-bordered min-w-0 flex-1" maxLength={1000} placeholder={ended ? 'Room ended' : 'Message your team…'} value={chatText} onChange={(event) => setChatText(event.target.value)} disabled={ended} /><button className="btn btn-primary" aria-label="Send message" disabled={!chatText.trim() || ended}><Send size={16} /></button></form>
                    </section>
                </aside>
            </div>
        </main>
    );
}
