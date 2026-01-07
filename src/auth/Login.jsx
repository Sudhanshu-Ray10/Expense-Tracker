import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();

  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mobile OTP login
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // UI states
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Email Login
  const handleEmailLogin = () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setError("");
        navigate("/dashboard");
      })
      .catch((err) => setError(err.message));
  };
const [showPassword, setShowPassword] = useState(false);

  // 🔵 Google Login
  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then(() => navigate("/dashboard"))
      .catch((err) => setError(err.message));
  };

  // 🔐 Setup reCAPTCHA (CORRECT FOR FIREBASE v9)
  const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
  }
};


  // 📲 Send OTP
  const handleSendOtp = () => {
    if (phone.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const phoneNumber = "+91" + phone;

    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((result) => {
        setConfirmationResult(result);
        setOtpSent(true);
        setError("");
      })
      .catch((err) => setError(err.message));
  };

  // ✅ Verify OTP
  const handleVerifyOtp = () => {
    if (!otp) {
      setError("Enter OTP");
      return;
    }

    confirmationResult
      .confirm(otp)
      .then(() => navigate("/dashboard"))
      .catch(() => setError("Invalid OTP"));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-indigo-300 to-purple-700">

      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 25 }).map((_, index) => {
          const symbols = ["₹", "$", "€", "£"];
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          return (
            <span
              key={index}
              className="currency text-white/20 text-5xl"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${6 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {symbol}
            </span>
          );
        })}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-[400px] bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">

        <h2 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back 👋
        </h2>
        <p className="text-center text-white/80 mb-6">
          Login to manage your expenses
        </p>

        {/* EMAIL / GOOGLE LOGIN */}
        {!showMobileLogin && (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg mb-3 outline-none bg-white/90"
            />

          <div className="relative mb-3">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full p-3 rounded-lg outline-none bg-white/90 pr-10"
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
  >
    {showPassword ? <FaEye /> : <FaEyeSlash />}
  </span>
</div>


            <button
              onClick={handleEmailLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold cursor-pointer"
            >
              Login
            </button>
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
            {error && (
              <p className="text-white text-sm mt-3 text-center">{error}</p>
            )}

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-white/40"></div>
              <span className="px-3 text-white/80 text-sm">OR</span>
              <div className="flex-1 h-px bg-white/40"></div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 p-3 rounded-lg flex items-center justify-center gap-2 mb-3 font-medium cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
                alt="google"
              />
              Continue with Google
            </button>

            {/* <button
              onClick={() => setShowMobileLogin(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg cursor-pointer"
            >
              Continue with Mobile Number
            </button> */}
          </>
        )}

        {/* 📱 MOBILE OTP LOGIN */}
        {showMobileLogin && (
          <>
            {!otpSent ? (
              <>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full p-3 rounded-lg mb-4 outline-none bg-white/90"
                />

                <button
                  onClick={handleSendOtp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold cursor-pointer"
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 rounded-lg mb-4 outline-none bg-white/90"
                />

                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold cursor-pointer"
                >
                  Verify OTP
                </button>
              </>
            )}

            <button
              onClick={() => {
                setShowMobileLogin(false);
                setOtpSent(false);
                setPhone("");
                setOtp("");
                setError("");
              }}
              className="text-white underline text-sm mt-4 block text-center cursor-pointer"
            >
              Back to Email Login
            </button>
          </>
        )}

        <p className="text-center text-white/80 text-sm mt-6">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-white font-semibold underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* 🔐 reCAPTCHA container (MUST be outside condition) */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
