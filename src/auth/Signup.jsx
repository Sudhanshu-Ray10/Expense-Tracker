import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Password validation
  const isValidPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(password);
  };

  const handleSignup = () => {
    // Frontend validations (already added by you)
    if (!firstName || !lastName) {
      setError("First name and last name are required");
      return;
    }

    if (mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "Password must be 8+ chars with uppercase, lowercase, number & special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 🔥 FIREBASE SIGNUP
  createUserWithEmailAndPassword(auth, email, password)
  .then(async (cred) => {
    const user = cred.user;

    // Save full name to Firebase Auth
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });
   await setDoc(doc(db, "users", user.uid), {
  firstName,
  lastName,
  mobile,
  email,
  createdAt: new Date()
});

    resetForm();
    await user.reload();
    navigate("/dashboard");
  })
  .catch((err) => setError(err.message));


  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setMobile("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };
  const handleGoogleSignup = () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then(() => {
        resetForm(); // optional
        navigate("/dashboard"); // go to dashboard
      })
      .catch((error) => {
        setError(error.message);
      });
  };
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-indigo-300 to-purple-700 px-4">
      {/* Falling currency background */}
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

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        <h2 className="text-3xl font-bold text-white text-center mb-1">
          Create Account
        </h2>
        <p className="text-center text-white/80 mb-6">
          Start managing your money 💸
        </p>

        {/* Name */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-1/2 p-3 rounded-lg outline-none bg-white/90"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-1/2 p-3 rounded-lg outline-none bg-white/90"
          />
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg mb-3 outline-none bg-white/90"
        />

        {/* Mobile */}
        <input
          type="tel"
          placeholder="Mobile number"
          value={mobile}
          maxLength={10}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          className="w-full p-3 rounded-lg mb-3 outline-none bg-white/90"
        />

        {/* Password */}
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

        {/* Confirm Password */}
        <div className="relative mb-3">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full p-3 rounded-lg outline-none bg-white/90 pr-10"
  />
  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
  >
    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          className="w-full bg-green-500 hover:bg-green-600 transition text-white p-3 rounded-lg font-semibold"
        >
          Create Account
        </button>

        {/* Error Message */}
        {error && (
          <p className="text-white font-medium mt-3 text-center">{error}</p>
        )}

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/40"></div>
          <span className="px-3 text-white/80 text-sm">OR</span>
          <div className="flex-1 h-px bg-white/40"></div>
        </div>

        {/* Google Signup (UI only) */}
       <button
  onClick={handleGoogleSignup}
  className="
    w-full bg-white text-gray-700 p-3 rounded-lg
    flex items-center justify-center gap-2 mb-3
    font-medium cursor-pointer
    transition-all duration-300 ease-out
    hover:-translate-y-1
    hover:shadow-[0_0_20px_rgba(66,133,244,0.4),0_0_35px_rgba(219,68,55,0.25)]
    active:scale-95
  "
>
  <img
    src="https://www.svgrepo.com/show/475656/google-color.svg"
    className="w-5 h-5 transition-transform duration-300"
    alt="google"
  />
  Sign up with Google
</button>



        {/* Login link */}
        <p className="text-center text-white/80 text-sm mt-5">
          Already have an account?{" "}
          <Link to="/" className="text-white font-semibold underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
