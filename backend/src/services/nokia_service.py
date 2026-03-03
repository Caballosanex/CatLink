from math import radians, sin, cos, sqrt, atan2
from src.config.settings import settings

class NokiaService:
    """Servicio para interactuar con Nokia Network as Code APIs.

    Soporta tanto modo real (con SIMs de operadores) como modo mock.
    """

    def __init__(self):
        self.mock_mode = settings.nokia_mock_mode
        self.client = None
        self._current_client_ip = None

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
        radius_m: int = 1500
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
            return {
                "swapped_recently": False,
                "last_swap_date": None,
                "risk_level": "low",
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
            return {
                "swapped_recently": False,
                "last_swap_date": None,
                "risk_level": "low",
                "error": str(e),
                "mock": True,
                "api": "sim_swap"
            }
    
    async def check_device_status(self, phone: str) -> dict:
        """Verifica estado de conectividad de un dispositivo.
        
        Uses Nokia Device Reachability Status API.
        """
        
        if self.mock_mode or self.client is None:
            is_offline = phone == "+3672100003"
            
            return {
                "connected": not is_offline,
                "network_type": "5G" if not is_offline else None,
                "mock": True,
                "api": "device_status"
            }
        
        try:
            device = self.client.devices.get(phone_number=phone)
            status = device.get_reachability()
            
            # status.reachable: bool
            # status.connectivity: list e.g. ["DATA", "SMS"] or None
            # status.last_status_time: datetime or str
            connectivity = status.connectivity or []
            has_data = "DATA" in connectivity
            
            # Derive network_type from connectivity capabilities
            if has_data:
                network_type = "5G"
            elif connectivity:
                network_type = "SMS_ONLY"
            else:
                network_type = None
            
            return {
                "connected": status.reachable,
                "network_type": network_type,
                "connectivity": connectivity,
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
        
        Uses Nokia QoD API. Requires device IPv4 + application server IPv4.
        We provide the device IP via the stored client IP (or a placeholder)
        and point service_ipv4 to our backend.
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
            from network_as_code.models.device import DeviceIpv4Addr
            
            # QoD requires device with IPv4 address identification.
            # Use the stored client IP if available, otherwise a placeholder.
            device_ip = self._current_client_ip or "203.0.113.10"
            
            device = self.client.devices.get(
                phone_number=phone,
                ipv4_address=DeviceIpv4Addr(
                    public_address=device_ip,
                    private_address="192.168.1.100"
                )
            )
            
            # Create QoD session between device and our application server
            session = device.create_qod_session(
                profile=profile,
                duration=3600,  # 1 hour
                service_ipv4="233.252.0.1"  # Application server endpoint
            )
            
            return {
                "session_id": session.id if hasattr(session, 'id') else str(session),
                "profile": profile,
                "status": session.status if hasattr(session, 'status') else "active",
                "device_ip": device_ip,
                "mock": False,
                "api": "qod"
            }
        except Exception as e:
            print(f"Error in activate_qod: {e}")
            import uuid
            return {
                "session_id": f"qod-error-{uuid.uuid4().hex[:8]}",
                "profile": profile,
                "status": "error",
                "error": str(e),
                "mock": True,
                "api": "qod"
            }
    
    async def get_congestion(self, phone: str) -> dict:
        """Get network congestion prediction for a device (charger IoT SIM).

        Uses Nokia Congestion Insights API.
        Returns the most recent congestion level and maps it to an occupancy %.
        """

        if self.mock_mode or self.client is None:
            # Deterministic mock based on phone for variety
            digit_sum = sum(int(c) for c in phone if c.isdigit()) % 4
            levels = ["None", "Low", "Medium", "High"]
            level = levels[digit_sum]
            return {
                "congestion_level": level,
                "occupancy_pct": self._congestion_to_occupancy(level),
                "phone": phone,
                "mock": True,
                "api": "congestion_insights"
            }

        try:
            device = self.client.devices.get(phone_number=phone)
            results = device.get_congestion()

            if results:
                # Take the first (most recent/upcoming) window
                level = results[0].level  # "None", "Low", "Medium", "High"
                confidence = results[0].confidence
            else:
                level = "Low"
                confidence = None

            return {
                "congestion_level": level,
                "occupancy_pct": self._congestion_to_occupancy(level),
                "confidence": confidence,
                "phone": phone,
                "mock": False,
                "api": "congestion_insights"
            }
        except Exception as e:
            print(f"Error in get_congestion: {e}")
            return {
                "congestion_level": "Low",
                "occupancy_pct": 30,
                "phone": phone,
                "error": str(e),
                "mock": True,
                "api": "congestion_insights"
            }

    @staticmethod
    def _congestion_to_occupancy(level: str) -> int:
        """Map Nokia congestion level to occupancy percentage."""
        mapping = {
            "None": 12,
            "Low": 30,
            "Medium": 58,
            "High": 85,
        }
        return mapping.get(level, 40)


# Singleton
nokia_service = NokiaService()
