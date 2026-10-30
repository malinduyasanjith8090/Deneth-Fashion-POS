import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Building2,
  UserCheck,
  Briefcase,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Employee, StoreSettings } from '../types';
import { formatCurrency } from '../utils/printer';

interface EmployeeManagerProps {
  employees: Employee[];
  settings: StoreSettings;
  onAddEmployee: (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  settings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    phone: '',
    email: '',
    address: '',
    role: 'Cashier & POS Operator',
    salary: '',
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'active' as 'active' | 'on_leave' | 'inactive',
    emergencyContact: '',
    notes: '',
  });

  const roles = [
    'all',
    'Cashier & POS Operator',
    'Store Manager & Head Tailor',
    'Alterations & Hemming Specialist',
    'Fashion Sales Associate',
    'Inventory & Stock Clerk',
  ];

  // Open modal for new employee
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      fullName: '',
      nic: '',
      phone: '',
      email: '',
      address: '',
      role: 'Cashier & POS Operator',
      salary: '',
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      emergencyContact: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing employee
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      nic: emp.nic,
      phone: emp.phone,
      email: emp.email || '',
      address: emp.address,
      role: emp.role,
      salary: String(emp.salary),
      joinDate: emp.joinDate || new Date().toISOString().slice(0, 10),
      status: emp.status,
      emergencyContact: emp.emergencyContact || '',
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.nic.trim() || !formData.phone.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        nic: formData.nic.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
        role: formData.role.trim(),
        salary: parseFloat(formData.salary) || 0,
        joinDate: formData.joinDate,
        status: formData.status,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingEmployee) {
        await onUpdateEmployee(editingEmployee.id, payload);
      } else {
        await onAddEmployee(payload);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await onDeleteEmployee(id);
    setDeleteConfirmId(null);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.nic.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        emp.address.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, search, roleFilter, statusFilter]);

  // Aggregate stats
  const totalStaff = employees.length;
  const activeStaff = employees.filter((e) => e.status === 'active').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Deneth Fashion Staff & Employees</h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">· {totalStaff} Registered</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage store team members, NIC numbers, addresses, contact details, roles, and salaries
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Staff Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Staff Members</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
              {totalStaff} Employees
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{activeStaff} Currently Active</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Monthly Payroll Obligation</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
              {formatCurrency(totalPayroll, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Monthly basic salaries
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md flex items-center justify-between transition-colors">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Boutique Store Branch</div>
            <div className="text-base font-bold text-neutral-900 dark:text-white mt-1 truncate max-w-[200px]">
              {settings.storeName}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px] mt-0.5">
              {settings.address}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by full name, NIC number (e.g. 1994...), phone, or address..."
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'active', label: 'Active' },
            { id: 'on_leave', label: 'On Leave' },
            { id: 'inactive', label: 'Inactive' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-md hover:shadow-lg flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
          >
            <div>
              {/* Header with Name, Role & Status */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm shadow-sm">
                    {emp.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {emp.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <Briefcase className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                      <span>{emp.role}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border capitalize ${
                    emp.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-500/30'
                      : emp.status === 'on_leave'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-500/30'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                  }`}
                >
                  {emp.status.replace('_', ' ')}
                </span>
              </div>

              {/* Detailed Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 py-3 text-xs">
                {/* NIC Number */}
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
                      NIC Number
                    </div>
                    <div className="font-mono text-neutral-900 dark:text-white font-medium select-all">
                      {emp.nic}
                    </div>
                  </div>
                </div>

                {/* Monthly Salary */}
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Monthly Salary
                    </div>
                    <div className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                      {formatCurrency(emp.salary, settings.currencySymbol)}
                    </div>
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Contact Phone
                    </div>
                    <a
                      href={`tel:${emp.phone}`}
                      className="text-neutral-800 hover:text-amber-600 dark:text-neutral-200 dark:hover:text-amber-400 transition-colors font-mono"
                    >
                      {emp.phone}
                    </a>
                  </div>
                </div>

                {/* Joining Date */}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Joined Date
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300 font-mono">
                      {emp.joinDate || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Residential Address
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300 text-xs">
                      {emp.address || 'Address not registered'}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Notes if provided */}
                {(emp.emergencyContact || emp.notes) && (
                  <div className="sm:col-span-2 space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                    {emp.emergencyContact && (
                      <div>
                        <strong className="text-neutral-700 dark:text-neutral-300">Emergency: </strong>
                        <span>{emp.emergencyContact}</span>
                      </div>
                    )}
                    {emp.notes && (
                      <div className="italic text-neutral-400 dark:text-neutral-500">
                        "{emp.notes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                ID: {emp.id}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmId(emp.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Remove Employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <Users className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">No employees match your search</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Try adjusting your query or click "Add New Employee" to register staff members into the system.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-auto transition-colors"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {editingEmployee ? 'Edit Staff Member' : 'Register New Employee'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Kaveesha Fernando"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      NIC Number (National ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nic}
                      onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                      placeholder="e.g. 199854201132 / 985420113V"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@denethfashion.com"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 45/2 Station Road, Dehiwala, Colombo"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Designation / Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="Cashier & POS Operator">Cashier & POS Operator</option>
                      <option value="Store Manager & Head Tailor">Store Manager & Head Tailor</option>
                      <option value="Alterations & Hemming Specialist">Alterations & Hemming Specialist</option>
                      <option value="Fashion Sales Associate">Fashion Sales Associate</option>
                      <option value="Inventory & Stock Clerk">Inventory & Stock Clerk</option>
                      <option value="Security & Facility Staff">Security & Facility Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Monthly Salary ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g. 55000"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 tabular-nums font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Employment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. +94 77 987 6543 (Brother / Spouse)"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Notes / Key Responsibilities
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Shift details, bank account info, or tailoring specialties..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Register Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-center space-y-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Remove Employee?</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Are you sure you want to remove this employee from Deneth Fashion staff records?
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(deleteConfirmId)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-500 transition-colors cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
