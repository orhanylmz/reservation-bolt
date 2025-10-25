import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, Calendar, User, LogOut } from 'lucide-react';
import type { Database } from '../lib/database.types';

type CleaningRequest = Database['public']['Tables']['cleaning_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type RequestAssignment = Database['public']['Tables']['request_assignments']['Row'];

interface RequestWithCustomer extends CleaningRequest {
  customer?: Profile;
  assigned_employees?: Profile[];
}

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [requests, setRequests] = useState<RequestWithCustomer[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CleaningRequest | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        supabase
          .from('cleaning_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'employee'),
      ]);

      if (requestsRes.error) throw requestsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      const requestsWithDetails = await Promise.all(
        (requestsRes.data || []).map(async (request) => {
          const [customerRes, assignmentsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', request.customer_id).maybeSingle(),
            supabase.from('request_assignments').select('employee_id').eq('request_id', request.id),
          ]);

          let assignedEmployees: Profile[] = [];
          if (assignmentsRes.data && assignmentsRes.data.length > 0) {
            const employeeIds = assignmentsRes.data.map(a => a.employee_id);
            const { data: empData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', employeeIds);
            assignedEmployees = empData || [];
          }

          return {
            ...request,
            customer: customerRes.data || undefined,
            assigned_employees: assignedEmployees,
          };
        })
      );

      setRequests(requestsWithDetails);
      setEmployees(employeesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function assignEmployees(request: CleaningRequest, employeeIds: string[]) {
    try {
      await supabase
        .from('request_assignments')
        .delete()
        .eq('request_id', request.id);

      if (employeeIds.length > 0) {
        const assignments = employeeIds.map(employee_id => ({
          request_id: request.id,
          employee_id,
        }));

        const { error: assignError } = await supabase
          .from('request_assignments')
          .insert(assignments);

        if (assignError) throw assignError;

        const { error: updateError } = await supabase
          .from('cleaning_requests')
          .update<Database['public']['Tables']['cleaning_requests']['Update']>({
            status: 'assigned',
          })
          .eq('id', request.id);

        if (updateError) throw updateError;
      }

      setSelectedRequest(null);
      setSelectedEmployees([]);
      loadData();
    } catch (error) {
      console.error('Error assigning employees:', error);
    }
  }

  function toggleEmployeeSelection(employeeId: string) {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  }

  async function updateStatus(requestId: string, status: string) {
    try {
      const { error } = await supabase
        .from('cleaning_requests')
        .update<Database['public']['Tables']['cleaning_requests']['Update']>({ status })
        .eq('id', requestId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      awaiting_confirmation: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Beklemede',
      assigned: 'Atandı',
      in_progress: 'Devam Ediyor',
      awaiting_confirmation: 'Onay Bekliyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getHomeSizeLabel = (size: string) => {
    const labels = { small: 'Küçük', medium: 'Orta', large: 'Büyük' };
    return labels[size as keyof typeof labels];
  };

  const filteredRequests = statusFilter
    ? statusFilter === 'active'
      ? requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress')
      : requests.filter((r) => r.status === statusFilter)
    : requests;

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    active: requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length,
    awaiting: requests.filter((r) => r.status === 'awaiting_confirmation').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      <nav className="bg-white shadow-md border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">TemizPro</h1>
                <p className="text-xs text-gray-500">Yönetim Paneli - {profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-green-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <button
            onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === null ? 'border-green-600 ring-2 ring-green-300' : 'border-green-600'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Toplam</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-yellow-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Bekleyen</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.pending}</p>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'active' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Aktif</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.active}</p>
          </button>
          <button
            onClick={() => setStatusFilter('awaiting_confirmation')}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'awaiting_confirmation' ? 'border-orange-500 ring-2 ring-orange-300' : 'border-orange-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Onay Bekleyen</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.awaiting}</p>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'completed' ? 'border-green-500 ring-2 ring-green-300' : 'border-green-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Tamamlanan</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.completed}</p>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Tüm Talepler</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Bu filtrede talep yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Adres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tarih & Saat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Büyüklük
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Çalışan Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Atanan Çalışan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {request.customer?.full_name || 'Bilinmiyor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div>{request.city} / {request.district}</div>
                          <div className="text-xs text-gray-600">{request.neighborhood}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {new Date(request.service_date).toLocaleDateString('tr-TR')}
                            <br />
                            {request.service_time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getHomeSizeLabel(request.home_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.employee_count} Kişi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.assigned_employees && request.assigned_employees.length > 0 ? (
                          <div className="text-sm text-gray-900">
                            {request.assigned_employees.map(emp => emp.full_name).join(', ')}
                            <span className="text-xs text-gray-500 ml-1">({request.assigned_employees.length}/{request.employee_count})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setSelectedEmployees(request.assigned_employees?.map(e => e.id) || []);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Ata
                            </button>
                          )}
                          {request.status === 'assigned' && (
                            <button
                              onClick={() => updateStatus(request.id, 'completed')}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Tamamlandı
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Çalışan Ata</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedRequest.employee_count} çalışan seçmeniz gerekiyor. Seçili: {selectedEmployees.length}
            </p>
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-gray-600">Henüz çalışan yok</p>
              ) : (
                employees.map((employee) => {
                  const isSelected = selectedEmployees.includes(employee.id);
                  return (
                    <button
                      key={employee.id}
                      onClick={() => toggleEmployeeSelection(employee.id)}
                      className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{employee.full_name}</div>
                          <div className="text-sm text-gray-600">{employee.email}</div>
                          {employee.phone && <div className="text-sm text-gray-600">{employee.phone}</div>}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => assignEmployees(selectedRequest, selectedEmployees)}
                disabled={selectedEmployees.length !== selectedRequest.employee_count}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Ata ({selectedEmployees.length}/{selectedRequest.employee_count})
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setSelectedEmployees([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
