# app/services/supabase_service.py
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("sellora.database")

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY
        self.client: Client | None = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            if not self.url or not self.key:
                logger.error("Supabase URL or Key not configured in settings")
                return
            
            logger.info(f"Initializing Supabase Client with URL: {self.url}")
            self.client = create_client(self.url, self.key)
            logger.info("Supabase Client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None

    def get_client(self) -> Client:
        if not self.client:
            self._initialize_client()
        if not self.client:
            raise RuntimeError("Supabase client is not initialized")
        return self.client

    async def check_connection(self) -> bool:
        """
        Verifies if database is reachable by performing a basic query.
        """
        try:
            client = self.get_client()
            # Perform a simple check - trying to query users count.
            # Even if table doesn't exist, getting a PGRST205 or other database error
            # means the API key is verified and we are connected to the Supabase endpoint.
            response = client.table("users").select("count", count="exact").limit(1).execute()
            return True
        except Exception as e:
            error_str = str(e)
            # If the error is PGRST205 (table not found), it means the connection is active
            # and authenticated, but schema is not applied.
            if "PGRST205" in error_str or "Could not find the table" in error_str:
                logger.warning("Supabase is CONNECTED, but 'users' table is missing (schema not applied yet).")
                return True
            logger.error(f"Supabase connection check failed: {e}")
            return False

# Singleton instance
supabase_service = SupabaseService()
