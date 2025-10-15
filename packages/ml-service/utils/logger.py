import logging
import sys
from pathlib import Path

# Create logs directory
log_dir = Path(__file__).parent.parent / "logs"
log_dir.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / "ml_service.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("nfl_ml_service")
