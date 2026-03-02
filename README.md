# ⚡ CatLink

Agente IA para gestión inteligente de cargadores de vehículos eléctricos.

**Open Gateway Hackathon - Barcelona, 2-3 Marzo 2026**

## 🎯 Propuesta

CatLink es un agente IA que gestiona una red de cargadores de VE usando las APIs de Nokia Network as Code:

- **Location Verification**: Confirma que el usuario está en el cargador
- **Number Verification**: Autenticación sin fricción
- **SIM Swap Detection**: Detecta fraude en tiempo real
- **QoD (Quality on Demand)**: Conexión prioritaria para transacciones

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                    Mapa + Panel de Agente                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket + REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                        │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  CatLink Agent  │───▶│      Nokia Service              │ │
│  │    (Gemini)     │    │  (Network as Code SDK)          │ │
│  └─────────────────┘    └──────────────┬──────────────────┘ │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                           ▼──────────────┴──────────────▼
┌─────────────────────────────────────────────────────────────┐
│              Nokia Network as Code APIs                      │
│         (Orange, Vodafone, Movistar - 5G Real)              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Clonar y configurar

```bash
git clone https://github.com/tu-equipo/catlink.git
cd catlink
cp .env.example .env
```

### 2. Editar `.env`

```bash
NOKIA_API_TOKEN=tu_token_nokia
NOKIA_MOCK_MODE=false
GEMINI_API_KEY=tu_api_key_gemini
```

### 3. Levantar con Docker

```bash
docker-compose up --build
```

### 4. Acceder

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🧪 Demos con SIMs Reales

Para la demo usamos las SIM/eSIM proporcionadas por Orange, Vodafone y Movistar.

### Demo 1: Aprobación exitosa
1. Insertar SIM real en dispositivo 5G
2. Seleccionar cargador disponible
3. El agente verifica ubicación, identidad, SIM swap
4. QoD se activa automáticamente
5. Carga autorizada

### Demo 2: Detección de fraude
1. Simular SIM swap reciente
2. El agente detecta el cambio
3. Carga rechazada por seguridad

### Demo 3: Usuario lejos
1. Usuario no está en el cargador
2. Location Verification falla
3. Carga rechazada

## 📁 Estructura

```
catlink/
├── backend/           # FastAPI + Agente IA (Gemini)
│   ├── src/
│   │   ├── agent/     # Agente Gemini + Tools
│   │   ├── services/  # Nokia APIs
│   │   └── routers/   # Endpoints
│   └── data/          # Mock data
├── frontend/          # React + Leaflet
├── mcp-server/        # MCP Server para Nokia APIs
└── docker-compose.yml
```

## 🔧 Desarrollo sin Docker

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### MCP Server (opcional)
```bash
cd mcp-server
pip install -r requirements.txt
python server.py
```

## 🔌 MCP Server

Incluimos un servidor MCP que expone las Nokia APIs como herramientas estándar MCP. Esto permite usar las APIs con cualquier aplicación compatible (Claude Desktop, etc.).

Ver `mcp-server/README.md` para más detalles.

## 📚 Documentación

- `CATLINK_AGENT_INSTRUCTIONS.md` - Especificaciones técnicas completas
- `mcp-server/README.md` - Documentación del servidor MCP

## 🏆 APIs Utilizadas

| API | Uso |
|-----|-----|
| **Location Verification** | Verificar usuario en cargador |
| **Number Verification** | Autenticación de identidad |
| **SIM Swap** | Detección de fraude |
| **QoD** | Conexión prioritaria |
| **Device Status** | Monitorización de cargadores |

## 👥 Equipo

CatLink - Open Gateway Hackathon 2026

---

Built with ❤️ using Nokia Network as Code + Google Gemini
