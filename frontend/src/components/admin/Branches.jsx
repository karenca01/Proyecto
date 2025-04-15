import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', state: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/branches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:3000/branches/${currentBranchId}` 
        : 'http://localhost:3000/branches';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} branch`);
      }

      // Reset form and refresh branches
      setFormData({ name: '', state: '' });
      setShowForm(false);
      setIsEditing(false);
      setCurrentBranchId(null);
      fetchBranches();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit branch
  const handleEdit = (branch) => {
    setFormData({ name: branch.name, state: branch.state });
    setCurrentBranchId(branch.id);
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle delete branch
  const handleDelete = (branch) => {
    setBranchToDelete(branch);
    setShowDeleteConfirm(true);
  };

  // Confirm delete branch
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/branches/${branchToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }

      // Close modal and refresh branches
      setShowDeleteConfirm(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setBranchToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with add button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Manage Branches</h2>
        <button
          onClick={() => {
            setFormData({ name: '', state: '' });
            setIsEditing(false);
            setCurrentBranchId(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel' : 'Add Branch'}
        </button>
      </div>

      {/* Branch form */}
      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Edit Branch' : 'Add New Branch'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Branch Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {isEditing ? 'Update Branch' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branches table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Loading branches...</div>
        ) : branches.length === 0 ? (
          <div className="p-4 text-center">No branches found. Add your first branch!</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && branchToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete the branch "{branchToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Branches;