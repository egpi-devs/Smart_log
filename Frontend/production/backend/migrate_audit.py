import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qc_project.settings')
django.setup()

from django.db import connection

def run_migration():
    print("Beginning Audit Trail Migration...")
    
    with connection.cursor() as cursor:
        # 1. Create the new AuditLogs table
        print("Creating AuditLogs table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
            BEGIN
                CREATE TABLE AuditLogs (
                    LogID INT IDENTITY(1,1) PRIMARY KEY,
                    Timestamp DATETIME DEFAULT GETDATE(),
                    Username NVARCHAR(128),
                    ActionType NVARCHAR(50),
                    EntityType NVARCHAR(50),
                    EntityID NVARCHAR(128),
                    OldValues NVARCHAR(MAX),
                    NewValues NVARCHAR(MAX),
                    Details NVARCHAR(MAX)
                )
            END
        """)
        print("Table created/verified.")

        # --- RAW MATERIALS ---
        print("Migrating RawMaterialCreation...")
        cursor.execute("SELECT Date, [Created By], [QC No.], Status FROM RawMaterialCreation")
        for row in cursor.fetchall():
            cursor.execute("""
                INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, Details)
                VALUES (%s, %s, 'Creation', 'Raw Material', %s, %s)
            """, [row[0], row[1], row[2], f"Status: {row[3]}"])

        print("Migrating RawMaterialEdits...")
        cursor.execute("SELECT [Edited Date], [Edited By], [QC No.], [Old Value], [New Value] FROM RawMaterialEdits")
        for row in cursor.fetchall():
            cursor.execute("""
                INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, OldValues, NewValues)
                VALUES (%s, %s, 'Edit', 'Raw Material', %s, %s, %s)
            """, [row[0], row[1], row[2], row[3], row[4]])

        # --- PACKAGING MATERIALS ---
        if table_exists(cursor, 'PackagingMaterialCreation'):
            print("Migrating PackagingMaterialCreation...")
            cursor.execute("SELECT Date, [Created By], [QC No.], Status FROM PackagingMaterialCreation")
            for row in cursor.fetchall():
                cursor.execute("""
                    INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, Details)
                    VALUES (%s, %s, 'Creation', 'Packaging Material', %s, %s)
                """, [row[0], row[1], row[2], f"Status: {row[3]}"])

        if table_exists(cursor, 'PackagingMaterialEdits'):
            print("Migrating PackagingMaterialEdits...")
            cursor.execute("SELECT [Edited Date], [Edited By], [QC No.], [Old Value], [New Value] FROM PackagingMaterialEdits")
            for row in cursor.fetchall():
                cursor.execute("""
                    INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, OldValues, NewValues)
                    VALUES (%s, %s, 'Edit', 'Packaging Material', %s, %s, %s)
                """, [row[0], row[1], row[2], row[3], row[4]])

        # --- FINISHED PRODUCTS ---
        if table_exists(cursor, 'FinishedProductCreation'):
            print("Migrating FinishedProductCreation...")
            cursor.execute("SELECT Date, [Created By], [QC No.], Status FROM FinishedProductCreation")
            for row in cursor.fetchall():
                cursor.execute("""
                    INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, Details)
                    VALUES (%s, %s, 'Creation', 'Finished Product', %s, %s)
                """, [row[0], row[1], row[2], f"Status: {row[3]}"])

        if table_exists(cursor, 'FinishedProductEdits'):
            print("Migrating FinishedProductEdits...")
            cursor.execute("SELECT [Edited Date], [Edited By], [QC No.], [Old Value], [New Value] FROM FinishedProductEdits")
            for row in cursor.fetchall():
                cursor.execute("""
                    INSERT INTO AuditLogs (Timestamp, Username, ActionType, EntityType, EntityID, OldValues, NewValues)
                    VALUES (%s, %s, 'Edit', 'Finished Product', %s, %s, %s)
                """, [row[0], row[1], row[2], row[3], row[4]])

    print("Migration completed successfully!")

def table_exists(cursor, table_name):
    cursor.execute("SELECT COUNT(*) FROM sys.tables WHERE name = %s", [table_name])
    return cursor.fetchone()[0] > 0

if __name__ == '__main__':
    run_migration()
