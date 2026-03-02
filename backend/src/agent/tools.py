import google.generativeai as genai
from src.services.nokia_service import nokia_service

# Gemini function declarations
GEMINI_TOOLS = [
    genai.protos.Tool(
        function_declarations=[
            genai.protos.FunctionDeclaration(
                name="verify_location",
                description="Verifica si el usuario está físicamente en la ubicación del cargador. Devuelve verified=true si está dentro del radio de 100m, false si no.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "phone": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Número de teléfono del usuario con prefijo internacional (ej: +34612345678)"
                        ),
                        "charger_lat": genai.protos.Schema(
                            type=genai.protos.Type.NUMBER,
                            description="Latitud del cargador"
                        ),
                        "charger_lon": genai.protos.Schema(
                            type=genai.protos.Type.NUMBER,
                            description="Longitud del cargador"
                        ),
                        "user_lat": genai.protos.Schema(
                            type=genai.protos.Type.NUMBER,
                            description="Latitud reportada del usuario"
                        ),
                        "user_lon": genai.protos.Schema(
                            type=genai.protos.Type.NUMBER,
                            description="Longitud reportada del usuario"
                        ),
                    },
                    required=["phone", "charger_lat", "charger_lon", "user_lat", "user_lon"]
                )
            ),
            genai.protos.FunctionDeclaration(
                name="verify_number",
                description="Verifica la identidad del usuario mediante su número de teléfono. Devuelve verified=true si la identidad es correcta.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "phone": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Número de teléfono del usuario"
                        ),
                    },
                    required=["phone"]
                )
            ),
            genai.protos.FunctionDeclaration(
                name="check_sim_swap",
                description="Comprueba si el usuario ha cambiado de tarjeta SIM recientemente (últimas 24 horas). Un cambio reciente puede indicar fraude. Devuelve swapped_recently=true si hubo cambio.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "phone": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Número de teléfono del usuario"
                        ),
                    },
                    required=["phone"]
                )
            ),
            genai.protos.FunctionDeclaration(
                name="activate_qod",
                description="Activa Quality on Demand para garantizar conexión prioritaria durante la transacción de carga. Devuelve session_id si se activa correctamente.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "phone": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Número de teléfono del usuario"
                        ),
                    },
                    required=["phone"]
                )
            ),
        ]
    )
]


async def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Ejecuta una herramienta y devuelve el resultado."""
    
    if tool_name == "verify_location":
        return await nokia_service.verify_location(
            phone=tool_input["phone"],
            target_lat=tool_input["charger_lat"],
            target_lon=tool_input["charger_lon"],
            user_lat=tool_input["user_lat"],
            user_lon=tool_input["user_lon"]
        )
    
    elif tool_name == "verify_number":
        return await nokia_service.verify_number(tool_input["phone"])
    
    elif tool_name == "check_sim_swap":
        return await nokia_service.check_sim_swap(tool_input["phone"])
    
    elif tool_name == "activate_qod":
        return await nokia_service.activate_qod(tool_input["phone"])
    
    else:
        return {"error": f"Unknown tool: {tool_name}"}
