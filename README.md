# 🔍 Sistema de Detección de Anomalías en Consumo Energético

Sistema avanzado para detectar patrones anómalos en consumo eléctrico que podrían indicar cultivos indoor ilegales. Analiza 2.3 millones de registros mediante agregaciones optimizadas de MongoDB.

![Dashboard Principal](./docs/images/dashboard-principal1.png)

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Patrones de Detección](#patrones-de-detección)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Optimizaciones](#optimizaciones)
- [Troubleshooting](#troubleshooting)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## ✨ Características

- 🔎 **Detección Inteligente**: 4 patrones diferentes de anomalías
- 📊 **Visualización Avanzada**: Gráficas interactivas con Recharts
- 🚀 **Alto Rendimiento**: Procesa 2.3M registros en segundos mediante agregaciones MongoDB
- 🗺️ **Análisis Geográfico**: Estadísticas por barrios y direcciones
- 🎯 **Sistema de Puntuación**: Ranking de ubicaciones sospechosas
- ⏱️ **Análisis Temporal**: Timeline de evolución de anomalías
- 🔄 **Filtros Dinámicos**: Por fecha, barrio y nivel de riesgo

![Gráfica de Evolución](./docs/images/grafica-temporal.png)

## 🛠️ Tecnologías

### Backend
- **Node.js** v16+
- **Express.js** 4.x - Framework web
- **MongoDB** 5.x - Base de datos
- **MongoDB Driver** 6.x - Cliente nativo

### Frontend
- **React** 18.x
- **Recharts** 2.x - Gráficas interactivas
- **Tailwind CSS** 3.x - Estilos
- **Lucide React** - Iconos

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v16 o superior
- [npm](https://www.npmjs.com/) v8 o superior
- Acceso a MongoDB (local o remoto)
- Git (para clonar el repositorio)

Verifica las versiones instaladas:
```bash
node --version
npm --version
git --version
```

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/detector-anomalias.git
cd detector-anomalias
```

### 2. Instalar Backend

```bash
cd backend
npm install
```

**Dependencias instaladas:**
- `express` - Framework web
- `mongodb` - Cliente MongoDB
- `cors` - Middleware para CORS

### 3. Instalar Frontend

```bash
cd ../frontend
npm install
```

**Dependencias instaladas:**
- `react` y `react-dom` - Framework UI
- `recharts` - Librería de gráficas
- `lucide-react` - Iconos
- `tailwindcss` - Framework CSS

## ⚙️ Configuración

### Backend - Base de Datos

Edita `backend/server.js` y actualiza la URI de MongoDB:

```javascript
const MONGODB_URI = 'mongodb://tu-servidor:puerto/bigdata';
```

**Opciones de configuración:**

**Conexión local:**
```javascript
const MONGODB_URI = 'mongodb://localhost:27017/bigdata';
```

**Conexión con autenticación:**
```javascript
const MONGODB_URI = 'mongodb://usuario:password@servidor:puerto/bigdata';
```

**MongoDB Atlas:**
```javascript
const MONGODB_URI = 'mongodb+srv://usuario:password@cluster.mongodb.net/bigdata';
```

### Frontend - URL de la API

Si cambias el puerto del backend, edita `frontend/src/App.js`:

```javascript
const API_URL = 'http://localhost:3001'; // Cambia el puerto si es necesario
```

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la carpeta `backend`:

```env
MONGODB_URI=mongodb://server25.fjortega.es:27777/bigdata
PORT=3001
NODE_ENV=development
```

Y actualiza `server.js`:
```javascript
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;
```

Instala dotenv:
```bash
npm install dotenv
```

## 🎮 Uso

### Modo Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3001
✅ Conectado a MongoDB
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

El navegador se abrirá automáticamente en `http://localhost:3000`

![Panel de Control](./docs/images/panel-control.png)

### Ejecutar Análisis

1. **Selecciona el rango de fechas** que deseas analizar
2. **Filtra por barrio** (opcional)
3. **Haz clic en "Analizar BD"**
4. Espera mientras el sistema procesa los datos (10-30 segundos)
5. **Visualiza los resultados** en las gráficas y tablas

### Modo Producción

**Backend:**
```bash
cd backend
npm install pm2 -g
pm2 start server.js --name "detector-backend"
pm2 save
pm2 startup
```

**Frontend:**
```bash
cd frontend
npm run build
# Servir con nginx, Apache o cualquier servidor web
```

## 🎯 Patrones de Detección

### 1. Consumo Nocturno Elevado (00:00-06:00)
- **Indicador**: Luces de cultivo funcionando de noche
- **Umbral**: > 15 kWh durante horario nocturno
- **Riesgo**: Alto si > 25 kWh, Medio si 15-25 kWh
- **Puntuación**: 65-85 puntos

### 2. Alto Consumo con Baja Necesidad
- **Indicador**: Posible generación oculta o consumo no declarado
- **Umbral**: Consumo > 20 kWh pero necesidad < 0.5 kWh
- **Riesgo**: Alto
- **Puntuación**: 90 puntos

### 3. Incremento Súbito
- **Indicador**: Instalación reciente de equipamiento
- **Umbral**: Consumo > 3x el día anterior
- **Riesgo**: Medio
- **Puntuación**: 70 puntos

### 4. Consumo Anómalo vs Barrio
- **Indicador**: Actividad atípica para la zona
- **Umbral**: Consumo > 2.5x la media del barrio
- **Riesgo**: Alto
- **Puntuación**: 80 puntos

![Tipos de Anomalías](./docs/images/tipos-anomalias.png)

## 📁 Estructura del Proyecto

```
detector-anomalias/
├── backend/
│   ├── server.js              # API principal
│   ├── package.json           # Dependencias backend
│   └── node_modules/
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Dashboard principal
│   │   ├── index.js
│   │   └── index.css         # Estilos con Tailwind
│   ├── tailwind.config.js    # Config Tailwind
│   ├── postcss.config.js     # Config PostCSS
│   ├── package.json          # Dependencias frontend
│   └── node_modules/
│
├── docs/
│   └── images/               # Capturas de pantalla
│       ├── dashboard-principal.png
│       ├── grafica-temporal.png
│       ├── panel-control.png
│       ├── tipos-anomalias.png
│       └── tabla-direcciones.png
│
├── .gitignore
├── README.md
└── LICENSE
```

## 🔌 API Endpoints

### `GET /api/analizar-anomalias`

Analiza consumos y detecta anomalías.

**Query Parameters:**
- `fechaInicio` (string): Fecha inicial YYYY-MM-DD
- `fechaFin` (string): Fecha final YYYY-MM-DD
- `barrio` (string): Nombre del barrio o "todos"

**Respuesta:**
```json
{
  "success": true,
  "totalRegistros": 50000,
  "anomalias": [...],
  "topLocations": [...],
  "barrioStats": [...],
  "timeline": [...],
  "resumen": {
    "totalAnomalias": 1250,
    "alertasAltas": 450,
    "alertasMedias": 800
  }
}
```

### `GET /api/barrios`

Obtiene la lista de barrios disponibles.

**Respuesta:**
```json
{
  "success": true,
  "barrios": ["Lavapiés", "Malasaña", "Chueca", ...]
}
```

### `GET /api/detalle-direccion/:propietarioId`

Obtiene el detalle de consumo de un cliente específico.

**Parámetros:**
- `propietarioId`: ID del propietario (external_id)

**Respuesta:**
```json
{
  "success": true,
  "cliente": {...},
  "consumos": [...]
}
```

## 📸 Capturas de Pantalla

### Dashboard Principal
![Dashboard](./docs/images/dashboard-principal1.png)

### Panel de Control y Filtros
![Panel Control](./docs/images/panel-control.png)

### Tabla de Direcciones Sospechosas
![Tabla Direcciones](./docs/images/tabla-direcciones.png)

### Gráficas de Análisis
![Gráficas](./docs/images/grafica-temporal.png)

## ⚡ Optimizaciones

### Base de Datos

**Índices recomendados** (ejecuta en MongoDB):

```javascript
// Índice en fecha para consultas temporales
db.consumos.createIndex({ "date": 1 })

// Índice compuesto para búsquedas por propietario y fecha
db.consumos.createIndex({ "propietario_id": 1, "date": 1 })

// Índice en clientes por external_id
db.clientes.createIndex({ "external_id": 1 })

// Índice en barrio para filtrado
db.clientes.createIndex({ "barrio": 1 })
```

### Agregación MongoDB

El sistema usa agregaciones para reducir la carga:

```javascript
// De 2.3M registros → 50K registros agregados por día/hora
db.collection('consumos').aggregate([
  { $match: { date: { $gte: fechaInicio, $lte: fechaFin } } },
  {
    $group: {
      _id: {
        propietario: "$propietario_id",
        fecha: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        hora: { $hour: "$date" }
      },
      consumo: { $sum: "$consumo" },
      generado: { $sum: "$generado" },
      necesidad: { $sum: "$necesidad" }
    }
  }
])
```

### Performance

- ✅ **Agregación por día/hora**: Reduce datos de 2.3M → 50K
- ✅ **Límite de 50K registros**: Previene sobrecarga
- ✅ **Índices en MongoDB**: Acelera consultas 10-100x
- ✅ **Caché en memoria**: Los datos del cliente se cargan una vez
- ✅ **Paginación en frontend**: Muestra top 100 anomalías

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solución:**
```bash
# Verifica que MongoDB esté corriendo
# Verifica la URI en server.js
# Comprueba el firewall y puertos abiertos
```

### Error: "CORS policy blocked"

**Solución:**
Actualiza `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Error: "Module not found"

**Solución:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Frontend no carga estilos

**Solución:**
```bash
# Verifica que tailwind.config.js esté en la raíz de frontend
# Verifica que src/index.css contenga @tailwind
# Reinicia el servidor: npm start
```

### MongoDB "Authentication failed"

**Solución:**
Actualiza la URI con credenciales:
```javascript
const MONGODB_URI = 'mongodb://usuario:password@servidor:puerto/bigdata';
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: nueva característica'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Estándares de Código

- Usa ESLint para JavaScript
- Comenta funciones complejas
- Sigue el estilo de código existente
- Incluye tests si es posible

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Juan Manuel Vega**
- GitHub: [@JuanmiiVg](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [MongoDB](https://www.mongodb.com/) - Base de datos NoSQL
- [React](https://reactjs.org/) - Librería UI
- [Recharts](https://recharts.org/) - Gráficas para React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Iconos

---

⭐ Si te ha sido útil este proyecto, considera darle una estrella en GitHub!

## 🗺️ Roadmap

- [ ] Exportación de reportes en PDF
- [ ] Integración con sistema de alertas (email/SMS)
- [ ] Dashboard de administración
- [ ] Machine Learning para detección predictiva
- [ ] API REST documentada con Swagger
- [ ] Dockerización del proyecto
- [ ] Tests unitarios y de integración
- [ ] Modo multi-tenant