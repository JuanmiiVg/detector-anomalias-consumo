const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Colocar aquí tu URI de conexión a MongoDB
const MONGODB_URI = '';
let db;

// Conexión a MongoDB
MongoClient.connect(MONGODB_URI)
.then(client => {
  console.log('✅ Conectado a MongoDB');
  db = client.db('bigdata');
})
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Función para detectar anomalías
function detectAnomalies(consumoData) {
  const anomalies = [];
  
  consumoData.forEach((record, idx) => {
    const hour = new Date(record.date).getHours();
    const consumo = record.consumo;
    
    // Patrón 1: Consumo nocturno elevado (00:00-06:00)
    if (hour >= 0 && hour < 6 && consumo > 15) {
      anomalies.push({
        propietario_id: record.propietario_id,
        direccion: record.direccion,
        barrio: record.barrio,
        fecha: record.date,
        tipo: 'Consumo Nocturno Elevado',
        valor: consumo,
        riesgo: consumo > 25 ? 'Alto' : 'Medio',
        puntuacion: consumo > 25 ? 85 : 65,
        descripcion: `Consumo de ${consumo} kWh durante horario nocturno (${hour}:00h)`
      });
    }
    
    // Patrón 2: Consumo muy superior a necesidad (indica posible generación oculta)
    if (record.necesidad < 0.5 && consumo > 20) {
      anomalies.push({
        propietario_id: record.propietario_id,
        direccion: record.direccion,
        barrio: record.barrio,
        fecha: record.date,
        tipo: 'Alto Consumo con Baja Necesidad',
        valor: consumo,
        riesgo: 'Alto',
        puntuacion: 90,
        descripcion: `Consumo ${consumo} kWh pero necesidad solo ${record.necesidad} kWh`
      });
    }
    
    // Patrón 3: Incremento súbito (comparar con día anterior)
    if (idx > 0 && consumo > consumoData[idx - 1].consumo * 3) {
      const incremento = ((consumo / consumoData[idx - 1].consumo - 1) * 100).toFixed(0);
      anomalies.push({
        propietario_id: record.propietario_id,
        direccion: record.direccion,
        barrio: record.barrio,
        fecha: record.date,
        tipo: 'Incremento Súbito',
        valor: consumo,
        riesgo: 'Medio',
        puntuacion: 70,
        descripcion: `Incremento del ${incremento}% respecto al día anterior`
      });
    }
  });
  
  return anomalies;
}

// Endpoint principal: Análisis de anomalías
app.get('/api/analizar-anomalias', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, barrio } = req.query;
    
    console.log('🔍 Iniciando análisis de anomalías...');
    
    // 1. Obtener datos de clientes con sus direcciones
    const clientesMap = {};
    const clientes = await db.collection('clientes').find({}).toArray();
    
    clientes.forEach(cliente => {
      clientesMap[cliente.external_id] = {
        nombre: cliente.nombre,
        direccion: `${cliente.calle} ${cliente.numero}`,
        barrio: cliente.barrio,
        ciudad: cliente.ciudad,
        provincia: cliente.provincia
      };
    });
    
    console.log(`📊 ${clientes.length} clientes cargados`);
    
    // 2. Agregación de consumos por día y hora para reducir datos
    const matchStage = {
      date: {
        $gte: new Date(fechaInicio || '2022-01-01'),
        $lte: new Date(fechaFin || '2022-12-31')
      }
    };
    
    if (barrio && barrio !== 'todos') {
      // Filtrar por propietarios del barrio específico
      const propietariosBarrio = clientes
        .filter(c => c.barrio === barrio)
        .map(c => c.external_id);
      matchStage.propietario_id = { $in: propietariosBarrio };
    }
    
    console.log('⚙️ Ejecutando agregación...');
    
    const consumosAgregados = await db.collection('consumos').aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hora: { $hour: "$date" },
          fecha: { $dateToString: { format: "%Y-%m-%d", date: "$date" }}
        }
      },
      {
        $group: {
          _id: {
            propietario: "$propietario_id",
            fecha: "$fecha",
            hora: "$hora"
          },
          consumo: { $sum: "$consumo" },
          generado: { $sum: "$generado" },
          necesidad: { $sum: "$necesidad" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          propietario_id: "$_id.propietario",
          fecha: "$_id.fecha",
          hora: "$_id.hora",
          consumo: 1,
          generado: 1,
          necesidad: 1,
          count: 1
        }
      },
      { $sort: { "propietario_id": 1, "fecha": 1, "hora": 1 } },
      { $limit: 50000 } // Limitar para no sobrecargar
    ]).toArray();
    
    console.log(`✅ ${consumosAgregados.length} registros agregados procesados`);
    
    // 3. Enriquecer datos con información de clientes
    const consumosEnriquecidos = consumosAgregados.map(c => {
      const cliente = clientesMap[c.propietario_id] || {};
      return {
        ...c,
        date: new Date(`${c.fecha}T${String(c.hora).padStart(2, '0')}:00:00Z`),
        direccion: cliente.direccion || 'Desconocida',
        barrio: cliente.barrio || 'Desconocido',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia || ''
      };
    });
    
    // 4. Detectar anomalías
    console.log('🔎 Detectando anomalías...');
    const anomalias = detectAnomalies(consumosEnriquecidos);
    
    // 5. Calcular estadísticas por barrio
    const barrioStats = {};
    consumosEnriquecidos.forEach(c => {
      if (!barrioStats[c.barrio]) {
        barrioStats[c.barrio] = {
          totalConsumo: 0,
          count: 0,
          anomalias: 0,
          riesgoAlto: 0,
          riesgoMedio: 0
        };
      }
      barrioStats[c.barrio].totalConsumo += c.consumo;
      barrioStats[c.barrio].count++;
    });
    
    anomalias.forEach(a => {
      if (barrioStats[a.barrio]) {
        barrioStats[a.barrio].anomalias++;
        if (a.riesgo === 'Alto') barrioStats[a.barrio].riesgoAlto++;
        else barrioStats[a.barrio].riesgoMedio++;
      }
    });
    
    // 6. Agrupar anomalías por dirección
    const direccionAnomalies = {};
    anomalias.forEach(a => {
      const key = `${a.direccion}_${a.barrio}`;
      if (!direccionAnomalies[key]) {
        direccionAnomalies[key] = {
          propietario_id: a.propietario_id,
          direccion: a.direccion,
          barrio: a.barrio,
          alertas: 0,
          puntuacionTotal: 0,
          tipos: new Set()
        };
      }
      direccionAnomalies[key].alertas++;
      direccionAnomalies[key].puntuacionTotal += a.puntuacion;
      direccionAnomalies[key].tipos.add(a.tipo);
    });
    
    const topLocations = Object.values(direccionAnomalies)
      .map(loc => ({
        ...loc,
        tipos: Array.from(loc.tipos),
        puntuacionPromedio: Math.round(loc.puntuacionTotal / loc.alertas),
        riesgo: (loc.puntuacionTotal / loc.alertas) > 80 ? 'Alto' : 'Medio'
      }))
      .sort((a, b) => b.puntuacionTotal - a.puntuacionTotal)
      .slice(0, 50);
    
    // 7. Timeline de anomalías
    const timelineMap = {};
    anomalias.forEach(a => {
      const fecha = typeof a.fecha === 'string' 
        ? a.fecha.split('T')[0] 
        : new Date(a.fecha).toISOString().split('T')[0];
      if (!timelineMap[fecha]) {
        timelineMap[fecha] = { date: fecha, count: 0, alto: 0, medio: 0 };
      }
      timelineMap[fecha].count++;
      if (a.riesgo === 'Alto') timelineMap[fecha].alto++;
      else timelineMap[fecha].medio++;
    });
    
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`✅ Análisis completado: ${anomalias.length} anomalías detectadas`);
    
    res.json({
      success: true,
      totalRegistros: consumosAgregados.length,
      anomalias: anomalias.slice(0, 100), // Primeras 100 anomalías
      topLocations,
      barrioStats: Object.entries(barrioStats).map(([barrio, stats]) => ({
        barrio,
        consumoPromedio: (stats.totalConsumo / stats.count).toFixed(2),
        totalAnomalias: stats.anomalias,
        riesgoAlto: stats.riesgoAlto,
        riesgoMedio: stats.riesgoMedio
      })),
      timeline,
      resumen: {
        totalAnomalias: anomalias.length,
        alertasAltas: anomalias.filter(a => a.riesgo === 'Alto').length,
        alertasMedias: anomalias.filter(a => a.riesgo === 'Medio').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

// Endpoint: Obtener lista de barrios
app.get('/api/barrios', async (req, res) => {
  try {
    const barrios = await db.collection('clientes')
      .distinct('barrio');
    
    res.json({ 
      success: true, 
      barrios: barrios.filter(b => b) 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint: Detalle de una dirección específica
app.get('/api/detalle-direccion/:propietarioId', async (req, res) => {
  try {
    const { propietarioId } = req.params;
    
    const cliente = await db.collection('clientes')
      .findOne({ external_id: propietarioId });
    
    const consumos = await db.collection('consumos')
      .find({ propietario_id: propietarioId })
      .sort({ date: -1 })
      .limit(100)
      .toArray();
    
    res.json({ 
      success: true, 
      cliente, 
      consumos 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});