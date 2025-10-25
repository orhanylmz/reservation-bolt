import { Home, Sparkles, Clock, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-md border-b-4 border-green-500 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                TemizPro
              </h1>
            </div>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
            >
              Başla
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <Home className="w-14 h-14 text-white" />
            </div>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Eviniz İçin
            <br />
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Profesyonel Temizlik
            </span>
          </h2>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Evinizi tertemiz yapmak için profesyonel temizlik hizmetimizi kullanın.
            Hızlı, güvenilir ve kaliteli hizmet garantisi.
          </p>

          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-green-600 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all hover:scale-105 shadow-2xl"
          >
            Hemen Başla
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-500 hover:shadow-2xl transition-all hover:scale-105">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Kaliteli Hizmet</h3>
            <p className="text-gray-600 leading-relaxed">
              Deneyimli ve profesyonel ekibimizle evinizi pırıl pırıl yapıyoruz.
              En son teknoloji ve çevre dostu ürünler kullanıyoruz.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-teal-500 hover:shadow-2xl transition-all hover:scale-105">
            <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Hızlı Hizmet</h3>
            <p className="text-gray-600 leading-relaxed">
              Talebinizi hızlı bir şekilde değerlendiriyor ve size en uygun zamanda
              hizmet sunuyoruz. Zamanınıza değer veriyoruz.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-cyan-500 hover:shadow-2xl transition-all hover:scale-105">
            <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Güvenilir</h3>
            <p className="text-gray-600 leading-relaxed">
              Tüm çalışanlarımız kimlik ve referans kontrolünden geçmiştir.
              Evinize güvenle kabul edebileceğiniz profesyonellerle çalışıyoruz.
            </p>
          </div>
        </div>

        <div className="py-16 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Nasıl Çalışır?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <div className="relative">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Kayıt Olun</h4>
              <p className="text-gray-600 text-sm">
                Hızlı ve kolay kayıt işlemi ile sisteme giriş yapın
              </p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Talep Oluşturun</h4>
              <p className="text-gray-600 text-sm">
                Adres, tarih ve ev büyüklüğü bilgilerini girin
              </p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Onay Alın</h4>
              <p className="text-gray-600 text-sm">
                Ekibimiz talebinizi değerlendirir ve çalışan atar
              </p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                4
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Keyfini Çıkarın</h4>
              <p className="text-gray-600 text-sm">
                Profesyonel ekibimiz evinizi tertemiz yapacak
              </p>
            </div>
          </div>
        </div>

        <div className="py-20 text-center bg-gradient-to-br from-green-600 to-teal-600 rounded-3xl shadow-2xl my-16">
          <h3 className="text-4xl font-bold text-white mb-6">Hazır mısınız?</h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Hemen kayıt olun ve temiz bir eve kavuşun!
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-white text-green-600 px-10 py-5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all hover:scale-105 shadow-2xl"
          >
            Şimdi Başla
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 TemizPro. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
