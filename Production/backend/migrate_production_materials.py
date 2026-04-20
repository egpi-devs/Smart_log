import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "qc_project.settings")
django.setup()

from django.db import connection

def run():
    print("Creating ProductionMaterialData table...")
    try:
        with connection.cursor() as cursor:
            # Check if table already exists
            cursor.execute("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'ProductionMaterialData'
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                    CREATE TABLE ProductionMaterialData (
                        ID INT IDENTITY(1,1) PRIMARY KEY,
                        Date DATETIME,
                        [Material Name] NVARCHAR(255),
                        [Material Code] NVARCHAR(100),
                        [Material Category] NVARCHAR(100),
                        [Batch No.] NVARCHAR(100),
                        [PM No.] NVARCHAR(100) UNIQUE,
                        Micro BIT,
                        Chemical BIT,
                        Manufacturer NVARCHAR(255),
                        Supplier NVARCHAR(255),
                        [Manufacture Date] DATE,
                        [Expiry Date] DATE,
                        Status NVARCHAR(50),
                        Notes NVARCHAR(MAX),
                        [Created By] NVARCHAR(100),
                        [Edited By] NVARCHAR(100),
                        [Edited Date] DATETIME
                    )
                """)
                print("Successfully created ProductionMaterialData table.")
            else:
                print("Table ProductionMaterialData already exists. Skipping.")
                
    except Exception as e:
        print(f"Migration Failed: {str(e)}")

if __name__ == '__main__':
    run()
