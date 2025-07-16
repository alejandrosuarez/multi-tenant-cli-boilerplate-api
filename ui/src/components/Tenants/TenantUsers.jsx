import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/admin';
import DataTable from '../UI/DataTable';
import FilterPanel from '../UI/FilterPanel';
import './TenantUsers.css';

const TenantUsers = () => {
  const { currentTenant, canManageTenant } = useTenant();
  const { hasRole, ROLES } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    if (currentTenant && canManageTenant()) {
      loadUsers();
    }
  }, [currentTenant, pagination.page, pagination.limit, filters, sortConfig]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminAPI.getTenantUsers(
        currentTenant.id,
        pagination.page,
        pagination.limit,
        {
          search: filters.search,
          role: filters.role !== 'all' ? filters.role : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          sort: `${sortConfig.key}:${sortConfig.direction}`
        }
      );

      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages
      }));
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      switch (action) {
        case 'suspend':
          await adminAPI.suspendUser(userId, data.reason || 'Suspended by tenant admin');
          break;
        case 'unsuspend':
          await adminAPI.unsuspendUser(userId);
          break;
        case 'reset-password':
          await adminAPI.resetUserPassword(userId);
          break;
        case 'update-role':
          await adminAPI.updateUser(userId, { role: data.role });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await adminAPI.deleteUser(userId);
          } else {
            return;
          }
          break;
        default:
          return;
      }
      
      loadUsers(); // Refresh data
      setError(null);
    } catch (err) {
      console.error(`Error performing ${action} on user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      setError('Please select users first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'suspend':
            return adminAPI.suspendUser(userId, 'Bulk suspended by tenant admin');
          case 'unsuspend':
            return adminAPI.unsuspendUser(userId);
          case 'delete':
            return adminAPI.deleteUser(userId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedUsers([]);
      loadUsers();
      setError(null);
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
      setError(`Failed to ${action} selected users`);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await adminAPI.createUser({
        ...userData,
        tenant_id: currentTenant.id
      });
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers();
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await adminAPI.updateUser(userId, userData);
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers();
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const userColumns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedUsers.length === users.length && users.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers(users.map(user => user.id));
            } else {
              setSelectedUsers([]);
            }
          }}
        />
      ),
      render: (user) => (
        <input
          type="checkbox"
          checked={selectedUsers.includes(user.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers(prev => [...prev, user.id]);
            } else {
              setSelectedUsers(prev => prev.filter(id => id !== user.id));
            }
          }}
        />
      )
    },
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (user) => (
        <div className="user-info">
          <div className="user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name || 'Unnamed User'}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => (
        <select
          value={user.role}
          onChange={(e) => handleUserAction('update-role', user.id, { role: e.target.value })}
          className="role-select"
          disabled={user.id === currentTenant.owner_id}
        >
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
          {hasRole(ROLES.SYSTEM_ADMIN) && <option value="system_admin">System Admin</option>}
        </select>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span className={`status-badge status-${user.status.toLowerCase()}`}>
          {user.status}
        </span>
      )
    },
    {
      key: 'entity_count',
      label: 'Entities',
      sortable: true,
      render: (user) => user.entity_count || 0
    },
    {
      key: 'last_active',
      label: 'Last Active',
      sortable: true,
      render: (user) => user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (user) => new Date(user.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="user-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setEditingUser(user);
              setShowUserModal(true);
            }}
          >
            Edit
          </button>
          
          {user.status === 'active' ? (
            <button
              className="btn btn-sm btn-warning"
              onClick={() => handleUserAction('suspend', user.id)}
              disabled={user.id === currentTenant.owner_id}
            >
              Suspend
            </button>
          ) : (
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleUserAction('unsuspend', user.id)}
            >
              Unsuspend
            </button>
          )}
          
          <button
            className="btn btn-sm btn-info"
            onClick={() => handleUserAction('reset-password', user.id)}
          >
            Reset Password
          </button>
          
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleUserAction('delete', user.id)}
            disabled={user.id === currentTenant.owner_id}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Search users...',
      value: filters.search
    },
    {
      key: 'role',
      type: 'select',
      label: 'Role',
      value: filters.role,
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'user', label: 'User' },
        { value: 'tenant_admin', label: 'Tenant Admin' },
        ...(hasRole(ROLES.SYSTEM_ADMIN) ? [{ value: 'system_admin', label: 'System Admin' }] : [])
      ]
    },
    {
      key: 'status',
      type: 'select',
      label: 'Status',
      value: filters.status,
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      key: 'dateRange',
      type: 'select',
      label: 'Joined',
      value: filters.dateRange,
      options: [
        { value: 'all', label: 'All Time' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' }
      ]
    }
  ];

  if (!canManageTenant()) {
    return (
      <div className="tenant-users">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage tenant users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-users">
      <div className="users-header">
        <div className="header-content">
          <h1>User Management</h1>
          <div className="tenant-info">
            <h2>{currentTenant?.name}</h2>
            <p>Manage users within your tenant</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
          >
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="users-content">
        <FilterPanel
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          className="users-filters"
        />

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="bulk-buttons">
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleBulkAction('suspend')}
              >
                Suspend Selected
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleBulkAction('unsuspend')}
              >
                Unsuspend Selected
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleBulkAction('delete')}
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        <DataTable
          data={filteredUsers}
          columns={userColumns}
          loading={loading}
          emptyMessage="No users found"
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          tenantId={currentTenant.id}
          onSave={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ user, tenantId, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    status: user?.status || 'active',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (user) {
        await onSave(user.id, userData);
      } else {
        await onSave(userData);
      }
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="form-select"
              >
                <option value="user">User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-select"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{user ? 'New Password (optional)' : 'Password'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`form-input ${errors.password ? 'error' : ''}`}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantUsers;