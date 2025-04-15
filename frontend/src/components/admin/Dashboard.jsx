import { useState, useEffect } from 'react';

function Dashboard() {
  const [branchCount, setBranchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBranchCount = async () => {
      try {
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
        setBranchCount(data.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchCount();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading dashboard data...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Branches</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{branchCount}</dd>
              </dl>
            </div>
          </div>
          
          {/* Additional dashboard cards can be added here */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Recent Activity</dt>
                <dd className="mt-1 text-sm text-gray-900">Dashboard statistics will be displayed here</dd>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;