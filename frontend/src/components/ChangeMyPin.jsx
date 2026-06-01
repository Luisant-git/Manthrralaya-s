import React, { useState } from 'react';
import { 
    Key, CheckCircle, AlertCircle, Eye, EyeOff, Lock, ArrowLeft
} from 'lucide-react';
import { userApi } from '../api/userApi';

export default function ChangeMyPin({ currentUser, onLogout, onCancel }) {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [isReseting, setIsReseting] = useState(false);
    const [resetFeedback, setResetFeedback] = useState({ error: '', success: false });

    const handleResetPinSubmit = async (e) => {
        e.preventDefault();
        setResetFeedback({ error: '', success: false });

        if (newPin.length !== 4 || isNaN(newPin)) {
            return setResetFeedback({ error: 'PIN must be exactly 4 digits.', success: false });
        }

        if (newPin !== confirmPin) {
            return setResetFeedback({ error: 'PINs do not match. Please re-enter.', success: false });
        }

        setIsReseting(true);
        try {
            await userApi.resetPin(currentUser.id, newPin);
            setResetFeedback({ error: '', success: true });
            setNewPin('');
            setConfirmPin('');
            
            setTimeout(() => {
                if (window.confirm('PIN changed successfully! Please login again with your new PIN.')) {
                    onLogout && onLogout();
                }
            }, 2000);
        } catch (err) {
            setResetFeedback({ error: err.message || 'Failed to update PIN', success: false });
        } finally {
            setIsReseting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Back Button */}
            <button 
                onClick={onCancel}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm mb-6 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            <div className="bg-white border border-slate-200 w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-emerald-600 text-white p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Lock className="w-6 h-6" />
                        <h3 className="font-extrabold text-xl">Change Your PIN</h3>
                    </div>
                    <p className="text-white/80 text-sm">Update your 4-digit login PIN</p>
                    <div className="mt-4 pt-3 border-t border-white/20">
                        <p className="text-white/80 text-sm font-medium">{currentUser?.fullName}</p>
                        <p className="text-white/60 text-xs mt-1">
                            {currentUser?.role} • @{currentUser?.username || currentUser?.email}
                        </p>
                    </div>
                </div>
               
                <form onSubmit={handleResetPinSubmit} className="p-6 space-y-5">
                    {resetFeedback.success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="font-extrabold text-xl text-slate-800">PIN Reset Successful!</h4>
                            <p className="text-sm text-slate-500 mt-2">
                                Your PIN has been updated successfully.
                            </p>
                            <p className="text-xs text-amber-600 mt-3">
                                You will be redirected to login page.
                            </p>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {resetFeedback.error && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> 
                                    {resetFeedback.error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    New PIN <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showNewPin ? "text" : "password"}
                                        required 
                                        maxLength={4} 
                                        autoFocus
                                        placeholder="••••" 
                                        value={newPin} 
                                        onChange={(e) => {
                                            setNewPin(e.target.value.replace(/\D/g, ''));
                                            setConfirmPin('');
                                            setResetFeedback({ error: '', success: false });
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono font-bold pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPin(!showNewPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">Enter 4-digit numeric code (0-9)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Confirm New PIN <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showConfirmPin ? "text" : "password"}
                                        required 
                                        maxLength={4} 
                                        placeholder="••••" 
                                        value={confirmPin} 
                                        onChange={(e) => {
                                            setConfirmPin(e.target.value.replace(/\D/g, ''));
                                            setResetFeedback({ error: '', success: false });
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono font-bold pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {newPin && confirmPin && (
                                <div className={`text-sm font-bold flex items-center justify-center gap-2 py-2 rounded-lg ${
                                    newPin === confirmPin && newPin.length === 4
                                        ? 'text-emerald-600 bg-emerald-50' 
                                        : 'text-rose-600 bg-rose-50'
                                }`}>
                                    {newPin === confirmPin && newPin.length === 4 ? (
                                        '✓ PIN codes match'
                                    ) : (
                                        newPin !== confirmPin ? '✗ PIN codes do not match' : '✗ PIN must be 4 digits'
                                    )}
                                </div>
                            )}

                            {newPin && newPin.length === 4 && (
                                <div className="text-xs text-center">
                                    {['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(newPin) ? (
                                        <div className="text-amber-600">
                                            ⚠️ Tip: Avoid using sequential or repetitive digits
                                        </div>
                                    ) : (
                                        <div className="text-emerald-600">
                                            ✓ Strong PIN choice
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isReseting || 
                                        !newPin || 
                                        !confirmPin || 
                                        newPin !== confirmPin || 
                                        newPin.length !== 4
                                    }
                                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${
                                        (isReseting || !newPin || !confirmPin || newPin !== confirmPin || newPin.length !== 4) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    {isReseting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-4 h-4" />
                                            Change PIN
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}