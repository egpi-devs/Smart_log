"""
migrate_status_columns.py
─────────────────────────
Adds MicroStatus and ChemicalStatus columns to RawMaterialData and
PackagingMaterialData tables.  Safe to run multiple times — wrapped in
column-existence checks so re-running is a no-op.

Usage:
    cd backend
    python migrate_status_columns.py
"""

import os
import sys
import django

# ── Bootstrap Django ──────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qc_project.settings')
django.setup()

from django.db import connection

SQL_STATEMENTS = [
    # RawMaterialData – MicroStatus
    """
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('RawMaterialData')
          AND name = 'MicroStatus'
    )
    ALTER TABLE RawMaterialData ADD MicroStatus NVARCHAR(50) NULL;
    """,
    # RawMaterialData – ChemicalStatus
    """
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('RawMaterialData')
          AND name = 'ChemicalStatus'
    )
    ALTER TABLE RawMaterialData ADD ChemicalStatus NVARCHAR(50) NULL;
    """,
    # PackagingMaterialData – MicroStatus
    """
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('PackagingMaterialData')
          AND name = 'MicroStatus'
    )
    ALTER TABLE PackagingMaterialData ADD MicroStatus NVARCHAR(50) NULL;
    """,
    # PackagingMaterialData – ChemicalStatus
    """
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('PackagingMaterialData')
          AND name = 'ChemicalStatus'
    )
    ALTER TABLE PackagingMaterialData ADD ChemicalStatus NVARCHAR(50) NULL;
    """,
]

def run():
    with connection.cursor() as cursor:
        for sql in SQL_STATEMENTS:
            try:
                cursor.execute(sql)
                print("OK:", sql.strip().splitlines()[2].strip())
            except Exception as e:
                print("ERROR:", e)
    print("\nMigration complete.")

if __name__ == '__main__':
    run()
