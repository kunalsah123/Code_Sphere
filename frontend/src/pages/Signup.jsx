import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { registerUser } from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, "Name should contain at least 3 characters"),
  emailId: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password should contain at least 8 characters")
});

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

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

  const onSubmit = (data) => {
    dispatch(registerUser(data));
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

      {/* Signup Form */}
      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden p-8 border border-gray-700">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join our community</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border ${errors.firstName ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200`}
                  {...register('firstName')}
                />
              </div>
              {errors.firstName?.message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.firstName.message}
                </motion.p>
              )}
            </div>

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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70"
            >
              {loading ? 'Signing Up...' : 'Sign Up'} <FiArrowRight className="ml-2" />
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;