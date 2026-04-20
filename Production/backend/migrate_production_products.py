import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qc_project.settings')
django.setup()

from django.db import connection

def migrate():
    print("Creating ProductionProducts table...")
    with connection.cursor() as cursor:
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductionProducts' and xtype='U')
            BEGIN
                CREATE TABLE ProductionProducts (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    ProductName NVARCHAR(255) NOT NULL,
                    ProductCode NVARCHAR(100) NULL
                )
            END
        """)
    print("Successfully created ProductionProducts table.")

if __name__ == '__main__':
    migrate()
