import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { ArrowLeft, KeyRound, Save, UserRound } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { updateUserProfile } from '../authSlice';

const inputClass = 'input input-bordered w-full bg-slate-800 border-slate-700 text-slate-100';

export default function Profile() {
    const dispatch = useDispatch();
    const [profile, setProfile] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        let active = true;
        axiosClient.get('/user/profile')
            .then(({ data }) => {
                if (!active) return;
                setProfile(data.user);
                setFirstName(data.user.firstName || '');
                setLastName(data.user.lastName || '');
            })
            .catch((error) => {
                if (active) setProfileError(error.response?.data?.error || 'Could not load your profile.');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const saveProfile = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        setProfileMessage('');
        setProfileError('');
        try {
            const { data } = await axiosClient.patch('/user/profile', { firstName, lastName });
            setProfile(data.user);
            dispatch(updateUserProfile(data.user));
            setProfileMessage(data.message || 'Profile updated.');
        } catch (error) {
            setProfileError(error.response?.data?.error || 'Could not update your profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async (event) => {
        event.preventDefault();
        setPasswordMessage('');
        setPasswordError('');
        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }
        setSavingPassword(true);
        try {
            const { data } = await axiosClient.patch('/user/change-password', { currentPassword, newPassword });
            setPasswordMessage(data.message || 'Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setPasswordError(error.response?.data?.error || 'Could not change your password.');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-slate-950"><span className="loading loading-spinner loading-lg text-blue-400" /></div>;

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
            <div className="mx-auto max-w-3xl">
                <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} />Back to CodeSphere</Link>
                <header className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Account settings</p>
                    <h1 className="mt-2 text-3xl font-bold">My profile</h1>
                    <p className="mt-2 text-slate-400">Update your account details and password.</p>
                </header>

                {profileError && !profile && <div className="alert alert-error mb-5">{profileError}</div>}
                {profile && <div className="grid gap-6 md:grid-cols-2">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                        <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold"><UserRound size={20} className="text-blue-400" />Profile details</h2>
                        <form onSubmit={saveProfile} className="space-y-4">
                            <label className="form-control gap-2"><span className="label-text text-slate-300">First name</span><input className={inputClass} minLength={3} maxLength={20} required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
                            <label className="form-control gap-2"><span className="label-text text-slate-300">Last name <span className="text-slate-500">(optional)</span></span><input className={inputClass} minLength={3} maxLength={20} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
                            <label className="form-control gap-2"><span className="label-text text-slate-300">Email</span><input className={`${inputClass} opacity-70`} value={profile.emailId} readOnly /><span className="text-xs text-slate-500">Email changes are not enabled yet.</span></label>
                            {profileError && <p role="alert" className="text-sm text-red-400">{profileError}</p>}
                            {profileMessage && <p role="status" className="text-sm text-emerald-400">{profileMessage}</p>}
                            <button className="btn btn-primary w-full" disabled={savingProfile}>{savingProfile ? 'Saving…' : <><Save size={16} />Save profile</>}</button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                        <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold"><KeyRound size={20} className="text-purple-400" />Change password</h2>
                        <p className="mb-5 text-sm text-slate-400">Changing your password signs out your other active sessions.</p>
                        <form onSubmit={savePassword} className="space-y-4">
                            <label className="form-control gap-2"><span className="label-text text-slate-300">Current password</span><input className={inputClass} type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
                            <label className="form-control gap-2"><span className="label-text text-slate-300">New password</span><input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><span className="text-xs text-slate-500">8+ characters with uppercase, lowercase, number, and symbol.</span></label>
                            <label className="form-control gap-2"><span className="label-text text-slate-300">Confirm new password</span><input className={inputClass} type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
                            {passwordError && <p role="alert" className="text-sm text-red-400">{passwordError}</p>}
                            {passwordMessage && <p role="status" className="text-sm text-emerald-400">{passwordMessage}</p>}
                            <button className="btn btn-secondary w-full" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update password'}</button>
                        </form>
                    </section>
                </div>}
            </div>
        </main>
    );
}
