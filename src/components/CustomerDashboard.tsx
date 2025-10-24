import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, Calendar, Clock, FileText, LogOut, Plus, CheckCircle, XCircle, MapPin } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { TURKISH_CITIES } from '../data/turkishCities';

type CleaningRequest = Database['public']['Tables']['cleaning_requests']['Row'];

export function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    district: '',
    neighborhood: '',
    address_detail: '',
    service_date: '',
    service_time: '',
    home_size: 'medium' as 'small' | 'medium' | 'large',
    special_notes: '',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const { data, error } = await supabase
        .from('cleaning_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCompletion(requestId: string) {
    try {
      const { error } = await supabase
        .from('cleaning_requests')
        .update({
          status: 'completed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      console.error('Error confirming completion:', error);
    }
  }

  async function rejectCompletion(requestId: string) {
    try {
      const { error } = await supabase
        .from('cleaning_requests')
        .update({
          status: 'assigned',
          completed_at: null,
        })
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      console.error('Error rejecting completion:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('cleaning_requests')
        .insert({
          customer_id: profile.id,
          ...formData,
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        city: '',
        district: '',
        neighborhood: '',
        address_detail: '',
        service_date: '',
        service_time: '',
        home_size: 'medium',
        special_notes: '',
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
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
                <p className="text-xs text-gray-500">Hoş geldiniz, {profile?.full_name}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter(null)}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === null ? 'border-green-600 ring-2 ring-green-300' : 'border-green-600'
            }`}
          >
            <h3 className="text-xs font-medium text-gray-600 mb-1 text-left">Toplam</h3>
            <p className="text-2xl font-bold text-gray-900 text-left">{stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-yellow-500'
            }`}
          >
            <h3 className="text-xs font-medium text-gray-600 mb-1 text-left">Bekleyen</h3>
            <p className="text-2xl font-bold text-gray-900 text-left">{stats.pending}</p>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'active' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-500'
            }`}
          >
            <h3 className="text-xs font-medium text-gray-600 mb-1 text-left">Aktif</h3>
            <p className="text-2xl font-bold text-gray-900 text-left">{stats.active}</p>
          </button>
          <button
            onClick={() => setStatusFilter('awaiting_confirmation')}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'awaiting_confirmation' ? 'border-orange-500 ring-2 ring-orange-300' : 'border-orange-500'
            }`}
          >
            <h3 className="text-xs font-medium text-gray-600 mb-1 text-left">Onay Bekleyen</h3>
            <p className="text-2xl font-bold text-gray-900 text-left">{stats.awaiting}</p>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 transition-all hover:shadow-xl ${
              statusFilter === 'completed' ? 'border-green-500 ring-2 ring-green-300' : 'border-green-500'
            }`}
          >
            <h3 className="text-xs font-medium text-gray-600 mb-1 text-left">Tamamlanan</h3>
            <p className="text-2xl font-bold text-gray-900 text-left">{stats.completed}</p>
          </button>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Temizlik Taleplerim</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Talep
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Yeni Temizlik Talebi</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İl
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">İl Seçiniz</option>
                    {TURKISH_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="İlçe adını giriniz"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mahalle
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Mahalle adını giriniz"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres Detayı
                  </label>
                  <input
                    type="text"
                    value={formData.address_detail}
                    onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Sokak, cadde, bina no, daire no"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tercih Edilen Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tercih Edilen Saat
                  </label>
                  <input
                    type="time"
                    value={formData.service_time}
                    onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ev Büyüklüğü
                  </label>
                  <select
                    value={formData.home_size}
                    onChange={(e) => setFormData({ ...formData, home_size: e.target.value as 'small' | 'medium' | 'large' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="small">Küçük (1-2 oda)</option>
                    <option value="medium">Orta (3-4 oda)</option>
                    <option value="large">Büyük (5+ oda)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Özel Notlar (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.special_notes}
                    onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Talep Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bu filtrede talep yok</h3>
            <p className="text-gray-600">Farklı bir filtre seçerek taleplerinizi görüntüleyebilirsiniz</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-green-100">
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(request.status)}
                  <div className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Adres</p>
                      <p className="font-medium text-gray-900">
                        {request.city} / {request.district} / {request.neighborhood}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{request.address_detail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Tarih & Saat</p>
                      <p className="font-medium text-gray-900">
                        {new Date(request.service_date).toLocaleDateString('tr-TR')} - {request.service_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Home className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Ev Büyüklüğü</p>
                      <p className="font-medium text-gray-900">{getHomeSizeLabel(request.home_size)}</p>
                    </div>
                  </div>

                  {request.special_notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Notlar</p>
                        <p className="font-medium text-gray-900 text-sm">{request.special_notes}</p>
                      </div>
                    </div>
                  )}

                  {request.status === 'awaiting_confirmation' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => confirmCompletion(request.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Onayla
                      </button>
                      <button
                        onClick={() => rejectCompletion(request.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reddet
                      </button>
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
