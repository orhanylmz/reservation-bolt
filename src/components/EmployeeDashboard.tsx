import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, Calendar, User, LogOut, Briefcase, MapPin, Phone } from 'lucide-react';
import type { Database } from '../lib/database.types';

type CleaningRequest = Database['public']['Tables']['cleaning_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface RequestWithCustomer extends CleaningRequest {
  customer?: Profile;
}

export function EmployeeDashboard() {
  const { profile, signOut } = useAuth();
  const [requests, setRequests] = useState<RequestWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [profile]);

  async function loadRequests() {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('cleaning_requests')
        .select('*')
        .eq('assigned_employee_id', profile.id)
        .order('service_date', { ascending: true });

      if (error) throw error;

      const requestsWithCustomer = await Promise.all(
        (data || []).map(async (request) => {
          const { data: customer } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', request.customer_id)
            .maybeSingle();

          return {
            ...request,
            customer: customer || undefined,
          };
        })
      );

      setRequests(requestsWithCustomer);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsCompleted(requestId: string) {
    try {
      const { error } = await supabase
        .from('cleaning_requests')
        .update({
          status: 'awaiting_confirmation',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
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
      awaiting_confirmation: 'Müşteri Onayı Bekleniyor',
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
    const labels = { small: 'Küçük (1-2 oda)', medium: 'Orta (3-4 oda)', large: 'Büyük (5+ oda)' };
    return labels[size as keyof typeof labels];
  };

  const filteredRequests = statusFilter
    ? statusFilter === 'assigned'
      ? requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress')
      : requests.filter((r) => r.status === statusFilter)
    : requests;

  const stats = {
    total: requests.length,
    assigned: requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length,
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
                <p className="text-xs text-gray-500">Görevlerim - {profile?.full_name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === null ? 'border-green-600 ring-2 ring-green-300' : 'border-green-600'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Toplam Görevlerim</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'assigned' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-600 mb-2 text-left">Aktif Görevler</h3>
            <p className="text-3xl font-bold text-gray-900 text-left">{stats.assigned}</p>
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Atanan Görevlerim</h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bu filtrede görev yok</h3>
            <p className="text-gray-600">Farklı bir filtre seçerek görevleri görüntüleyebilirsiniz</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-green-600"
              >
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(request.status)}
                  <div className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="space-y-4">
                  {request.customer && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        Müşteri Bilgileri
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-900 font-medium">{request.customer.full_name}</p>
                        <p className="text-gray-600">{request.customer.email}</p>
                        {request.customer.phone && (
                          <p className="text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {request.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Adres</p>
                      <p className="font-medium text-gray-900">
                        {request.city} / {request.district} / {request.neighborhood}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{request.address_detail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Tarih & Saat</p>
                      <p className="font-medium text-gray-900">
                        {new Date(request.service_date).toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="font-medium text-green-600">{request.service_time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Ev Büyüklüğü</p>
                      <p className="font-medium text-gray-900">{getHomeSizeLabel(request.home_size)}</p>
                    </div>
                  </div>

                  {request.special_notes && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Özel Notlar</p>
                      <p className="text-sm text-gray-900">{request.special_notes}</p>
                    </div>
                  )}

                  {(request.status === 'assigned' || request.status === 'in_progress') && (
                    <button
                      onClick={() => markAsCompleted(request.id)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Home className="w-5 h-5" />
                      Temizliği Tamamladım
                    </button>
                  )}
                  {request.status === 'awaiting_confirmation' && (
                    <div className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 py-3 rounded-lg font-medium text-center">
                      Müşteri onayı bekleniyor...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
