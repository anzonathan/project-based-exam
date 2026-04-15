import logging
from abc import ABC


class BaseService(ABC):
   

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def _log_info(self, message: str) -> None:
        """Log an informational message."""
        self.logger.info(message)

    def _log_error(self, message: str) -> None:
        """Log an error message."""
        self.logger.error(message)

    def _log_warning(self, message: str) -> None:
        """Log a warning message."""
        self.logger.warning(message)