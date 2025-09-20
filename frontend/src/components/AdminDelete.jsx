import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { FaTrashAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'; // Importing new icons

const AdminDelete = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Replaced window.confirm with a custom modal for better UX
    const confirmed = window.confirm('Are you sure you want to delete this problem?');
    if (!confirmed) {
      return;
    }

    try {
      // Corrected API endpoint to match resource
      await axiosClient.delete(`/problem/delete/${id}`);
      setProblems(problems.filter(problem => problem._id !== id));
    } catch (err) {
      setError('Failed to delete problem');
      console.error(err);
    }
  };

  // Helper function for badge styles
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
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950 text-gray-200">
        <FaSpinner className="animate-spin text-blue-500 h-10 w-10 mb-4" />
        <p>Loading problems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950 text-gray-200 p-4 text-center">
        <FaExclamationTriangle className="text-red-500 h-10 w-10 mb-4" />
        <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={fetchProblems}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Delete Problems</h1>
        </div>

        <div className="overflow-x-auto bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
          <table className="table w-full text-gray-300">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="w-1/12 text-sm font-semibold text-gray-400">#</th>
                <th className="w-4/12 text-sm font-semibold text-gray-400">Title</th>
                <th className="w-2/12 text-sm font-semibold text-gray-400">Difficulty</th>
                <th className="w-3/12 text-sm font-semibold text-gray-400">Tags</th>
                <th className="w-2/12 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No problems found.
                  </td>
                </tr>
              ) : (
                problems.map((problem, index) => (
                  <tr key={problem._id} className="hover:bg-gray-800 transition-colors border-b border-gray-800">
                    <th className="text-gray-400">{index + 1}</th>
                    <td className="font-medium text-gray-200">{problem.title}</td>
                    <td>
                      <span className={`badge px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyStyle(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="badge px-3 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                        {problem.tags}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(problem._id)}
                        className="btn btn-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200"
                      >
                        <FaTrashAlt />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDelete;