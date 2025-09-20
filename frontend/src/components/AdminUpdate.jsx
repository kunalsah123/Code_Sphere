import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { FaInfoCircle, FaFileCode, FaCode, FaPlus, FaTrashAlt, FaSpinner, FaArrowLeft } from 'react-icons/fa';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminUpdate() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
    replace: replaceVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
    replace: replaceHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  // Fetch all problems on component mount
  useEffect(() => {
    fetchAllProblems();
  }, []);

  const fetchAllProblems = async () => {
    try {
      setLoadingProblems(true);
      const response = await axiosClient.get('/problem/getallProblem');
      setProblems(response.data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      alert('Error fetching problems: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingProblems(false);
    }
  };

  // Fetch problem details when a problem is selected
  const handleProblemSelect = async (problemId) => {
    if (!problemId) {
      setSelectedProblem(null);
      reset();
      return;
    }

    try {
      setLoading(true);
      // Fetch complete problem details (we need all fields for update)
      const response = await axiosClient.get(`/problem/problemById/${problemId}`);
      const problemData = response.data;
      
      setSelectedProblem(problemData);
      
      // Reset form with fetched data
      reset({
        title: problemData.title,
        description: problemData.description,
        difficulty: problemData.difficulty,
        tags: problemData.tags,
        visibleTestCases: problemData.visibleTestCases || [],
        hiddenTestCases: problemData.hiddenTestCases || [],
        startCode: problemData.startCode || [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ],
        referenceSolution: problemData.referenceSolution || [
          { language: 'C++', completeCode: '' },
          { language: 'Java', completeCode: '' },
          { language: 'JavaScript', completeCode: '' }
        ]
      });

      // Update field arrays
      replaceVisible(problemData.visibleTestCases || []);
      replaceHidden(problemData.hiddenTestCases || []);

    } catch (error) {
      console.error('Error fetching problem details:', error);
      alert('Error fetching problem details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedProblem) {
      alert('Please select a problem to update');
      return;
    }

    try {
      setLoading(true);
      await axiosClient.put(`/problem/update/${selectedProblem._id}`, data);
      alert('Problem updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Update error:', error);
      alert(`Error updating problem: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProblems) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <FaSpinner className="animate-spin text-blue-500 h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Update Problem</h1>
          <button
            onClick={() => navigate('/admin')}
            className="btn btn-ghost text-gray-400 hover:bg-gray-800 rounded-xl px-4 py-2 transition-all duration-200 flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Admin
          </button>
        </div>

        {/* Problem Selection */}
        <div className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
            <FaInfoCircle className="text-blue-400" />
            Select Problem to Update
          </h2>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-400">Choose a problem</span>
            </label>
            <select
              className="select select-bordered w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
              onChange={(e) => handleProblemSelect(e.target.value)}
              disabled={loading}
              value={selectedProblem?._id || ''}
            >
              <option value="">Select a problem...</option>
              {problems.map((problem) => (
                <option key={problem._id} value={problem._id}>
                  {problem.title} ({problem.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Update Form - Only show when a problem is selected */}
        {selectedProblem && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <section className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800 transition-all duration-300 hover:shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                <FaInfoCircle className="text-blue-400" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text text-gray-400">Title</span>
                  </label>
                  <input
                    {...register('title')}
                    className={`input input-bordered w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all ${errors.title && 'input-error border-red-500'}`}
                    disabled={loading}
                  />
                  {errors.title && (
                    <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>
                  )}
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text text-gray-400">Description</span>
                  </label>
                  <textarea
                    {...register('description')}
                    className={`textarea textarea-bordered h-32 w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all ${errors.description && 'textarea-error border-red-500'}`}
                    disabled={loading}
                  />
                  {errors.description && (
                    <span className="text-red-500 text-sm mt-1">{errors.description.message}</span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">Difficulty</span>
                  </label>
                  <select
                    {...register('difficulty')}
                    className={`select select-bordered w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all ${errors.difficulty && 'select-error border-red-500'}`}
                    disabled={loading}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">Tag</span>
                  </label>
                  <select
                    {...register('tags')}
                    className={`select select-bordered w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all ${errors.tags && 'select-error border-red-500'}`}
                    disabled={loading}
                  >
                    <option value="array">Array</option>
                    <option value="linkedList">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">DP</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Test Cases Section */}
            <section className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800 transition-all duration-300 hover:shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                <FaFileCode className="text-green-400" />
                Test Cases
              </h2>
              
              {/* Visible Test Cases */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-300">Visible Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all"
                    disabled={loading}
                  >
                    <FaPlus /> Add Visible Case
                  </button>
                </div>
                {visibleFields.map((field, index) => (
                  <div key={field.id} className="relative bg-gray-800 p-4 rounded-lg space-y-2 border border-gray-700">
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-500 transition-colors"
                      disabled={loading}
                    >
                      <FaTrashAlt />
                    </button>
                    <input
                      {...register(`visibleTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                      disabled={loading}
                    />
                    <input
                      {...register(`visibleTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                      disabled={loading}
                    />
                    <textarea
                      {...register(`visibleTestCases.${index}.explanation`)}
                      placeholder="Explanation"
                      className="textarea textarea-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                ))}
                {errors.visibleTestCases && (
                  <span className="text-red-500 text-sm mt-1">{errors.visibleTestCases.message}</span>
                )}
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-300">Hidden Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all"
                    disabled={loading}
                  >
                    <FaPlus /> Add Hidden Case
                  </button>
                </div>
                {hiddenFields.map((field, index) => (
                  <div key={field.id} className="relative bg-gray-800 p-4 rounded-lg space-y-2 border border-gray-700">
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-500 transition-colors"
                      disabled={loading}
                    >
                      <FaTrashAlt />
                    </button>
                    <input
                      {...register(`hiddenTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                      disabled={loading}
                    />
                    <input
                      {...register(`hiddenTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                ))}
                {errors.hiddenTestCases && (
                  <span className="text-red-500 text-sm mt-1">{errors.hiddenTestCases.message}</span>
                )}
              </div>
            </section>

            {/* Code Templates Section */}
            <section className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800 transition-all duration-300 hover:shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                <FaCode className="text-purple-400" />
                Code Templates
              </h2>
              <div className="space-y-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-4 bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-semibold text-lg text-gray-300">
                      {index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}
                    </h3>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-400">Initial Code</span>
                      </label>
                      <textarea
                        {...register(`startCode.${index}.initialCode`)}
                        className="textarea textarea-bordered h-48 w-full bg-gray-700 text-gray-200 border-gray-600 font-mono resize-y focus:border-blue-500 rounded-lg"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-400">Reference Solution</span>
                      </label>
                      <textarea
                        {...register(`referenceSolution.${index}.completeCode`)}
                        className="textarea textarea-bordered h-48 w-full bg-gray-700 text-gray-200 border-gray-600 font-mono resize-y focus:border-blue-500 rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              type="submit"
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl shadow-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating Problem...
                </>
              ) : (
                'Update Problem'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminUpdate;