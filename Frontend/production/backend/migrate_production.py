import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qc_project.settings')
django.setup()

from django.db import connection

def run_migration():
    print("Beginning Production Audit Migration...")
    
    with connection.cursor() as cursor:
        # 1. Create ProductionMachine table
        print("Creating ProductionMachine table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductionMachine')
            BEGIN
                CREATE TABLE ProductionMachine (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(255) UNIQUE NOT NULL
                )
            END
        """)

        # 2. Create ProductionSection table
        print("Creating ProductionSection table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductionSection')
            BEGIN
                CREATE TABLE ProductionSection (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(255) UNIQUE NOT NULL
                )
            END
        """)

        # 3. Create CleaningLogbook table
        print("Creating CleaningLogbook table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CleaningLogbook')
            BEGIN
                CREATE TABLE CleaningLogbook (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    Machine NVARCHAR(255),
                    Section NVARCHAR(255),
                    Date DATETIME,
                    ProductName NVARCHAR(255),
                    BatchNo NVARCHAR(100),
                    BatchSize NVARCHAR(100),
                    TimeStart NVARCHAR(50),
                    TimeEnd NVARCHAR(50),
                    DueDate DATETIME,
                    CleaningReason NVARCHAR(MAX),
                    DoneBy NVARCHAR(255),
                    CheckedBy NVARCHAR(255)
                )
            END
        """)

        # 4. Create OperationLogbook table
        print("Creating OperationLogbook table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OperationLogbook')
            BEGIN
                CREATE TABLE OperationLogbook (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    Machine NVARCHAR(255),
                    Section NVARCHAR(255),
                    Date DATETIME,
                    ProductName NVARCHAR(255),
                    BatchNo NVARCHAR(100),
                    BatchSize NVARCHAR(100),
                    OperationStart NVARCHAR(50),
                    OperationEnd NVARCHAR(50),
                    IncidentBrief NVARCHAR(MAX),
                    IncidentAction NVARCHAR(MAX),
                    DoneBy NVARCHAR(255),
                    CheckedBy NVARCHAR(255)
                )
            END
        """)

        # 5. Create ProductionAuditLogs table
        print("Creating ProductionAuditLogs table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductionAuditLogs')
            BEGIN
                CREATE TABLE ProductionAuditLogs (
                    LogID INT IDENTITY(1,1) PRIMARY KEY,
                    Timestamp DATETIME,
                    Username NVARCHAR(255),
                    ActionType NVARCHAR(50),
                    EntityType NVARCHAR(100),
                    EntityID NVARCHAR(255),
                    OldValues NVARCHAR(MAX),
                    NewValues NVARCHAR(MAX),
                    Details NVARCHAR(MAX)
                )
            END
        """)

    print("Production tables migration completed successfully!")

if __name__ == '__main__':
    run_migration()
