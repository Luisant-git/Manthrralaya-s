import React, { useState, useRef } from 'react';
import { User, Shield, Stethoscope, Lock, ArrowRight, X, Smartphone, KeyRound, CheckCircle, Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/authApi';
import { toast } from 'react-toastify';

export default function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('receptionist');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const otpBoxRefs = useRef([]);

  const roles = [
    { id: 'receptionist', title: 'Receptionist', icon: User },
    { id: 'doctor', title: 'Doctor', icon: Stethoscope },
    { id: 'admin', title: 'System Admin', icon: Shield }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return alert('Please enter your staff username.');
    if (!pin) return alert('Please enter your staff PIN code.');

    setIsLoading(true);
    try {
      const response = await authApi.login({ username: trimmedUsername, pin });
      
      console.log('🔍 Full login response:', response);

      // Extract user ID from response - try multiple possible locations
      const userId = response?.id || 
                     response?.user?.id || 
                     response?.data?.id || 
                     response?.data?.user?.id || 
                     response?.userId || 
                     null;

      // Extract role from response
      const userRole = response?.role || 
                       response?.user?.role || 
                       response?.data?.role || 
                       response?.data?.user?.role || 
                       'USER';

      // Extract email from response
      const userEmail = response?.email || 
                        response?.user?.email || 
                        response?.data?.email || 
                        response?.data?.user?.email || 
                        trimmedUsername;

      // Extract name from response
      const userName = response?.name || 
                       response?.fullName || 
                       response?.user?.name || 
                       response?.user?.fullName || 
                       response?.data?.name || 
                       response?.data?.fullName || 
                       response?.data?.user?.name || 
                       response?.data?.user?.fullName || 
                       userEmail;

      console.log('✅ Extracted user info:', { userId, userRole, userEmail, userName });

      // Ensure the selected role in the UI matches the user's actual role in the database
      if (selectedRole.toUpperCase() !== userRole) {
        if (!(selectedRole === 'doctor' && userRole === 'THERAPIST')) {
          throw new Error(`Unauthorized: Your account does not have access to the ${selectedRole} workspace.`);
        }
      }

      // Save the token to local storage so the session persists on refresh
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      } else if (response.token) {
        localStorage.setItem('access_token', response.token);
      } else if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      } else {
        throw new Error('No access token received from server');
      }

      // Store user info for consistent matching
      localStorage.setItem('user_email', userEmail);
      localStorage.setItem('user_display_name', userName);
      localStorage.setItem('user_role', userRole.toLowerCase());
      
      // IMPORTANT: Store user ID in localStorage
      if (userId) {
        localStorage.setItem('user_id', userId);
        console.log('✅ User ID stored in localStorage:', userId);
      } else {
        console.warn('⚠️ No user ID found in login response');
      }

      // Pass the authenticated user data to the parent component
      onLogin({ 
        role: userRole.toLowerCase(), 
        username: userEmail, // Use email as primary identifier
        displayName: userName,
        email: userEmail,
        userId: userId // Pass the extracted userId
      });
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      const res = await authApi.adminRequestOtp(forgotPhone.trim());
      setForgotSuccess(res.message || 'OTP sent to your registered mobile number.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      await authApi.adminVerifyOtp(forgotPhone.trim(), forgotOtp.trim());
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSetNewPin = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (forgotNewPin.length !== 4 || !/^\d+$/.test(forgotNewPin)) {
      return setForgotError('New PIN must be exactly 4 digits.');
    }
    if (forgotNewPin !== forgotConfirmPin) {
      return setForgotError('PINs do not match. Please re-enter.');
    }

    setForgotLoading(true);
    try {
      await authApi.adminResetPin(forgotPhone.trim(), forgotOtp.trim(), forgotNewPin);
      setForgotSuccess('PIN reset successful! You can now login with your new PIN.');
      toast.success('Admin PIN reset successful! Please login with your new PIN.', { position: 'top-center' });
      setTimeout(() => {
        setShowForgotPin(false);
        setForgotStep(1);
        setForgotPhone('');
        setForgotOtp('');
        setForgotNewPin('');
        setForgotConfirmPin('');
        setForgotSuccess('');
        setShowNewPin(false);
        setShowConfirmPin(false);
        setSelectedRole('admin');
      }, 2000);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset PIN. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    if (forgotLoading) return;
    setShowForgotPin(false);
    setForgotStep(1);
    setForgotPhone('');
    setForgotOtp('');
    setForgotNewPin('');
    setForgotConfirmPin('');
    setForgotError('');
    setForgotSuccess('');
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/[^\d]/g, '').slice(-1);
    const current = forgotOtp.split('');
    current[index] = digit;
    setForgotOtp(current.join(''));
    setForgotError('');
    setForgotSuccess('');
    if (digit && index < 3) {
      otpBoxRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    setForgotOtp(pasteData.padEnd(4, '').slice(0, 4));
    const focusIndex = Math.min(pasteData.length, 3);
    otpBoxRefs.current[focusIndex]?.focus();
    setForgotError('');
    setForgotSuccess('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden min-h-[550px] relative">
        
        {/* Left Side: Branding */}
        <div className="bg-emerald-600 p-8 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight font-outfit mb-3 mt-8">{"Manthrralaya's"}</h1>
            <p className="text-emerald-50 text-lg font-medium leading-relaxed max-w-sm">
              Advanced Clinical Management, Patient CRM, & Detox Lifecycle Engine.
            </p>
          </div>

          <div className="relative z-10 text-emerald-100 text-sm font-medium">
            <p>Secure Staff Portal. Authorized personnel only.</p>
            <p className="mt-1 opacity-70">© 2026 {"Manthrralaya's"} Wellness</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-6">Select your clinical department to access the workspace.</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl animate-fadeIn text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              {roles.map(role => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <label 
                    key={role.id} 
                    className={`flex items-center space-x-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="role" 
                      value={role.id} 
                      checked={isSelected}
                      onChange={() => setSelectedRole(role.id)} 
                      className="hidden" 
                    />
                    <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-sm tracking-tight ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>{role.title}</h4>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>{role.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-center font-bold text-lg placeholder:text-sm placeholder:font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Secure Auth PIN
              </label>
              <input
                type="password"
                required
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-center font-bold text-lg placeholder:text-sm placeholder:font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {selectedRole === 'admin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPin(true)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
                >
                  Forgot your PIN?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Authenticating...' : 'Access Workspace'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Forgot PIN Modal */}
        {showForgotPin && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn overflow-y-auto max-h-[90%]">
              <button
                type="button"
                onClick={closeForgotModal}
                disabled={forgotLoading}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors disabled:opacity-40"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-emerald-50 rounded-2xl mb-3">
                  <KeyRound className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Reset Admin PIN</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {forgotStep === 1 && 'Verify your registered mobile number to receive an OTP.'}
                  {forgotStep === 2 && `Enter the OTP sent to ${forgotPhone || 'your mobile'}.`}
                  {forgotStep === 3 && 'Set your new 4-digit login PIN.'}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      forgotStep >= step ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {forgotStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                    </div>
                    {step < 3 && <div className={`w-8 h-0.5 rounded ${forgotStep > step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              {forgotError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl text-center">
                  {forgotError}
                </div>
              )}
              {forgotSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium rounded-xl text-center">
                  {forgotSuccess}
                </div>
              )}

              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        maxLength={15}
                        inputMode="numeric"
                        placeholder="e.g. 9876543210"
                        value={forgotPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          if (val.length <= 15) setForgotPhone(val);
                          setForgotError(''); setForgotSuccess('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> OTP will be sent to this number via WhatsApp.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotPhone.length < 10}
                    className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                      forgotLoading || forgotPhone.length < 10 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {forgotLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      <>Send OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3 text-center">
                      Enter 4-digit OTP
                    </label>
                    <div className="flex items-center justify-center gap-3" onPaste={handleOtpPaste}>
                      {[0, 1, 2, 3].map((i) => (
                        <input
                          key={i}
                          ref={(el) => (otpBoxRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={forgotOtp[i] || ''}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onFocus={(e) => e.target.select()}
                          className="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl text-slate-800 text-center font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                      <MessageSquare className="w-3 h-3" /> OTP sent to {forgotPhone || 'your mobile'} via WhatsApp.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.length !== 4}
                    className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                      forgotLoading || forgotOtp.length !== 4 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {forgotLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : (
                      <>Verify OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotOtp(''); }}
                    disabled={forgotLoading}
                    className="w-full text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 disabled:opacity-40"
                  >
                    ← Change mobile number
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleSetNewPin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      New PIN
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        maxLength={4}
                        inputMode="numeric"
                        placeholder="••••"
                        value={forgotNewPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          if (val.length <= 4) setForgotNewPin(val);
                          setForgotError(''); setForgotSuccess('');
                        }}
                        onFocus={(e) => e.target.select()}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-xl text-slate-800 text-center font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all ${forgotNewPin ? 'tracking-[0.5em]' : 'tracking-normal placeholder:text-slate-300'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showNewPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Confirm New PIN
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        required
                        maxLength={4}
                        inputMode="numeric"
                        placeholder="••••"
                        value={forgotConfirmPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          if (val.length <= 4) setForgotConfirmPin(val);
                          setForgotError(''); setForgotSuccess('');
                        }}
                        onFocus={(e) => e.target.select()}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-xl text-slate-800 text-center font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all ${forgotConfirmPin ? 'tracking-[0.5em]' : 'tracking-normal placeholder:text-slate-300'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {forgotNewPin && forgotConfirmPin && (
                    <div className={`text-sm font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl ${
                      forgotNewPin === forgotConfirmPin && forgotNewPin.length === 4
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-rose-600 bg-rose-50'
                    }`}>
                      {forgotNewPin === forgotConfirmPin && forgotNewPin.length === 4 ? (
                        <><CheckCircle className="w-4 h-4" /> PIN codes match</>
                      ) : (
                        <>{forgotNewPin !== forgotConfirmPin ? 'PIN codes do not match' : 'PIN must be 4 digits'}</>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotNewPin.length !== 4 || forgotNewPin !== forgotConfirmPin}
                    className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                      forgotLoading || forgotNewPin.length !== 4 || forgotNewPin !== forgotConfirmPin ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {forgotLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Resetting PIN...</>
                    ) : (
                      <>Reset PIN <KeyRound className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}