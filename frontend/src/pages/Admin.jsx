import React, { useState } from 'react';
import { Plus, Edit, Trash2, Home, RefreshCw, Zap, Video } from 'lucide-react';
import { NavLink } from 'react-router'; // Using react-router-dom for NavLink

function Admin() {
  const [selectedOption, setSelectedOption] = useState(null);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
      color: 'btn-success',
      bgColor: 'bg-success/10',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems and their details',
      icon: Edit,
      color: 'btn-warning',
      bgColor: 'bg-warning/10',
      route: '/admin/update'
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform',
      icon: Trash2,
      color: 'btn-error',
      bgColor: 'bg-error/10',
      route: '/admin/delete'
    },
    {
      id: 'video',
      title: 'Video Solution',
      description: 'Upload and delete Video',
      icon: Video,
      color: 'btn-success',
      bgColor: 'bg-success/10',
      route: '/admin/video'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="container mx-auto px-4 py-8">

        {/* Back to Home Button */}
        <div className="flex justify-end mb-8">
          <NavLink
            to="/"
            className="btn btn-ghost text-gray-400 hover:bg-gray-800 rounded-xl px-4 py-2 transition-all duration-200 flex items-center gap-2"
          >
            <Home size={20} />
            Back to Home
          </NavLink>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Admin Panel
          </h1>
          <p className="text-gray-400 text-lg">
            Manage coding problems on your platform
          </p>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                className="card bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-800"
              >
                <div className="card-body items-center text-center p-8">
                  {/* Icon */}
                  <div className={`${option.bgColor} p-4 rounded-full mb-4`}>
                    <IconComponent size={32} className={`text-white/80`} />
                  </div>

                  {/* Title */}
                  <h2 className="card-title text-xl mb-2 text-gray-100">
                    {option.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-400 mb-6">
                    {option.description}
                  </p>

                  {/* Action Button */}
                  <div className="card-actions">
                    <NavLink
                      to={option.route}
                      className={`btn ${option.color} btn-wide text-white font-semibold transition-all duration-200`}
                    >
                      {option.title}
                    </NavLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default Admin;