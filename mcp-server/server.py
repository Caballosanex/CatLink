"""
CatLink MCP Server - Nokia Network as Code APIs

This MCP server exposes Nokia Network as Code APIs as tools that can be
used by any MCP-compatible AI application (Claude, Gemini, etc.).

Run with: python server.py
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Configuration
NOKIA_API_TOKEN = os.getenv("NOKIA_API_TOKEN", "")
MOCK_MODE = os.getenv("NOKIA_MOCK_MODE", "false").lower() == "true"
FRAUD_NUMBERS = ["+34666666666", "+34699999999"]

# Initialize Nokia client
nokia_client = None
if not MOCK_MODE and NOKIA_API_TOKEN:
    try:
        from network_as_code import NetworkAsCodeClient
        nokia_client = NetworkAsCodeClient(token=NOKIA_API_TOKEN)
        print("Nokia SDK initialized - REAL MODE", file=__import__('sys').stderr)
    except Exception as e:
        print(f"Nokia SDK not available: {e}", file=__import__('sys').stderr)

# Create MCP Server
server = Server("catlink-nokia-mcp")


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two coordinates."""
    R = 6371000
    lat1_r, lon1_r = radians(lat1), radians(lon1)
    lat2_r, lon2_r = radians(lat2), radians(lon2)
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = sin(dlat/2)**2 + cos(lat1_r) * cos(lat2_r) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available Nokia API tools."""
    return [
        Tool(
            name="verify_location",
            description="Verifies if a device is at a specific location within a given radius. Uses Nokia Location Verification API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Phone number with international prefix (e.g., +34612345678)"
                    },
                    "target_lat": {
                        "type": "number",
                        "description": "Target latitude"
                    },
                    "target_lon": {
                        "type": "number",
                        "description": "Target longitude"
                    },
                    "user_lat": {
                        "type": "number",
                        "description": "User's reported latitude"
                    },
                    "user_lon": {
                        "type": "number",
                        "description": "User's reported longitude"
                    },
                    "radius_m": {
                        "type": "integer",
                        "description": "Verification radius in meters (default: 100)",
                        "default": 100
                    }
                },
                "required": ["phone", "target_lat", "target_lon", "user_lat", "user_lon"]
            }
        ),
        Tool(
            name="verify_number",
            description="Verifies user identity through their phone number. Uses Nokia Number Verification API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Phone number to verify"
                    }
                },
                "required": ["phone"]
            }
        ),
        Tool(
            name="check_sim_swap",
            description="Checks if a SIM card was recently swapped. Recent swaps may indicate fraud. Uses Nokia SIM Swap API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Phone number to check"
                    },
                    "max_age_hours": {
                        "type": "integer",
                        "description": "Check for swaps within this many hours (default: 24)",
                        "default": 24
                    }
                },
                "required": ["phone"]
            }
        ),
        Tool(
            name="activate_qod",
            description="Activates Quality on Demand for prioritized network connection. Uses Nokia QoD API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Phone number to boost"
                    },
                    "profile": {
                        "type": "string",
                        "description": "QoS profile (default: QOS_L for low latency)",
                        "default": "QOS_L"
                    }
                },
                "required": ["phone"]
            }
        ),
        Tool(
            name="check_device_status",
            description="Checks device connectivity status. Uses Nokia Device Status API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Phone number to check"
                    }
                },
                "required": ["phone"]
            }
        ),
        Tool(
            name="get_population_density",
            description="Gets population density for a location. Uses Nokia Population Density API.",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat": {
                        "type": "number",
                        "description": "Latitude"
                    },
                    "lon": {
                        "type": "number",
                        "description": "Longitude"
                    }
                },
                "required": ["lat", "lon"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a Nokia API tool."""
    
    result = {}
    
    if name == "verify_location":
        phone = arguments["phone"]
        target_lat = arguments["target_lat"]
        target_lon = arguments["target_lon"]
        user_lat = arguments["user_lat"]
        user_lon = arguments["user_lon"]
        radius_m = arguments.get("radius_m", 100)
        
        if nokia_client and not MOCK_MODE:
            try:
                device = nokia_client.devices.get(phone_number=phone)
                api_result = device.verify_location(
                    latitude=target_lat,
                    longitude=target_lon,
                    radius=radius_m,
                    max_age=60
                )
                result = {
                    "verified": api_result.result_type == "TRUE",
                    "result_type": api_result.result_type,
                    "radius_m": radius_m,
                    "mock": False
                }
            except Exception as e:
                distance = calculate_distance(user_lat, user_lon, target_lat, target_lon)
                result = {
                    "verified": distance <= radius_m,
                    "distance_m": round(distance, 2),
                    "error": str(e),
                    "mock": True
                }
        else:
            distance = calculate_distance(user_lat, user_lon, target_lat, target_lon)
            result = {
                "verified": distance <= radius_m,
                "distance_m": round(distance, 2),
                "radius_m": radius_m,
                "mock": True
            }
    
    elif name == "verify_number":
        phone = arguments["phone"]
        
        if nokia_client and not MOCK_MODE:
            try:
                device = nokia_client.devices.get(phone_number=phone)
                api_result = device.verify_number()
                result = {
                    "verified": getattr(api_result, 'verified', True),
                    "phone": phone,
                    "mock": False
                }
            except Exception as e:
                result = {
                    "verified": True,
                    "phone": phone,
                    "error": str(e),
                    "mock": True
                }
        else:
            result = {
                "verified": bool(phone and len(phone) > 5),
                "phone": phone,
                "mock": True
            }
    
    elif name == "check_sim_swap":
        phone = arguments["phone"]
        max_age_hours = arguments.get("max_age_hours", 24)
        
        if nokia_client and not MOCK_MODE:
            try:
                device = nokia_client.devices.get(phone_number=phone)
                swapped = device.verify_sim_swap(max_age=max_age_hours)
                result = {
                    "swapped_recently": swapped,
                    "risk_level": "high" if swapped else "low",
                    "mock": False
                }
            except Exception as e:
                is_fraud = phone in FRAUD_NUMBERS
                result = {
                    "swapped_recently": is_fraud,
                    "risk_level": "high" if is_fraud else "low",
                    "error": str(e),
                    "mock": True
                }
        else:
            is_fraud = phone in FRAUD_NUMBERS
            result = {
                "swapped_recently": is_fraud,
                "last_swap_date": (datetime.now() - timedelta(hours=2)).isoformat() if is_fraud else None,
                "risk_level": "high" if is_fraud else "low",
                "mock": True
            }
    
    elif name == "activate_qod":
        phone = arguments["phone"]
        profile = arguments.get("profile", "QOS_L")
        
        if nokia_client and not MOCK_MODE:
            try:
                device = nokia_client.devices.get(phone_number=phone)
                session = device.create_qod_session(profile=profile, duration=3600)
                result = {
                    "session_id": getattr(session, 'id', str(session)),
                    "profile": profile,
                    "status": "active",
                    "mock": False
                }
            except Exception as e:
                import uuid
                result = {
                    "session_id": f"qod-{uuid.uuid4().hex[:8]}",
                    "profile": profile,
                    "status": "active",
                    "error": str(e),
                    "mock": True
                }
        else:
            import uuid
            result = {
                "session_id": f"qod-mock-{uuid.uuid4().hex[:8]}",
                "profile": profile,
                "status": "active",
                "mock": True
            }
    
    elif name == "check_device_status":
        phone = arguments["phone"]
        
        if nokia_client and not MOCK_MODE:
            try:
                device = nokia_client.devices.get(phone_number=phone)
                connectivity = device.get_connectivity()
                result = {
                    "connected": getattr(connectivity, 'connected', True),
                    "network_type": getattr(connectivity, 'network_type', "5G"),
                    "mock": False
                }
            except Exception as e:
                result = {
                    "connected": True,
                    "network_type": "5G",
                    "error": str(e),
                    "mock": True
                }
        else:
            is_offline = phone == "+34900000003"
            result = {
                "connected": not is_offline,
                "network_type": "5G" if not is_offline else None,
                "mock": True
            }
    
    elif name == "get_population_density":
        lat = arguments["lat"]
        lon = arguments["lon"]
        
        # Population density - typically mock for hackathon
        distance_to_center = calculate_distance(lat, lon, 41.3900, 2.1700)
        if distance_to_center < 2000:
            category = "high"
            density = 850
        elif distance_to_center < 5000:
            category = "medium"
            density = 450
        else:
            category = "low"
            density = 150
        
        result = {
            "density": density,
            "category": category,
            "mock": True
        }
    
    else:
        result = {"error": f"Unknown tool: {name}"}
    
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
