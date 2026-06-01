import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "qc_project.settings")
django.setup()

from django.db import connection

def run():
    print("Migrating ProductionMachine to have Section column...")
    try:
        with connection.cursor() as cursor:
            # Check if column exists first
            cursor.execute("""
                SELECT COUNT(*)
                FROM sys.columns 
                WHERE Name = N'Section' 
                AND Object_ID = Object_ID(N'ProductionMachine')
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE ProductionMachine ADD Section NVARCHAR(255)")
                print("Successfully added Section column to ProductionMachine.")
            else:
                print("Section column already exists. Skipping.")
    except Exception as e:
        print(f"Migration Failed: {str(e)}")

if __name__ == '__main__':
    run()
