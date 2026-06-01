import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "qc_project.settings")
django.setup()

from django.db import connection

def run():
    print("Migrating ProductionAuditLogs historical IDs...")
    try:
        with connection.cursor() as cursor:
            # For CleaningLogbook
            cursor.execute("SELECT ID, Machine, Section FROM CleaningLogbook")
            cleaning_rows = cursor.fetchall()
            for r in cleaning_rows:
                id_str = str(r[0])
                old_entity_id = f"{r[1]} - {r[2]}"
                cursor.execute("""
                    UPDATE ProductionAuditLogs 
                    SET EntityID=%s 
                    WHERE EntityType='Cleaning Logbook' 
                      AND EntityID=%s 
                      AND ActionType='Creation'
                """, [id_str, old_entity_id])

            # For OperationLogbook
            cursor.execute("SELECT ID, Machine, Section FROM OperationLogbook")
            operation_rows = cursor.fetchall()
            for r in operation_rows:
                id_str = str(r[0])
                old_entity_id = f"{r[1]} - {r[2]}"
                cursor.execute("""
                    UPDATE ProductionAuditLogs 
                    SET EntityID=%s 
                    WHERE EntityType='Operation Logbook' 
                      AND EntityID=%s 
                      AND ActionType='Creation'
                """, [id_str, old_entity_id])

        print("Successfully remapped ProductionAuditLogs historical references.")
    except Exception as e:
        print(f"Migration Failed: {str(e)}")

if __name__ == '__main__':
    run()
