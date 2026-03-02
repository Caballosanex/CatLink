import os
import json
import time
import re
from datetime import datetime
import google.generativeai as genai
from src.agent.tools import GEMINI_TOOLS, execute_tool
from src.agent.prompts import SYSTEM_PROMPT
from src.websocket.manager import manager


class CatLinkAgent:
    """Agente IA para evaluar solicitudes de carga usando Gemini."""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
            tools=GEMINI_TOOLS
        )
    
    async def evaluate_charge_request(
        self,
        charger: dict,
        user_phone: str,
        user_lat: float,
        user_lon: float
    ) -> dict:
        """Evalúa una solicitud de carga usando Gemini."""
        
        start_time = time.time()
        logs = []
        qod_session_id = None
        
        # Notificar inicio
        await manager.broadcast({
            "type": "agent_log",
            "data": {
                "timestamp": datetime.now().isoformat(),
                "event": "start",
                "message": f"Evaluando: {user_phone} → {charger['id']}"
            }
        })
        
        # Preparar mensaje inicial
        user_message = f"""
Evalúa esta solicitud de carga:

CARGADOR:
- ID: {charger['id']}
- Nombre: {charger['name']}
- Ubicación: ({charger['lat']}, {charger['lon']})

USUARIO:
- Teléfono: {user_phone}
- Ubicación reportada: ({user_lat}, {user_lon})

Ejecuta las verificaciones en orden y decide si aprobar o rechazar.
"""
        
        # Iniciar chat
        chat = self.model.start_chat(enable_automatic_function_calling=False)
        
        # Loop del agente
        max_iterations = 10
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            
            response = chat.send_message(user_message)
            
            # Verificar si hay function calls
            function_calls = []
            for part in response.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    function_calls.append(part.function_call)
            
            if function_calls:
                # Ejecutar cada función
                function_responses = []
                
                for fc in function_calls:
                    tool_name = fc.name
                    tool_input = dict(fc.args)
                    
                    # Ejecutar herramienta
                    result = await execute_tool(tool_name, tool_input)
                    
                    # Guardar QoD session_id si es activate_qod
                    if tool_name == "activate_qod" and "session_id" in result:
                        qod_session_id = result["session_id"]
                    
                    # Log
                    log_entry = {
                        "timestamp": datetime.now().isoformat(),
                        "tool": tool_name,
                        "input": tool_input,
                        "output": result
                    }
                    logs.append(log_entry)
                    
                    # Broadcast via WebSocket
                    await manager.broadcast({
                        "type": "agent_log",
                        "data": log_entry
                    })
                    
                    function_responses.append(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=tool_name,
                                response={"result": result}
                            )
                        )
                    )
                
                # Enviar respuestas de las funciones
                user_message = function_responses
            
            else:
                # Respuesta final (sin function calls)
                final_text = response.text
                
                # Parsear decisión
                decision_data = self._parse_decision(final_text)
                
                processing_time = int((time.time() - start_time) * 1000)
                
                # Broadcast decisión final
                await manager.broadcast({
                    "type": "agent_log",
                    "data": {
                        "timestamp": datetime.now().isoformat(),
                        "event": "decision",
                        "decision": decision_data["decision"],
                        "reason": decision_data.get("reason", "")
                    }
                })
                
                return {
                    "decision": decision_data["decision"],
                    "reason": decision_data.get("reason", ""),
                    "user_message": decision_data.get("user_message", ""),
                    "confidence": decision_data.get("confidence", 0.9),
                    "logs": logs,
                    "qod_session_id": qod_session_id,
                    "processing_time_ms": processing_time
                }
        
        # Timeout
        return {
            "decision": "REJECT_IDENTITY",
            "reason": "Timeout en evaluación",
            "user_message": "Error procesando solicitud. Intenta de nuevo.",
            "confidence": 0.5,
            "logs": logs,
            "qod_session_id": None,
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
    
    def _parse_decision(self, text: str) -> dict:
        """Parsea la decisión del agente desde el texto."""
        try:
            # Buscar JSON en la respuesta
            json_match = re.search(r'\{[^{}]*"decision"[^{}]*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # Intentar parsear todo el texto
            return json.loads(text)
        except:
            # Fallback: buscar decisión en texto
            text_upper = text.upper()
            if "APPROVE" in text_upper:
                return {
                    "decision": "APPROVE",
                    "reason": "Aprobado",
                    "user_message": "Carga autorizada.",
                    "confidence": 0.8
                }
            elif "REJECT_FRAUD" in text_upper:
                return {
                    "decision": "REJECT_FRAUD",
                    "reason": "Posible fraude detectado",
                    "user_message": "Verificación adicional requerida.",
                    "confidence": 0.9
                }
            elif "REJECT_LOCATION" in text_upper:
                return {
                    "decision": "REJECT_LOCATION",
                    "reason": "Usuario no está en el cargador",
                    "user_message": "Debes estar junto al cargador.",
                    "confidence": 0.9
                }
            else:
                return {
                    "decision": "REJECT_IDENTITY",
                    "reason": "No se pudo verificar",
                    "user_message": "Error de verificación.",
                    "confidence": 0.5
                }


# Singleton
agent = CatLinkAgent()
