import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { FaPlus, FaTrashAlt, FaCode, FaInfoCircle, FaFileCode } from 'react-icons/fa';

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

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
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
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-100">Create New Problem</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <section className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800 transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
              <FaInfoCircle className="text-blue-400" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text text-gray-400">Problem Title</span>
                </label>
                <input
                  {...register('title')}
                  className={`input input-bordered w-full bg-gray-800 text-gray-200 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all ${errors.title && 'input-error border-red-500'}`}
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
                  >
                    <FaTrashAlt />
                  </button>
                  <input
                    {...register(`visibleTestCases.${index}.input`)}
                    placeholder="Input"
                    className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                  />
                  <input
                    {...register(`visibleTestCases.${index}.output`)}
                    placeholder="Output"
                    className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                  />
                  <textarea
                    {...register(`visibleTestCases.${index}.explanation`)}
                    placeholder="Explanation"
                    className="textarea textarea-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
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
                  >
                    <FaTrashAlt />
                  </button>
                  <input
                    {...register(`hiddenTestCases.${index}.input`)}
                    placeholder="Input"
                    className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
                  />
                  <input
                    {...register(`hiddenTestCases.${index}.output`)}
                    placeholder="Output"
                    className="input input-bordered w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 rounded-lg"
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
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400">Reference Solution</span>
                    </label>
                    <textarea
                      {...register(`referenceSolution.${index}.completeCode`)}
                      className="textarea textarea-bordered h-48 w-full bg-gray-700 text-gray-200 border-gray-600 font-mono resize-y focus:border-blue-500 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl shadow-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : (
              'Create Problem'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;