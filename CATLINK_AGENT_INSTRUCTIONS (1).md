# CatLink - Instrucciones para Agente de Código

> **IMPORTANTE**: Este documento es la fuente de verdad para el desarrollo de CatLink.
> Léelo completamente antes de escribir cualquier código.

---

## REGLAS DEL AGENTE

### Cuándo PREGUNTAR al equipo

```
SIEMPRE pregunta antes de:
- Cambiar la arquitectura definida en este documento
- Añadir dependencias no listadas aquí
- Modificar el flujo de decisión del agente IA
- Crear nuevos endpoints no especificados
- Cambiar la estructura de datos mock
- Implementar funcionalidades marcadas como "NO HACER"
- Modificar archivos que otro miembro del equipo está editando
- Tomar decisiones de UI/UX no especificadas en los mockups
```

### Cuándo NO preguntar (proceder directamente)

```
Procede sin preguntar cuando:
- Implementas exactamente lo especificado en este documento
- Corriges errores de sintaxis o bugs obvios
- Añades imports necesarios para código existente
- Creas archivos dentro de la estructura definida
- Implementas los endpoints tal como están documentados
- Sigues los mockups de UI exactamente
- Aplicas las decisiones ya tomadas en este documento
```

### Verificación OBLIGATORIA de la codebase

```
ANTES de escribir código:
1. Leer los archivos existentes relacionados
2. Verificar que no existe código duplicado
3. Comprobar imports y dependencias disponibles
4. Revisar el estilo del código existente

DESPUÉS de escribir código:
1. Verificar que el código compila/ejecuta sin errores
2. Comprobar que sigue la estructura definida
3. Validar que no rompe funcionalidad existente
4. Confirmar que los tipos/modelos son consistentes
```

---

## 1. VISIÓN DEL PROYECTO

### Qué es CatLink

Un agente de IA que gestiona una red de cargadores de vehículos eléctricos de forma autónoma, utilizando las APIs de Nokia Network as Code para verificar ubicación, identidad, detectar fraude y optimizar la red.

### Objetivo de la hackathon

Construir un MVP funcional en 2 días que demuestre:
1. Un agente IA tomando decisiones autónomas (Gemini)
2. Integración real con APIs de Nokia (SIMs reales de operadores)
3. UI que muestra el razonamiento del agente en tiempo real
4. MCP Server para Nokia APIs (diferenciador técnico)

### Propuesta de 280 caracteres

> CatLink: Agente IA para carga de VE. Verifica ubicación e identidad, detecta fraude por SIM swap, monitoriza cargadores offline y balancea demanda según densidad poblacional. Red eléctrica inteligente con 5G.

---

## 2. STACK TECNOLÓGICO

### Tecnologías FIJAS (no cambiar)

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Backend** | FastAPI | 0.109+ |
| **Frontend** | React + Vite | React 18, Vite 5 |
| **Mapas** | Leaflet + React-Leaflet | 4.x |
| **Estado** | Zustand | 4.x |
| **Agente IA** | Google Gemini | gemini-1.5-flash |
| **MCP Server** | mcp (Python) | 1.0.0 |
| **Nokia SDK** | network-as-code | latest |
| **Base de datos** | SQLite + JSON files | - |
| **Realtime** | WebSocket (FastAPI) | - |
| **Contenedores** | Docker Compose | - |
| **Python** | 3.11+ | - |
| **Node** | 20+ | - |

### Dependencias Backend (requirements.txt)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
google-generativeai==0.4.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
websockets==12.0
httpx==0.26.0
mcp==1.0.0
```

### Dependencias Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "zustand": "^4.4.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 3. ESTRUCTURA DE CARPETAS

```
catlink/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── CATLINK_AGENT_INSTRUCTIONS.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   │
│   ├── data/
│   │   ├── chargers.json
│   │   ├── users.json
│   │   └── zones.json
│   │
│   └── src/
│       ├── __init__.py
│       ├── config/
│       │   └── settings.py
│       ├── models/
│       │   ├── charger.py
│       │   ├── user.py
│       │   └── session.py
│       ├── routers/
│       │   ├── chargers.py
│       │   └── sessions.py
│       ├── services/
│       │   ├── charger_service.py
│       │   ├── session_service.py
│       │   └── nokia_service.py
│       ├── agent/
│       │   ├── agent.py
│       │   ├── tools.py
│       │   └── prompts.py
│       └── websocket/
│           └── manager.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Map/
│       │   │   └── ChargerMap.jsx
│       │   └── Agent/
│       │       ├── AgentPanel.jsx
│       │       └── AgentLogEntry.jsx
│       ├── services/
│       │   └── api.js
│       ├── store/
│       │   └── store.js
│       └── styles/
│           └── index.css
│
└── mcp-server/
    ├── server.py
    ├── requirements.txt
    └── README.md
```

---

## 4. VARIABLES DE ENTORNO

### .env.example

```bash
# Nokia API (credenciales del hackathon)
NOKIA_API_TOKEN=your_nokia_token_here
NOKIA_MOCK_MODE=false  # false para usar SIMs reales

# Google Gemini (proporcionado en hackathon)
GEMINI_API_KEY=your_gemini_api_key_here

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Cómo obtener las credenciales en el hackathon

1. **Nokia API Token**: 
   - Ir a https://networkascode.nokia.io/
   - Login con la organización del hackathon
   - Dashboard → API Keys

2. **Gemini API Key**:
   - Proporcionado por Google el lunes por la mañana
   - O usar: https://makersuite.google.com/app/apikey

3. **SIMs reales**:
   - Recoger SIM/eSIM de Orange, Vodafone o Movistar
   - Insertar en dispositivo 5G
   - El número de la SIM es el que se usa en las APIs

---

## 5. DATOS MOCK

### chargers.json

```json
[
  {
    "id": "CHG-001",
    "name": "Plaça Catalunya",
    "address": "Plaça Catalunya, 1, 08002 Barcelona",
    "lat": 41.3870,
    "lon": 2.1700,
    "power_kw": 150,
    "connectors": ["CCS2", "CHAdeMO"],
    "status": "available",
    "zone": "centro",
    "iot_phone": "+34900000001"
  },
  {
    "id": "CHG-002",
    "name": "Passeig de Gràcia",
    "address": "Passeig de Gràcia, 50, 08007 Barcelona",
    "lat": 41.3950,
    "lon": 2.1640,
    "power_kw": 100,
    "connectors": ["CCS2"],
    "status": "in_use",
    "zone": "centro",
    "iot_phone": "+34900000002"
  },
  {
    "id": "CHG-003",
    "name": "Barceloneta",
    "address": "Passeig Marítim, 15, 08003 Barcelona",
    "lat": 41.3780,
    "lon": 2.1890,
    "power_kw": 50,
    "connectors": ["CCS2", "Type2"],
    "status": "offline",
    "zone": "centro",
    "iot_phone": "+34900000003"
  },
  {
    "id": "CHG-004",
    "name": "Diagonal Mar",
    "address": "Av. Diagonal, 3, 08019 Barcelona",
    "lat": 41.4100,
    "lon": 2.2200,
    "power_kw": 50,
    "connectors": ["CCS2"],
    "status": "available",
    "zone": "norte",
    "iot_phone": "+34900000004"
  },
  {
    "id": "CHG-005",
    "name": "Zona Franca",
    "address": "Carrer 60, 25, 08040 Barcelona",
    "lat": 41.3500,
    "lon": 2.1300,
    "power_kw": 150,
    "connectors": ["CCS2", "CHAdeMO"],
    "status": "available",
    "zone": "sur",
    "iot_phone": "+34900000005"
  },
  {
    "id": "CHG-006",
    "name": "Glòries",
    "address": "Plaça de les Glòries, 08013 Barcelona",
    "lat": 41.4036,
    "lon": 2.1875,
    "power_kw": 100,
    "connectors": ["CCS2"],
    "status": "available",
    "zone": "centro",
    "iot_phone": "+34900000006"
  }
]
```

### users.json

```json
[
  {
    "id": "USR-001",
    "name": "Maria García",
    "phone": "+34612345678",
    "email": "maria@example.com",
    "vehicle": "Tesla Model 3",
    "is_fraud_test": false
  },
  {
    "id": "USR-002",
    "name": "Test Fraud User",
    "phone": "+34666666666",
    "email": "fraud@test.com",
    "vehicle": "Unknown",
    "is_fraud_test": true
  },
  {
    "id": "USR-003",
    "name": "Carlos López",
    "phone": "+34655443322",
    "email": "carlos@example.com",
    "vehicle": "VW ID.4",
    "is_fraud_test": false
  }
]
```

---

## 6. AGENTE IA (GEMINI)

### System Prompt (prompts.py)

```python
SYSTEM_PROMPT = """
Eres CatLink Agent, un agente inteligente que gestiona una red de cargadores de vehículos eléctricos en Barcelona.

## TU OBJETIVO
Decidir si autorizar o rechazar solicitudes de carga de forma AUTÓNOMA, verificando seguridad y optimizando la red.

## HERRAMIENTAS DISPONIBLES

1. verify_location(phone, charger_lat, charger_lon, user_lat, user_lon)
   - Verifica si el usuario está físicamente en el cargador
   - SIEMPRE ejecutar primero
   - Si verified=false, rechazar inmediatamente

2. verify_number(phone)
   - Verifica la identidad del usuario por su número de teléfono
   - Ejecutar si la ubicación es correcta

3. check_sim_swap(phone)
   - Detecta si hubo un cambio de SIM en las últimas 24 horas
   - Un cambio reciente indica posible fraude
   - Ejecutar si la identidad es correcta

4. activate_qod(phone)
   - Activa Quality on Demand para conexión prioritaria
   - Ejecutar solo si todas las verificaciones pasaron

## PROCESO DE DECISIÓN

SIEMPRE sigue este orden exacto:

1. PRIMERO: verify_location
   → Si verified=false: REJECT_LOCATION
   
2. SEGUNDO: verify_number
   → Si verified=false: REJECT_IDENTITY
   
3. TERCERO: check_sim_swap
   → Si swapped_recently=true: REJECT_FRAUD
   
4. CUARTO: activate_qod
   → Solo si todo lo anterior pasó

5. FINALMENTE: Responder con decisión

## DECISIONES POSIBLES

- APPROVE: Todo verificado, autorizar carga
- REJECT_LOCATION: Usuario no está en el cargador
- REJECT_IDENTITY: No se pudo verificar identidad
- REJECT_FRAUD: SIM swap detectado, posible fraude

## FORMATO DE RESPUESTA

Después de usar las herramientas, responde con este JSON exacto:

{
  "decision": "APPROVE",
  "reason": "Todas las verificaciones pasaron correctamente",
  "user_message": "Carga autorizada. Conecta tu vehículo.",
  "confidence": 0.95
}

## REGLAS IMPORTANTES

- Sé conciso en tus razonamientos
- NUNCA apruebes sin verificar ubicación primero
- NUNCA saltes pasos del proceso
- Si una herramienta falla, rechaza con REJECT_IDENTITY
- Cada tool call debe tener un propósito claro
"""
```

### Configuración de Gemini (agent.py)

```python
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=SYSTEM_PROMPT,
    tools=GEMINI_TOOLS
)
```

---

## 7. NOKIA APIS - USO CON SIMs REALES

### Configuración para SIMs reales

```python
# .env
NOKIA_MOCK_MODE=false
NOKIA_API_TOKEN=<token-del-hackathon>
```

### Cómo funcionan las APIs con SIMs reales

| API | Qué hace | Datos necesarios |
|-----|----------|------------------|
| **Location Verification** | Verifica posición GPS real del dispositivo | Número de la SIM + coordenadas |
| **Number Verification** | Confirma que la SIM es quien dice ser | Número de la SIM |
| **SIM Swap** | Detecta cambios de SIM recientes | Número de la SIM |
| **QoD** | Activa prioridad de red 5G | Número de la SIM |
| **Device Status** | Estado de conectividad | Número de la SIM (cargador IoT) |

### Para la demo con SIMs reales necesitas:

1. **Dispositivo 5G** con la SIM del operador insertada
2. **El número de teléfono** de esa SIM (formato: +34XXXXXXXXX)
3. **Estar en zona de cobertura 5G** de Barcelona
4. **API Token de Nokia** (dashboard del hackathon)

### Ejemplo de llamada real

```python
from network_as_code import NetworkAsCodeClient

client = NetworkAsCodeClient(token=NOKIA_API_TOKEN)
device = client.devices.get(phone_number="+34612345678")

# Location Verification
result = device.verify_location(
    latitude=41.3870,
    longitude=2.1700,
    radius=100,
    max_age=60
)
# result.result_type: "TRUE", "FALSE", "PARTIAL", "UNKNOWN"

# SIM Swap
swapped = device.verify_sim_swap(max_age=24)  # últimas 24 horas
# swapped: True/False

# QoD
session = device.create_qod_session(
    profile="QOS_L",
    duration=3600
)
# session.id: ID de la sesión
```

---

## 8. MCP SERVER

### Qué es MCP

Model Context Protocol (MCP) es un estándar abierto que permite conectar aplicaciones de IA a sistemas externos. Nuestro MCP Server expone las Nokia APIs como herramientas que cualquier IA compatible puede usar.

### Por qué es importante para el hackathon

1. **Diferenciador técnico**: Pocos equipos implementarán MCP
2. **Demuestra conocimiento**: MCP se menciona explícitamente en el challenge
3. **Extensibilidad**: Las APIs quedan accesibles para cualquier AI

### Estructura del MCP Server

```
mcp-server/
├── server.py         # Servidor MCP principal
├── requirements.txt  # mcp + network-as-code
└── README.md
```

### Tools expuestos por el MCP Server

| Tool | Descripción |
|------|-------------|
| `verify_location` | Location Verification API |
| `verify_number` | Number Verification API |
| `check_sim_swap` | SIM Swap API |
| `activate_qod` | Quality on Demand API |
| `check_device_status` | Device Status API |
| `get_population_density` | Population Density API |

### Cómo ejecutar

```bash
cd mcp-server
pip install -r requirements.txt
export NOKIA_API_TOKEN="..."
python server.py
```

---

## 9. ENDPOINTS API

### Chargers Router (/api/chargers)

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/chargers` | Lista todos los cargadores |
| GET | `/api/chargers/{id}` | Detalle de un cargador |
| GET | `/api/chargers/{id}/status` | Estado del cargador (Nokia API) |

### Sessions Router (/api/sessions)

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/sessions/start` | Iniciar sesión de carga |
| POST | `/api/sessions/{id}/stop` | Detener carga |
| GET | `/api/sessions` | Lista sesiones recientes |

### WebSocket (/ws)

```
Conexión: ws://localhost:8000/ws

Mensajes enviados por el servidor:
{
  "type": "agent_log",
  "data": {
    "timestamp": "2026-03-02T10:23:45",
    "tool": "verify_location",
    "input": {...},
    "output": {...}
  }
}
```

---

## 10. QUÉ HACER Y QUÉ NO HACER

### HACER ✅

- [x] Agente tomando decisiones con Gemini API
- [x] Llamadas a Nokia APIs (reales con SIMs)
- [x] WebSocket para logs en tiempo real
- [x] Mapa con cargadores
- [x] 3 demos funcionales
- [x] MCP Server para Nokia APIs
- [x] UI funcional y limpia

### NO HACER ❌

- [ ] KYC (no compartimos esa visión)
- [ ] Device Swap (no incluido)
- [ ] Sistema de login/autenticación real
- [ ] Base de datos PostgreSQL
- [ ] Sistema de pagos
- [ ] Tests unitarios
- [ ] CI/CD

---

## 11. DEMOS PARA EL PITCH

### Demo 1: Aprobación exitosa (SIM real)

```
1. Mostrar dispositivo 5G con SIM del operador
2. Abrir app, seleccionar cargador
3. El teléfono real es el que se usa en la verificación
4. Ver panel de agente mostrando:
   - ✅ Ubicación verificada (API real)
   - ✅ Identidad verificada (API real)
   - ✅ Sin SIM swap (API real)
   - ✅ QoD activado (API real)
   - ✅ DECISIÓN: APPROVE
```

### Demo 2: Fraude detectado

```
1. Usuario con SIM swap simulado
2. Ver panel de agente mostrando:
   - ✅ Ubicación verificada
   - ✅ Identidad verificada
   - ❌ SIM SWAP DETECTADO
   - ❌ DECISIÓN: REJECT_FRAUD
```

### Demo 3: Usuario lejos del cargador

```
1. Usuario lejos del cargador
2. Ver panel de agente mostrando:
   - ❌ Usuario no está en el cargador
   - ❌ DECISIÓN: REJECT_LOCATION
```

---

## 12. CRITERIOS DE EVALUACIÓN (del challenge)

### BUSINESS

| Criterio | Cómo destacamos |
|----------|-----------------|
| Business Relevance | Fraude en EV charging es problema real, ROI claro |
| Commercial Viability | Modelo B2B para operadores de carga |
| Clarity and Presentation | Demo con SIMs reales, muy visual |

### TECHNOLOGY

| Criterio | Cómo destacamos |
|----------|-----------------|
| Technical Innovation | Agente IA + múltiples APIs + MCP Server |
| Demonstration (PoC) | Demo end-to-end con APIs reales |
| Sustainability/Scalability | Multi-operador, multi-país, MCP estándar |

---

## 13. DOCUMENTACIÓN NOKIA NETWORK AS CODE

### Portal principal

| Recurso | URL |
|---------|-----|
| **Developer Portal** | https://developer.networkascode.nokia.io/ |
| **Documentación** | https://developer.networkascode.nokia.io/docs |
| **Getting Started** | https://developer.networkascode.nokia.io/docs/getting-started |

### APIs que usamos

| API | Documentación |
|-----|---------------|
| **Location Verification** | https://developer.networkascode.nokia.io/docs/location/location-verification |
| **Number Verification** | https://developer.networkascode.nokia.io/products/identity-security |
| **SIM Swap** | https://networkascode.nokia.io/_docs/device-swap/device-swap |
| **QoD** | https://developer.networkascode.nokia.io/docs/quality-on-demand/index-qod |
| **Device Status** | https://developer.networkascode.nokia.io/docs/general-concepts/identifying-devices |

### SDKs

| SDK | Instalación |
|-----|-------------|
| **Python** | `pip install network-as-code` |
| **TypeScript** | `npm install network-as-code` |

---

## 14. CHECKLIST FINAL

### Día 1 (lunes)

```
□ Recoger credenciales Nokia del dashboard
□ Recoger API key Gemini de Google
□ Recoger SIM/eSIM del operador
□ Probar SIM en dispositivo 5G
□ Verificar que las APIs responden
□ Demo 1 funcionando end-to-end
□ Demo 2 funcionando
```

### Día 2 (martes)

```
□ Demo 3 funcionando
□ MCP Server probado
□ UI pulida
□ Pitch ensayado (5 min máx)
□ Backup del código
□ Primera ronda de pitching: 11:00
□ (Si finalistas) Segunda ronda: 16:00
□ Ceremonia de premios: 17:30
```

---

**Última actualización**: Marzo 2026
**Equipo**: CatLink
**Hackathon**: Open Gateway Hackathon 2026 - Talent Arena Barcelona
