import { useState, useEffect } from 'react';
import LowStockInventory from './LowStockInventory';

function Dashboard() {
  const [branchCount, setBranchCount] = useState(0);
  const [branchesByState, setBranchesByState] = useState({});
  const [recentCategories, setRecentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        const branchData = await response.json();
        setBranchCount(branchData.length);
        
        // Group branches by state
        const stateGroups = branchData.reduce((acc, branch) => {
          acc[branch.state] = (acc[branch.state] || 0) + 1;
          return acc;
        }, {});
        setBranchesByState(stateGroups);

        // Fetch recent categories
        const categoriesResponse = await fetch('http://localhost:3000/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }

        const categoriesData = await categoriesResponse.json();
        // Sort by ID in descending order and take the first 5
        const sortedCategories = categoriesData
          .sort((a, b) => b.id - a.id)
          .slice(0, 5);
        setRecentCategories(sortedCategories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading dashboard data...</div>
      ) : (
        <>
          <div className="mb-6">
            <LowStockInventory />
          </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-xl font-semibold text-gray-900 truncate">Total Branches</dt>
                <dd className="text-gray-600">{branchCount}</dd>
              </dl>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-xl font-semibold text-gray-900 truncate">Branches by State</dt>
                <dd className="mt-1">
                  <div className="space-y-2">
                    {Object.entries(branchesByState).map(([state, count]) => (
                      <div key={state} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{state}</span>
                        <span className="text-gray-900 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </dd>
              </dl>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-xl font-semibold text-gray-900 truncate">Recent Categories</dt>
                <dd className="mt-1">
                  <div className="space-y-2">
                    {recentCategories.map((category) => (
                      <div key={category.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;