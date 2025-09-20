import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// A custom helper function to get the correct badge style
const getDifficultyStyle = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-600/20 text-green-400 border border-green-500/30';
    case 'medium':
      return 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30';
    case 'hard':
      return 'bg-red-600/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-600/20 text-gray-400 border border-gray-500/30';
  }
};

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all',
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      if (user) {
        try {
          const { data } = await axiosClient.get('/problem/problemSolvedByUser');
          setSolvedProblems(data);
        } catch (error) {
          console.error('Error fetching solved problems:', error);
        }
      }
    };

    fetchProblems();
    if (user) {
      fetchSolvedProblems();
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const isProblemSolved = (problemId) => {
    return solvedProblems.some((sp) => sp._id === problemId);
  };

  const filteredProblems = problems.filter((problem) => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch =
      filters.status === 'all' ||
      (filters.status === 'solved' && isProblemSolved(problem._id));
    return difficultyMatch && tagMatch && statusMatch;
  });

  const solvedCount = solvedProblems.length;
  const totalProblems = problems.length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Modern Navigation Bar with all components re-ordered */}
      <nav className="navbar bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Left side: Brand Logo */}
          <div className="flex-1">
            <NavLink to="/" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </NavLink>
          </div>

          {/* Center: Brand Name */}
          <div className="flex-none">
            <NavLink to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
              CodeMaster
            </NavLink>
          </div>

          {/* Right side: Stats and Profile Dropdown */}
          <div className="flex-1 flex justify-end items-center gap-4">
            {/* Solved Problems Stat */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full border border-green-600/30">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-400">{solvedCount}/{totalProblems}</span>
            </div>

            {/* Profile Dropdown or Login Button */}
            {user ? (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} className="btn btn-ghost hover:bg-gray-800 rounded-xl px-4 py-2 transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-2">
                    {user?.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="hidden md:block font-medium text-gray-200">{user?.firstName}</span>
                  <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <ul className="mt-3 p-2 shadow-xl menu menu-sm dropdown-content bg-gray-800 rounded-xl border border-gray-700 w-52">
                  <li>
                    <button onClick={handleLogout} className="hover:bg-red-800/50 hover:text-red-400 rounded-lg transition-colors text-gray-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </li>
                  {user?.role === 'admin' && (
                    <li>
                      <NavLink to="/admin" className="hover:bg-blue-800/50 hover:text-blue-400 rounded-lg transition-colors text-gray-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </NavLink>
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <NavLink to="/login" className="btn bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 shadow-md transition-all duration-200">Login</NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Coding</span> Skills
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-400">
              Practice coding problems and boost your programming expertise
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-yellow-400">{totalProblems}</div>
                <div className="text-sm text-gray-400">Total Problems</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-green-400">{solvedCount}</div>
                <div className="text-sm text-gray-400">Problems Solved</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-blue-400">
                  {totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Modern Filters Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Problems
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-medium">{filteredProblems.length}</span>
              <span>problems found</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </label>
              <select
                className="select select-bordered w-full bg-gray-800/50 border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Problems</option>
                <option value="solved">Solved Problems</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Difficulty
              </label>
              <select
                className="select select-bordered w-full bg-gray-800/50 border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </label>
              <select
                className="select select-bordered w-full bg-gray-800/50 border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              >
                <option value="all">All Tags</option>
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="dp">Dynamic Programming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Problems List */}
        <div className="space-y-4">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No problems found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more problems</p>
            </div>
          ) : (
            filteredProblems.map((problem, index) => (
              <div
                key={problem._id}
                className="group bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <NavLink
                          to={`/problem/${problem._id}`}
                          className="text-xl font-semibold text-gray-100 hover:text-blue-400 transition-colors group-hover:text-blue-400"
                        >
                          {problem.title}
                        </NavLink>
                        <div className="flex items-center gap-3 mt-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyStyle(problem.difficulty)}`}>
                            {problem.difficulty}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            {problem.tags}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isProblemSolved(problem._id) && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full border border-green-600/30">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-green-400">Solved</span>
                        </div>
                      )}
                      <NavLink
                        to={`/problem/${problem._id}`}
                        className="btn btn-sm bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Solve
                      </NavLink>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;