import { FaTrophy, FaUsers, FaBolt, FaGamepad } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
              CQG Platform
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
              The ultimate gaming tournament platform. Compete, connect, and conquer in the world of competitive gaming.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <a 
                href="/tournaments" 
                className="min-h-[48px] inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg text-base sm:text-lg"
              >
                <FaTrophy className="mr-2" />
                View Tournaments
              </a>
              <a 
                href="/players" 
                className="min-h-[48px] inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-500/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-blue-500/30 transition-all duration-200 text-base sm:text-lg"
              >
                <FaUsers className="mr-2" />
                Player Directory
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-300/20 rounded-full blur-xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose CQG Platform?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Experience the future of competitive gaming with our cutting-edge platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FaTrophy className="text-xl sm:text-2xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Tournament Management</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Organize and participate in tournaments with our intuitive bracket system and real-time match tracking.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FaUsers className="text-xl sm:text-2xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Player Profiles</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Build your gaming reputation with detailed profiles, statistics, and achievements tracking.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:shadow-lg transition-all duration-200 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FaBolt className="text-xl sm:text-2xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Real-time Updates</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Stay connected with live match updates, instant notifications, and seamless communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <p className="text-gray-600">
              Get started with these popular features
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <a 
              href="/tournaments" 
              className="group min-h-[80px] p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                  <FaTrophy className="text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm sm:text-base">Tournaments</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Browse & join</p>
                </div>
              </div>
            </a>
            
            <a 
              href="/players" 
              className="group min-h-[80px] p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-purple-300"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <FaUsers className="text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 text-sm sm:text-base">Players</h3>
                  <p className="text-xs sm:text-sm text-gray-500">View profiles</p>
                </div>
              </div>
            </a>
            
            {process.env.NODE_ENV !== 'production' && (
              <>
                <a 
                  href="/dev-test" 
                  className="group min-h-[80px] p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-amber-300"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors flex-shrink-0">
                      <span className="text-lg sm:text-xl">🧪</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 text-sm sm:text-base">Dev Test</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Testing tools</p>
                    </div>
                  </div>
                </a>
                
                <a 
                  href="/arena-test" 
                  className="group min-h-[80px] p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-green-300"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                      <FaGamepad className="text-lg sm:text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 text-sm sm:text-base">Arena Test</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Overlay testing</p>
                    </div>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </section>
      </div>
  );
}
