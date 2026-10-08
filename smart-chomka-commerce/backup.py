"""Create a consistent local database backup, including committed WAL data."""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from server import DB

if __name__ == '__main__':
    if not DB.exists():
        raise SystemExit('Database does not exist yet')
    folder = DB.parent / 'backups'
    folder.mkdir(exist_ok=True)
    target = folder / ('commerce-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')+'.sqlite3')
    source = sqlite3.connect(DB)
    destination = sqlite3.connect(target)
    try:
        source.backup(destination)
    finally:
        source.close(); destination.close()
    print('Backup saved:',target)
