import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { loginUser } from "../authSlice";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

const loginSchema = z.object({
  emailId: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password should contain at least 8 characters")
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Bubble animation effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const newBubble = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 40 + 20,
        color: `hsla(${Math.random() * 60 + 200}, 80%, 60%, 0.4)`
      };
      setBubbles((prev) => [...prev.slice(-8), newBubble]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const onSubmit = async (data) => {
    try {
      // Dispatch login action and wait for completion
      await dispatch(loginUser(data)).unwrap();
      // The useEffect will handle the redirect when isAuthenticated becomes true
    } catch (err) {
      // Errors are already handled by the authSlice
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Floating bubbles */}
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            background: bubble.color,
            filter: 'blur(15px)',
            translateX: '-50%',
            translateY: '-50%'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {/* Login Form */}
      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden p-8 border border-gray-700">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border ${errors.emailId ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200`}
                  {...register('emailId')}
                />
              </div>
              {errors.emailId?.message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.emailId.message}
                </motion.p>
              )}
            </div>

            <div className="form-group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border ${errors.password ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password?.message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox rounded bg-gray-700 border-gray-600 text-purple-600" />
                <span className="ml-2 text-gray-400 text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Login <FiArrowRight className="ml-2" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;