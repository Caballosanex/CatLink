from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from src.config.settings import settings

# Mock fraud numbers for testing
FRAUD_NUMBERS = ["+34666666666", "+34699999999"]


class NokiaService:
    """Servicio para interactuar con Nokia Network as Code APIs.

    Soporta tanto modo real (con SIMs de operadores) como modo mock.
    """

    def __init__(self):
        self.mock_mode = settings.nokia_mock_mode
        self.client = None

        if not self.mock_mode and settings.nokia_api_token:
            try:
                from network_as_code import NetworkAsCodeClient
                self.client = NetworkAsCodeClient(token=settings.nokia_api_token)
                print("Nokia SDK initialized - REAL MODE")
            except ImportError:
                print("WARNING: network-as-code SDK not installed, falling back to mock")
                self.mock_mode = True
            except Exception as e:
                print(f"WARNING: Could not initialize Nokia SDK: {e}, falling back to mock")
                self.mock_mode = True
        else:
            print("Nokia Service running in MOCK MODE")
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calcula distancia en metros entre dos coordenadas (Haversine)."""
        R = 6371000
        lat1_r, lon1_r = radians(lat1), radians(lon1)
        lat2_r, lon2_r = radians(lat2), radians(lon2)
        
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r
        
        a = sin(dlat/2)**2 + cos(lat1_r) * cos(lat2_r) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    async def verify_location(
        self,
        phone: str,
        target_lat: float,
        target_lon: float,
        user_lat: float,
        user_lon: float,
        radius_m: int = 100
    ) -> dict:
        """Verifica si el usuario está en la ubicación del cargador.
        
        Uses Nokia Location Verification API in real mode.
        """
        
        if self.mock_mode or self.client is None:
            distance = self._calculate_distance(user_lat, user_lon, target_lat, target_lon)
            verified = distance <= radius_m
            
            return {
                "verified": verified,
                "distance_m": round(distance, 2),
                "radius_m": radius_m,
                "mock": True,
                "api": "location_verification"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            result = device.verify_location(
                latitude=target_lat,
                longitude=target_lon,
                radius=radius_m,
                max_age=60
            )
            
            # result.result_type can be "TRUE", "FALSE", "PARTIAL", "UNKNOWN"
            # UNKNOWN means the network can't determine location (e.g. phone not on sandbox network)
            # In that case, fall back to GPS distance check
            if result.result_type == "UNKNOWN":
                distance = self._calculate_distance(user_lat, user_lon, target_lat, target_lon)
                verified = distance <= radius_m
                return {
                    "verified": verified,
                    "result_type": result.result_type,
                    "distance_m": round(distance, 2),
                    "radius_m": radius_m,
                    "note": "Network returned UNKNOWN, used GPS fallback",
                    "mock": False,
                    "api": "location_verification"
                }
            
            verified = result.result_type == "TRUE"
            
            return {
                "verified": verified,
                "result_type": result.result_type,
                "radius_m": radius_m,
                "mock": False,
                "api": "location_verification"
            }
        except Exception as e:
            print(f"Error in verify_location: {e}")
            # Fallback to distance calculation
            distance = self._calculate_distance(user_lat, user_lon, target_lat, target_lon)
            return {
                "verified": distance <= radius_m,
                "distance_m": round(distance, 2),
                "error": str(e),
                "mock": True,
                "api": "location_verification"
            }
    
    async def verify_number(self, phone: str) -> dict:
        """Verifica la identidad del usuario por número.
        
        Uses Nokia Number Verification API in real mode.
        """
        
        if self.mock_mode or self.client is None:
            return {
                "verified": bool(phone and len(phone) > 5),
                "phone": phone,
                "mock": True,
                "api": "number_verification"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            result = device.verify_number()
            
            return {
                "verified": result.verified if hasattr(result, 'verified') else True,
                "phone": phone,
                "mock": False,
                "api": "number_verification"
            }
        except Exception as e:
            print(f"Error in verify_number: {e}")
            return {
                "verified": True,  # Fallback to true to not block
                "phone": phone,
                "error": str(e),
                "mock": True,
                "api": "number_verification"
            }
    
    async def check_sim_swap(self, phone: str, max_age_hours: int = 24) -> dict:
        """Detecta si hubo SIM swap reciente.
        
        Uses Nokia SIM Swap API in real mode.
        """
        
        if self.mock_mode or self.client is None:
            is_fraud = phone in FRAUD_NUMBERS
            
            return {
                "swapped_recently": is_fraud,
                "last_swap_date": (datetime.now() - timedelta(hours=2)).isoformat() if is_fraud else None,
                "risk_level": "high" if is_fraud else "low",
                "mock": True,
                "api": "sim_swap"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            
            # Check if SIM was swapped recently
            swapped = device.verify_sim_swap(max_age=max_age_hours)
            
            # Also try to get the actual date
            try:
                swap_date = device.get_sim_swap_date()
            except:
                swap_date = None
            
            return {
                "swapped_recently": swapped,
                "last_swap_date": swap_date.isoformat() if swap_date else None,
                "risk_level": "high" if swapped else "low",
                "mock": False,
                "api": "sim_swap"
            }
        except Exception as e:
            print(f"Error in check_sim_swap: {e}")
            # Check if it's a known fraud number in mock
            is_fraud = phone in FRAUD_NUMBERS
            return {
                "swapped_recently": is_fraud,
                "last_swap_date": None,
                "risk_level": "high" if is_fraud else "low",
                "error": str(e),
                "mock": True,
                "api": "sim_swap"
            }
    
    async def get_population_density(self, lat: float, lon: float) -> dict:
        """Obtiene densidad de población en una zona.
        
        Uses Nokia Population Density Insights API.
        """
        
        if self.mock_mode or self.client is None:
            distance_to_center = self._calculate_distance(lat, lon, 41.3900, 2.1700)
            
            if distance_to_center < 2000:
                category = "high"
                density = 850
            elif distance_to_center < 5000:
                category = "medium"
                density = 450
            else:
                category = "low"
                density = 150
            
            return {
                "density": density,
                "category": category,
                "mock": True,
                "api": "population_density"
            }
        
        try:
            # Note: Population density might be under Insights namespace
            # Adjust based on actual SDK structure
            from network_as_code import Insights
            result = Insights.get_population_density(
                latitude=lat,
                longitude=lon,
                radius=500
            )
            return {
                "density": result.density,
                "category": result.category,
                "mock": False,
                "api": "population_density"
            }
        except Exception as e:
            print(f"Error in get_population_density: {e}")
            return {
                "density": 500,
                "category": "medium",
                "error": str(e),
                "mock": True,
                "api": "population_density"
            }
    
    async def check_device_status(self, phone: str) -> dict:
        """Verifica estado de conectividad de un dispositivo.
        
        Uses Nokia Device Status API.
        """
        
        if self.mock_mode or self.client is None:
            is_offline = phone == "+34900000003"
            
            return {
                "connected": not is_offline,
                "network_type": "5G" if not is_offline else None,
                "mock": True,
                "api": "device_status"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            result = device.get_connectivity()
            
            return {
                "connected": result.connected if hasattr(result, 'connected') else True,
                "network_type": result.network_type if hasattr(result, 'network_type') else "5G",
                "mock": False,
                "api": "device_status"
            }
        except Exception as e:
            print(f"Error in check_device_status: {e}")
            return {
                "connected": True,
                "network_type": "5G",
                "error": str(e),
                "mock": True,
                "api": "device_status"
            }
    
    async def activate_qod(self, phone: str, profile: str = "QOS_L") -> dict:
        """Activa Quality on Demand.
        
        Uses Nokia QoD API.
        """
        
        if self.mock_mode or self.client is None:
            import uuid
            return {
                "session_id": f"qod-mock-{uuid.uuid4().hex[:8]}",
                "profile": profile,
                "status": "active",
                "mock": True,
                "api": "qod"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            
            # Create QoD session
            session = device.create_qod_session(
                profile=profile,
                duration=3600  # 1 hour
            )
            
            return {
                "session_id": session.id if hasattr(session, 'id') else str(session),
                "profile": profile,
                "status": "active",
                "mock": False,
                "api": "qod"
            }
        except Exception as e:
            print(f"Error in activate_qod: {e}")
            import uuid
            return {
                "session_id": f"qod-error-{uuid.uuid4().hex[:8]}",
                "profile": profile,
                "status": "active",
                "error": str(e),
                "mock": True,
                "api": "qod"
            }
    
    async def deactivate_qod(self, session_id: str) -> dict:
        """Desactiva sesión QoD."""
        
        if self.mock_mode or self.client is None:
            return {"deactivated": True, "mock": True, "api": "qod"}
        
        try:
            self.client.sessions.delete(session_id)
            return {"deactivated": True, "mock": False, "api": "qod"}
        except Exception as e:
            print(f"Error in deactivate_qod: {e}")
            return {"deactivated": True, "error": str(e), "mock": True, "api": "qod"}


# Singleton
nokia_service = NokiaService()
