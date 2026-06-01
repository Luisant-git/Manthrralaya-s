import React, { useState } from 'react';
import { 
    Key, Shield, Eye, EyeOff, CheckCircle, AlertCircle, 
    User, Smartphone, Mail, Lock, ArrowRight
} from 'lucide-react';
import { userApi } from '../api/userApi';

export default function ResetMyPin({ currentUser, onLogout }) {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetFeedback, setResetFeedback] = useState({ error: '', success: false });

    const handleResetPinSubmit = async (e) => {
        e.preventDefault();
        setResetFeedback({ error: '', success: false });

        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return setResetFeedback({ error: 'PIN must be exactly 4 digits.', success: false });
        }

        if (newPin !== confirmPin) {
            return setResetFeedback({ error: 'PINs do not match. Please re-enter.', success: false });
        }

        setIsResetting(true);
        try {
            await userApi.resetPin(currentUser.id, newPin);
            setResetFeedback({ error: '', success: true });
            setNewPin('');
            setConfirmPin('');
            
            // Auto logout after 3 seconds to force login with new PIN
            setTimeout(() => {
                if (window.confirm('PIN reset successful! Please login again with your new PIN.')) {
                    onLogout && onLogout();
                }
            }, 2000);
        } catch (err) {
            setResetFeedback({ error: err.message || 'Failed to update PIN', success: false });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full mb-4 shadow-sm">
                    <Lock className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Change Your PIN</h1>
                <p className="text-slate-500 text-sm mt-2">
                    Update your 4-digit login PIN to keep your account secure
                </p>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-bold">Security Guidelines</p>
                    <p className="text-amber-700 text-xs mt-1">
                        • Choose a 4-digit PIN that's easy to remember but hard to guess<br/>
                        • Avoid using sequential numbers (1234) or repetitive digits (1111)<br/>
                        • Never share your PIN with anyone
                    </p>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">
                                {currentUser?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-slate-800 text-xl">{currentUser?.fullName}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                                <div className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="capitalize">{currentUser?.role?.toLowerCase()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{currentUser?.email}</span>
                                </div>
                                {currentUser?.phone && (
                                    <div className="flex items-center gap-1">
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>{currentUser?.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PIN Reset Form */}
                <form onSubmit={handleResetPinSubmit} className="p-6 space-y-5">
                    {resetFeedback.success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="font-extrabold text-xl text-slate-800">PIN Reset Successful!</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                Your login PIN has been updated successfully.
                            </p>
                            <p className="text-xs text-amber-600 mt-3">
                                You will be redirected to login page to use your new PIN.
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

                            {/* Current PIN Info */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                    <Key className="w-3.5 h-3.5" />
                                    Your PIN is a 4-digit code used to login to the system
                                </p>
                            </div>

                            {/* New PIN Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    New PIN <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type={showNewPin ? "text" : "password"}
                                        required 
                                        maxLength={4} 
                                        autoFocus
                                        placeholder="Enter 4-digit PIN" 
                                        value={newPin} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 4) {
                                                setNewPin(value);
                                                setConfirmPin('');
                                                setResetFeedback({ error: '', success: false });
                                            }
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono font-bold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPin(!showNewPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                    Enter exactly 4 numeric digits (0-9)
                                </p>
                            </div>

                            {/* Confirm PIN Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Confirm New PIN <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type={showConfirmPin ? "text" : "password"}
                                        required 
                                        maxLength={4} 
                                        placeholder="Confirm 4-digit PIN" 
                                        value={confirmPin} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 4) {
                                                setConfirmPin(value);
                                                setResetFeedback({ error: '', success: false });
                                            }
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono font-bold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* PIN Match Indicator */}
                            {newPin && confirmPin && (
                                <div className={`text-sm font-bold flex items-center justify-center gap-2 py-2 rounded-lg ${
                                    newPin === confirmPin && newPin.length === 4
                                        ? 'text-emerald-600 bg-emerald-50' 
                                        : 'text-rose-600 bg-rose-50'
                                }`}>
                                    {newPin === confirmPin && newPin.length === 4 ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            PIN codes match
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-4 h-4" />
                                            {newPin !== confirmPin ? 'PIN codes do not match' : 'PIN must be 4 digits'}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Warning for weak PINs */}
                            {newPin && newPin.length === 4 && (
                                <div className="text-xs text-center">
                                    {['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(newPin) ? (
                                        <div className="text-amber-600 flex items-center justify-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Tip: Avoid using sequential or repetitive digits for better security
                                        </div>
                                    ) : (
                                        <div className="text-emerald-600 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Strong PIN choice
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={
                                        isResetting || 
                                        !newPin || 
                                        !confirmPin || 
                                        newPin !== confirmPin || 
                                        newPin.length !== 4
                                    }
                                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                                        (isResetting || !newPin || !confirmPin || newPin !== confirmPin || newPin.length !== 4) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    {isResetting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Resetting PIN...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-4 h-4" />
                                            Change PIN
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>

            {/* Help Text */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="font-semibold text-slate-700 text-sm mb-2">💡 Need Help?</h4>
                <p className="text-xs text-slate-500">
                    If you've forgotten your PIN, please contact the system administrator to reset your credentials. 
                    For security reasons, administrators cannot view your PIN, only reset it.
                </p>
            </div>
        </div>
    );
}