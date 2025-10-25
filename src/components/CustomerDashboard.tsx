import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, Calendar, FileText, LogOut, Plus, CheckCircle, XCircle, MapPin } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { TURKISH_CITIES } from '../data/turkishCities';

type CleaningRequest = Database['public']['Tables']['cleaning_requests']['Row'];

export function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CleaningRequest | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    district: '',
    neighborhood: '',
    address_detail: '',
    service_date: '',
    service_time: '09:00',
    home_size: 'medium' as 'small' | 'medium' | 'large',
    special_notes: '',
    employee_count: 1,
  });

  const calculatePrice = (homeSize: 'small' | 'medium' | 'large', employeeCount: number): number => {
    const basePrices = {
      small: 500,
      medium: 800,
      large: 1200,
    };
    const basePrice = basePrices[homeSize];
    return basePrice * (1 + (employeeCount - 1) * 0.5);
  };

  const currentPrice = calculatePrice(formData.home_size, formData.employee_count);

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
        .update<Database['public']['Tables']['cleaning_requests']['Update']>({
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
        .update<Database['public']['Tables']['cleaning_requests']['Update']>({
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
      const price = calculatePrice(formData.home_size, formData.employee_count);
      const { error } = await supabase
        .from('cleaning_requests')
        .insert<Database['public']['Tables']['cleaning_requests']['Insert']>({
          customer_id: profile.id,
          ...formData,
          price,
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        city: '',
        district: '',
        neighborhood: '',
        address_detail: '',
        service_date: '',
        service_time: '09:00',
        home_size: 'medium',
        special_notes: '',
        employee_count: 1,
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Temizlik Taleplerim</h2>
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
                  <select
                    value={formData.service_time}
                    onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çalışan Sayısı
                  </label>
                  <select
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="1">1 Çalışan</option>
                    <option value="2">2 Çalışan</option>
                    <option value="3">3 Çalışan</option>
                    <option value="4">4 Çalışan</option>
                    <option value="5">5 Çalışan</option>
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Toplam Ücret</h4>
                    <p className="text-xs text-gray-600">
                      {getHomeSizeLabel(formData.home_size)} ev + {formData.employee_count} çalışan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">{currentPrice} ₺</p>
                  </div>
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
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-green-100 cursor-pointer hover:scale-105"
              >
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

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ücret</span>
                      <span className="text-xl font-bold text-green-600">{request.price} ₺</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all hover:scale-110 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Talep Detayları</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                {getStatusBadge(selectedRequest.status)}
                <div className="text-sm text-gray-500">
                  Oluşturulma: {new Date(selectedRequest.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Toplam Ücret</h4>
                    <p className="text-xs text-gray-600">
                      {getHomeSizeLabel(selectedRequest.home_size)} ev + {selectedRequest.employee_count} çalışan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">{selectedRequest.price} ₺</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Adres Bilgileri</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedRequest.city} / {selectedRequest.district}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{selectedRequest.neighborhood}</p>
                    <p className="text-sm text-gray-600 mt-2">{selectedRequest.address_detail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Hizmet Tarihi & Saati</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(selectedRequest.service_date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">Saat: {selectedRequest.service_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Home className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Ev Detayları</p>
                    <p className="text-base font-semibold text-gray-900">
                      {getHomeSizeLabel(selectedRequest.home_size)} Ev
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedRequest.employee_count} Çalışan
                    </p>
                  </div>
                </div>

                {selectedRequest.special_notes && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Özel Notlar</p>
                      <p className="text-sm text-gray-900">{selectedRequest.special_notes}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.completed_at && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Tamamlanma Tarihi</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedRequest.completed_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.confirmed_at && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Onaylanma Tarihi</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedRequest.confirmed_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'awaiting_confirmation' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmCompletion(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Tamamlandığını Onayla
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectCompletion(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
