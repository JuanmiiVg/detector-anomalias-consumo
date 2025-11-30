import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Activity, MapPin, TrendingUp, Database, RefreshCw } from 'lucide-react';

const AnomalyDetectionDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [barrios, setBarrios] = useState([]);
  const [selectedBarrio, setSelectedBarrio] = useState('todos');
  const [alertLevel, setAlertLevel] = useState('all');
  const [fechaInicio, setFechaInicio] = useState('2022-01-01');
  const [fechaFin, setFechaFin] = useState('2022-12-31');

  // URL de tu API backend
  const API_URL = 'http://localhost:3001';

  // Cargar lista de barrios al iniciar
  useEffect(() => {
    fetchBarrios();
  }, []);

  const fetchBarrios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/barrios`);
      const result = await response.json();
      if (result.success) {
        setBarrios(result.barrios);
      }
    } catch (err) {
      console.error('Error cargando barrios:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        barrio: selectedBarrio
      });

      const response = await fetch(`${API_URL}/api/analizar-anomalias?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      setData(result);
      console.log('✅ Datos cargados:', result.totalRegistros, 'registros procesados');
      
    } catch (err) {
      setError(`Error: ${err.message}. Asegúrate de que el backend esté corriendo en ${API_URL}`);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riesgo) => {
    return riesgo === 'Alto' ? '#EF4444' : '#F59E0B';
  };

  const filteredLocations = data?.topLocations?.filter(loc => {
    const alertMatch = alertLevel === 'all' || loc.riesgo === alertLevel;
    return alertMatch;
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-red-900">
          <h1 className="text-3xl font-bold text-red-500 mb-2 flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Sistema de Detección de Anomalías - Cultivos Indoor
          </h1>
          <p className="text-gray-400">Análisis de patrones de consumo eléctrico anómalos | MongoDB: server25.fjortega.es:27777</p>
        </div>

        {/* Panel de Control */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Database className="text-blue-400" />
            Panel de Control
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded border border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded border border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Barrio</label>
              <select
                value={selectedBarrio}
                onChange={(e) => setSelectedBarrio(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded border border-gray-600"
              >
                <option value="todos">Todos los barrios</option>
                {barrios.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchData}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Analizando...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} />
                    Analizar BD
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-900 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-sm text-yellow-100">
              <strong>⚠️ Patrones detectados:</strong> Consumo nocturno elevado (00-06h) • Consumo constante 24/7 • 
              Incrementos súbitos • Consumo anómalo vs barrio
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertTriangle className="text-red-300 mr-2" />
              <div>
                <p className="text-red-200 font-semibold">Error de conexión</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <p className="text-red-400 text-xs mt-2">
                  Ejecuta el backend: <code className="bg-red-950 px-2 py-1 rounded">node server.js</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <RefreshCw className="animate-spin h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Analizando 2.3M de registros de MongoDB...</p>
            <p className="text-gray-500 text-sm mt-2">Este proceso puede tardar 10-30 segundos</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-sm text-gray-400 mb-1">Registros Procesados</h3>
                <p className="text-2xl font-bold text-blue-400">{data.totalRegistros?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
                <h3 className="text-sm text-gray-400 mb-1">Total Anomalías</h3>
                <p className="text-2xl font-bold text-red-400">{data.resumen?.totalAnomalias}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-orange-500">
                <h3 className="text-sm text-gray-400 mb-1">Riesgo Alto</h3>
                <p className="text-2xl font-bold text-orange-400">{data.resumen?.alertasAltas}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-yellow-500">
                <h3 className="text-sm text-gray-400 mb-1">Riesgo Medio</h3>
                <p className="text-2xl font-bold text-yellow-400">{data.resumen?.alertasMedias}</p>
              </div>
            </div>

            {/* Evolución Temporal */}
            {data.timeline && data.timeline.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-red-400" />
                  Evolución Temporal de Anomalías
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Line type="monotone" dataKey="alto" stroke="#EF4444" name="Riesgo Alto" strokeWidth={2} />
                    <Line type="monotone" dataKey="medio" stroke="#F59E0B" name="Riesgo Medio" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribución por Barrio */}
            {data.barrioStats && data.barrioStats.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                  <Activity className="text-blue-400" />
                  Distribución por Barrio
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.barrioStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="barrio" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="riesgoAlto" fill="#EF4444" name="Alertas Alto Riesgo" />
                    <Bar dataKey="riesgoMedio" fill="#F59E0B" name="Alertas Riesgo Medio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Direcciones */}
            {filteredLocations && filteredLocations.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                    <MapPin className="text-red-400" />
                    Direcciones con Mayor Sospecha ({filteredLocations.length})
                  </h2>
                  <select 
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(e.target.value)}
                    className="bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm border border-gray-600"
                  >
                    <option value="all">Todos los niveles</option>
                    <option value="Alto">Solo Alto Riesgo</option>
                    <option value="Medio">Solo Riesgo Medio</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700 text-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left">Dirección</th>
                        <th className="px-4 py-3 text-left">Barrio</th>
                        <th className="px-4 py-3 text-center">Alertas</th>
                        <th className="px-4 py-3 text-center">Puntuación</th>
                        <th className="px-4 py-3 text-center">Riesgo</th>
                        <th className="px-4 py-3 text-left">Tipos Detectados</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {filteredLocations.map((loc, idx) => (
                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium">{loc.direccion}</td>
                          <td className="px-4 py-3">{loc.barrio}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-red-900 text-red-200 px-2 py-1 rounded font-semibold">
                              {loc.alertas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-lg">{loc.puntuacionPromedio}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded font-semibold ${
                              loc.riesgo === 'Alto' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-orange-600 text-white'
                            }`}>
                              {loc.riesgo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{loc.tipos.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Últimas Anomalías */}
            {data.anomalias && data.anomalias.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-200 mb-4">
                  Últimas Anomalías Detectadas (Top 100)
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.anomalias.map((anomaly, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-700 p-4 rounded border-l-4"
                      style={{ borderLeftColor: getRiskColor(anomaly.riesgo) }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-200">{anomaly.direccion}</span>
                            <span className="text-xs text-gray-400">({anomaly.barrio})</span>
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              anomaly.riesgo === 'Alto' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                            }`}>
                              {anomaly.riesgo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">{anomaly.tipo}</p>
                          <p className="text-xs text-gray-400">{anomaly.descripcion}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold" style={{ color: getRiskColor(anomaly.riesgo) }}>
                            {anomaly.puntuacion}
                          </p>
                          <p className="text-xs text-gray-400">Score</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(anomaly.fecha).toLocaleString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!data && !loading && !error && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <Database className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Configura los parámetros y presiona "Analizar BD"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyDetectionDashboard;